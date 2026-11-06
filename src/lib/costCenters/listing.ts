/**
 * Filtrado y orden del listado de centros de costo. Los parámetros de orden
 * son los mismos que muestran las gráficas de la página (ingresos, egresos,
 * resultado, participación y tendencia), más código, nombre y unidades.
 */
import type { CostCenterStats } from '@/types/cost-center';

export type KindFilter = 'all' | 'books' | 'other';
export type SortDir = 'asc' | 'desc';
export type SortKey =
  | 'code'
  | 'name'
  | 'income'
  | 'expense'
  | 'balance'
  | 'incomeShare'
  | 'expenseShare'
  | 'trend'
  | 'units';

export interface CostCenterRow extends CostCenterStats {
  /** % de los ingresos totales de todos los centros. */
  incomeShare: number;
  /** % de los egresos totales de todos los centros. */
  expenseShare: number;
  /** Resultado de la segunda mitad del historial menos el de la primera. */
  trend: number;
}

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Egresos' },
  { key: 'balance', label: 'Resultado' },
  { key: 'incomeShare', label: 'Participación en ingresos' },
  { key: 'expenseShare', label: 'Participación en egresos' },
  { key: 'trend', label: 'Tendencia (3 meses)' },
  { key: 'units', label: 'Unidades vendidas' },
];

export const KIND_OPTIONS: Array<{ key: KindFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'books', label: 'Libros' },
  { key: 'other', label: 'Otros' },
];

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

/** Variación del resultado: últimos meses menos los meses anteriores. */
export function computeTrend(history: number[]): number {
  const half = Math.floor(history.length / 2);
  if (half === 0) return 0;
  return sum(history.slice(-half)) - sum(history.slice(0, half));
}

/**
 * Agrega participación y tendencia. La participación se calcula sobre todos
 * los centros con valor positivo, igual que las gráficas de dona.
 */
export function withShares(items: CostCenterStats[]): CostCenterRow[] {
  const totalIncome = sum(items.map((i) => Math.max(0, i.income)));
  const totalExpense = sum(items.map((i) => Math.max(0, i.expense)));
  const share = (value: number, total: number) =>
    value > 0 && total > 0 ? (value / total) * 100 : 0;

  return items.map((item) => ({
    ...item,
    incomeShare: share(item.income, totalIncome),
    expenseShare: share(item.expense, totalExpense),
    trend: computeTrend(item.history ?? []),
  }));
}

export function filterCostCenters(
  rows: CostCenterRow[],
  { search, kind }: { search: string; kind: KindFilter }
): CostCenterRow[] {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (kind === 'books' && !row.isBook) return false;
    if (kind === 'other' && row.isBook) return false;
    if (!query) return true;
    return [row.code, row.name, row.bookTitle ?? '']
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
}

const collator = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});

function compare(a: CostCenterRow, b: CostCenterRow, key: SortKey): number {
  if (key === 'code' || key === 'name') return collator.compare(a[key], b[key]);
  return (a[key] ?? 0) - (b[key] ?? 0);
}

/** Devuelve una copia ordenada; el empate se resuelve por nombre. */
export function sortCostCenters(
  rows: CostCenterRow[],
  key: SortKey,
  dir: SortDir
): CostCenterRow[] {
  const factor = dir === 'asc' ? 1 : -1;
  return [...rows].sort(
    (a, b) => compare(a, b, key) * factor || collator.compare(a.name, b.name)
  );
}
