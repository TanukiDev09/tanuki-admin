/**
 * Definición única del flujo de caja del panel.
 *
 * - Vista consolidada: flujo = Ingresos - Egresos. Los Traslados se excluyen
 *   (plata que pasa entre cuentas propias no entra ni sale de la empresa).
 * - Vista de una cuenta X:
 *     entradas = Ingresos de X + Traslados cuyo destinationAccount es X
 *     salidas  = Egresos de X + Traslados cuyo account es X
 *
 * Las expresiones asumen fechas en UTC (el comportamiento por defecto de Mongo).
 */

export const INCOME_TYPES = ['Ingreso', 'INCOME', 'factura_emitida'];
export const TRANSFER_TYPES = ['Traslado', 'TRANSFER'];

export type FlowKind = 'income' | 'expense' | 'transfer';

export function classifyMovementType(type: unknown): FlowKind {
  if (typeof type === 'string') {
    if (INCOME_TYPES.includes(type)) return 'income';
    if (TRANSFER_TYPES.includes(type)) return 'transfer';
  }
  return 'expense';
}

export const isIncomeType = (type: unknown) =>
  classifyMovementType(type) === 'income';
export const isTransferType = (type: unknown) =>
  classifyMovementType(type) === 'transfer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expr = any;

const isIncomeExpr: Expr = { $in: ['$type', INCOME_TYPES] };
const isTransferExpr: Expr = { $in: ['$type', TRANSFER_TYPES] };
const isExpenseExpr: Expr = {
  $and: [{ $not: [isIncomeExpr] }, { $not: [isTransferExpr] }],
};

// account/destinationAccount pueden venir como ObjectId o texto: se comparan
// siempre como texto.
const accountIs = (field: string, accountId: string): Expr => ({
  $eq: [{ $toString: { $ifNull: [field, ''] } }, accountId],
});

/**
 * Filtro $match para quedarse solo con los movimientos que tocan la cuenta
 * (como origen o como destino). Sin cuenta devuelve un filtro vacío.
 */
export function accountMatchStage(accountId?: string | null) {
  if (!accountId) return {};
  return {
    $expr: {
      $or: [
        accountIs('$account', accountId),
        accountIs('$destinationAccount', accountId),
      ],
    },
  };
}

/**
 * Expresiones de Mongo (por documento) para sumar con $sum.
 * `amount` es la expresión del monto a sumar (p. ej. amountInCOP).
 */
export function flowExpressions(amount: Expr, accountId?: string | null) {
  if (!accountId) {
    return {
      income: { $cond: [isIncomeExpr, amount, 0] },
      expense: { $cond: [isExpenseExpr, amount, 0] },
      isIncome: isIncomeExpr,
    };
  }

  const incomeIn: Expr = {
    $or: [
      { $and: [isIncomeExpr, accountIs('$account', accountId)] },
      { $and: [isTransferExpr, accountIs('$destinationAccount', accountId)] },
    ],
  };
  const expenseOut: Expr = {
    $or: [
      { $and: [isExpenseExpr, accountIs('$account', accountId)] },
      { $and: [isTransferExpr, accountIs('$account', accountId)] },
    ],
  };

  return {
    income: { $cond: [incomeIn, amount, 0] },
    expense: { $cond: [expenseOut, amount, 0] },
    isIncome: { $and: [isIncomeExpr, accountIs('$account', accountId)] },
  };
}
