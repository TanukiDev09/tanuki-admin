import { PipelineStage } from 'mongoose';
import Movement from '@/models/Movement';
import { getSemanticCategoryColor } from '@/styles/category-utils';
import { add, subtract, toNumber } from '@/lib/math';
import {
  GET_AMOUNT_COP_EXPR,
  GET_CC_PORTION_EXPR,
  calculateRelevantAmount,
} from './aggregations';
import { MonthlyData } from './health';

export async function getTotals(
  matchStage: Record<string, unknown>,
  costCenterCode?: string
) {
  const pipeline: PipelineStage[] = [{ $match: matchStage }];

  if (costCenterCode) {
    // If a cost center filter is applied, we only want the portion of the amount that belongs to it.
    pipeline.push({
      $addFields: {
        finalAmount: GET_CC_PORTION_EXPR(costCenterCode),
      },
    });

    pipeline.push({
      $group: {
        _id: '$type',
        total: { $sum: '$finalAmount' },
        quantity: { $sum: { $ifNull: ['$quantity', 0] } },
      },
    });
  } else {
    pipeline.push({
      $group: {
        _id: '$type',
        total: { $sum: GET_AMOUNT_COP_EXPR },
        quantity: { $sum: { $ifNull: ['$quantity', 0] } },
      },
    });
  }

  const totalsResponse = await Movement.aggregate(pipeline);

  let totalIncome = '0';
  let totalExpenses = '0';
  let totalQuantity = 0;

  totalsResponse.forEach((t) => {
    const val = t.total ? t.total.toString() : '0';
    // Match both Spanish and English types
    const isIncome =
      t._id === 'Ingreso' || t._id === 'INCOME' || t._id === 'factura_emitida';
    if (isIncome) {
      totalIncome = add(totalIncome, val);
      totalQuantity += toNumber(t.quantity || 0);
    } else {
      totalExpenses = add(totalExpenses, val);
    }
  });

  return {
    totalIncome,
    totalExpenses,
    totalQuantity,
    netBalance: subtract(totalIncome, totalExpenses),
  };
}

export async function getMovements(
  query: Record<string, unknown>,
  page: number,
  limit: number,
  costCenterCode?: string
) {
  const skip = (page - 1) * limit;
  const [movements, total] = await Promise.all([
    Movement.find(query)
      .populate('category')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Movement.countDocuments(query),
  ]);

  const formatted = movements.map((m) => {
    const plain = m.toObject();
    let normalizedType = plain.type;

    if (
      plain.type === 'Ingreso' ||
      plain.type === 'INCOME' ||
      plain.type === 'factura_emitida'
    )
      normalizedType = 'INCOME';
    else normalizedType = 'EXPENSE';

    const amountInCOP = toNumber(plain.amountInCOP || 0);
    const relevantAmount = calculateRelevantAmount(
      plain,
      amountInCOP,
      costCenterCode
    );

    return {
      ...plain,
      _id: plain._id.toString(),
      type: normalizedType,
      amount: toNumber(plain.amount),
      amountInCOP,
      relevantAmount,
      exchangeRate: toNumber(plain.exchangeRate),
      quantity: plain.quantity ? toNumber(plain.quantity) : undefined,
      unitValue: plain.unitValue ? toNumber(plain.unitValue) : undefined,
      category:
        plain.category && typeof plain.category === 'object'
          ? {
              ...plain.category,
              color: getSemanticCategoryColor(
                plain.type,
                plain.category.color,
                plain.category._id.toString()
              ),
            }
          : plain.category,
    };
  });

  return { formatted, total };
}

