/**
 * Saldo de caja real por mes, a partir de los cierres documentados.
 *
 * El saldo de caja es la plata que hay en TODAS las cuentas (banco y
 * billeteras) al cierre de cada mes. Sale de la colección `reconciliations`:
 * el cierre de Davivienda según el extracto y el de cada billetera según su
 * reporte. El flujo del mes es la diferencia entre un cierre y el anterior.
 *
 * Reglas:
 * - Un cierre documentado es la suma de los cierres de las cuentas de ese mes.
 * - Si el mes no tiene cierre y el anterior sí, se calcula con el flujo de los
 *   movimientos cargados (ingresos menos egresos; los traslados no cuentan).
 * - Si alguna cuenta entra en el mes SIN saldo inicial documentado
 *   (openingBalance null), el flujo del mes no es determinable: se devuelve
 *   null y, si existe, el rango estimado guardado en la conciliación. El saldo
 *   de cierre sí se muestra, porque está documentado.
 * - Los meses futuros no tienen saldo.
 */

export interface ReconciliationRow {
  account: string;
  period: string; // AAAA-MM
  openingBalance: number | null;
  closingBalance: number | null;
  basis?: string | null; // extracto | reporte | calculado | derivado
  flowRange?: { low: number; high: number; note?: string } | null;
  notes?: string | null;
}

export type CashBasis = 'documentado' | 'calculado';

export interface CashMonth {
  month: string; // AAAA-MM
  /** Saldo de caja total al cierre del mes. null = mes futuro o sin dato. */
  closing: number | null;
  /** Variación del saldo en el mes. null = no determinable o sin dato. */
  flow: number | null;
  basis: CashBasis | null;
  /** true si hay cuentas sin saldo inicial documentado en el mes. */
  flowEstimated: boolean;
  flowRange: { low: number; high: number } | null;
  note: string | null;
  /** Cierre solo del banco (filas con basis "extracto"). */
  bankClosing: number | null;
}

