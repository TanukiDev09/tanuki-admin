import Movement from '@/models/Movement';
import Reconciliation from '@/models/Reconciliation';
import { toNumber } from '@/lib/math';
import { flowExpressions } from '@/lib/finance/cashflow';
import {
  buildCashHistory,
  currentPeriod,
  periodBalances,
  sliceCashYear,
  type CashSeries,
  type PeriodBalances,
  type ReconciliationRow,
} from '@/lib/finance/cashBalance';
import { GET_AMOUNT_COP_EXPR } from './aggregations';
import type { HealthOptions } from './health';

/**
 * Flujo neto mensual de los movimientos cargados (ingresos - egresos, sin
 * traslados). Solo se usa para meses que todavía no tienen cierre documentado.
 */
export async function getBooksNetByMonth(
  year: number
): Promise<Record<string, number>> {
  const flow = flowExpressions(GET_AMOUNT_COP_EXPR);
  const rows = await Movement.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(Date.UTC(year, 0, 1)),
          $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$date' },
        income: { $sum: flow.income },
        expense: { $sum: flow.expense },
      },
    },
  ]);

  const net: Record<string, number> = {};
  for (const r of rows) {
    const key = `${year}-${String(r._id).padStart(2, '0')}`;
    net[key] = toNumber(r.income) - toNumber(r.expense);
  }
  return net;
}

function toRows(docs: Array<Record<string, unknown>>): ReconciliationRow[] {
  return docs.map((d) => ({
    account: String(d.account),
    period: String(d.period),
    openingBalance:
      typeof d.openingBalance === 'number' ? d.openingBalance : null,
    closingBalance:
      typeof d.closingBalance === 'number' ? d.closingBalance : null,
    basis: (d.basis as string | undefined) ?? null,
    flowRange: (d.flowRange as ReconciliationRow['flowRange']) ?? null,
    notes: (d.notes as string | undefined) ?? null,
  }));
}

/**
 * Serie de caja de un año: se recorta de la historia completa, así que los años
 * anteriores a los cierres documentados usan saldos reconstruidos con movimientos.
 */
export async function getCashSeries(year: number): Promise<CashSeries | null> {
  const history = await getCashHistory();
  return history ? sliceCashYear(history, year) : null;
}

/** Historia completa de caja (vista global): todos los años con cierres. */
export async function getCashHistory(): Promise<CashSeries | null> {
  const docs = await Reconciliation.find({}).lean();
  const reconciliations = toRows(docs);
  if (reconciliations.length === 0) return null;

  const firstMovement = await Movement.findOne({}, { date: 1 })
    .sort({ date: 1 })
    .lean();
  const firstMonth = firstMovement?.date
    ? currentPeriod(new Date(firstMovement.date.getTime() + 5 * 3600 * 1000))
    : null;

  const years = new Set(reconciliations.map((r) => r.period.slice(0, 4)));
  years.add(currentPeriod().slice(0, 4));
  if (firstMonth) years.add(firstMonth.slice(0, 4));
  const startYear = Math.min(...[...years].map((y) => parseInt(y)));
  for (let y = startYear; y <= parseInt(currentPeriod().slice(0, 4)); y++) {
    years.add(String(y));
  }
  const perYear = await Promise.all(
    [...years].map((y) => getBooksNetByMonth(parseInt(y)))
  );
  return buildCashHistory({
    reconciliations,
    booksNet: Object.assign({}, ...perYear),
    currentMonth: currentPeriod(),
    firstMonth,
  });
}

/**
 * Serie de caja + saldos del periodo pedido (año o mes). Solo aplica a la vista
 * consolidada: con filtros de centro de costo, autor o cuenta no se calcula.
 */
export async function getCashContext(params: {
  yearParam: string | null;
  monthParam: string | null;
}): Promise<{ cash: CashSeries | null; balances: PeriodBalances | null }> {
  const { yearParam, monthParam } = params;
  // Vista global: toda la historia con cierres. Anual y mensual: el año pedido.
  const cash = yearParam
    ? await getCashSeries(parseInt(yearParam))
    : await getCashHistory();
  if (!cash || !yearParam) return { cash, balances: null };
  return {
    cash,
    balances: periodBalances(cash, monthParam ? parseInt(monthParam) : null),
  };
}

export interface CashBalances {
  previousMonth: number;
  currentMonth: number;
  note?: string;
}

/**
 * Decide qué saldos y serie de caja devuelve el resumen. Con filtros (centro de
 * costo, autor o cuenta) no hay saldo consolidado: se conserva el cálculo previo.
 */
export async function resolveCash(params: {
  filters: {
    costCenter: string | null;
    creatorId: string | null;
    account: string | null;
  };
  yearParam: string | null;
  monthParam: string | null;
  legacyBalances: CashBalances | undefined;
}): Promise<{
  cash: CashSeries | null;
  balances: CashBalances | undefined;
  health: HealthOptions | undefined;
}> {
  const { filters, yearParam, monthParam, legacyBalances } = params;
  const consolidated =
    !filters.costCenter && !filters.creatorId && !filters.account;
  if (!consolidated) {
    return { cash: null, balances: legacyBalances, health: undefined };
  }

  const { cash, balances } = await getCashContext({ yearParam, monthParam });
  const health = cash ? healthOptionsFor(cash, monthParam) : undefined;
  if (!balances) return { cash, balances: legacyBalances, health };

  const { note, ...amounts } = balances;
  return { cash, balances: note ? { ...amounts, note } : amounts, health };
}

/**
 * Datos para los indicadores de sostenibilidad: la caja real como base y sin los
 * meses incompletos (flujo no determinable) ni el mes en curso en los promedios.
 */
export function healthOptionsFor(
  cash: CashSeries,
  monthParam: string | null
): HealthOptions {
  const excludeMonths = cash.months
    .filter((m) => m.flowEstimated)
    .map((m) => m.month);
  excludeMonths.push(currentPeriod());

  const cashBase = monthParam
    ? (cash.months[parseInt(monthParam) - 1]?.closing ?? null)
    : cash.current;
  return { cashBase, excludeMonths };
}
