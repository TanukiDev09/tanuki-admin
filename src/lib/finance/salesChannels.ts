/**
 * Clasificación de ejemplares vendidos por canal: punto de venta vs. venta
 * directa. Las facturas no guardan una referencia al punto de venta, así que
 * se usa el mismo criterio que /api/points-of-sale/[id]/stats: coincidencia
 * por NIT/identificación o por nombre del cliente.
 */

export interface PosIdentity {
  _id?: unknown;
  name: string;
  code?: string;
  city?: string;
  identificationNumber?: string;
}

export interface InvoiceCustomer {
  customerName?: string;
  customerTaxId?: string;
}

export interface SalesChannelSlice {
  name: string;
  value: number;
}

const POS_NAME_SUFFIX =
  /\s+(Librerías|Librería|S\.?A\.?S\.?|S\.?A\.?|Libros)\s*$/i;

export const normalizeTaxId = (value?: string): string =>
  (value ?? '').replace(/[^0-9a-z]/gi, '').toLowerCase();

const normalizeName = (value?: string): string =>
  (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Nombre base del PdV sin sufijos societarios; vacío si es muy corto. */
const baseName = (name: string): string => {
  const clean = normalizeName(name.replace(POS_NAME_SUFFIX, ''));
  return clean.length > 3 ? clean : '';
};

/**
 * Punto de venta al que pertenece el cliente de una factura. El NIT tiene
 * prioridad sobre el nombre, que es una coincidencia más débil.
 */
export function findPointOfSale<T extends PosIdentity>(
  invoice: InvoiceCustomer,
  pointsOfSale: T[]
): T | undefined {
  const taxId = normalizeTaxId(invoice.customerTaxId);
  if (taxId) {
    const byTaxId = pointsOfSale.find(
      (pos) => normalizeTaxId(pos.identificationNumber) === taxId
    );
    if (byTaxId) return byTaxId;
  }

  const customer = normalizeName(invoice.customerName);
  return pointsOfSale.find((pos) => {
    const base = baseName(pos.name);
    return !!base && customer.includes(base);
  });
}

export function isPointOfSaleCustomer(
  invoice: InvoiceCustomer,
  pointsOfSale: PosIdentity[]
): boolean {
  return !!findPointOfSale(invoice, pointsOfSale);
}

export function buildSalesChannelSlices(
  rows: Array<InvoiceCustomer & { quantity: number }>,
  pointsOfSale: PosIdentity[]
): SalesChannelSlice[] {
  let pos = 0;
  let direct = 0;
  for (const row of rows) {
    const qty = Number(row.quantity) || 0;
    if (isPointOfSaleCustomer(row, pointsOfSale)) pos += qty;
    else direct += qty;
  }
  return [
    { name: 'Puntos de venta', value: pos },
    { name: 'Venta directa', value: direct },
  ];
}

export interface SalesRow extends InvoiceCustomer {
  quantity: number;
  /** Total de la línea ya convertido a COP. */
  total: number;
  date?: Date | string;
}

export interface TopPointOfSale {
  id: string;
  name: string;
  code?: string;
  city?: string;
  units: number;
  revenue: number;
  invoices: number;
  lastSaleDate?: string;
}

/**
 * Ranking de puntos de venta por ingresos aportados. Las filas de
 * compradores directos se ignoran.
 */
export function buildTopPointsOfSale(
  rows: SalesRow[],
  pointsOfSale: PosIdentity[],
  limit = 5
): TopPointOfSale[] {
  const byPos = new Map<PosIdentity, TopPointOfSale>();

  for (const row of rows) {
    const pos = findPointOfSale(row, pointsOfSale);
    if (!pos) continue;

    const entry = byPos.get(pos) ?? {
      id: String(pos._id ?? pos.code ?? pos.name),
      name: pos.name,
      code: pos.code,
      city: pos.city,
      units: 0,
      revenue: 0,
      invoices: 0,
    };
    entry.units += Number(row.quantity) || 0;
    entry.revenue += Number(row.total) || 0;
    entry.invoices += 1;

    if (row.date) {
      const iso = new Date(row.date).toISOString();
      if (!entry.lastSaleDate || iso > entry.lastSaleDate) {
        entry.lastSaleDate = iso;
      }
    }
    byPos.set(pos, entry);
  }

  return [...byPos.values()]
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, limit);
}

export interface BookPointOfSaleStat extends TopPointOfSale {
  /** % de los ejemplares totales del libro vendidos a este punto de venta. */
  unitsShare: number;
  /** % de los ingresos totales del libro aportados por este punto de venta. */
  revenueShare: number;
  /** % de los ejemplares del canal "puntos de venta" que aporta este punto. */
  channelShare: number;
}

export interface BookChannelSummary {
  totalUnits: number;
  posUnits: number;
  directUnits: number;
  totalRevenue: number;
  posRevenue: number;
  directRevenue: number;
  /** % de ejemplares vendidos vía puntos de venta (el resto es venta directa). */
  posUnitsPct: number;
  /** % de ingresos facturados vía puntos de venta. */
  posRevenuePct: number;
  /** Puntos de venta que registran al menos una venta del libro. */
  pointsOfSaleWithSales: number;
  /** Promedio de ejemplares por punto de venta con ventas. */
  avgUnitsPerPointOfSale: number;
}

export interface BookPointsOfSaleStats {
  summary: BookChannelSummary;
  pointsOfSale: BookPointOfSaleStat[];
}

const pct = (part: number, total: number): number =>
  total > 0 ? (part / total) * 100 : 0;

/**
 * Estadísticas de un libro por canal: proporción puntos de venta vs. venta
 * directa y participación de cada punto de venta (ordenados por ejemplares).
 * Cada fila es una línea de factura del libro.
 */
export function buildBookPointsOfSaleStats(
  rows: SalesRow[],
  pointsOfSale: PosIdentity[]
): BookPointsOfSaleStats {
  let totalUnits = 0;
  let totalRevenue = 0;
  for (const row of rows) {
    totalUnits += Number(row.quantity) || 0;
    totalRevenue += Number(row.total) || 0;
  }

  const ranked = buildTopPointsOfSale(rows, pointsOfSale, Infinity);
  const posUnits = ranked.reduce((sum, pos) => sum + pos.units, 0);
  const posRevenue = ranked.reduce((sum, pos) => sum + pos.revenue, 0);

  const stats = ranked
    .map((pos) => ({
      ...pos,
      unitsShare: pct(pos.units, totalUnits),
      revenueShare: pct(pos.revenue, totalRevenue),
      channelShare: pct(pos.units, posUnits),
    }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue);

  return {
    summary: {
      totalUnits,
      posUnits,
      directUnits: totalUnits - posUnits,
      totalRevenue,
      posRevenue,
      directRevenue: totalRevenue - posRevenue,
      posUnitsPct: pct(posUnits, totalUnits),
      posRevenuePct: pct(posRevenue, totalRevenue),
      pointsOfSaleWithSales: stats.length,
      avgUnitsPerPointOfSale: stats.length > 0 ? posUnits / stats.length : 0,
    },
    pointsOfSale: stats,
  };
}
