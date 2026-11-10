import { NextRequest, NextResponse } from 'next/server';
import { PipelineStage } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';
import CostCenter from '@/models/CostCenter';
import Book from '@/models/Book';
import Invoice from '@/models/Invoice';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { add, subtract, toNumber } from '@/lib/math';
import {
  INCOME_TYPES,
  TRANSFER_TYPES,
  classifyMovementType,
} from '@/lib/finance/cashflow';
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
      const kind = classifyMovementType(t._id);
      if (kind === 'income') {
        totalIncome = add(totalIncome, val);
      } else if (kind === 'expense') {
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
        const kind = classifyMovementType(item._id.type);
        if (kind === 'income') {
          chartData[key].income += val;
        } else if (kind === 'expense') {
          chartData[key].expenses += val;
        }
        chartData[key].balance =
          chartData[key].income - chartData[key].expenses;
      }
    });

    // 4. Per Cost Center Stats
    const incomeTypes = INCOME_TYPES;

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
                    // NOTA: los allocations se guardan en COP (su suma =
                    // amountInCOP), por eso NO se multiplican por exchangeRate.
                    $map: {
                      input: '$allocations',
                      as: 'alloc',
                      in: {
                        cc: '$$alloc.costCenter',
                        val: { $ifNull: ['$$alloc.amount', 0] },
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
      // portions.cc is an array of one or more codes (a movement/item/
      // allocation can belong to several cost centers at once); unwind it
      // too so each portion groups under its own individual code.
      {
        $addFields: {
          'portions.cc': {
            $cond: [
              { $isArray: '$portions.cc' },
              '$portions.cc',
              ['$portions.cc'],
            ],
          },
        },
      },
      { $unwind: '$portions.cc' },
      {
        $addFields: {
          finalAmount: { $toDouble: { $ifNull: ['$portions.val', 0] } },
        },
      },
    ];

    const ccStats = await Movement.aggregate([
      ...basePortionsPipeline,
      { $match: { type: { $nin: TRANSFER_TYPES } } },
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
        $match: { type: { $nin: TRANSFER_TYPES } },
      },
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

    // 6. Libros vinculados y ejemplares vendidos por centro de costo
    // (mismo criterio que "Unidades Vendidas" del detalle).
    const [books, unitsByCenter] = await Promise.all([
      Book.find({ costCenter: { $in: costCenters.map((cc) => cc.code) } })
        .select('title costCenter')
        .sort({ title: 1 })
        .lean<Array<{ title: string; costCenter: string }>>(),
      Invoice.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        { $match: { 'items.type': 'libro' } },
        { $unwind: '$items.costCenter' },
        {
          $group: {
            _id: '$items.costCenter',
            units: { $sum: { $ifNull: ['$items.quantity', 0] } },
          },
        },
      ]),
    ]);
    const firstBookTitle = new Map<string, string>();
    for (const book of books) {
      if (!firstBookTitle.has(book.costCenter)) {
        firstBookTitle.set(book.costCenter, book.title);
      }
    }
    const unitsMap = new Map<string, number>(
      unitsByCenter.map((u: { _id: string; units: number }) => [u._id, u.units])
    );

    const formattedCCStats = costCenters.map((cc) => {
      const stats = ccStats.filter((s) => s._id.costCenter === cc.code);
      let income = 0;
      let expense = 0;

      stats.forEach((s) => {
        const val = toNumber(s.total);
        const kind = classifyMovementType(s._id.type);
        if (kind === 'income') {
          income += val;
        } else if (kind === 'expense') {
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
        isBook: firstBookTitle.has(cc.code),
        bookTitle: firstBookTitle.get(cc.code),
        units: unitsMap.get(cc.code) ?? 0,
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
