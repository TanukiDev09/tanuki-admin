import { NextRequest, NextResponse } from 'next/server';
import { PipelineStage } from 'mongoose';
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

async function getTotals(
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

const GET_AMOUNT_COP_EXPR = {
  $cond: [
    { $gt: [{ $ifNull: ['$amountInCOP', 0] }, 0] },
    '$amountInCOP',
    '$amount',
  ],
};

const GET_CC_PORTION_EXPR = (ccCode: string) => ({
  $multiply: [
    {
      $cond: {
        if: {
          $and: [{ $isArray: '$items' }, { $gt: [{ $size: '$items' }, 0] }],
        },
        then: {
          $reduce: {
            input: '$items',
            initialValue: 0,
            in: {
              $add: [
                '$$value',
                {
                  $cond: [
                    {
                      $let: {
                        vars: { cc: { $ifNull: ['$$this.costCenter', '$costCenter'] } },
                        in: {
                          $cond: [
                            { $isArray: '$$cc' },
                            { $in: [ccCode, '$$cc'] },
                            { $eq: ['$$cc', ccCode] },
                          ],
                        },
                      },
                    },
                    { $ifNull: ['$$this.total', 0] },
                    0,
                  ],
                },
              ],
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
              $reduce: {
                input: '$allocations',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    {
                      $cond: [
                        {
                          $cond: [
                            { $isArray: '$$this.costCenter' },
                            { $in: [ccCode, '$$this.costCenter'] },
                            { $eq: ['$$this.costCenter', ccCode] },
                          ],
                        },
                        { $ifNull: ['$$this.amount', 0] },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
            else: {
              $cond: [
                {
                  $cond: [
                    { $isArray: '$costCenter' },
                    { $in: [ccCode, '$costCenter'] },
                    { $eq: ['$costCenter', ccCode] },
                  ],
                },
                GET_AMOUNT_COP_EXPR,
                0,
              ],
            },
          },
        },
      },
    },
    {
      $cond: [
        {
          $or: [
            {
              $and: [{ $isArray: '$items' }, { $gt: [{ $size: '$items' }, 0] }],
            },
            {
              $and: [
                { $isArray: '$allocations' },
                { $gt: [{ $size: '$allocations' }, 0] },
              ],
            },
          ],
        },
        { $ifNull: ['$exchangeRate', 1] },
        1,
      ],
    },
  ],
});

interface MovementItem {
  costCenter?: string | string[];
  total?: { toString(): string } | string | number;
}

interface MovementAllocation {
  costCenter?: string | string[];
  amount?: { toString(): string } | string | number;
}

function matchesCC(cc: string | string[] | undefined, code: string): boolean {
  if (!cc) return false;
  if (Array.isArray(cc)) return cc.includes(code);
  return cc === code;
}

function calculateRelevantAmount(
  plain: {
    items?: MovementItem[];
    allocations?: MovementAllocation[];
    costCenter?: string | string[];
    exchangeRate?: { toString(): string } | string | number;
  },
  amountInCOP: number,
  costCenterCode?: string
): number {
  if (!costCenterCode) return amountInCOP;

  if (plain.items && plain.items.length > 0) {
    const matchingItemsTotal = plain.items.reduce(
      (sum: string, item: MovementItem) => {
        const itemCC = item.costCenter || plain.costCenter;
        if (matchesCC(itemCC, costCenterCode)) {
          return add(sum, item.total?.toString() || '0');
        }
        return sum;
      },
      '0'
    );
    return toNumber(
      multiply(matchingItemsTotal, plain.exchangeRate?.toString() || '1')
    );
  }

  if (plain.allocations && plain.allocations.length > 0) {
    const matchingAllocTotal = plain.allocations.reduce(
      (sum: string, alloc: MovementAllocation) => {
        if (matchesCC(alloc.costCenter, costCenterCode)) {
          return add(sum, alloc.amount?.toString() || '0');
        }
        return sum;
      },
      '0'
    );
    return toNumber(
      multiply(matchingAllocTotal, plain.exchangeRate?.toString() || '1')
    );
  }

  if (!matchesCC(plain.costCenter, costCenterCode)) {
    return 0;
  }

  return amountInCOP;
}

async function getMovements(
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

    // DB stores costCenter as array (e.g. ["03"]); normalize to string
    if (Array.isArray(plain.costCenter)) {
      plain.costCenter = plain.costCenter[0] ?? '';
    }
    if (Array.isArray(plain.allocations)) {
      plain.allocations = plain.allocations.map(
        (al: { costCenter?: unknown; [key: string]: unknown }) => ({
          ...al,
          costCenter: Array.isArray(al.costCenter)
            ? al.costCenter[0] ?? ''
            : al.costCenter,
        })
      );
    }

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

function calculateHealthMetrics(
  totalIncome: string,
  totalExpenses: string,
  netBalance: string,
  formattedMonthlyData: MonthlyData[],
  yearParam: string | null,
  monthParam: string | null
) {
  const isAnnual = yearParam && !monthParam;
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;

  // For annual view of current year, only use months up to now for average
  let relevantMonths = formattedMonthlyData;
  if (isAnnual && parseInt(yearParam) === currentYear) {
    relevantMonths = formattedMonthlyData.slice(0, currentMonth);
  }

  // Filter out months with no activity to avoid dragging down average?
  // Actually, standard burn rate usually counts all months.
  // But let's at least use the last 3 ACTIVE months if possible.
  const last3MonthsMetrics = relevantMonths.slice(-3);

  const avgMonthlyExpenses =
    last3MonthsMetrics.length > 0
      ? divide(
          last3MonthsMetrics.reduce((sum, m) => add(sum, m.expenses), '0'),
          last3MonthsMetrics.length
        )
      : divide(totalExpenses, relevantMonths.length || 1);

  const avgMonthlyIncome =
    last3MonthsMetrics.length > 0
      ? divide(
          last3MonthsMetrics.reduce((sum, m) => add(sum, m.income), '0'),
          last3MonthsMetrics.length
        )
      : divide(totalIncome, relevantMonths.length || 1);

  const netBurnRate = subtract(avgMonthlyExpenses, avgMonthlyIncome);

  const cashRunway = gtZero(netBurnRate)
    ? toNumber(divide(netBalance, netBurnRate))
    : Infinity;

  const grossProfitMargin = gtZero(totalIncome)
    ? toNumber(
        multiply(divide(subtract(totalIncome, totalExpenses), totalIncome), 100)
      )
    : 0;

  const healthScore = calculateHealthScore(
    cashRunway,
    grossProfitMargin,
    relevantMonths
  );

  const runwayProjection = generateRunwayProjection(netBalance, netBurnRate);

  return {
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
}

async function getMonthlyData(
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

  let formattedMonthlyData = monthlyData.map((d) => ({
    month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
    income: toNumber(d.income),
    expenses: toNumber(d.expense),
  }));

  // If a year context is provided (e.g., Annual View), fill in missing months
  if (yearContext) {
    const filledData = [];
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

async function getCategoryBreakdown(
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

// Normalizes a costCenter value that may be stored as array ["03"] or string "03"
function normalizeCCExpr(expr: unknown): unknown {
  return {
    $cond: [
      { $isArray: expr },
      { $ifNull: [{ $arrayElemAt: [expr, 0] }, 'Sin definir'] },
      { $ifNull: [expr, 'Sin definir'] },
    ],
  };
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
                  cc: normalizeCCExpr({ $ifNull: ['$$item.costCenter', '$costCenter'] }),
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
                      cc: normalizeCCExpr('$$alloc.costCenter'),
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
                    cc: normalizeCCExpr('$costCenter'),
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

async function getDailyData(
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
          totalQuantity: toNumber(totalQuantity),
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
