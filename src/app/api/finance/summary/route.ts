import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';
import CostCenter from '@/models/CostCenter';
import Book from '@/models/Book';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

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
  // Runway Score
  const runwayScore = Math.min(40, (cashRunway / 12) * 40);

  // Profit Margin Score
  const marginScore =
    grossProfitMargin >= 50
      ? 30
      : grossProfitMargin >= 0
        ? 15 + (grossProfitMargin / 50) * 15
        : 0;

  // Cash Flow Trend
  const last3Months = formattedMonthlyData.slice(-3);
  const prev3Months = formattedMonthlyData.slice(-6, -3);
  const last3Net =
    last3Months.length > 0
      ? last3Months.reduce((sum, m) => sum + (m.income - m.expenses), 0) /
        last3Months.length
      : 0;
  const prev3Net =
    prev3Months.length > 0
      ? prev3Months.reduce((sum, m) => sum + (m.income - m.expenses), 0) /
        prev3Months.length
      : last3Net;

  const trendScore = last3Net >= prev3Net ? 30 : 15;

  return Math.round(runwayScore + marginScore + trendScore);
}

function generateRunwayProjection(netBalance: number, netBurnRate: number) {
  const projection = [];
  for (let month = 0; month <= 18; month++) {
    const projectedCash = Math.max(0, netBalance - netBurnRate * month);
    projection.push({
      month: month === 0 ? 'Hoy' : `Mes ${month}`,
      balance: projectedCash,
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
        total: { $sum: '$amount' },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  totalsResponse.forEach((t) => {
    const val = t.total ? parseFloat(t.total.toString()) : 0;
    if (t._id === 'Ingreso' || t._id === 'INCOME') totalIncome += val;
    else totalExpenses += val;
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
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
            $cond: [{ $in: ['$type', ['Ingreso', 'INCOME']] }, '$amount', 0],
          },
        },
        expense: {
          $sum: {
            $cond: [
              { $not: { $in: ['$type', ['Ingreso', 'INCOME']] } },
              '$amount',
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
    income: d.income ? parseFloat(d.income.toString()) : 0,
    expenses: d.expense ? parseFloat(d.expense.toString()) : 0,
  }));

  return { monthlyData, formattedMonthlyData };
}

async function getCategoryBreakdown(
  matchStage: Record<string, unknown>,
  startOfMonth: Date,
  endOfMonth: Date
) {
  const categoryBreakdown = await Movement.aggregate([
    {
      $match: {
        ...matchStage,
        type: { $nin: ['Ingreso', 'INCOME'] },
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: '$category',
        value: { $sum: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
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
    { $limit: 10 },
  ]);

  return categoryBreakdown.map((c) => ({
    name: c.categoryData?.name || c._id?.toString() || 'Sin categoría',
    value: c.value ? parseFloat(c.value.toString()) : 0,
  }));
}

async function getDailyData(
  matchStage: Record<string, unknown>,
  startOfMonth: Date,
  endOfMonth: Date,
  now: Date
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
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        income: {
          $sum: {
            $cond: [{ $in: ['$type', ['Ingreso', 'INCOME']] }, '$amount', 0],
          },
        },
        expense: {
          $sum: {
            $cond: [
              { $not: { $in: ['$type', ['Ingreso', 'INCOME']] } },
              '$amount',
              0,
            ],
          },
        },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);

  // Fill in missing days
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const formattedDailyData = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const found = dailyData.find((d) => d._id.day === i);
    formattedDailyData.push({
      day: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      income: found && found.income ? parseFloat(found.income.toString()) : 0,
      expenses: found && found.expense ? parseFloat(found.expense.toString()) : 0,
    });
  }
  return formattedDailyData;
}

function calculateEntrepreneurHealth(
  formattedMonthlyData: MonthlyData[],
  netBalance: number,
  totalIncome: number,
  totalExpenses: number
) {
  const recentMonths = formattedMonthlyData.slice(-6);
  const avgMonthlyIncome =
    recentMonths.length > 0
      ? recentMonths.reduce((sum, m) => sum + m.income, 0) / recentMonths.length
      : 0;
  const avgMonthlyExpense =
    recentMonths.length > 0
      ? recentMonths.reduce((sum, m) => sum + m.expenses, 0) /
        recentMonths.length
      : 0;
  const netBurnRate = avgMonthlyExpense - avgMonthlyIncome;
  const cashRunway = netBurnRate > 0 ? netBalance / netBurnRate : 999;
  const grossProfitMargin =
    totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const healthScore = calculateHealthScore(
    cashRunway,
    grossProfitMargin,
    formattedMonthlyData
  );

  const runwayProjection = generateRunwayProjection(netBalance, netBurnRate);

  return {
    runway: Math.max(0, cashRunway),
    burnRate: { gross: avgMonthlyExpense, net: netBurnRate },
    profitMargin: grossProfitMargin,
    avgMonthlyIncome,
    avgMonthlyExpense,
    healthScore,
    runwayProjection,
  };
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
        const creatorId = searchParams.get('creatorId');
        
        // Find books for the creator
        const books = await Book.find({
            $or: [
            { authors: creatorId },
            { translators: creatorId },
            { illustrators: creatorId }
            ]
        }).select('title costCenter');

        // Calculate totals per book
        const bookStats = await Promise.all(books.map(async (book) => {
            if (!book.costCenter) return null;

            // Get totals for this specific cost center
            const stats = await getTotals({ costCenter: book.costCenter });
            
            // Only include if there's activity
            if (stats.totalIncome === 0 && stats.totalExpenses === 0) return null;

            return {
                id: book._id,
                title: book.title,
                income: stats.totalIncome,
                expenses: stats.totalExpenses,
                profit: stats.totalIncome - stats.totalExpenses
            };
        }));

        // Filter out nulls (books with no cost center or no activity)
        const validStats = bookStats.filter((s): s is NonNullable<typeof s> => s !== null);
        
        // Sort by highest profit
        validStats.sort((a, b) => b.profit - a.profit);

        return NextResponse.json(validStats);
    } 

    let matchStage: Record<string, unknown> = {};

    if (costCenterParam) {
      const cc = await CostCenter.findOne({
        $or: [{ code: costCenterParam }, { name: costCenterParam }],
      });
      matchStage = { costCenter: cc ? cc.code : costCenterParam };
    } else if (searchParams.get('creatorId')) {
      const creatorId = searchParams.get('creatorId');
      
      // Find books where this creator is author, translator, or illustrator
      const books = await Book.find({
        $or: [
          { authors: creatorId },
          { translators: creatorId },
          { illustrators: creatorId }
        ]
      }).select('costCenter');

      // Extract unique cost centers
      const costCenters = books
        .map(b => b.costCenter)
        .filter((cc): cc is string => !!cc);

      if (costCenters.length > 0) {
        matchStage = { costCenter: { $in: costCenters } };
      } else {
        // No associated cost centers found, return empty match
        matchStage = { costCenter: '________' }; // Impossible match
      }
    }

    // 1. Calculate Totals
    const { totalIncome, totalExpenses, netBalance } =
      await getTotals(matchStage);

    // 2. Monthly Data
    const { monthlyData, formattedMonthlyData } =
      await getMonthlyData(matchStage);

    // 3. Category Breakdown (Current Month Only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const formattedCategories = await getCategoryBreakdown(
      matchStage,
      startOfMonth,
      endOfMonth
    );

    // 4. Daily Breakdown (Current Month)
    const formattedDailyData = await getDailyData(
      matchStage,
      startOfMonth,
      endOfMonth,
      now
    );

    // 5. Calculate Entrepreneur Health Metrics
    const healthData = calculateEntrepreneurHealth(
      formattedMonthlyData,
      netBalance,
      totalIncome,
      totalExpenses
    );

    return NextResponse.json({
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: netBalance,
      },
      currentMonth: {
        income: (() => {
          const m = monthlyData.find(
            (m) =>
              m._id.year === new Date().getFullYear() &&
              m._id.month === new Date().getMonth() + 1
          );
          return m && m.income ? parseFloat(m.income.toString()) : 0;
        })(),
        expenses: (() => {
          const m = monthlyData.find(
            (m) =>
              m._id.year === new Date().getFullYear() &&
              m._id.month === new Date().getMonth() + 1
          );
          return m && m.expense ? parseFloat(m.expense.toString()) : 0;
        })(),
        balance: (() => {
          const m = monthlyData.find(
            (m) =>
              m._id.year === new Date().getFullYear() &&
              m._id.month === new Date().getMonth() + 1
          );
          const inc = m && m.income ? parseFloat(m.income.toString()) : 0;
          const exp = m && m.expense ? parseFloat(m.expense.toString()) : 0;
          return inc - exp;
        })(),
      },
      monthly: formattedMonthlyData,
      daily: formattedDailyData,
      categories: formattedCategories,
      health: healthData,
    });
  } catch (error) {
    console.error('Summary API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    );
  }
}
