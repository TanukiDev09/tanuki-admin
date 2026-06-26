import RoyaltyStatement from '@/models/RoyaltyStatement';
import { toNumber } from '@/lib/math';

/**
 * Convierte los campos Decimal128 de una liquidación a números planos para la respuesta.
 */
export function serializeStatement<T extends Record<string, unknown>>(
  doc: T & { toObject?: () => Record<string, unknown> }
): Record<string, unknown> {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    ...obj,
    _id: obj._id?.toString?.() ?? obj._id,
    advancePayment: toNumber(obj.advancePayment as never),
    previousBalance: toNumber(obj.previousBalance as never),
    totalInvoiced: toNumber(obj.totalInvoiced as never),
    totalRoyalties: toNumber(obj.totalRoyalties as never),
    netSettlement: toNumber(obj.netSettlement as never),
    carryoverToNext: toNumber(obj.carryoverToNext as never),
    paidAmount: toNumber(obj.paidAmount as never),
  };
}

/**
 * Liquidación previa más reciente (aprobada o pagada) del mismo CREADOR.
 * Permite encadenar el estado de cuenta de la persona.
 */
export async function getPreviousStatement(
  creatorId: string,
  beforeDate?: Date
) {
  const query: Record<string, unknown> = {
    creator: creatorId,
    status: { $in: ['approved', 'paid'] },
  };
  if (beforeDate) {
    query.periodEnd = { $lt: beforeDate };
  }
  return RoyaltyStatement.findOne(query).sort({ periodEnd: -1, createdAt: -1 });
}

export interface RoyaltyDefaults {
  previousBalance: number;
  /** true si es la primera liquidación del creador → se detecta el anticipo. */
  detectAdvances: boolean;
  /** De dónde sale el saldo de partida. */
  source: 'first' | 'carryover';
}

/**
 * Valores por defecto de una nueva liquidación de un creador.
 *
 * - Si ya existe una liquidación previa del creador: el saldo de partida es su
 *   arrastre y el anticipo NO se vuelve a aplicar (ya se aplicó en la primera).
 * - Si es la primera: saldo 0 y el anticipo se detecta en los movimientos.
 */
export async function resolveDefaults(params: {
  creatorId: string;
  periodStart?: Date;
}): Promise<RoyaltyDefaults> {
  const { creatorId, periodStart } = params;

  const prior = await getPreviousStatement(creatorId, periodStart);
  if (prior) {
    return {
      previousBalance: toNumber(prior.carryoverToNext),
      detectAdvances: false,
      source: 'carryover',
    };
  }
  return { previousBalance: 0, detectAdvances: true, source: 'first' };
}
