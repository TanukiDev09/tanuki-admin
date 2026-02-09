import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import PointOfSale, { IPointOfSale } from '@/models/PointOfSale';
import InventoryItem from '@/models/InventoryItem';
import ExternalEntity from '@/models/ExternalEntity';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { startOfMonth, subMonths, format } from 'date-fns';
import { toNumber } from '@/lib/math';
import { Types } from 'mongoose';

interface Params {
  params: Promise<{ id: string }>;
}

interface BillingHistoryItem {
  _id: {
    year: number;
    month: number;
  };
  total: Types.Decimal128 | number;
}

interface InventoryMetrics {
  totalStock: number;
  soldLast30Days: number;
  soldLastYear: number;
  turnoverRatio: number;
}

export async function GET(request: NextRequest, { params }: Params) {
  const permissionError = await requirePermission(
    request,
    ModuleName.POINTS_OF_SALE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  return handleGetStats(params);
}

/**
 * Builds a robust filter for invoices belonging to a specific POS
 */
async function getInvoiceFilter(pos: IPointOfSale) {
  const orFilters: Record<string, unknown>[] = [];

  // 1. Match by POS Code as Cost Center (Backward compatibility/Direct link)
  orFilters.push({ 'items.costCenter': pos.code });

  // 2. Match by Identification Number (NIT/Tax ID)
  if (pos.identificationNumber && pos.identificationNumber.trim()) {
    orFilters.push({ customerTaxId: pos.identificationNumber });
  }

  // 3. Match by Fuzzy Name
  const cleanName = pos.name
    .replace(/\s+(Librerías|Librería|S\.?A\.?S\.?|S\.?A\.?|Libros)\s*$/i, '')
    .trim();
  if (cleanName.length > 3) {
    orFilters.push({ customerName: { $regex: cleanName, $options: 'i' } });
  }

  // 4. Try to find alternate Tax ID in External Entities
  if (!pos.identificationNumber || !pos.identificationNumber.trim()) {
    const entity = await ExternalEntity.findOne({
      name: { $regex: cleanName, $options: 'i' },
    }).lean();
    if (entity?.taxId) {
      orFilters.push({ customerTaxId: entity.taxId });
    }
  }

  return {
    status: { $ne: 'Cancelled' },
    $or: orFilters,
  };
}

async function handleGetStats(params: Promise<{ id: string }>) {
  try {
    await dbConnect();
    const { id } = await params;
    const pos = await PointOfSale.findById(id).lean();

    if (!pos) {
      return NextResponse.json(
        { error: 'Punto de venta no encontrado' },
        { status: 404 }
      );
    }

    const now = new Date();
    const invoiceFilter = await getInvoiceFilter(pos);

    const billingHistory = await getBillingHistory(invoiceFilter, now);
    const chartData = formatChartData(billingHistory, now);
    const inventoryMetrics: InventoryMetrics = pos.warehouseId
      ? await getInventoryMetrics(
          invoiceFilter,
          pos.warehouseId as Types.ObjectId,
          now
        )
      : { totalStock: 0, soldLast30Days: 0, soldLastYear: 0, turnoverRatio: 0 };

    // Global Lifetime Total
    const globalLifetimeSales = await Invoice.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' },
        },
      },
      { $group: { _id: null, total: { $sum: { $toDouble: '$total' } } } },
    ]);

    // POS Lifetime Total
    const posLifetimeSales = await Invoice.aggregate([
      {
        $match: {
          ...invoiceFilter,
        },
      },
      { $group: { _id: null, total: { $sum: { $toDouble: '$total' } } } },
    ]);

    const globalTotal =
      globalLifetimeSales.length > 0 ? globalLifetimeSales[0].total : 0;
    const posTotal =
      posLifetimeSales.length > 0 ? posLifetimeSales[0].total : 0;
    const posContribution =
      globalTotal > 0 ? (posTotal / globalTotal) * 100 : 0;

    const topProducts = await getTopProducts(invoiceFilter);
    const catalogContribution = await getCatalogContribution(invoiceFilter);

    return NextResponse.json({
      success: true,
      billingHistory: chartData,
      inventoryMetrics,
      topProducts,
      catalogContribution,
      globalRevenueSummary: {
        posTotal: posTotal,
        globalTotal: globalTotal,
        contributionPercentage: posContribution,
      },
    });
  } catch (error) {
    console.error('Error fetching POS stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching statistics' },
      { status: 500 }
    );
  }
}

