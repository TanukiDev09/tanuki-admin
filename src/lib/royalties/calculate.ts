import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';
import { add, subtract, multiply, divide, toNumber, compare } from '@/lib/math';
import {
  IRoyaltyLine,
  RoyaltyComputation,
  BalanceFavor,
} from '@/types/royalty';

/**
 * Estados de factura que NO cuentan como venta emitida para regalías.
 * (Coherente con las estadísticas de venta por libro, pero excluyendo borradores.)
 */
const EXCLUDED_INVOICE_STATUSES = ['Cancelled', 'Draft'];

interface InvoiceLineAgg {
  _id: mongoose.Types.ObjectId;
  invoiceNumber: string;
  date: Date;
  quantity: number;
  totalInvoiced: number;
  maxUnitPrice: number;
}

/**
 * Calcula las líneas de regalías (ventas en papel) de un libro en un periodo.
 * Una fila por factura: suma ejemplares y total facturado (PVP × ejemplares) del libro en esa factura.
 */
export async function computeRoyaltyLines(
  bookId: string,
  periodStart: Date,
  periodEnd: Date,
  royaltyPercentage: number
): Promise<{
  lines: IRoyaltyLine[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
}> {
  const bookObjectId = new mongoose.Types.ObjectId(bookId);

  const agg: InvoiceLineAgg[] = await Invoice.aggregate([
    {
      $match: {
        status: { $nin: EXCLUDED_INVOICE_STATUSES },
        'items.bookId': bookObjectId,
        date: { $gte: periodStart, $lte: periodEnd },
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.bookId': bookObjectId } },
    {
      $group: {
        _id: '$_id',
        invoiceNumber: { $first: '$number' },
        date: { $first: '$date' },
        quantity: { $sum: '$items.quantity' },
        // Base de regalías = PVP × ejemplares (bruto, sin descuentos de factura)
        totalInvoiced: {
          $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] },
        },
        maxUnitPrice: { $max: '$items.unitPrice' },
      },
    },
    { $sort: { date: 1, invoiceNumber: 1 } },
  ]);

  let totalCopies = 0;
  let totalInvoicedStr = '0';
  let totalRoyaltiesStr = '0';

  const lines: IRoyaltyLine[] = agg.map((row) => {
    const totalInvoiced = row.totalInvoiced;
    const royalty = toNumber(
      divide(multiply(totalInvoiced, royaltyPercentage), 100)
    );
    const pvp =
      row.quantity > 0
        ? toNumber(divide(totalInvoiced, row.quantity))
        : row.maxUnitPrice;

    totalCopies += row.quantity;
    totalInvoicedStr = add(totalInvoicedStr, totalInvoiced);
    totalRoyaltiesStr = add(totalRoyaltiesStr, royalty);

    return {
      invoiceId: row._id.toString(),
      invoiceNumber: row.invoiceNumber,
      quantity: row.quantity,
      pvp,
      date: row.date,
      totalInvoiced,
      totalRoyalty: royalty,
    };
  });

  return {
    lines,
    totalCopies,
    totalInvoiced: toNumber(totalInvoicedStr),
    totalRoyalties: toNumber(totalRoyaltiesStr),
  };
}

/**
 * Determina a favor de quién queda el saldo neto.
 */
export function resolveFavor(netSettlement: number | string): BalanceFavor {
  const cmp = compare(netSettlement, 0);
  if (cmp > 0) return 'author';
  if (cmp < 0) return 'publisher';
  return 'none';
}

/**
 * Construye el cálculo completo de una liquidación, incluyendo saldo anterior,
 * anticipo, neto y arrastre para la siguiente liquidación.
 */
export async function buildComputation(params: {
  bookId: string;
  periodStart: Date;
  periodEnd: Date;
  royaltyPercentage: number;
  previousBalance: number;
  advancePayment: number;
}): Promise<RoyaltyComputation> {
  const {
    bookId,
    periodStart,
    periodEnd,
    royaltyPercentage,
    previousBalance,
    advancePayment,
  } = params;

  const { lines, totalCopies, totalInvoiced, totalRoyalties } =
    await computeRoyaltyLines(
      bookId,
      periodStart,
      periodEnd,
      royaltyPercentage
    );

  // netSettlement = saldo anterior + regalías generadas − anticipo
  const netSettlement = toNumber(
    subtract(add(previousBalance, totalRoyalties), advancePayment)
  );

  const balanceInFavorOf = resolveFavor(netSettlement);

  // Si queda a favor de la editorial (negativo), se arrastra; si es a favor del
  // autor, se salda con una deuda y el arrastre es 0.
  const carryoverToNext = balanceInFavorOf === 'publisher' ? netSettlement : 0;

  return {
    lines,
    totalCopies,
    totalInvoiced,
    totalRoyalties,
    previousBalance,
    advancePayment,
    royaltyPercentage,
    netSettlement,
    carryoverToNext,
    balanceInFavorOf,
  };
}
