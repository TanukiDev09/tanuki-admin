/**
 * Operaciones y logística de un libro: cobertura de inventario, rotación y
 * señal de reimpresión, separando la bodega propia (que abastece la venta
 * directa y las remisiones a librerías) de la red de puntos de venta (stock
 * en consignación).
 *
 * Supuestos del negocio:
 * - La venta directa sale de la bodega propia de la editorial.
 * - Las facturas no guardan punto de venta: se atribuyen por NIT o nombre del
 *   cliente (ver `findPointOfSale`).
 * - Rotación = ejemplares vendidos en 12 meses ÷ stock actual.
 */
import { findPointOfSale, type PosIdentity } from '@/lib/finance/salesChannels';

const DAY_MS = 86_400_000;
const AVG_WINDOW_DAYS = 90;
const MONTHS_IN_WINDOW = AVG_WINDOW_DAYS / 30;
const YEAR_DAYS = 365;
const DEMAND_MONTHS = 12;

/** Cobertura (en meses) por encima de la cual un punto está sobre-abastecido. */
export const OVERSTOCK_MONTHS = 12;
/** Cobertura por debajo de la cual un punto necesita reposición. */
export const LOW_COVERAGE_MONTHS = 1;

export interface OpsSaleRow {
  date: Date | string;
  quantity: number;
  customerName?: string;
  customerTaxId?: string;
}

export interface OpsPointOfSale extends PosIdentity {
  /** Bodega donde el punto de venta guarda su stock en consignación. */
  warehouseId?: string;
}

export interface OpsStockRow {
  warehouseId: string;
  quantity: number;
}

export type OpsMovementType =
  | 'INGRESO'
  | 'REMISION'
  | 'DEVOLUCION'
  | 'LIQUIDACION';

export interface OpsMovementRow {
  type: OpsMovementType | string;
  date: Date | string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  quantity: number;
}

export interface BookOperationsInput {
  sales: OpsSaleRow[];
  pointsOfSale: OpsPointOfSale[];
  stock: OpsStockRow[];
  movements: OpsMovementRow[];
  /** Bodegas de puntos de venta (tipo `pos` o enlazadas a un punto de venta). */
  posWarehouseIds: string[];
  now?: Date;
}

export type PointOfSaleStatus =
  | 'healthy'
  | 'dormant'
  | 'overstock'
  | 'low'
  | 'stockout';

export interface PointOfSaleOps {
  id: string;
  name: string;
  code?: string;
  city?: string;
  /** Stock actual del libro en la bodega del punto. */
  stock: number;
  sold90: number;
  sold365: number;
  soldTotal: number;
  remitted: number;
  returned: number;
  /** Ejemplares liquidados (reportados como vendidos) desde su bodega. */
  liquidated: number;
  lastLiquidationDate?: string;
  /**
   * Remitido − devuelto − liquidado − stock actual. Distinto de cero indica
   * ejemplares que el sistema no sabe explicar (ventas sin liquidar, ajustes).
   */
  difference: number;
  /** Vendido ÷ remitido (0–100); null si nunca se le remitió. */
  sellThroughPct: number | null;
  /** % devuelto sobre lo remitido; null si nunca se le remitió. */
  returnRatePct: number | null;
  /** Ventas de 12 meses ÷ stock actual; null sin stock. */
  rotation: number | null;
  /** Meses que cubre el stock al ritmo de los últimos 90 días. */
  coverageMonths: number | null;
  lastSaleDate?: string;
  status: PointOfSaleStatus;
}

export interface MonthlyDemand {
  /** AAAA-MM (UTC). */
  month: string;
  direct: number;
  pointsOfSale: number;
}

