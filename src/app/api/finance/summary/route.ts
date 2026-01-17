import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';
import CostCenter from '@/models/CostCenter';

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

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const costCenterParam = searchParams.get('costCenter');

    let matchStage: Record<string, unknown> = {};

    if (costCenterParam) {
      const cc = await CostCenter.findOne({
        $or: [{ code: costCenterParam }, { name: costCenterParam }],
      });
      matchStage = { costCenter: cc ? cc.code : costCenterParam };
    }

    // 1. Calculate Totals
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
      const val = parseFloat(t.total.toString());
      if (t._id === 'Ingreso' || t._id === 'INCOME') totalIncome += val;
      else totalExpenses += val;
    });

    const netBalance = totalIncome - totalExpenses;

    // 2. Monthly Data
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
      income: parseFloat(d.income.toString()),
      expenses: parseFloat(d.expense.toString()),
    }));

    // 3. Category Breakdown
    const categoryBreakdown = await Movement.aggregate([
      { $match: { ...matchStage, type: { $nin: ['Ingreso', 'INCOME'] } } },
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

    const formattedCategories = categoryBreakdown.map((c) => ({
      name: c.categoryData?.name || c._id?.toString() || 'Sin categoría',
      value: parseFloat(c.value.toString()),
    }));

    // 4. Calculate Entrepreneur Health Metrics
    const recentMonths = formattedMonthlyData.slice(-6);
    const avgMonthlyIncome =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + m.income, 0) /
          recentMonths.length
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

    return NextResponse.json({
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: netBalance,
      },
      monthly: formattedMonthlyData,
      categories: formattedCategories,
      health: {
        runway: Math.max(0, cashRunway),
        burnRate: { gross: avgMonthlyExpense, net: netBurnRate },
        profitMargin: grossProfitMargin,
        avgMonthlyIncome,
        avgMonthlyExpense,
        healthScore,
        runwayProjection,
      },
    });
  } catch (error) {
    console.error('Summary API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    );
  }
}