export interface CashSeries {
  year: number;
  months: CashMonth[];
  /** Último saldo de caja disponible hasta el mes actual. */
  current: number | null;
  currentMonth: string | null;
  /** Cuenta del banco (la de las filas con basis "extracto"). */
  bankAccountId: string | null;
  /** Saldo de caja al cierre del año anterior (diciembre), si está documentado. */
  previousYearClosing: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

function sumClosings(rows: ReconciliationRow[] | undefined): number | null {
  if (!rows) return null;
  const withClosing = rows.filter((r) => typeof r.closingBalance === 'number');
  if (withClosing.length === 0) return null;
  return round2(
    withClosing.reduce((acc, r) => acc + (r.closingBalance ?? 0), 0)
  );
}

function bankClosingOf(rows: ReconciliationRow[] | undefined): number | null {
  if (!rows) return null;
  const bank = rows.filter(
    (r) => r.basis === 'extracto' && typeof r.closingBalance === 'number'
  );
  if (bank.length === 0) return null;
  return round2(bank.reduce((acc, r) => acc + (r.closingBalance ?? 0), 0));
}

const emptyMonth = (month: string): CashMonth => ({
  month,
  closing: null,
  flow: null,
  basis: null,
  flowEstimated: false,
  flowRange: null,
  note: null,
  bankClosing: null,
});

const ESTIMATED_NOTE =
  'Hay cuentas sin saldo inicial documentado este mes (billeteras al 31 de agosto sin reporte). El flujo del mes no se puede determinar con exactitud.';

/** Mes con cierre documentado: el saldo es real; el flujo solo si es determinable. */
function documentedMonth(
  month: string,
  rows: ReconciliationRow[],
  closing: number,
  prevClosing: number | null
): CashMonth {
  const incorporated = rows.filter(
    (r) => r.openingBalance === null && typeof r.closingBalance === 'number'
  );
  const estimated = incorporated.length > 0;
  const range = incorporated.find((r) => r.flowRange)?.flowRange;

  let flow: number | null = null;
  if (!estimated && prevClosing !== null) flow = round2(closing - prevClosing);

  return {
    month,
    closing,
    flow,
    basis: 'documentado',
    flowEstimated: estimated,
    flowRange: range ? { low: range.low, high: range.high } : null,
    note: estimated ? ESTIMATED_NOTE : null,
    bankClosing: bankClosingOf(rows),
  };
}

/** Mes sin cierre: se proyecta con el flujo de los movimientos cargados. */
function calculatedMonth(
  month: string,
  prevClosing: number,
  booksNet: Record<string, number>
): CashMonth {
  const flow = round2(booksNet[month] ?? 0);
  return {
    ...emptyMonth(month),
    closing: round2(prevClosing + flow),
    flow,
    basis: 'calculado',
  };
}

function groupByPeriod(rows: ReconciliationRow[]) {
  const byPeriod = new Map<string, ReconciliationRow[]>();
  for (const row of rows) {
    const list = byPeriod.get(row.period) ?? [];
    list.push(row);
    byPeriod.set(row.period, list);
  }
  return byPeriod;
}

/**
 * Arma la serie de saldo de caja de un año.
 * Devuelve null si no hay ancla documentada para empezar el año (cierre de
 * diciembre anterior o de enero); en ese caso el panel usa su cálculo anterior.
 *
 * @param booksNet flujo neto mensual de los movimientos cargados (AAAA-MM -> valor),
 *                 sin traslados. Solo se usa para meses sin cierre documentado.
 * @param currentMonth mes actual (AAAA-MM): los meses posteriores quedan vacíos.
 */
export function buildCashSeries(params: {
  year: number;
  reconciliations: ReconciliationRow[];
  booksNet: Record<string, number>;
  currentMonth: string;
}): CashSeries | null {
  const { year, reconciliations, booksNet, currentMonth } = params;
  const byPeriod = groupByPeriod(reconciliations);

  const previousYearClosing = sumClosings(byPeriod.get(monthKey(year - 1, 12)));
  const januaryClosing = sumClosings(byPeriod.get(monthKey(year, 1)));
  if (previousYearClosing === null && januaryClosing === null) return null;

  const bankAccountId =
    reconciliations.find((r) => r.basis === 'extracto')?.account ?? null;

  const months: CashMonth[] = [];
  let prevClosing: number | null = previousYearClosing;
  let current: number | null = null;
  let currentMonthFound: string | null = null;

  for (let m = 1; m <= 12; m++) {
    const key = monthKey(year, m);
    const rows = byPeriod.get(key) ?? [];
    const documented = sumClosings(rows);

    let month = emptyMonth(key);
    if (key <= currentMonth && documented !== null) {
      month = documentedMonth(key, rows, documented, prevClosing);
    } else if (key <= currentMonth && prevClosing !== null) {
      month = calculatedMonth(key, prevClosing, booksNet);
    }

    months.push(month);
    if (month.closing !== null) {
      prevClosing = month.closing;
      current = month.closing;
      currentMonthFound = key;
    }
  }

  return {
    year,
    months,
    current,
    currentMonth: currentMonthFound,
    bankAccountId: bankAccountId === null ? null : String(bankAccountId),
    previousYearClosing,
  };
}

/** Mes actual en formato AAAA-MM (zona horaria de Colombia, UTC-5). */
export function currentPeriod(now: Date = new Date()): string {
  const bogota = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return monthKey(bogota.getUTCFullYear(), bogota.getUTCMonth() + 1);
}

export interface PeriodBalances {
  /** Saldo de caja al inicio del periodo (cierre del periodo anterior). */
  previousMonth: number;
  /** Saldo de caja al final del periodo. */
  currentMonth: number;
  /** Aclaración cuando el cálculo no cubre todas las cuentas. */
  note: string | null;
}

/**
 * Saldos de apertura y cierre de un periodo a partir de la serie de caja.
 * - month = null: el año completo (cierre de diciembre anterior -> último saldo).
 * - month = 1..12: ese mes. Si el flujo del mes no es determinable (cuentas sin
 *   saldo inicial), se comparan solo los saldos del banco y se avisa en `note`.
 * Devuelve null si no hay datos suficientes (el panel usa su cálculo anterior).
 */
export function periodBalances(
  series: CashSeries,
  month: number | null
): PeriodBalances | null {
  if (month === null) {
    if (series.previousYearClosing === null || series.current === null) {
      return null;
    }
    return {
      previousMonth: series.previousYearClosing,
      currentMonth: series.current,
      note: null,
    };
  }

  const cur = series.months[month - 1];
  if (!cur || cur.closing === null) return null;

  const prev = month === 1 ? null : series.months[month - 2];
  const prevClosing = month === 1 ? series.previousYearClosing : prev?.closing;
  if (prevClosing === null || prevClosing === undefined) return null;

  if (!cur.flowEstimated) {
    return {
      previousMonth: prevClosing,
      currentMonth: cur.closing,
      note: null,
    };
  }

  if (cur.bankClosing === null) return null;
  const prevBank =
    month === 1
      ? series.previousYearClosing
      : (prev?.bankClosing ?? prev?.closing ?? null);
  if (prevBank === null) return null;

  return {
    previousMonth: prevBank,
    currentMonth: cur.bankClosing,
    note: 'Solo incluye el banco: las billeteras no tienen saldo inicial documentado este mes.',
  };
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** "2026-09" -> "Septiembre 2026" */
export function monthName(key: string): string {
  return `${MONTH_NAMES[parseInt(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
}

/** "2026-09" -> "Sep" (con año de dos cifras si se pide: "Sep 26") */
export function shortMonth(key: string, withYear = false): string {
  const abbr = MONTH_NAMES[parseInt(key.slice(5, 7)) - 1].slice(0, 3);
  return withYear ? `${abbr} ${key.slice(2, 4)}` : abbr;
}

/**
 * Meses del año precedidos del cierre de diciembre anterior (si está documentado),
 * para que la gráfica arranque desde el primer cierre real.
 */
export function monthsWithOpening(
  series: Pick<CashSeries, 'year' | 'months' | 'previousYearClosing'>
): CashMonth[] {
  if (series.previousYearClosing === null) return series.months;
  return [
    {
      ...emptyMonth(monthKey(series.year - 1, 12)),
      closing: series.previousYearClosing,
      basis: 'documentado',
    },
    ...series.months,
  ];
}

function previousMonthKey(key: string): string {
  const y = parseInt(key.slice(0, 4));
  const m = parseInt(key.slice(5, 7));
  return m === 1 ? monthKey(y - 1, 12) : monthKey(y, m - 1);
}

/**
 * Antes del primer cierre documentado no hay extractos: el saldo se reconstruye
 * hacia atrás restando el flujo de los movimientos cargados (basis "calculado").
 */
function backfillMonths(
  months: CashMonth[],
  booksNet: Record<string, number>,
  firstMonth?: string | null
): CashMonth[] {
  if (months.length === 0 || !firstMonth || firstMonth >= months[0].month) {
    return months;
  }
  const anchor = months[0];
  if (anchor.closing === null) return months;

  const head: CashMonth[] = [];
  let cursor = anchor.month;
  let cursorClosing = anchor.closing;
  while (cursor > firstMonth) {
    const prev = previousMonthKey(cursor);
    cursorClosing = round2(cursorClosing - (booksNet[cursor] ?? 0));
    head.unshift({
      ...emptyMonth(prev),
      closing: cursorClosing,
      flow: round2(booksNet[prev] ?? 0),
      basis: 'calculado',
    });
    cursor = prev;
  }
  const first: CashMonth = { ...anchor };
  if (first.flow === null && !first.flowEstimated) {
    first.flow = round2(booksNet[first.month] ?? 0);
  }
  return [...head, first, ...months.slice(1)];
}

/**
 * Historia completa: une los años con cierres documentados en una sola serie
 * (la vista global). Quita los meses vacíos del principio y del final.
 */
export function buildCashHistory(params: {
  reconciliations: ReconciliationRow[];
  booksNet: Record<string, number>;
  currentMonth: string;
  /** Primer mes con movimientos (AAAA-MM): la serie se extiende hacia atrás hasta él. */
  firstMonth?: string | null;
}): CashSeries | null {
  const { reconciliations, booksNet, currentMonth, firstMonth } = params;
  const years = reconciliations.map((r) => parseInt(r.period.slice(0, 4)));
  if (years.length === 0) return null;

  const firstYear = Math.min(...years);
  const lastYear = Math.max(parseInt(currentMonth.slice(0, 4)), ...years);

  let months: CashMonth[] = [];
  let bankAccountId: string | null = null;
  for (let year = firstYear; year <= lastYear; year++) {
    const series = buildCashSeries({
      year,
      reconciliations,
      booksNet,
      currentMonth,
    });
    if (!series) continue;
    bankAccountId = bankAccountId ?? series.bankAccountId;
    const yearMonths =
      months.length === 0 ? monthsWithOpening(series) : series.months;
    months = months.concat(yearMonths);
  }

  const first = months.findIndex((m) => m.closing !== null);
  if (first < 0) return null;
  const last = months.map((m) => m.closing !== null).lastIndexOf(true);
  const trimmed = backfillMonths(
    months.slice(first, last + 1),
    booksNet,
    firstMonth
  );

  return {
    year: lastYear,
    months: trimmed,
    current: trimmed[trimmed.length - 1].closing,
    currentMonth: trimmed[trimmed.length - 1].month,
    bankAccountId,
    previousYearClosing: null,
  };
}

/**
 * Recorta la historia a los 12 meses de un año (vista anual). Los meses fuera
 * de la historia quedan vacíos; devuelve null si el año no tiene ningún saldo.
 */
export function sliceCashYear(
  history: CashSeries,
  year: number
): CashSeries | null {
  const byMonth = new Map(history.months.map((m) => [m.month, m]));
  const months = Array.from(
    { length: 12 },
    (_, i) =>
      byMonth.get(monthKey(year, i + 1)) ?? emptyMonth(monthKey(year, i + 1))
  );
  const withClosing = months.filter((m) => m.closing !== null);
  if (withClosing.length === 0) return null;

  const last = withClosing[withClosing.length - 1];
  return {
    year,
    months,
    current: last.closing,
    currentMonth: last.month,
    bankAccountId: history.bankAccountId,
    previousYearClosing: byMonth.get(monthKey(year - 1, 12))?.closing ?? null,
  };
}