async function getBillingHistory(
  invoiceFilter: Record<string, unknown>,
  now: Date
): Promise<BillingHistoryItem[]> {
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11));

  // For billing history, we aggregate the total of the invoice to simplify
  // since multi-criteria matching at item-level CC is unreliable here.
  return await Invoice.aggregate([
    {
      $match: {
        ...invoiceFilter,
        date: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        total: { $sum: { $toDouble: '$total' } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
}

function formatChartData(billingHistory: BillingHistoryItem[], now: Date) {
  const chartData = [];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, 11 - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const match = billingHistory.find(
      (h) => h._id.year === year && h._id.month === month
    );
    chartData.push({
      month: format(d, 'MMM'),
      fullMonth: format(d, 'yyyy-MM'),
      revenue: match ? toNumber(match.total) : 0,
    });
  }
  return chartData;
}

async function getInventoryMetrics(
  invoiceFilter: Record<string, unknown>,
  warehouseId: Types.ObjectId,
  now: Date
): Promise<InventoryMetrics> {
  const thirtyDaysAgo = subMonths(now, 1);
  const oneYearAgo = subMonths(now, 12);

  const stock = await InventoryItem.find({ warehouseId }).lean();
  const totalUnits = stock.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const salesStats = await Invoice.aggregate([
    {
      $match: {
        ...invoiceFilter,
        date: { $gte: oneYearAgo },
      },
    },
    { $unwind: '$items' },
    // Re-verify it matches the POS if we were matching by some specific item-level CC previously
    // But since we use multi-criteria at invoice level, we take all items of these invoices.
    {
      $group: {
        _id: null,
        totalSoldYear: { $sum: { $toDouble: '$items.quantity' } },
        totalSold30Days: {
          $sum: {
            $cond: [
              { $gte: ['$date', thirtyDaysAgo] },
              { $toDouble: '$items.quantity' },
              0,
            ],
          },
        },
      },
    },
  ]);

  const soldYear = salesStats.length > 0 ? salesStats[0].totalSoldYear : 0;
  const sold30 = salesStats.length > 0 ? salesStats[0].totalSold30Days : 0;

  return {
    totalStock: totalUnits,
    soldLast30Days: Math.round(sold30),
    soldLastYear: Math.round(soldYear),
    turnoverRatio: totalUnits > 0 ? soldYear / totalUnits : 0,
  };
}

async function getTopProducts(invoiceFilter: Record<string, unknown>) {
  // 1. Get top products for THIS POS
  const topProducts = await Invoice.aggregate([
    {
      $match: {
        ...invoiceFilter,
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.type': 'libro', 'items.bookId': { $ne: null } } },
    {
      $group: {
        _id: '$items.bookId',
        title: { $first: '$items.description' },
        quantity: { $sum: { $toDouble: '$items.quantity' } },
        totalRevenue: { $sum: { $toDouble: '$items.total' } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);

  if (topProducts.length === 0) return [];

  // 2. Get global revenue for these specific books (same period)
  const bookIds = topProducts.map((p) => p._id);
  const globalStats = await Invoice.aggregate([
    {
      $match: {
        status: { $ne: 'Cancelled' },
        'items.bookId': { $in: bookIds },
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.bookId': { $in: bookIds },
      },
    },
    {
      $group: {
        _id: '$items.bookId',
        globalRevenue: { $sum: { $toDouble: '$items.total' } },
      },
    },
  ]);

  // 3. Merge global stats into result
  return topProducts.map((product) => {
    const globalMatch = globalStats.find(
      (g) => g._id?.toString() === product._id?.toString()
    );
    return {
      ...product,
      globalRevenue: globalMatch
        ? globalMatch.globalRevenue
        : product.totalRevenue,
    };
  });
}

async function getCatalogContribution(invoiceFilter: Record<string, unknown>) {
  // 1. Get ALL products sold at THIS POS
  const posSales = await Invoice.aggregate([
    {
      $match: {
        ...invoiceFilter,
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.type': 'libro', 'items.bookId': { $ne: null } } },
    {
      $group: {
        _id: '$items.bookId',
        title: { $first: '$items.description' },
        quantity: { $sum: { $toDouble: '$items.quantity' } },
        revenue: { $sum: { $toDouble: '$items.total' } },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  if (posSales.length === 0) return [];

  const bookIds = posSales.map((p) => p._id);

  // 2. Get global sales for these specific books
  const globalSales = await Invoice.aggregate([
    {
      $match: {
        status: { $ne: 'Cancelled' },
        'items.bookId': { $in: bookIds },
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.bookId': { $in: bookIds } } },
    {
      $group: {
        _id: '$items.bookId',
        globalRevenue: { $sum: { $toDouble: '$items.total' } },
        globalQuantity: { $sum: { $toDouble: '$items.quantity' } },
      },
    },
  ]);

  // 3. Merge global stats into result
  return posSales.map((item) => {
    const globalMatch = globalSales.find(
      (g) => g._id?.toString() === item._id?.toString()
    );
    const gRev = globalMatch ? globalMatch.globalRevenue : item.revenue;
    const gQty = globalMatch ? globalMatch.globalQuantity : item.quantity;

    return {
      ...item,
      globalRevenue: gRev,
      globalQuantity: gQty,
      contributionPercentage: gRev > 0 ? (item.revenue / gRev) * 100 : 100,
    };
  });
}
