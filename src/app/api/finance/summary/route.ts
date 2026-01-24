import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';
import CostCenter from '@/models/CostCenter';
import Book from '@/models/Book';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { getSemanticCategoryColor } from '@/styles/category-utils';
import { add, subtract, multiply, divide, toNumber, gtZero } from '@/lib/math';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

function calculateHealthScore(
  cashRunway: number,
  grossProfitMargin: number,
  formattedMonthlyData: MonthlyData[]
) {
  // Runway Score (Max 40 points)
  let runwayScore = 0;
  if (cashRunway === Infinity || cashRunway >= 18) {
    runwayScore = 40;
  } else {
    runwayScore = Math.min(40, toNumber(multiply(divide(cashRunway, 12), 40)));
  }

  // Profit Margin Score (Max 30 points)
  const marginScore =
    grossProfitMargin >= 50
      ? 30
      : grossProfitMargin >= 0
        ? toNumber(add(15, multiply(divide(grossProfitMargin, 50), 15)))
        : 0;

  // Cash Flow Trend (Max 30 points)
  const last3Months = formattedMonthlyData.slice(-3);
  const prev3Months = formattedMonthlyData.slice(-6, -3);

  const getAvgNet = (data: MonthlyData[]) => {
    if (data.length === 0) return '0';
    const totalNet = data.reduce(
      (sum, m) => add(sum, subtract(m.income, m.expenses)),
      '0'
    );
    return divide(totalNet, data.length);
  };

  const last3Net = getAvgNet(last3Months);
  const prev3Net = getAvgNet(prev3Months);

  const trendScore = toNumber(last3Net) >= toNumber(prev3Net) ? 30 : 15;

  return Math.round(runwayScore + marginScore + trendScore);
}

function generateRunwayProjection(netBalance: string, netBurnRate: string) {
  const projection = [];
  for (let month = 0; month <= 18; month++) {
    // projected = current - (burn * month)
    const projectedCash = subtract(netBalance, multiply(netBurnRate, month));
    const finalProjected =
      toNumber(projectedCash) < 0 ? 0 : toNumber(projectedCash);

    projection.push({
      month: month === 0 ? 'Hoy' : `Mes ${month}`,
      balance: finalProjected,
    });
  }
  return projection;
}

async function getTotals(matchStage: Record<string, unknown>) {
  const totalsResponse = await Movement.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: { $ifNull: ['$amountInCOP', '$amount'] } },
      },
    },
  ]);

  let totalIncome = '0';
  let totalExpenses = '0';

  totalsResponse.forEach((t) => {
    const val = t.total ? t.total.toString() : '0';
    if (t._id === 'Ingreso' || t._id === 'INCOME')
      totalIncome = add(totalIncome, val);
    else totalExpenses = add(totalExpenses, val);
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: subtract(totalIncome, totalExpenses),
  };
}

async function getMonthlyData(matchStage: Record<string, unknown>) {
  const monthlyData = await Movement.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Ingreso', 'INCOME']] },
              { $ifNull: ['$amountInCOP', '$amount'] },
              0,
            ],
          },
        },
        expense: {
          $sum: {
            $cond: [
              { $not: { $in: ['$type', ['Ingreso', 'INCOME']] } },
              { $ifNull: ['$amountInCOP', '$amount'] },
              0,
            ],
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const formattedMonthlyData = monthlyData.map((d) => ({
    month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
    income: toNumber(d.income),
    expenses: toNumber(d.expense),
  }));

  return { monthlyData, formattedMonthlyData };
}

async function getCategoryBreakdown(
  matchStage: Record<string, unknown>,
  startDate: Date | undefined,
  endDate: Date | undefined,
  isIncome: boolean = false
) {
  const matchQuery: Record<string, unknown> = {
    ...matchStage,
    type: isIncome
      ? { $in: ['Ingreso', 'INCOME'] }
      : { $nin: ['Ingreso', 'INCOME'] },
  };

  if (startDate && endDate) {
    matchQuery['date'] = { $gte: startDate, $lte: endDate };
  }

  const categoryBreakdown = await Movement.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: '$category',
        value: { $sum: { $ifNull: ['$amountInCOP', '$amount'] } },
      },
    },
    {
      $lookup: {
        from: 'categories',
        let: { catId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: [{ $type: '$$catId' }, 'string'] },
                          {
                            $regexMatch: {
                              input: '$$catId',
                              regex: /^[0-9a-fA-F]{24}$/,
                            },
                          },
                        ],
                      },
                      then: { $toObjectId: '$$catId' },
                      else: '$$catId',
                    },
                  },
                ],
              },
            },
          },
        ],
        as: 'categoryData',
      },
    },
    {
      $unwind: {
        path: '$categoryData',
        preserveNullAndEmptyArrays: true,
      },
    },
    { $sort: { value: -1 } },
    { $limit: 15 },
  ]);

  return categoryBreakdown.map((c) => ({
    name:
      c.categoryData?.name ||
      (c._id ? `Ref: ${c._id.toString().slice(-6)}` : 'Sin categoría'),
    value: toNumber(c.value),
    color: getSemanticCategoryColor(
      isIncome ? 'Ingreso' : 'Egreso',
      c.categoryData?.color,
      c.categoryData?._id?.toString() || c.name || c._id?.toString()
    ),
  }));
}

