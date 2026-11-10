const oneDecimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
});

const EMPTY = '—';

/** "2,8 meses"; "—" si no hay demanda con la que calcularlo. */
export const formatMonths = (value: number | null): string => {
  if (value === null) return EMPTY;
  return `${oneDecimal.format(value)} ${value === 1 ? 'mes' : 'meses'}`;
};

export const formatPercent = (value: number | null): string =>
  value === null ? EMPTY : `${oneDecimal.format(value)}%`;

/** Veces que rota el inventario en el año. */
export const formatTurns = (value: number | null): string =>
  value === null ? EMPTY : `${twoDecimals.format(value)}×`;

export const formatDecimal = (value: number): string =>
  oneDecimal.format(value);

/** "mar 2026" a partir de una fecha ISO. */
export const formatMonthYear = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
