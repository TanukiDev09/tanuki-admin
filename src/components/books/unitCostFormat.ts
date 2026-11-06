import type { UnitCostEstimate } from '@/lib/inventory/unitCost';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { formatMonthYear, formatPercent } from './opsFormat';

export const formatUnitCost = (cost: UnitCostEstimate | null): string =>
  cost ? formatCurrency(Math.round(cost.amount)) : '—';

/** Línea corta bajo la cifra: "30% del precio · mar 2026". */
export function unitCostHint(cost: UnitCostEstimate | null): string {
  if (!cost) return 'Sin compra con precio registrado';
  const parts = [
    cost.percentOfPrice === null
      ? null
      : `${formatPercent(cost.percentOfPrice)} del precio`,
    cost.source === 'cost-center'
      ? 'promedio de impresión'
      : `compra ${formatMonthYear(cost.purchaseDate)}`,
  ];
  return parts.filter(Boolean).join(' · ');
}

/** Detalle del origen del estimado, para el tooltip. */
export function unitCostTitle(cost: UnitCostEstimate | null): string {
  if (!cost) {
    return 'No hay una compra a la imprenta con precio registrado: registra el egreso de impresión con el libro en sus ítems.';
  }
  if (cost.source === 'cost-center') {
    return `Promedio: lo pagado en impresión del centro de costo ÷ ${formatNumber(cost.quantity)} ejemplares ingresados por compra. No es el precio de la última tirada.`;
  }
  const origin =
    cost.source === 'line-item'
      ? 'precio unitario registrado en la compra'
      : 'total pagado ÷ ejemplares recibidos';
  const supplier = cost.supplier ? ` a ${cost.supplier}` : '';
  const older = cost.fromLatestPurchase
    ? ''
    : ' Es de una compra anterior: la más reciente no tiene precio registrado.';
  return `Último precio pagado${supplier} (${formatNumber(cost.quantity)} ejemplares, ${formatMonthYear(cost.purchaseDate)}): ${origin}.${older}`;
}
