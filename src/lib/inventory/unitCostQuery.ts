import type mongoose from 'mongoose';
import InventoryMovement from '@/models/InventoryMovement';
import Movement from '@/models/Movement';
import { toNumber, type DecimalValue } from '@/lib/math';
import {
  estimateFromPrintingTotal,
  estimateUnitCost,
  type BookPurchase,
  type PurchaseFinancials,
  type UnitCostEstimate,
} from './unitCost';

/** Compras recientes que se revisan para encontrar un precio. */
const MAX_PURCHASES = 10;

interface FinancialDoc {
  _id: mongoose.Types.ObjectId;
  date: Date;
  description?: string;
  amount?: DecimalValue;
  amountInCOP?: DecimalValue;
  exchangeRate?: DecimalValue;
  beneficiary?: string;
  items?: Array<{
    bookId?: mongoose.Types.ObjectId | null;
    quantity?: DecimalValue;
    unitValue?: DecimalValue;
  }>;
}

function toFinancials(doc: FinancialDoc): PurchaseFinancials {
  // `amountInCOP` puede faltar en movimientos antiguos: se cae al monto.
  const amountInCOP = toNumber(doc.amountInCOP) || toNumber(doc.amount);
  return {
    amountInCOP,
    exchangeRate: toNumber(doc.exchangeRate) || 1,
    supplier: doc.beneficiary || undefined,
    items: (doc.items ?? []).map((item) => ({
      bookId: item.bookId ? String(item.bookId) : undefined,
      quantity: toNumber(item.quantity),
      unitValue: toNumber(item.unitValue),
    })),
  };
}

interface PrintingPayment {
  date: Date;
  amount?: DecimalValue;
  amountInCOP?: DecimalValue;
  beneficiary?: string;
}

/** Ejemplares ingresados por compra del libro. */
async function purchasedCopies(bookId: mongoose.Types.ObjectId) {
  const [row] = await InventoryMovement.aggregate([
    {
      $match: { type: 'INGRESO', subType: 'PURCHASE', 'items.bookId': bookId },
    },
    { $unwind: '$items' },
    { $match: { 'items.bookId': bookId } },
    {
      $group: {
        _id: null,
        copies: { $sum: { $toDouble: { $ifNull: ['$items.quantity', 0] } } },
      },
    },
  ]);
  return (row?.copies as number | undefined) ?? 0;
}

/** Respaldo: egresos de impresión del centro de costo ÷ ejemplares comprados. */
async function costFromCostCenter(
  bookId: mongoose.Types.ObjectId,
  costCenter: string,
  catalogPrice?: number
): Promise<UnitCostEstimate | null> {
  const payments = await Movement.find({
    type: 'Egreso',
    costCenter,
    description: { $regex: /impresi/i, $not: /muestra/i },
  })
    .sort({ date: -1 })
    .select('date amount amountInCOP beneficiary')
    .lean<PrintingPayment[]>();
  if (payments.length === 0) return null;

  const totalPaid = payments.reduce(
    (sum, p) => sum + (toNumber(p.amountInCOP) || toNumber(p.amount)),
    0
  );
  return estimateFromPrintingTotal({
    totalPaid,
    copies: await purchasedCopies(bookId),
    lastPaymentDate: payments[0].date,
    supplier: payments[0].beneficiary || undefined,
    catalogPrice,
  });
}

/**
 * Estimado del costo unitario de un libro: precio unitario de la última
 * compra a la imprenta. Sale de los egresos que traen el libro en sus ítems
 * (los ingresos de inventario no guardan precio ni están vinculados).
 * Las muestras no cuentan: no son una tirada.
 */
export async function getBookUnitCost(
  bookId: mongoose.Types.ObjectId,
  catalogPrice?: number,
  costCenter?: string
): Promise<UnitCostEstimate | null> {
  const docs = await Movement.find({
    type: 'Egreso',
    'items.bookId': bookId,
    description: { $not: /muestra/i },
  })
    .sort({ date: -1 })
    .limit(MAX_PURCHASES)
    .select(
      'date description amount amountInCOP exchangeRate beneficiary items'
    )
    .lean<FinancialDoc[]>();

  const purchases: BookPurchase[] = docs.map((doc) => {
    const financials = toFinancials(doc);
    const line = financials.items?.find(
      (item) => item.bookId === String(bookId)
    );
    return {
      date: doc.date,
      quantity: line?.quantity ?? 0,
      bookCount: new Set(financials.items?.map((item) => item.bookId)).size,
      financials,
    };
  });

  const byItem = estimateUnitCost(purchases, String(bookId), catalogPrice);
  if (byItem || !costCenter) return byItem;
  return costFromCostCenter(bookId, costCenter, catalogPrice);
}
