/**
 * Estimado del costo unitario por ejemplar: el precio unitario de la última
 * compra a la imprenta, tomado del egreso que incluye el libro. No hay cotizaciones: es el último precio
 * pagado, no un costo de producción desglosado.
 */

export interface PurchaseLineItem {
  bookId?: string;
  quantity: number;
  /** Precio unitario en la moneda del movimiento. */
  unitValue: number;
}

export interface PurchaseFinancials {
  /** Total pagado, ya convertido a COP. */
  amountInCOP: number;
  /** Factor de conversión de la moneda del movimiento a COP. */
  exchangeRate: number;
  /** Quien recibió el pago (la imprenta). */
  supplier?: string;
  items?: PurchaseLineItem[];
}

export interface BookPurchase {
  date: Date | string;
  /** Ejemplares de este libro recibidos en la compra. */
  quantity: number;
  /** Cuántos libros distintos incluye la compra. */
  bookCount: number;
  /** Movimiento financiero vinculado; null si no se registró. */
  financials: PurchaseFinancials | null;
}

export type UnitCostSource =
  /** Precio unitario registrado en la línea del libro. */
  | 'line-item'
  /** Total pagado ÷ ejemplares recibidos (compra de un solo libro). */
  | 'total'
  /** Egresos de impresión del centro de costo ÷ ejemplares ingresados. */
  | 'cost-center';

export interface UnitCostEstimate {
  /** Costo por ejemplar, en COP. */
  amount: number;
  purchaseDate: string;
  /** Ejemplares comprados en esa compra. */
  quantity: number;
  supplier?: string;
  source: UnitCostSource;
  /** false si la compra más reciente no tenía precio y se usó una anterior. */
  fromLatestPurchase: boolean;
  /** Costo como % del precio de catálogo; null si el libro no tiene precio. */
  percentOfPrice: number | null;
}

const positive = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

function costFromPurchase(
  purchase: BookPurchase,
  bookId: string
): { amount: number; source: UnitCostSource } | null {
  const { financials } = purchase;
  if (!financials) return null;
  const rate = positive(financials.exchangeRate) ? financials.exchangeRate : 1;

  const line = financials.items?.find(
    (item) => item.bookId === bookId && positive(item.unitValue)
  );
  if (line) return { amount: line.unitValue * rate, source: 'line-item' };

  // Sin precio por línea solo se puede repartir el total si la compra es de
  // un único libro; en una compra mixta no se sabe cuánto costó cada uno.
  if (
    purchase.bookCount === 1 &&
    positive(financials.amountInCOP) &&
    positive(purchase.quantity)
  ) {
    return {
      amount: financials.amountInCOP / purchase.quantity,
      source: 'total',
    };
  }
  return null;
}

/**
 * Costo unitario de la última compra del libro que tenga un precio
 * registrado. `purchases` puede venir en cualquier orden.
 */
export function estimateUnitCost(
  purchases: BookPurchase[],
  bookId: string,
  catalogPrice?: number
): UnitCostEstimate | null {
  const newestFirst = [...purchases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const [index, purchase] of newestFirst.entries()) {
    const cost = costFromPurchase(purchase, bookId);
    if (!cost) continue;
    return {
      amount: cost.amount,
      purchaseDate: new Date(purchase.date).toISOString(),
      quantity: purchase.quantity,
      supplier: purchase.financials?.supplier,
      source: cost.source,
      fromLatestPurchase: index === 0,
      percentOfPrice: positive(catalogPrice ?? 0)
        ? (cost.amount / (catalogPrice as number)) * 100
        : null,
    };
  }
  return null;
}

/**
 * Respaldo para libros cuyos egresos no traen el libro en sus ítems: reparte
 * lo pagado en impresión (por centro de costo) entre los ejemplares que
 * ingresaron por compra. Es un promedio de todas las tiradas, no la última.
 */
export function estimateFromPrintingTotal(input: {
  totalPaid: number;
  copies: number;
  lastPaymentDate: Date | string;
  supplier?: string;
  catalogPrice?: number;
}): UnitCostEstimate | null {
  const { totalPaid, copies, catalogPrice } = input;
  if (!positive(totalPaid) || !positive(copies)) return null;
  const amount = totalPaid / copies;
  return {
    amount,
    purchaseDate: new Date(input.lastPaymentDate).toISOString(),
    quantity: copies,
    supplier: input.supplier,
    source: 'cost-center',
    fromLatestPurchase: false,
    percentOfPrice: positive(catalogPrice ?? 0)
      ? (amount / (catalogPrice as number)) * 100
      : null,
  };
}
