import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'COP') {
  const locale = currency === 'JPY' ? 'ja-JP' : 'es-CO';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 0,
    maximumFractionDigits: currency === 'JPY' ? 0 : 0,
  })
    .formatToParts(amount)
    .map((part) => (part.type === 'group' ? '\u00A0' : part.value))
    .join('');
}

export function formatNumber(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return String(amount);

  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .formatToParts(value)
    .map((part) => (part.type === 'group' ? '\u00A0' : part.value))
    .join('');
}