export interface BookOperations {
  stock: {
    own: number;
    atPointsOfSale: number;
    total: number;
    /** Stock en puntos de venta sin ventas en 90 días (recuperable). */
    dormantAtPointsOfSale: number;
  };
  /** Demanda promedio mensual de los últimos 90 días. */
  demand: {
    directMonthly: number;
    pointsOfSaleMonthly: number;
    /** Remisiones menos devoluciones a puntos de venta, por mes. */
    netRemissionsMonthly: number;
    /** Lo que sale de la bodega propia: directa + remisiones netas (≥ 0). */
    ownMonthly: number;
    totalMonthly: number;
  };
  coverage: {
    own: number | null;
    network: number | null;
    combined: number | null;
    /** Cobertura propia si se recupera el stock dormido de las librerías. */
    ownWithRecovery: number | null;
  };
  rotation: {
    turns: number | null;
    daysOfInventory: number | null;
  };
  network: {
    remitted: number;
    returned: number;
    returnRatePct: number | null;
    sellThroughPct: number | null;
    pointsWithStock: number;
    dormantPoints: number;
  };
  /** Ciclo de vida de los ejemplares ingresados. */
  flow: {
    received: number;
    soldDirect: number;
    soldPointsOfSale: number;
    onHandOwn: number;
    onHandPointsOfSale: number;
    /**
     * Ingresado − vendido − en inventario. Puede incluir ajustes manuales o
     * ventas previas al sistema.
     */
    difference: number;
  };
  /** Ejemplares vendidos por mes y canal, últimos 12 meses (incluye el actual). */
  monthlyDemand: MonthlyDemand[];
  lastSaleDate?: string;
  pointsOfSale: PointOfSaleOps[];
}

/** Movimiento reciente del libro, listo para mostrar en el kardex. */
export interface RecentMovement {
  id: string;
  type: string;
  consecutive?: number;
  date: string;
  quantity: number;
  from?: string;
  to?: string;
}

const pct = (part: number, total: number): number | null =>
  total > 0 ? (part / total) * 100 : null;

const ratio = (num: number, den: number): number | null =>
  den > 0 ? num / den : null;

const toTime = (value: Date | string): number => new Date(value).getTime();

const isWithinDays = (nowMs: number, time: number, days: number): boolean =>
  nowMs - time <= days * DAY_MS;

function sum<T>(rows: Iterable<T>, pick: (row: T) => number): number {
  let total = 0;
  for (const row of rows) total += pick(row);
  return total;
}

function addTo(map: Map<string, number>, key: string, value: number): void {
  map.set(key, (map.get(key) ?? 0) + value);
}

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// Ventas por canal
// ---------------------------------------------------------------------------

interface SoldUnits {
  sold90: number;
  sold365: number;
  soldTotal: number;
  lastSale: number | null;
}

const emptySold = (): SoldUnits => ({
  sold90: 0,
  sold365: 0,
  soldTotal: 0,
  lastSale: null,
});

function addSale(
  acc: SoldUnits,
  time: number,
  quantity: number,
  nowMs: number
) {
  if (isWithinDays(nowMs, time, AVG_WINDOW_DAYS)) acc.sold90 += quantity;
  if (isWithinDays(nowMs, time, YEAR_DAYS)) acc.sold365 += quantity;
  acc.soldTotal += quantity;
  if (acc.lastSale === null || time > acc.lastSale) acc.lastSale = time;
}

type MonthlyAccumulator = Map<string, { direct: number; pointsOfSale: number }>;

function addMonthly(
  monthly: MonthlyAccumulator,
  time: number,
  quantity: number,
  channel: 'direct' | 'pointsOfSale'
) {
  const key = monthKey(new Date(time));
  const entry = monthly.get(key) ?? { direct: 0, pointsOfSale: 0 };
  entry[channel] += quantity;
  monthly.set(key, entry);
}

