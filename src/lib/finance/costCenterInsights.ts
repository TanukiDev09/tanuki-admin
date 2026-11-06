/**
 * Indicadores de gestión de un centro de costo (un título): recuperación de
 * inversión, inventario, devoluciones, cartera, regalías y ritmo de ventas.
 * Son funciones puras; las consultas a la base de datos viven en el endpoint
 * /api/costcenters/[id]/insights.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.44;

// ---------------------------------------------------------------------------
// 1. Recuperación de inversión
// ---------------------------------------------------------------------------

export interface RecoveryInput {
  /** Ingresos acumulados del centro de costo. */
  income: number;
  /** Egresos acumulados (la inversión: impresión, diseño, anticipo...). */
  expenses: number;
  /** Ingreso promedio por ejemplar vendido (desde facturas). */
  revenuePerUnit: number;
  /** Ejemplares vendidos por mes, promedio de los últimos 3 meses. */
  avgMonthlyUnits: number;
  now?: Date;
}

export interface Recovery {
  invested: number;
  recovered: number;
  /** 0-100, tope en 100. */
  recoveredPct: number;
  remaining: number;
  /** Ejemplares que faltan para cubrir lo invertido. null = no estimable. */
  unitsToBreakEven: number | null;
  /** Fecha estimada de recuperación (ISO). null = no estimable o ya cubierta. */
  estimatedDate: string | null;
  status: 'no-investment' | 'recovered' | 'in-progress';
}

export function computeRecovery({
  income,
  expenses,
  revenuePerUnit,
  avgMonthlyUnits,
  now = new Date(),
}: RecoveryInput): Recovery {
  const invested = Math.max(0, expenses);
  const recovered = Math.max(0, income);
  const remaining = Math.max(0, invested - recovered);

  if (invested === 0) {
    return {
      invested,
      recovered,
      recoveredPct: 0,
      remaining: 0,
      unitsToBreakEven: 0,
      estimatedDate: null,
      status: 'no-investment',
    };
  }

  const recoveredPct = Math.min(100, (recovered / invested) * 100);
  if (remaining === 0) {
    return {
      invested,
      recovered,
      recoveredPct,
      remaining,
      unitsToBreakEven: 0,
      estimatedDate: null,
      status: 'recovered',
    };
  }

  const unitsToBreakEven =
    revenuePerUnit > 0 ? Math.ceil(remaining / revenuePerUnit) : null;
  const estimatedDate =
    unitsToBreakEven !== null && avgMonthlyUnits > 0
      ? new Date(
          now.getTime() +
            (unitsToBreakEven / avgMonthlyUnits) * DAYS_PER_MONTH * DAY_MS
        ).toISOString()
      : null;

  return {
    invested,
    recovered,
    recoveredPct,
    remaining,
    unitsToBreakEven,
    estimatedDate,
    status: 'in-progress',
  };
}

// ---------------------------------------------------------------------------
// 6. Ritmo de ventas
// ---------------------------------------------------------------------------

export interface SaleRow {
  date: Date | string;
  quantity: number;
  /** Total de la línea en COP. */
  total: number;
}

export interface PacePoint {
  month: string; // AAAA-MM
  units: number;
  revenue: number;
  /** Meses transcurridos desde la publicación (0 = mes de publicación). */
  monthsSincePublication: number | null;
}

export interface PaceTrend {
  last: number;
  previous: number;
  /** Variación porcentual; null si el periodo anterior fue 0. */
  changePct: number | null;
}

export interface SalesPace {
  series: PacePoint[];
  last30: PaceTrend;
  last90: PaceTrend;
  /** Promedio mensual de ejemplares de los últimos 90 días. */
  avgMonthlyUnits: number;
  /** Ingreso promedio por ejemplar vendido en toda la historia. */
  revenuePerUnit: number;
  totalUnits: number;
}

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

const monthIndex = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

function windowUnits(
  rows: Array<{ time: number; quantity: number }>,
  from: number,
  to: number
): number {
  return rows
    .filter((r) => r.time > from && r.time <= to)
    .reduce((sum, r) => sum + r.quantity, 0);
}

function trend(
  rows: Array<{ time: number; quantity: number }>,
  now: number,
  days: number
): PaceTrend {
  const span = days * DAY_MS;
  const last = windowUnits(rows, now - span, now);
  const previous = windowUnits(rows, now - 2 * span, now - span);
  return {
    last,
    previous,
    changePct: previous > 0 ? ((last - previous) / previous) * 100 : null,
  };
}

interface DatedSale {
  date: Date;
  quantity: number;
  total: number;
}

