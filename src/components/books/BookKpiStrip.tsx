'use client';

import type { BookOperations } from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import type { UnitCostEstimate } from '@/lib/inventory/unitCost';
import { formatMonths, formatPercent, formatTurns } from './opsFormat';
import { formatUnitCost, unitCostHint, unitCostTitle } from './unitCostFormat';
import './BookKpiStrip.scss';

interface BookKpiStripProps {
  operations: BookOperations | null;
  loading: boolean;
  unitCost?: UnitCostEstimate | null;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  title?: string;
}

function buildKpis(
  ops: BookOperations,
  unitCost: UnitCostEstimate | null
): Kpi[] {
  const { stock, coverage, rotation, network } = ops;
  return [
    {
      label: 'Stock total',
      value: formatNumber(stock.total),
      hint: `${formatNumber(stock.own)} propio · ${formatNumber(stock.atPointsOfSale)} en librerías`,
    },
    {
      label: 'Cobertura bodega propia',
      value: formatMonths(coverage.own),
      hint: 'Venta directa + remisiones',
    },
    {
      label: 'Cobertura combinada',
      value: formatMonths(coverage.combined),
      hint: 'Bodega propia + librerías',
    },
    {
      label: 'Rotación del libro',
      value: formatTurns(rotation.turns),
      hint:
        rotation.daysOfInventory === null
          ? 'Ventas 12 meses ÷ stock'
          : `${formatNumber(Math.round(rotation.daysOfInventory))} días de inventario`,
    },
    {
      label: 'Tasa de devolución',
      value: formatPercent(network.returnRatePct),
      hint: `${formatNumber(network.returned)} de ${formatNumber(network.remitted)} remitidos`,
    },
    {
      label: 'Costo unitario estimado',
      value: formatUnitCost(unitCost),
      hint: unitCostHint(unitCost),
      title: unitCostTitle(unitCost),
    },
  ];
}

export default function BookKpiStrip({
  operations,
  loading,
  unitCost = null,
}: BookKpiStripProps) {
  if (loading) {
    return <div className="book-kpis book-kpis--loading" aria-busy="true" />;
  }
  if (!operations) return null;

  return (
    <dl className="book-kpis">
      {buildKpis(operations, unitCost).map((kpi) => (
        <div key={kpi.label} className="book-kpis__item" title={kpi.title}>
          <dt className="book-kpis__label">{kpi.label}</dt>
          <dd className="book-kpis__value">{kpi.value}</dd>
          <dd className="book-kpis__hint">{kpi.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
