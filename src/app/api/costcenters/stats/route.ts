import { NextRequest, NextResponse } from 'next/server';
import { PipelineStage } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';
import CostCenter from '@/models/CostCenter';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { add, subtract, toNumber } from '@/lib/math';
import { subMonths, startOfMonth, format } from 'date-fns';

/**
 * Helper to determine the best amount value for a movement.
 */
const GET_AMOUNT_COP_EXPR = {
  $cond: [
    { $gt: [{ $ifNull: ['$amountInCOP', 0] }, 0] },
    '$amountInCOP',
    '$amount',
  ],
};

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    // 1. Get all active cost centers
    const costCenters = await CostCenter.find({ isActive: true })
      .sort({ code: 1 })
      .lean();

    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    // 2. Global Totals (All time or relevant period)
    const globalTotals = await Movement.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: GET_AMOUNT_COP_EXPR },
        },
      },
    ]);

    let totalIncome = '0';
    let totalExpenses = '0';

    globalTotals.forEach((t) => {
      const val = t.total ? t.total.toString() : '0';
      const isIncome =
        t._id === 'Ingreso' ||
        t._id === 'INCOME' ||
        t._id === 'factura_emitida';
      if (isIncome) {
        totalIncome = add(totalIncome, val);
      } else {
        totalExpenses = add(totalExpenses, val);
      }
    });

    // 3. Monthly History (Last 6 months)
    const monthlyHistory = await Movement.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: GET_AMOUNT_COP_EXPR },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly data for charts
    const chartData: Record<
      string,
      {
        month: string;
        fullMonth: string;
        income: number;
        expenses: number;
        balance: number;
      }
    > = {};
    for (let i = 0; i < 6; i++) {
      const d = subMonths(now, 5 - i);
      const key = format(d, 'yyyy-MM');
      chartData[key] = {
        month: format(d, 'MMM'),
        fullMonth: key,
        income: 0,
        expenses: 0,
        balance: 0,
      };
    }

    monthlyHistory.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (chartData[key]) {
        const val = toNumber(item.total);
        if (item._id.type === 'Ingreso' || item._id.type === 'INCOME') {
          chartData[key].income += val;
        } else {
          chartData[key].expenses += val;
        }
        chartData[key].balance =
          chartData[key].income - chartData[key].expenses;
      }
    });

    // 4. Per Cost Center Stats
    const incomeTypes = ['Ingreso', 'INCOME', 'factura_emitida'];

    const basePortionsPipeline: PipelineStage[] = [
      {
        $project: {
          portions: {
            $cond: {
              if: {
                $and: [
                  { $isArray: '$items' },
                  { $gt: [{ $size: '$items' }, 0] },
                ],
              },
              then: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: {
                    cc: { $ifNull: ['$$item.costCenter', '$costCenter'] },
                    val: {
                      $multiply: [
                        { $ifNull: ['$$item.total', 0] },
                        { $ifNull: ['$exchangeRate', 1] },
                      ],
                    },
                  },
                },
              },
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $isArray: '$allocations' },
                      { $gt: [{ $size: '$allocations' }, 0] },
                    ],
                  },
                  then: {
                    $map: {
                      input: '$allocations',
                      as: 'alloc',
                      in: {
                        cc: '$$alloc.costCenter',
                        val: {
                          $multiply: [
                            { $ifNull: ['$$alloc.amount', 0] },
                            { $ifNull: ['$exchangeRate', 1] },
                          ],
                        },
                      },
                    },
                  },
                  else: [
                    {
                      cc: { $ifNull: ['$costCenter', '00'] },
                      val: GET_AMOUNT_COP_EXPR,
                    },
                  ],
                },
              },
            },
          },
          type: '$type',
          date: '$date',
        },
      },
      { $unwind: '$portions' },
      {
        $addFields: {
          finalAmount: { $toDouble: { $ifNull: ['$portions.val', 0] } },
        },
      },
    ];

    const ccStats = await Movement.aggregate([
      ...basePortionsPipeline,
      {
        $group: {
          _id: {
            costCenter: '$portions.cc',
            type: '$type',
          },
          total: { $sum: '$finalAmount' },
        },
      },
    ]);

    // 5. Per Cost Center History (Sparklines)
    const ccHistory = await Movement.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo },
        },
      },
      ...basePortionsPipeline,
      {
        $group: {
          _id: {
            costCenter: '$portions.cc',
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          income: {
            $sum: {
              $cond: [{ $in: ['$type', incomeTypes] }, '$finalAmount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [
                { $not: [{ $in: ['$type', incomeTypes] }] },
                '$finalAmount',
                0,
              ],
            },
          },
        },
      },
    ]);

    const formattedCCStats = costCenters.map((cc) => {
      const stats = ccStats.filter((s) => s._id.costCenter === cc.code);
      let income = 0;
      let expense = 0;

      stats.forEach((s) => {
        const val = toNumber(s.total);
        if (s._id.type === 'Ingreso' || s._id.type === 'INCOME') {
          income += val;
        } else {
          expense += val;
        }
      });

      // Sparkline data (balance of last 6 months)
      const history = [];
      for (let i = 0; i < 6; i++) {
        const d = subMonths(now, 5 - i);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;

        const h = ccHistory.find(
          (item) =>
            item._id.costCenter === cc.code &&
            item._id.year === year &&
            item._id.month === month
        );

        const hIncome = h ? toNumber(h.income) : 0;
        const hExpense = h ? toNumber(h.expense) : 0;
        history.push(hIncome - hExpense);
      }

      return {
        ...cc,
        income,
        expense,
        balance: income - expense,
        history,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalIncome: toNumber(totalIncome),
        totalExpenses: toNumber(totalExpenses),
        balance: toNumber(subtract(totalIncome, totalExpenses)),
      },
      history: Object.values(chartData),
      costCenters: formattedCCStats,
    });
  } catch (error) {
    console.error('Error fetching cost centers stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching statistics' },
      { status: 500 }
    );
  }
}