/** Serie mensual continua, desde la primera venta hasta el mes de `now`. */
function buildMonthlySeries(
  sales: DatedSale[],
  publicationDate: Date | string | null | undefined,
  now: Date
): PacePoint[] {
  if (sales.length === 0) return [];

  const byMonth = new Map<string, { units: number; revenue: number }>();
  for (const sale of sales) {
    const key = monthKey(sale.date);
    const cur = byMonth.get(key) ?? { units: 0, revenue: 0 };
    cur.units += sale.quantity;
    cur.revenue += sale.total;
    byMonth.set(key, cur);
  }

  const first = new Date(Math.min(...sales.map((r) => r.date.getTime())));
  const pub = publicationDate ? new Date(publicationDate) : null;
  const pubIndex = pub && !Number.isNaN(pub.getTime()) ? monthIndex(pub) : null;

  const series: PacePoint[] = [];
  for (let i = monthIndex(first); i <= monthIndex(now); i++) {
    const key = `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
    const data = byMonth.get(key) ?? { units: 0, revenue: 0 };
    series.push({
      month: key,
      units: data.units,
      revenue: data.revenue,
      monthsSincePublication: pubIndex === null ? null : i - pubIndex,
    });
  }
  return series;
}

export function computeSalesPace(
  rows: SaleRow[],
  publicationDate?: Date | string | null,
  now: Date = new Date()
): SalesPace {
  const sales: DatedSale[] = rows
    .map((r) => ({
      date: new Date(r.date),
      quantity: Number(r.quantity) || 0,
      total: Number(r.total) || 0,
    }))
    .filter((r) => !Number.isNaN(r.date.getTime()));

  const totalUnits = sales.reduce((s, r) => s + r.quantity, 0);
  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
  const times = sales.map((r) => ({
    time: r.date.getTime(),
    quantity: r.quantity,
  }));

  const last90 = trend(times, now.getTime(), 90);

  return {
    series: buildMonthlySeries(sales, publicationDate, now),
    last30: trend(times, now.getTime(), 30),
    last90,
    avgMonthlyUnits: last90.last / 3,
    revenuePerUnit: totalUnits > 0 ? totalRevenue / totalUnits : 0,
    totalUnits,
  };
}

// ---------------------------------------------------------------------------
// 2 y 3. Inventario y devoluciones
// ---------------------------------------------------------------------------

export interface StockRow {
  quantity: number;
  /** true si la bodega pertenece a un punto de venta (consignación). */
  atPointOfSale: boolean;
}

export interface InventoryInput {
  /** Suma de los movimientos INGRESO del libro. */
  printRun: number;
  sold: number;
  stock: StockRow[];
  /** Suma de movimientos REMISION. */
  remitted: number;
  /** Suma de movimientos DEVOLUCION. */
  returned: number;
  avgMonthlyUnits: number;
}

export interface InventorySummary {
  printRun: number;
  sold: number;
  /** % del tiraje vendido; null si no hay tiraje registrado. */
  soldPct: number | null;
  inWarehouse: number;
  atPointsOfSale: number;
  onHand: number;
  /** Meses de cobertura al ritmo actual; null si no hay ventas recientes. */
  coverageMonths: number | null;
  remitted: number;
  returned: number;
  /** % devuelto sobre lo remitido; null si no hay remisiones. */
  returnRate: number | null;
}

export function computeInventory(input: InventoryInput): InventorySummary {
  const inWarehouse = input.stock
    .filter((s) => !s.atPointOfSale)
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const atPointsOfSale = input.stock
    .filter((s) => s.atPointOfSale)
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const onHand = inWarehouse + atPointsOfSale;

  return {
    printRun: input.printRun,
    sold: input.sold,
    soldPct:
      input.printRun > 0
        ? Math.min(100, (input.sold / input.printRun) * 100)
        : null,
    inWarehouse,
    atPointsOfSale,
    onHand,
    coverageMonths:
      input.avgMonthlyUnits > 0 ? onHand / input.avgMonthlyUnits : null,
    remitted: input.remitted,
    returned: input.returned,
    returnRate:
      input.remitted > 0 ? (input.returned / input.remitted) * 100 : null,
  };
}

// ---------------------------------------------------------------------------
// 4. Cartera
// ---------------------------------------------------------------------------

export interface ReceivableRow {
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled' | 'Unchecked';
  /** Parte del centro de costo en la factura, en COP. */
  amount: number;
  /** Parte ya cobrada, en COP. */
  paid: number;
  dueDate?: Date | string | null;
  date: Date | string;
}

export interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

export interface Receivables {
  invoiced: number;
  collected: number;
  pending: number;
  overdue: number;
  /** Facturas sin verificar: no se sabe si están cobradas. */
  unverified: number;
  aging: AgingBuckets;
}

function addToAging(
  aging: AgingBuckets,
  pending: number,
  dueDate: Date | string,
  now: Date
) {
  const daysLate = Math.floor(
    (now.getTime() - new Date(dueDate).getTime()) / DAY_MS
  );
  if (daysLate <= 0) aging.current += pending;
  else if (daysLate <= 30) aging.days1to30 += pending;
  else if (daysLate <= 60) aging.days31to60 += pending;
  else if (daysLate <= 90) aging.days61to90 += pending;
  else aging.over90 += pending;
}

export function computeReceivables(
  rows: ReceivableRow[],
  now: Date = new Date()
): Receivables {
  const aging: AgingBuckets = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  };
  let invoiced = 0;
  let collected = 0;
  let unverified = 0;

  for (const row of rows) {
    if (row.status === 'Cancelled' || row.status === 'Draft') continue;
    if (row.status === 'Unchecked') {
      unverified += row.amount;
      continue;
    }

    const paid =
      row.status === 'Paid' ? row.amount : Math.min(row.paid, row.amount);
    invoiced += row.amount;
    collected += paid;

    const pending = row.amount - paid;
    if (pending > 0) addToAging(aging, pending, row.dueDate ?? row.date, now);
  }

  const pending = invoiced - collected;
  return {
    invoiced,
    collected,
    pending,
    overdue: pending - aging.current,
    unverified,
    aging,
  };
}

// ---------------------------------------------------------------------------
// 5. Regalías y anticipo
// ---------------------------------------------------------------------------

export interface Royalties {
  /** Anticipo pactado en los acuerdos del título. */
  advance: number;
  /** Regalías causadas en liquidaciones aprobadas o pagadas. */
  accrued: number;
  /** Anticipo que aún no se ha cubierto con regalías. */
  advanceToRecover: number;
  /** Regalías causadas por encima del anticipo. */
  toPay: number;
}

export function computeRoyalties(advance: number, accrued: number): Royalties {
  return {
    advance,
    accrued,
    advanceToRecover: Math.max(0, advance - accrued),
    toPay: Math.max(0, accrued - advance),
  };
}