function classifySales(
  sales: OpsSaleRow[],
  pointsOfSale: OpsPointOfSale[],
  nowMs: number
) {
  const byPos = new Map<OpsPointOfSale, SoldUnits>();
  const direct = emptySold();
  const overall = emptySold();
  const monthly: MonthlyAccumulator = new Map();

  for (const sale of sales) {
    const time = toTime(sale.date);
    const quantity = Number(sale.quantity) || 0;
    if (Number.isNaN(time) || quantity === 0) continue;

    addSale(overall, time, quantity, nowMs);
    const pos = findPointOfSale(sale, pointsOfSale);
    if (!pos) {
      addSale(direct, time, quantity, nowMs);
      addMonthly(monthly, time, quantity, 'direct');
      continue;
    }
    const acc = byPos.get(pos) ?? emptySold();
    addSale(acc, time, quantity, nowMs);
    byPos.set(pos, acc);
    addMonthly(monthly, time, quantity, 'pointsOfSale');
  }

  return { byPos, direct, overall, monthly };
}

/** Últimos 12 meses continuos (con ceros), terminando en el mes de `now`. */
function buildMonthlyDemand(
  monthly: MonthlyAccumulator,
  now: Date
): MonthlyDemand[] {
  const series: MonthlyDemand[] = [];
  for (let back = DEMAND_MONTHS - 1; back >= 0; back--) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)
    );
    const month = monthKey(date);
    const entry = monthly.get(month);
    series.push({
      month,
      direct: entry?.direct ?? 0,
      pointsOfSale: entry?.pointsOfSale ?? 0,
    });
  }
  return series;
}

// ---------------------------------------------------------------------------
// Stock y movimientos
// ---------------------------------------------------------------------------

function groupStock(stock: OpsStockRow[], posWarehouses: Set<string>) {
  const byWarehouse = new Map<string, number>();
  for (const row of stock) {
    addTo(byWarehouse, row.warehouseId, Number(row.quantity) || 0);
  }
  let own = 0;
  let atPointsOfSale = 0;
  for (const [warehouseId, quantity] of byWarehouse) {
    if (posWarehouses.has(warehouseId)) atPointsOfSale += quantity;
    else own += quantity;
  }
  return { byWarehouse, own, atPointsOfSale };
}

interface Flows {
  remittedTo: Map<string, number>;
  returnedFrom: Map<string, number>;
  liquidatedFrom: Map<string, number>;
  lastLiquidation: Map<string, number>;
  received: number;
  remitted: number;
  returned: number;
  net90: number;
}

interface FlowEvent {
  mv: OpsMovementRow;
  quantity: number;
  time: number;
  recent: boolean;
}

function recordRemission(flows: Flows, { mv, quantity, recent }: FlowEvent) {
  if (!mv.toWarehouseId) return;
  addTo(flows.remittedTo, mv.toWarehouseId, quantity);
  flows.remitted += quantity;
  if (recent) flows.net90 += quantity;
}

function recordReturn(flows: Flows, { mv, quantity, recent }: FlowEvent) {
  if (!mv.fromWarehouseId) return;
  addTo(flows.returnedFrom, mv.fromWarehouseId, quantity);
  flows.returned += quantity;
  if (recent) flows.net90 -= quantity;
}

function recordLiquidation(flows: Flows, { mv, quantity, time }: FlowEvent) {
  if (!mv.fromWarehouseId) return;
  addTo(flows.liquidatedFrom, mv.fromWarehouseId, quantity);
  const last = flows.lastLiquidation.get(mv.fromWarehouseId);
  if (last === undefined || time > last) {
    flows.lastLiquidation.set(mv.fromWarehouseId, time);
  }
}

function groupFlows(movements: OpsMovementRow[], nowMs: number): Flows {
  const flows: Flows = {
    remittedTo: new Map(),
    returnedFrom: new Map(),
    liquidatedFrom: new Map(),
    lastLiquidation: new Map(),
    received: 0,
    remitted: 0,
    returned: 0,
    net90: 0,
  };

  for (const mv of movements) {
    const time = toTime(mv.date);
    const event: FlowEvent = {
      mv,
      quantity: Number(mv.quantity) || 0,
      time,
      recent: isWithinDays(nowMs, time, AVG_WINDOW_DAYS),
    };
    if (mv.type === 'INGRESO') flows.received += event.quantity;
    else if (mv.type === 'REMISION') recordRemission(flows, event);
    else if (mv.type === 'DEVOLUCION') recordReturn(flows, event);
    else if (mv.type === 'LIQUIDACION') recordLiquidation(flows, event);
  }
  return flows;
}

