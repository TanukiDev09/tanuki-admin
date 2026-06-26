import mongoose from 'mongoose';
import Movement from '@/models/Movement';
import Category from '@/models/Category';
import { add, toNumber, DecimalValue } from '@/lib/math';

/**
 * Mapeo de rol del contrato → nombre de la categoría de movimiento con la que se
 * registran los pagos/anticipos a ese creador en Tanuki.
 */
export const ROLE_CATEGORY: Record<string, string> = {
  author: 'regalías por derechos de autor',
  translator: 'traducción',
  illustrator: 'Ilustración',
};

export interface AdvanceLine {
  movementId: string;
  date: Date;
  description: string;
  beneficiary?: string;
  amount: number;
}

export interface AdvanceLookup {
  total: number;
  lines: AdvanceLine[];
  categoryName?: string;
  /** true si no se pudo buscar (faltó centro de costo del libro o categoría del rol). */
  unavailable: boolean;
}

/**
 * Busca en los movimientos financieros los anticipos/pagos hechos a un creador
 * por su trabajo en un libro, identificados por:
 *  - centro de costo del libro (`Book.costCenter`)
 *  - categoría correspondiente al rol (traducción / ilustración / regalías…)
 *  - egreso (salida de dinero)
 *  - fecha ≤ fin del período liquidado
 *
 * El creador no tiene un ID estable en los movimientos (va como texto libre en
 * `beneficiary`/`description`), por eso el cruce se hace por centro de costo +
 * categoría, que en los datos reales identifican el pago de forma precisa.
 */
export async function findAdvanceMovements(params: {
  bookCostCenter?: string;
  role: string;
  periodEnd: Date;
}): Promise<AdvanceLookup> {
  const { bookCostCenter, role, periodEnd } = params;
  const categoryName = ROLE_CATEGORY[role];

  if (!bookCostCenter || !categoryName) {
    return { total: 0, lines: [], categoryName, unavailable: true };
  }

  // La categoría puede estar guardada como ObjectId, como string-hex o (legacy)
  // como el propio nombre. Cubrimos las tres formas.
  const category = await Category.findOne({ name: categoryName }).lean<{
    _id: mongoose.Types.ObjectId;
  } | null>();
  const categoryMatch: unknown[] = [categoryName];
  if (category?._id) {
    categoryMatch.push(category._id, category._id.toString());
  }

  const movements = await Movement.find({
    costCenter: bookCostCenter,
    category: { $in: categoryMatch },
    $or: [{ type: 'Egreso' }, { flowDirection: 'outflow' }],
    date: { $lte: periodEnd },
  })
    .sort({ date: 1 })
    .lean();

  let total = '0';
  const lines: AdvanceLine[] = movements.map((m) => {
    const mov = m as unknown as {
      _id: mongoose.Types.ObjectId;
      date: Date;
      description?: string;
      beneficiary?: string;
      amountInCOP?: DecimalValue;
      amount?: DecimalValue;
    };
    const cop = toNumber(mov.amountInCOP);
    const amount = cop > 0 ? cop : toNumber(mov.amount);
    total = add(total, amount);
    return {
      movementId: mov._id.toString(),
      date: mov.date,
      description: mov.description || '',
      beneficiary: mov.beneficiary,
      amount,
    };
  });

  return { total: toNumber(total), lines, categoryName, unavailable: false };
}
