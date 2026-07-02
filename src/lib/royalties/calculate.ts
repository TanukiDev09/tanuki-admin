import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';
import { add, subtract, multiply, divide, toNumber, compare } from '@/lib/math';
import {
  IRoyaltyLine,
  IAdvanceBreakdownLine,
  RoyaltyBookComputation,
  RoyaltyComputation,
  BalanceFavor,
} from '@/types/royalty';
import { findAdvanceMovements } from './advances';

/**
 * Estados de factura que NO cuentan como venta emitida para regalías.
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

/** Determina a favor de quién queda el saldo neto. */
export function resolveFavor(netSettlement: number | string): BalanceFavor {
  const cmp = compare(netSettlement, 0);
  if (cmp > 0) return 'author';
  if (cmp < 0) return 'publisher';
  return 'none';
}

/** Un contrato del creador con su libro (poblado) para el cálculo. */
export interface AgreementForComputation {
  _id: string;
  role: string;
  royaltyPercentage: number;
  book: { _id: string; title: string; costCenter?: string };
}

/**
 * Construye el cálculo completo de la liquidación de un CREADOR: una sección por
 * obra con ventas en el período, anticipos detectados por obra y totales
 * agregados a nivel de la persona (saldo anterior, anticipo, neto y arrastre).
 *
 * Solo se incluyen obras con ventas en el período (las demás se omiten).
 */
export async function buildCreatorComputation(params: {
  agreements: AgreementForComputation[];
  periodStart: Date;
  periodEnd: Date;
  previousBalance: number;
  /** true en la primera liquidación del creador (se detecta el anticipo). */
  detectAdvances: boolean;
}): Promise<RoyaltyComputation> {
  const { agreements, periodStart, periodEnd, previousBalance, detectAdvances } =
    params;

  const books: RoyaltyBookComputation[] = [];
  const advanceBreakdown: IAdvanceBreakdownLine[] = [];

  let totalCopies = 0;
  let totalInvoicedStr = '0';
  let totalRoyaltiesStr = '0';
  let detectedAdvanceStr = '0';

  for (const agreement of agreements) {
    const book = agreement.book;
    const { lines, totalCopies: copies, totalInvoiced, totalRoyalties } =
      await computeRoyaltyLines(
        book._id,
        periodStart,
        periodEnd,
        agreement.royaltyPercentage
      );

    // Omitir obras sin ventas en el período.
    if (lines.length === 0) continue;

    books.push({
      agreement: agreement._id,
      book: book._id,
      bookTitle: book.title,
      role: agreement.role,
      royaltyPercentage: agreement.royaltyPercentage,
      lines,
      totalCopies: copies,
      totalInvoiced,
      totalRoyalties,
    });

    totalCopies += copies;
    totalInvoicedStr = add(totalInvoicedStr, totalInvoiced);
    totalRoyaltiesStr = add(totalRoyaltiesStr, totalRoyalties);

    // Anticipo detectado para esta obra (solo en la primera liquidación).
    if (detectAdvances) {
      const adv = await findAdvanceMovements({
        bookCostCenter: book.costCenter,
        role: agreement.role,
        periodEnd,
      });
      for (const line of adv.lines) {
        advanceBreakdown.push({ ...line, bookTitle: book.title });
        detectedAdvanceStr = add(detectedAdvanceStr, line.amount);
      }
    }
  }

  const totalRoyalties = toNumber(totalRoyaltiesStr);
  const advancePayment = toNumber(detectedAdvanceStr);

  // net = saldo anterior + regalías generadas − anticipo
  const netSettlement = toNumber(
    subtract(add(previousBalance, totalRoyalties), advancePayment)
  );
  const balanceInFavorOf = resolveFavor(netSettlement);
  const carryoverToNext = balanceInFavorOf === 'publisher' ? netSettlement : 0;

  return {
    books,
    totalCopies,
    totalInvoiced: toNumber(totalInvoicedStr),
    totalRoyalties,
    previousBalance,
    advancePayment,
    advanceBreakdown,
    netSettlement,
    carryoverToNext,
    balanceInFavorOf,
  };
}
