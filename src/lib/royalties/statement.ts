import RoyaltyStatement from '@/models/RoyaltyStatement';
import { toNumber } from '@/lib/math';
import { findAdvanceMovements, AdvanceLine } from './advances';

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
 * Saldo anterior por defecto: el arrastre de la liquidación previa más reciente
 * (aprobada o pagada) del mismo contrato. Permite encadenar el estado de cuenta.
 */
export async function getPreviousStatement(
  agreementId: string,
  beforeDate?: Date
) {
  const query: Record<string, unknown> = {
    agreement: agreementId,
    status: { $in: ['approved', 'paid'] },
  };
  if (beforeDate) {
    query.periodEnd = { $lt: beforeDate };
  }
  return RoyaltyStatement.findOne(query).sort({ periodEnd: -1, createdAt: -1 });
}

export interface RoyaltyDefaults {
  previousBalance: number;
  advancePayment: number;
  /** Movimientos financieros detectados como anticipo (vacío si no aplica). */
  advanceLines: AdvanceLine[];
  /** De dónde sale el anticipo sugerido. */
  advanceSource: 'movements' | 'carryover' | 'none';
}

/**
 * Calcula los valores por defecto de saldo anterior y anticipo para una nueva
 * liquidación de un contrato.
 *
 * - Si ya existe una liquidación previa: el saldo anterior es su arrastre y el
 *   anticipo ya fue aplicado, así que por defecto es 0.
 * - Si es la primera liquidación: saldo anterior 0 y el anticipo se **detecta
 *   automáticamente** en los movimientos financieros (pagos al creador por ese
 *   libro/rol), no del campo del contrato ni de la memoria del usuario.
 */
export async function resolveDefaults(params: {
  agreementId: string;
  role: string;
  bookCostCenter?: string;
  periodStart?: Date;
  periodEnd: Date;
}): Promise<RoyaltyDefaults> {
  const { agreementId, role, bookCostCenter, periodStart, periodEnd } = params;

  const prior = await getPreviousStatement(agreementId, periodStart);
  if (prior) {
    return {
      previousBalance: toNumber(prior.carryoverToNext),
      advancePayment: 0,
      advanceLines: [],
      advanceSource: 'carryover',
    };
  }

  const advance = await findAdvanceMovements({ bookCostCenter, role, periodEnd });
  return {
    previousBalance: 0,
    advancePayment: advance.total,
    advanceLines: advance.lines,
    advanceSource: advance.lines.length > 0 ? 'movements' : 'none',
  };
}