async function getCostCenterBreakdown(
  matchStage: Record<string, unknown>,
  startDate: Date | undefined,
  endDate: Date | undefined,
  isIncome: boolean = false
) {
  const matchQuery: Record<string, unknown> = {
    ...matchStage,
    type: isIncome
      ? { $in: ['Ingreso', 'INCOME'] }
      : { $nin: ['Ingreso', 'INCOME'] },
  };

  if (startDate && endDate) {
    matchQuery['date'] = { $gte: startDate, $lte: endDate };
  }

  const breakdown = await Movement.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: { $ifNull: ['$costCenter', 'Sin definir'] },
        value: { $sum: { $ifNull: ['$amountInCOP', '$amount'] } },
      },
    },
    { $sort: { value: isIncome ? -1 : 1 } }, // Expenses are usually positive in this view if they are 'amount', but let's check
    { $limit: 10 },
  ]);

  return breakdown.map((cc) => ({
    name: cc._id,
    value: toNumber(cc.value),
  }));
}

async function getDailyData(
  matchStage: Record<string, unknown>,
  startOfMonth: Date,
  endOfMonth: Date,
  referenceDate: Date
) {
  const dailyData = await Movement.aggregate([
    {
      $match: {
        ...matchStage,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: '$date' },
        },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Ingreso', 'INCOME']] },
              { $ifNull: ['$amountInCOP', '$amount'] },
              0,
            ],
          },
        },
        expense: {
          $sum: {
            $cond: [
              { $not: { $in: ['$type', ['Ingreso', 'INCOME']] } },
              { $ifNull: ['$amountInCOP', '$amount'] },
              0,
            ],
          },
        },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);

  // Fill in missing days
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formattedDailyData = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const found = dailyData.find((d) => d._id.day === i);
    const dayStr = String(i).padStart(2, '0');
    formattedDailyData.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`,
      day: i,
      month: dayStr, // Keep for chart dataKey
      income: toNumber(found?.income || 0),
      expenses: toNumber(found?.expense || 0),
    });
  }
  return formattedDailyData;
}

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
        matchStage = { costCenter: cc ? cc.code : costCenterParam };
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
      const now = new Date();

      // 1. Calculate Totals (for the filtered period)
      const { totalIncome, totalExpenses, netBalance } =
        await getTotals(matchStage);

      // 2. Monthly Data
      const { formattedMonthlyData } = await getMonthlyData(matchStage);

      // 3. Category Breakdown (Income & Expense)
      const [categoriesExpense, categoriesIncome] = await Promise.all([
        getCategoryBreakdown(matchStage, startDate, endDate, false),
        getCategoryBreakdown(matchStage, startDate, endDate, true),
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
          startDate
        );
      }

      // 5. Cost Center Breakdown (Income & Expense)
      const [costCentersExpense, costCentersIncome] = await Promise.all([
        getCostCenterBreakdown(matchStage, startDate, endDate, false),
        getCostCenterBreakdown(matchStage, startDate, endDate, true),
      ]);

      // 6. Movements List for the period with Pagination
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      const movementQuery: Record<string, unknown> = { ...matchStage };
      if (startDate && endDate) {
        movementQuery.date = { $gte: startDate, $lte: endDate };
      }

      const [movements, totalMovements] = await Promise.all([
        Movement.find(movementQuery)
          .populate('category')
          .sort({ date: 1 })
          .skip(skip)
          .limit(limit),
        Movement.countDocuments(movementQuery),
      ]);

      const formattedMovements = movements.map((m) => {
        const plain = m.toObject();
        let normalizedType = plain.type;
        if (plain.type === 'Ingreso') normalizedType = 'INCOME';
        else if (plain.type === 'Egreso') normalizedType = 'EXPENSE';

        return {
          ...plain,
          _id: plain._id.toString(),
          type: normalizedType,
          amount: toNumber(plain.amount),
          amountInCOP: toNumber(plain.amountInCOP),
          exchangeRate: toNumber(plain.exchangeRate),
          quantity: plain.quantity ? toNumber(plain.quantity) : undefined,
          unitValue: plain.unitValue ? toNumber(plain.unitValue) : undefined,
          category:
            plain.category && typeof plain.category === 'object'
              ? {
                  ...plain.category,
                  color: getSemanticCategoryColor(
                    plain.type, // 'Ingreso' or 'Egreso'
                    plain.category.color,
                    plain.category._id.toString()
                  ),
                }
              : plain.category,
        };
      });

      // 7. Calculate Health Metrics
      // ... (Health logic remains same but ensuring no changes unless necessary)

      // Re-implementing health logic block from previous context if needed,
      // but simpler to just return the response structure with pagination

      // ... Health Logic ...
      // 7. Calculate Balance History (for monthly view)
      let balanceData = undefined;
      if (yearParam && monthParam && startDate && endDate) {
        const year = parseInt(yearParam);
        const month = parseInt(monthParam);

        // Calculate the last moment of the previous month
        // For June (month=6), we want May 31st 23:59:59.999
        // Date.UTC(year, month-1, 0) gives us the last day of the previous month
        const prevMonthEnd = new Date(
          Date.UTC(year, month - 1, 0, 23, 59, 59, 999)
        );

        // Use baseMatchStage without date restrictions, then add date filter
        const previousMonthTotals = await getTotals({
          ...baseMatchStage,
          date: { $lte: prevMonthEnd },
        });

        // Calculate current month balance (end of current month)
        const currentMonthTotals = await getTotals({
          ...baseMatchStage,
          date: { $lte: endDate },
        });

        balanceData = {
          previousMonth: toNumber(previousMonthTotals.netBalance),
          currentMonth: toNumber(currentMonthTotals.netBalance),
        };
      }

      // 8. Calculate Health Metrics with 3-month Rolling Average
      const last3MonthsMetrics = formattedMonthlyData.slice(-3);
      const avgMonthlyExpenses =
        last3MonthsMetrics.length > 0
          ? divide(
              last3MonthsMetrics.reduce((sum, m) => add(sum, m.expenses), '0'),
              last3MonthsMetrics.length
            )
          : divide(totalExpenses, formattedMonthlyData.length || 1);

      const avgMonthlyIncome =
        last3MonthsMetrics.length > 0
          ? divide(
              last3MonthsMetrics.reduce((sum, m) => add(sum, m.income), '0'),
              last3MonthsMetrics.length
            )
          : divide(totalIncome, formattedMonthlyData.length || 1);

      const netBurnRate = subtract(avgMonthlyExpenses, avgMonthlyIncome);

      const cashRunway = gtZero(netBurnRate)
        ? toNumber(divide(netBalance, netBurnRate))
        : Infinity;

      const grossProfitMargin = gtZero(totalIncome)
        ? toNumber(
            multiply(
              divide(subtract(totalIncome, totalExpenses), totalIncome),
              100
            )
          )
        : 0;

      const healthScore = calculateHealthScore(
        cashRunway,
        grossProfitMargin,
        formattedMonthlyData
      );

      const runwayProjection = generateRunwayProjection(
        netBalance,
        netBurnRate
      );

      const healthData = {
        runway: cashRunway,
        burnRate: {
          gross: toNumber(avgMonthlyExpenses),
          net: toNumber(netBurnRate),
        },
        profitMargin: grossProfitMargin,
        avgMonthlyIncome: toNumber(avgMonthlyIncome),
        avgMonthlyExpense: toNumber(avgMonthlyExpenses),
        healthScore,
        runwayProjection,
      };

      return {
        totals: {
          income: toNumber(totalIncome),
          expenses: toNumber(totalExpenses),
          balance: toNumber(netBalance),
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
        categories: categoriesExpense, // Keeping original structure
        categoriesExpense,
        categoriesIncome,
        costCenters: costCentersExpense,
        costCentersExpense,
        costCentersIncome,
        movements: formattedMovements,
        health: healthData,
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