export async function getMonthlyData(
  matchStage: Record<string, unknown>,
  yearContext?: number,
  costCenterCode?: string
) {
  const pipeline: PipelineStage[] = [{ $match: matchStage }];

  if (costCenterCode) {
    pipeline.push({
      $addFields: {
        finalAmount: GET_CC_PORTION_EXPR(costCenterCode),
      },
    });

    pipeline.push({
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']] },
              '$finalAmount',
              0,
            ],
          },
        },
        expense: {
          $sum: {
            $cond: [
              {
                $not: {
                  $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']],
                },
              },
              '$finalAmount',
              0,
            ],
          },
        },
      },
    });
  } else {
    pipeline.push({
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']] },
              GET_AMOUNT_COP_EXPR,
              0,
            ],
          },
        },
        expense: {
          $sum: {
            $cond: [
              {
                $not: {
                  $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']],
                },
              },
              GET_AMOUNT_COP_EXPR,
              0,
            ],
          },
        },
      },
    });
  }

  const monthlyData = await Movement.aggregate([
    ...pipeline,
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  let formattedMonthlyData: MonthlyData[] = monthlyData.map((d) => ({
    month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
    income: toNumber(d.income),
    expenses: toNumber(d.expense),
  }));

  // If a year context is provided (e.g., Annual View), fill in missing months
  if (yearContext) {
    const filledData: MonthlyData[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${yearContext}-${String(m).padStart(2, '0')}`;
      const found = formattedMonthlyData.find((d) => d.month === monthStr);
      if (found) {
        filledData.push(found);
      } else {
        filledData.push({
          month: monthStr,
          income: 0,
          expenses: 0,
        });
      }
    }
    formattedMonthlyData = filledData;
  }

  return { monthlyData, formattedMonthlyData };
}

export async function getCategoryBreakdown(
  matchStage: Record<string, unknown>,
  startDate: Date | undefined,
  endDate: Date | undefined,
  isIncome: boolean = false,
  costCenterCode?: string
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

  const pipeline: PipelineStage[] = [{ $match: matchQuery }];

  if (costCenterCode) {
    pipeline.push({
      $addFields: {
        finalAmount: GET_CC_PORTION_EXPR(costCenterCode),
      },
    });
    pipeline.push({
      $group: {
        _id: '$category',
        value: { $sum: '$finalAmount' },
      },
    });
  } else {
    pipeline.push({
      $group: {
        _id: '$category',
        value: { $sum: GET_AMOUNT_COP_EXPR },
      },
    });
  }

  pipeline.push(
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
    { $limit: 15 }
  );

  const categoryBreakdown = await Movement.aggregate(pipeline);

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

export async function getCostCenterBreakdown(
  matchStage: Record<string, unknown>,
  startDate: Date | undefined,
  endDate: Date | undefined,
  isIncome: boolean = false
) {
  const matchQuery: Record<string, unknown> = {
    ...matchStage,
    type: isIncome
      ? { $in: ['Ingreso', 'INCOME', 'factura_emitida'] }
      : { $nin: ['Ingreso', 'INCOME', 'factura_emitida'] },
  };

  if (startDate && endDate) {
    matchQuery['date'] = { $gte: startDate, $lte: endDate };
  }

  const breakdown = await Movement.aggregate([
    { $match: matchQuery },
    {
      $project: {
        costCenters: {
          $cond: {
            if: {
              $and: [{ $isArray: '$items' }, { $gt: [{ $size: '$items' }, 0] }],
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
                    cc: { $ifNull: ['$costCenter', 'Sin definir'] },
                    val: GET_AMOUNT_COP_EXPR,
                  },
                ],
              },
            },
          },
        },
      },
    },
    { $unwind: '$costCenters' },
    // costCenters.cc is now itself an array of one or more codes (a
    // movement/item/allocation can belong to several cost centers at once);
    // unwind it too so grouping happens per individual code, not per array.
    {
      $addFields: {
        'costCenters.cc': {
          $cond: [
            { $isArray: '$costCenters.cc' },
            '$costCenters.cc',
            ['$costCenters.cc'],
          ],
        },
      },
    },
    { $unwind: '$costCenters.cc' },
    {
      $group: {
        _id: '$costCenters.cc',
        value: {
          $sum: { $toDouble: '$costCenters.val' },
        },
      },
    },
    { $sort: { value: isIncome ? -1 : 1 } },
    { $limit: 15 },
  ]);

  return breakdown.map((cc) => ({
    name: cc._id || 'Sin definir',
    value: Math.abs(toNumber(cc.value)),
  }));
}

export async function getDailyData(
  matchStage: Record<string, unknown>,
  startOfMonth: Date,
  endOfMonth: Date,
  referenceDate: Date,
  costCenterCode?: string
) {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...matchStage,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
  ];

  if (costCenterCode) {
    pipeline.push({
      $addFields: {
        finalAmount: GET_CC_PORTION_EXPR(costCenterCode),
      },
    });
    pipeline.push({
      $group: {
        _id: {
          day: { $dayOfMonth: '$date' },
        },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']] },
              '$finalAmount',
              0,
            ],
          },
        },
        expense: {
          $sum: {
            $cond: [
              {
                $not: {
                  $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']],
                },
              },
              '$finalAmount',
              0,
            ],
          },
        },
      },
    });
  } else {
    pipeline.push({
      $group: {
        _id: {
          day: { $dayOfMonth: '$date' },
        },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']] },
              GET_AMOUNT_COP_EXPR,
              0,
            ],
          },
        },
        expense: {
          $sum: {
            $cond: [
              {
                $not: {
                  $in: ['$type', ['Ingreso', 'INCOME', 'factura_emitida']],
                },
              },
              GET_AMOUNT_COP_EXPR,
              0,
            ],
          },
        },
      },
    });
  }

  pipeline.push({ $sort: { '_id.day': 1 } });
  const dailyData = await Movement.aggregate(pipeline);

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