// ---------------------------------------------------------------------------
// Puntos de venta
// ---------------------------------------------------------------------------

function pointOfSaleStatus(
  stock: number,
  sold90: number,
  coverage: number | null
): PointOfSaleStatus {
  if (stock > 0 && sold90 === 0) return 'dormant';
  if (stock === 0 && sold90 > 0) return 'stockout';
  if (coverage !== null && coverage > OVERSTOCK_MONTHS) return 'overstock';
  if (coverage !== null && coverage < LOW_COVERAGE_MONTHS) return 'low';
  return 'healthy';
}

interface PosFlow {
  remitted: number;
  returned: number;
  liquidated: number;
  lastLiquidation: number | null;
}

function buildPointOfSaleRow(
  pos: OpsPointOfSale,
  sold: SoldUnits,
  stock: number,
  flow: PosFlow
): PointOfSaleOps {
  const coverage =
    sold.sold90 > 0 ? stock / (sold.sold90 / MONTHS_IN_WINDOW) : null;
  const sellThrough = pct(sold.soldTotal, flow.remitted);
  return {
    id: String(pos._id ?? pos.code ?? pos.name),
    name: pos.name,
    code: pos.code,
    city: pos.city,
    stock,
    sold90: sold.sold90,
    sold365: sold.sold365,
    soldTotal: sold.soldTotal,
    remitted: flow.remitted,
    returned: flow.returned,
    liquidated: flow.liquidated,
    lastLiquidationDate: flow.lastLiquidation
      ? new Date(flow.lastLiquidation).toISOString()
      : undefined,
    difference: flow.remitted - flow.returned - flow.liquidated - stock,
    // Las ventas anteriores al sistema pueden superar lo remitido: se
    // acota para no mostrar porcentajes imposibles.
    sellThroughPct: sellThrough === null ? null : Math.min(100, sellThrough),
    returnRatePct: pct(flow.returned, flow.remitted),
    rotation: ratio(sold.sold365, stock),
    coverageMonths: coverage,
    lastSaleDate: sold.lastSale
      ? new Date(sold.lastSale).toISOString()
      : undefined,
    status: pointOfSaleStatus(stock, sold.sold90, coverage),
  };
}

/** Mejor a peor rotación; sin rotación (sin stock) al final. */
function byRotation(a: PointOfSaleOps, b: PointOfSaleOps): number {
  if (a.rotation === null && b.rotation === null) return b.sold365 - a.sold365;
  if (a.rotation === null) return 1;
  if (b.rotation === null) return -1;
  return b.rotation - a.rotation || b.sold365 - a.sold365;
}

