import Invoice from '@/models/Invoice';
import { add, multiply, toNumber } from '@/lib/math';

export const GET_AMOUNT_COP_EXPR = {
  $cond: [
    { $gt: [{ $ifNull: ['$amountInCOP', 0] }, 0] },
    '$amountInCOP',
    '$amount',
  ],
};

// Normalizes a costCenter field (string or string[]) to an array, then checks
// whether ccCode is a member. Movements always store costCenter as an array,
// but we normalize defensively in case of stray legacy values.
export const CC_ARRAY_INCLUDES = (fieldExpr: unknown, ccCode: string) => ({
  $in: [ccCode, { $cond: [{ $isArray: fieldExpr }, fieldExpr, [fieldExpr]] }],
});

export const GET_CC_PORTION_EXPR = (ccCode: string) => ({
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
                    CC_ARRAY_INCLUDES(
                      { $ifNull: ['$$this.costCenter', '$costCenter'] },
                      ccCode
                    ),
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
                        CC_ARRAY_INCLUDES('$$this.costCenter', ccCode),
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
                CC_ARRAY_INCLUDES('$costCenter', ccCode),
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

// costCenter fields are always arrays in the DB; this tolerates a stray
// legacy string value too.
export function ccArrayIncludes(
  cc: string | string[] | undefined,
  code: string
): boolean {
  if (!cc) return false;
  return Array.isArray(cc) ? cc.includes(code) : cc === code;
}

export function calculateRelevantAmount(
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
        if (ccArrayIncludes(itemCC, costCenterCode)) {
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
        if (ccArrayIncludes(alloc.costCenter, costCenterCode)) {
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

  if (!ccArrayIncludes(plain.costCenter, costCenterCode)) {
    return 0;
  }

  return amountInCOP;
}

// Unidades vendidas de un centro de costo: se calculan desde las facturas
// (items.type === 'libro'), no desde movements.quantity, porque en los
// abonos bancarios ese campo es un marcador (=1) y no representa ejemplares.
export async function getUnitsSoldFromInvoices(costCenterCode: string) {
  const result = await Invoice.aggregate([
    { $unwind: '$items' },
    {
      $match: {
        'items.type': 'libro',
        'items.costCenter': costCenterCode,
        status: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: { $ifNull: ['$items.quantity', 0] } },
      },
    },
  ]);

  return result.length > 0 ? toNumber(result[0].totalQuantity) : 0;
}
