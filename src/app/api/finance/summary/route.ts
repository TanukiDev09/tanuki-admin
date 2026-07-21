import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CostCenter from '@/models/CostCenter';
import Book from '@/models/Book';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { subtract, toNumber, gtZero } from '@/lib/math';
import { getUnitsSoldFromInvoices } from './aggregations';
import { calculateHealthMetrics } from './health';
import {
  getTotals,
  getMovements,
  getMonthlyData,
  getCategoryBreakdown,
  getCostCenterBreakdown,
  getDailyData,
} from './queries';

async function handleBookGroupBy(creatorId: string) {
  // Find books for the creator
  const books = await Book.find({
    $or: [
      { authors: creatorId },
      { translators: creatorId },
      { illustrators: creatorId },
    ],
  }).select('title costCenter');

  // Calculate totals per book
  const bookStats = await Promise.all(
    books.map(async (book) => {
      if (!book.costCenter) return null;

      // Get totals for this specific cost center
      const stats = await getTotals({ costCenter: book.costCenter });

      // Only include if there's activity
      if (gtZero(stats.totalIncome) || gtZero(stats.totalExpenses)) {
        return {
          id: book._id,
          title: book.title,
          income: toNumber(stats.totalIncome),
          expenses: toNumber(stats.totalExpenses),
          profit: toNumber(subtract(stats.totalIncome, stats.totalExpenses)),
        };
      }
      return null;
    })
  );

  // Filter out nulls
  const validStats = bookStats.filter(
    (s): s is NonNullable<typeof s> => s !== null
  );

  // Sort by highest profit
  validStats.sort((a, b) => b.profit - a.profit);

  return NextResponse.json(validStats);
}

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const costCenterParam = searchParams.get('costCenter');
    const groupBy = searchParams.get('groupBy');

    if (groupBy === 'book' && searchParams.get('creatorId')) {
      return handleBookGroupBy(searchParams.get('creatorId')!);
    }

    function calculateDateRange(
      yearParam: string | null,
      monthParam: string | null
    ) {
      if (!yearParam) {
        return { startDate: undefined, endDate: undefined };
      }

      const year = parseInt(yearParam);
      let startDate: Date;
      let endDate: Date;

      if (monthParam) {
        const month = parseInt(monthParam);
        startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      } else {
        startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      }
      return { startDate, endDate };
    }

    async function buildBaseMatchStage(
      costCenterParam: string | null,
      creatorId: string | null
    ): Promise<Record<string, unknown>> {
      let matchStage: Record<string, unknown> = {};

      if (costCenterParam) {
        const cc = await CostCenter.findOne({
          $or: [{ code: costCenterParam }, { name: costCenterParam }],
        });
        const code = cc ? cc.code : costCenterParam;
        matchStage = {
          $or: [
            { costCenter: code },
            { 'allocations.costCenter': code },
            { 'items.costCenter': code },
          ],
        };
      } else if (creatorId) {
        const books = await Book.find({
          $or: [
            { authors: creatorId },
            { translators: creatorId },
            { illustrators: creatorId },
          ],
        }).select('costCenter');

        const costCenters = books
          .map((b) => b.costCenter)
          .filter((cc): cc is string => !!cc);

        if (costCenters.length > 0) {
          matchStage = { costCenter: { $in: costCenters } };
        } else {
          matchStage = { costCenter: '________' };
        }
      }
      return matchStage;
    }

    async function getFinancialReport(
      matchStage: Record<string, unknown>,
      baseMatchStage: Record<string, unknown>,
      startDate: Date | undefined,
      endDate: Date | undefined,
      yearParam: string | null,
      monthParam: string | null
    ) {
      // 0. Extract cost center code if present for refined totals
      const costCenterCode = costCenterParam
        ? (
            await CostCenter.findOne({
              $or: [{ code: costCenterParam }, { name: costCenterParam }],
            })
          )?.code || costCenterParam
        : undefined;

      // 1. Calculate Totals (for the filtered period)
      const { totalIncome, totalExpenses, totalQuantity, netBalance } =
        await getTotals(matchStage, costCenterCode);

      // 1.1 Unidades vendidas: para un CC específico se calculan desde las
      // facturas (ver getUnitsSoldFromInvoices), no desde movements.quantity.
      const totalQuantityFromInvoices = costCenterCode
        ? await getUnitsSoldFromInvoices(costCenterCode)
        : totalQuantity;

      // 2. Monthly Data
      const { formattedMonthlyData } = await getMonthlyData(
        matchStage,
        yearParam && !monthParam ? parseInt(yearParam) : undefined,
        costCenterCode
      );

      // 3. Category & Cost Center Breakdowns
      const [
        categoriesExpense,
        categoriesIncome,
        costCentersExpense,
        costCentersIncome,
      ] = await Promise.all([
        getCategoryBreakdown(
          matchStage,
          startDate,
          endDate,
          false,
          costCenterCode
        ),
        getCategoryBreakdown(
          matchStage,
          startDate,
          endDate,
          true,
          costCenterCode
        ),
        getCostCenterBreakdown(matchStage, startDate, endDate, false),
        getCostCenterBreakdown(matchStage, startDate, endDate, true),
      ]);

      // 4. Daily Breakdown (Only relevant for monthly view)
      let formattedDailyData: Array<{
        date: string;
        day: number;
        month: string;
        income: number;
        expenses: number;
      }> = [];
      if (yearParam && monthParam && startDate && endDate) {
        formattedDailyData = await getDailyData(
          matchStage,
          startDate,
          endDate,
          startDate,
          costCenterCode
        );
      }

      // 5. Movements List with Pagination
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const { formatted: movements, total: totalMovements } =
        await getMovements(matchStage, page, limit, costCenterCode);

      // 6. Calculate Balance History (Starting balance before period)
      let balanceData = undefined;
      if (yearParam && startDate && endDate) {
        // Calculate the last moment of the previous period
        const prevPeriodEnd = new Date(startDate.getTime() - 1);

        const [previousTotals, currentTotals] = await Promise.all([
          getTotals({ ...baseMatchStage, date: { $lte: prevPeriodEnd } }),
          getTotals({ ...baseMatchStage, date: { $lte: endDate } }),
        ]);

        balanceData = {
          previousMonth: toNumber(previousTotals.netBalance),
          currentMonth: toNumber(currentTotals.netBalance),
        };
      }

      // 7. Calculate Health Metrics
      const health = calculateHealthMetrics(
        totalIncome,
        totalExpenses,
        netBalance,
        formattedMonthlyData,
        yearParam,
        monthParam
      );

      return {
        totals: {
          income: toNumber(totalIncome),
          expenses: toNumber(totalExpenses),
          balance: toNumber(netBalance),
          totalQuantity: toNumber(totalQuantityFromInvoices),
        },
        period: {
          year: yearParam ? parseInt(yearParam) : now.getFullYear(),
          month: monthParam ? parseInt(monthParam) : null,
          startDate,
          endDate,
        },
        pagination: {
          total: totalMovements,
          page,
          limit,
          totalPages: Math.ceil(totalMovements / limit),
        },
        monthly: formattedMonthlyData,
        daily: formattedDailyData,
        categories: categoriesExpense,
        categoriesExpense,
        categoriesIncome,
        costCenters: costCentersExpense,
        costCentersExpense,
        costCentersIncome,
        movements,
        health,
        balances: balanceData,
      };
    }

    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    // Build match stage and date range
    const baseMatchStage = await buildBaseMatchStage(
      costCenterParam,
      searchParams.get('creatorId')
    );
    const { startDate, endDate } = calculateDateRange(yearParam, monthParam);

    // Combine
    const matchStage = { ...baseMatchStage };
    if (startDate && endDate) {
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    // Generate Report
    const reportData = await getFinancialReport(
      matchStage,
      baseMatchStage,
      startDate,
      endDate,
      yearParam,
      monthParam
    );

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Summary API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    );
  }
}