function buildPointOfSaleRows(
  pointsOfSale: OpsPointOfSale[],
  byPos: Map<OpsPointOfSale, SoldUnits>,
  stockByWarehouse: Map<string, number>,
  flows: Flows
): PointOfSaleOps[] {
  const rows: PointOfSaleOps[] = [];
  for (const pos of pointsOfSale) {
    const warehouseId = pos.warehouseId ?? '';
    const sold = byPos.get(pos) ?? emptySold();
    const stock = stockByWarehouse.get(warehouseId) ?? 0;
    const flow: PosFlow = {
      remitted: flows.remittedTo.get(warehouseId) ?? 0,
      returned: flows.returnedFrom.get(warehouseId) ?? 0,
      liquidated: flows.liquidatedFrom.get(warehouseId) ?? 0,
      lastLiquidation: flows.lastLiquidation.get(warehouseId) ?? null,
    };

    if (stock === 0 && sold.soldTotal === 0 && flow.remitted === 0) continue;
    rows.push(buildPointOfSaleRow(pos, sold, stock, flow));
  }
  return rows.sort(byRotation);
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

function buildNetwork(
  rows: PointOfSaleOps[],
  flows: Flows
): BookOperations['network'] {
  const remittedRows = rows.filter((row) => row.remitted > 0);
  const sellThrough = pct(
    sum(remittedRows, (row) => row.soldTotal),
    sum(remittedRows, (row) => row.remitted)
  );
  return {
    remitted: flows.remitted,
    returned: flows.returned,
    returnRatePct: pct(flows.returned, flows.remitted),
    sellThroughPct: sellThrough === null ? null : Math.min(100, sellThrough),
    pointsWithStock: rows.filter((row) => row.stock > 0).length,
    dormantPoints: rows.filter((row) => row.status === 'dormant').length,
  };
}

export function computeBookOperations(
  input: BookOperationsInput
): BookOperations {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  const { byPos, direct, overall, monthly } = classifySales(
    input.sales,
    input.pointsOfSale,
    nowMs
  );
  const stock = groupStock(input.stock, new Set(input.posWarehouseIds));
  const flows = groupFlows(input.movements, nowMs);
  const rows = buildPointOfSaleRows(
    input.pointsOfSale,
    byPos,
    stock.byWarehouse,
    flows
  );

  const directMonthly = direct.sold90 / MONTHS_IN_WINDOW;
  const pointsOfSaleMonthly =
    (overall.sold90 - direct.sold90) / MONTHS_IN_WINDOW;
  const netRemissionsMonthly = flows.net90 / MONTHS_IN_WINDOW;
  const ownMonthly = Math.max(0, directMonthly + netRemissionsMonthly);
  const totalMonthly = directMonthly + pointsOfSaleMonthly;

  const dormantUnits = sum(
    rows.filter((row) => row.status === 'dormant'),
    (row) => row.stock
  );
  const totalStock = stock.own + stock.atPointsOfSale;

  return {
    stock: {
      own: stock.own,
      atPointsOfSale: stock.atPointsOfSale,
      total: totalStock,
      dormantAtPointsOfSale: dormantUnits,
    },
    demand: {
      directMonthly,
      pointsOfSaleMonthly,
      netRemissionsMonthly,
      ownMonthly,
      totalMonthly,
    },
    coverage: {
      own: ratio(stock.own, ownMonthly),
      network: ratio(stock.atPointsOfSale, pointsOfSaleMonthly),
      combined: ratio(totalStock, totalMonthly),
      ownWithRecovery: ratio(stock.own + dormantUnits, ownMonthly),
    },
    rotation: {
      turns: ratio(overall.sold365, totalStock),
      daysOfInventory: ratio(totalStock, totalMonthly / 30),
    },
    network: buildNetwork(rows, flows),
    flow: {
      received: flows.received,
      soldDirect: direct.soldTotal,
      soldPointsOfSale: overall.soldTotal - direct.soldTotal,
      onHandOwn: stock.own,
      onHandPointsOfSale: stock.atPointsOfSale,
      difference: flows.received - overall.soldTotal - totalStock,
    },
    monthlyDemand: buildMonthlyDemand(monthly, now),
    lastSaleDate: overall.lastSale
      ? new Date(overall.lastSale).toISOString()
      : undefined,
    pointsOfSale: rows,
  };
}

// ---------------------------------------------------------------------------
// Señal de reimpresión
// ---------------------------------------------------------------------------

export type ReprintStatus = 'now' | 'plan' | 'ok' | 'no-demand';

/** Margen (en meses) sobre el tiempo de reimpresión para empezar a planear. */
export const REPRINT_PLANNING_MARGIN_MONTHS = 2;

/**
 * Compara la cobertura de la bodega propia (la que se repone con la
 * reimpresión) con lo que tarda en llegar una reimpresión.
 * - `now`: el stock se agota antes de que llegue una reimpresión nueva.
 * - `plan`: alcanza, pero con menos de `REPRINT_PLANNING_MARGIN_MONTHS` de
 *   holgura.
 */
export function getReprintStatus(
  ownCoverageMonths: number | null,
  leadTimeMonths: number
): ReprintStatus {
  if (ownCoverageMonths === null) return 'no-demand';
  if (ownCoverageMonths <= leadTimeMonths) return 'now';
  if (ownCoverageMonths <= leadTimeMonths + REPRINT_PLANNING_MARGIN_MONTHS) {
    return 'plan';
  }
  return 'ok';
}

const DAYS_PER_MONTH = 30;

export interface ReprintDates {
  /** Fecha estimada en que se agota la bodega propia (ISO). */
  stockoutDate: string;
  /** Fecha límite para pedir la reimpresión: agotamiento − tiempo de entrega. */
  reprintByDate: string;
  /** true si la fecha límite ya pasó. */
  overdue: boolean;
}

/**
 * Punto de reorden en fechas: con la cobertura actual, cuándo se agota la
 * bodega propia y cuándo habría que haber pedido para que llegue a tiempo.
 */
export function getReprintDates(
  ownCoverageMonths: number | null,
  leadTimeMonths: number,
  now: Date = new Date()
): ReprintDates | null {
  if (ownCoverageMonths === null || !Number.isFinite(ownCoverageMonths)) {
    return null;
  }
  const stockout = now.getTime() + ownCoverageMonths * DAYS_PER_MONTH * DAY_MS;
  const reprintBy = stockout - leadTimeMonths * DAYS_PER_MONTH * DAY_MS;
  return {
    stockoutDate: new Date(stockout).toISOString(),
    reprintByDate: new Date(reprintBy).toISOString(),
    overdue: reprintBy < now.getTime(),
  };
}

export interface DemandTrend {
  /** Ejemplares en los últimos 3 meses. */
  recent: number;
  /** Ejemplares en los 3 meses anteriores. */
  previous: number;
  /** Variación porcentual; null si no había ventas antes. */
  changePct: number | null;
}

const TREND_MONTHS = 3;

/** Compara los últimos 3 meses de demanda contra los 3 anteriores. */
export function getDemandTrend(data: MonthlyDemand[]): DemandTrend | null {
  if (data.length < TREND_MONTHS * 2) return null;
  const sum = (rows: MonthlyDemand[]) =>
    rows.reduce((total, m) => total + m.direct + m.pointsOfSale, 0);
  const recent = sum(data.slice(-TREND_MONTHS));
  const previous = sum(data.slice(-TREND_MONTHS * 2, -TREND_MONTHS));
  if (recent === 0 && previous === 0) return null;
  return {
    recent,
    previous,
    changePct: previous > 0 ? ((recent - previous) / previous) * 100 : null,
  };
}

export type AttentionLevel = 'critical' | 'warning';

export interface AttentionItem {
  key: string;
  level: AttentionLevel;
  text: string;
}

const plural = (n: number, one: string, many: string): string =>
  `${n} ${n === 1 ? one : many}`;

/**
 * Excepciones del libro, de la más urgente a la menos: lo que requiere una
 * decisión hoy. Vacío si todo está en orden.
 */
export function getAttentionItems(
  ops: BookOperations,
  leadTimeMonths: number
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const reprint = getReprintStatus(ops.coverage.own, leadTimeMonths);
  if (reprint === 'now') {
    items.push({ key: 'reprint', level: 'critical', text: 'Reimprimir ya' });
  } else if (reprint === 'plan') {
    items.push({
      key: 'reprint',
      level: 'warning',
      text: 'Planear reimpresión',
    });
  }

  const count = (status: PointOfSaleStatus) =>
    ops.pointsOfSale.filter((pos) => pos.status === status).length;
  const stockout = count('stockout');
  if (stockout > 0) {
    items.push({
      key: 'stockout',
      level: 'critical',
      text: `${plural(stockout, 'punto agotado', 'puntos agotados')}`,
    });
  }
  const dormant = count('dormant');
  if (dormant > 0) {
    items.push({
      key: 'dormant',
      level: 'warning',
      text: `${plural(dormant, 'punto sin ventas con stock', 'puntos sin ventas con stock')}`,
    });
  }
  return items;
}
