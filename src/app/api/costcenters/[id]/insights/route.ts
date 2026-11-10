import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import CostCenter from '@/models/CostCenter';
import Book from '@/models/Book';
import Invoice from '@/models/Invoice';
import Movement from '@/models/Movement';
import PointOfSale from '@/models/PointOfSale';
import InventoryItem from '@/models/InventoryItem';
import InventoryMovement from '@/models/InventoryMovement';
import Agreement from '@/models/Agreement';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { InventoryMovementType } from '@/types/inventory-movement';
import {
  computeInventory,
  computeReceivables,
  computeRoyalties,
  computeSalesPace,
  type ReceivableRow,
} from '@/lib/finance/costCenterInsights';

const toRate = { $toDouble: { $ifNull: ['$exchangeRate', 1] } };

interface InvoiceForReceivables {
  _id: Types.ObjectId;
  status: ReceivableRow['status'];
  date: Date;
  dueDate?: Date;
  total: number;
  exchangeRate?: number;
  items: Array<{ total: number; costCenter?: string[] }>;
  movements?: Types.ObjectId[];
}

// GET /api/costcenters/[id]/insights
// Indicadores de gestión del título: ritmo de ventas, inventario,
// devoluciones, cartera y regalías. La recuperación de inversión se calcula
// en el cliente con los totales financieros y los datos de ritmo de ventas.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();

    const costCenter = await CostCenter.findById(id).lean();
    if (!costCenter) {
      return NextResponse.json(
        { success: false, error: 'Centro de costo no encontrado' },
        { status: 404 }
      );
    }
    const code = costCenter.code;

    const books = await Book.find({ costCenter: code })
      .select('_id publicationDate')
      .lean();
    const bookIds = books.map((b) => b._id);
    const publicationDate = books
      .map((b) => b.publicationDate)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

    const [
      salesRows,
      invoices,
      posWarehouses,
      stockItems,
      inventoryTotals,
      advanceAgg,
      accruedAgg,
    ] = await Promise.all([
      // Ventas de libros (mismo criterio que "Unidades Vendidas").
      Invoice.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        { $match: { 'items.type': 'libro', 'items.costCenter': code } },
        {
          $project: {
            _id: 0,
            date: 1,
            quantity: { $ifNull: ['$items.quantity', 0] },
            total: {
              $multiply: [
                { $toDouble: { $ifNull: ['$items.total', 0] } },
                toRate,
              ],
            },
          },
        },
      ]),
      Invoice.find({
        'items.costCenter': code,
        status: { $in: ['Sent', 'Partial', 'Paid', 'Unchecked'] },
      })
        .select('status date dueDate total exchangeRate items movements')
        .lean<InvoiceForReceivables[]>(),
      PointOfSale.find({ warehouseId: { $exists: true, $ne: null } })
        .select('warehouseId')
        .lean(),
      bookIds.length
        ? InventoryItem.find({ bookId: { $in: bookIds } }).lean()
        : [],
      bookIds.length
        ? InventoryMovement.aggregate([
            { $match: { 'items.bookId': { $in: bookIds } } },
            { $unwind: '$items' },
            { $match: { 'items.bookId': { $in: bookIds } } },
            { $group: { _id: '$type', quantity: { $sum: '$items.quantity' } } },
          ])
        : [],
      bookIds.length
        ? Agreement.aggregate([
            { $match: { book: { $in: bookIds } } },
            {
              $group: {
                _id: null,
                total: {
                  $sum: { $toDouble: { $ifNull: ['$advancePayment', 0] } },
                },
              },
            },
          ])
        : [],
      bookIds.length
        ? RoyaltyStatement.aggregate([
            { $match: { status: { $in: ['approved', 'paid'] } } },
            { $unwind: '$books' },
            { $match: { 'books.book': { $in: bookIds } } },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $toDouble: { $ifNull: ['$books.totalRoyalties', 0] },
                  },
                },
              },
            },
          ])
        : [],
    ]);

    // --- Ritmo de ventas
    const pace = computeSalesPace(salesRows, publicationDate);

    // --- Inventario y devoluciones
    const posWarehouseIds = new Set(
      posWarehouses.map((p) => String(p.warehouseId))
    );
    const qtyByType = new Map<string, number>(
      inventoryTotals.map((t: { _id: string; quantity: number }) => [
        t._id,
        t.quantity,
      ])
    );
    const inventory = computeInventory({
      printRun: qtyByType.get(InventoryMovementType.INGRESO) ?? 0,
      sold: pace.totalUnits,
      stock: stockItems.map((item) => ({
        quantity: item.quantity,
        atPointOfSale: posWarehouseIds.has(String(item.warehouseId)),
      })),
      remitted: qtyByType.get(InventoryMovementType.REMISION) ?? 0,
      returned: qtyByType.get(InventoryMovementType.DEVOLUCION) ?? 0,
      avgMonthlyUnits: pace.avgMonthlyUnits,
    });

    // --- Cartera: pagos de las facturas parcialmente cobradas
    const partialMovementIds = invoices
      .filter((inv) => inv.status === 'Partial')
      .flatMap((inv) => inv.movements ?? []);
    const payments: Array<{ _id: Types.ObjectId; value: number }> =
      partialMovementIds.length
        ? await Movement.aggregate([
            { $match: { _id: { $in: partialMovementIds } } },
            {
              $project: {
                value: {
                  $cond: [
                    {
                      $gt: [{ $toDouble: { $ifNull: ['$amountInCOP', 0] } }, 0],
                    },
                    { $toDouble: '$amountInCOP' },
                    { $toDouble: { $ifNull: ['$amount', 0] } },
                  ],
                },
              },
            },
          ])
        : [];
    const paymentById = new Map(payments.map((p) => [String(p._id), p.value]));

    const receivableRows: ReceivableRow[] = invoices.map((inv) => {
      const rate = Number(inv.exchangeRate) || 1;
      const itemsTotal = inv.items.reduce(
        (s, i) => s + (Number(i.total) || 0),
        0
      );
      const ccTotal = inv.items
        .filter((i) => i.costCenter?.includes(code))
        .reduce((s, i) => s + (Number(i.total) || 0), 0);
      const amount = ccTotal * rate;
      const share = itemsTotal > 0 ? ccTotal / itemsTotal : 0;

      let paid = 0;
      if (inv.status === 'Paid') {
        paid = amount;
      } else if (inv.status === 'Partial') {
        const paidTotal = (inv.movements ?? []).reduce(
          (s, m) => s + (paymentById.get(String(m)) ?? 0),
          0
        );
        // El pago se reparte entre centros de costo en proporción a su parte.
        paid = paidTotal * share;
      }
      return {
        status: inv.status,
        amount,
        paid,
        dueDate: inv.dueDate,
        date: inv.date,
      };
    });
    const receivables = computeReceivables(receivableRows);

    // --- Regalías
    const royalties = computeRoyalties(
      advanceAgg[0]?.total ?? 0,
      accruedAgg[0]?.total ?? 0
    );

    return NextResponse.json({
      success: true,
      data: {
        hasBooks: bookIds.length > 0,
        pace,
        inventory,
        receivables,
        royalties,
      },
    });
  } catch (error) {
    console.error('Cost Center Insights Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los indicadores' },
      { status: 500 }
    );
  }
}
