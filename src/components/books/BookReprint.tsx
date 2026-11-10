'use client';

import { useState } from 'react';
import {
  REPRINT_PLANNING_MARGIN_MONTHS,
  getReprintDates,
  getReprintStatus,
  type BookOperations,
  type ReprintStatus,
} from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  formatDecimal,
  formatMonths,
  formatPercent,
  formatTurns,
} from './opsFormat';
import './BookReprint.scss';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const LEAD_TIME_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12];
const DEFAULT_LEAD_TIME = 3;

interface BookReprintProps {
  operations: BookOperations;
}

interface StatRow {
  label: string;
  value: string;
  hint?: string;
}

function buildMessage(
  status: ReprintStatus,
  ops: BookOperations,
  leadTime: number
): { title: string; text: string } {
  const own = formatMonths(ops.coverage.own);
  const { dormantAtPointsOfSale: dormant } = ops.stock;
  const recovery = ops.coverage.ownWithRecovery;

  switch (status) {
    case 'now': {
      const canRecover =
        dormant > 0 && recovery !== null && recovery > leadTime;
      const base = `La bodega propia cubre ${own} y una reimpresión tarda ${formatMonths(leadTime)}: el stock se agota antes de que llegue.`;
      return {
        title: 'Reimprimir ya',
        text: canRecover
          ? `${base} Recuperando ${formatNumber(dormant)} ejemplares dormidos de las librerías la cobertura subiría a ${formatMonths(recovery)}.`
          : base,
      };
    }
    case 'plan':
      return {
        title: 'Planear reimpresión',
        text: `La bodega propia cubre ${own}. Alcanza hasta que llegue una reimpresión (${formatMonths(leadTime)}), pero con menos de ${formatMonths(REPRINT_PLANNING_MARGIN_MONTHS)} de holgura.`,
      };
    case 'ok':
      return {
        title: 'Sin urgencia',
        text: `La bodega propia cubre ${own}, con más de ${formatMonths(REPRINT_PLANNING_MARGIN_MONTHS)} de holgura sobre una reimpresión de ${formatMonths(leadTime)}.`,
      };
    default:
      return {
        title: 'Sin señal',
        text: 'No hay venta directa ni remisiones netas a librerías en los últimos 90 días, así que no se puede estimar la cobertura.',
      };
  }
}

function StatList({ rows }: { rows: StatRow[] }) {
  return (
    <dl className="book-reprint__list">
      {rows.map((row) => (
        <div key={row.label} className="book-reprint__list-row">
          <dt className="book-reprint__list-label">
            {row.label}
            {row.hint && (
              <span className="book-reprint__list-hint">{row.hint}</span>
            )}
          </dt>
          <dd className="book-reprint__list-value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StockBar({ ops }: { ops: BookOperations }) {
  const { own, atPointsOfSale, dormantAtPointsOfSale, total } = ops.stock;
  if (total === 0) return null;

  const activeAtPos = atPointsOfSale - dormantAtPointsOfSale;
  const segments = [
    { key: 'own', label: 'Bodega propia', units: own },
    { key: 'active', label: 'Librerías con ventas', units: activeAtPos },
    {
      key: 'dormant',
      label: 'Librerías sin ventas (90 días)',
      units: dormantAtPointsOfSale,
    },
  ];

  return (
    <div className="book-reprint__stock">
      <div
        className="book-reprint__bar"
        role="img"
        aria-label={`Dónde está el inventario: ${segments
          .map((s) => `${s.label} ${formatNumber(s.units)}`)
          .join(', ')}`}
      >
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`book-reprint__bar-segment book-reprint__bar-segment--${segment.key}`}
            style={{ width: `${(segment.units / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="book-reprint__legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <i
              className={`book-reprint__dot book-reprint__dot--${segment.key}`}
              aria-hidden="true"
            />
            {segment.label} · {formatNumber(segment.units)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BookReprint({ operations: ops }: BookReprintProps) {
  const [leadTime, setLeadTime] = useState(DEFAULT_LEAD_TIME);
  const status = getReprintStatus(ops.coverage.own, leadTime);
  const message = buildMessage(status, ops, leadTime);
  const dates = getReprintDates(ops.coverage.own, leadTime);

  const ownRows: StatRow[] = [
    { label: 'Stock en bodega propia', value: formatNumber(ops.stock.own) },
    {
      label: 'Venta directa',
      value: `${formatDecimal(ops.demand.directMonthly)} / mes`,
    },
    {
      label: 'Remisiones netas a librerías',
      hint: 'Remitido − devuelto',
      value: `${formatDecimal(ops.demand.netRemissionsMonthly)} / mes`,
    },
    {
      label: 'Salida total de la bodega',
      value: `${formatDecimal(ops.demand.ownMonthly)} / mes`,
    },
    { label: 'Cobertura', value: formatMonths(ops.coverage.own) },
  ];

  const networkRows: StatRow[] = [
    {
      label: 'Stock en consignación',
      value: formatNumber(ops.stock.atPointsOfSale),
    },
    {
      label: 'Ventas de las librerías',
      value: `${formatDecimal(ops.demand.pointsOfSaleMonthly)} / mes`,
    },
    { label: 'Cobertura de la red', value: formatMonths(ops.coverage.network) },
    {
      label: 'Vendido sobre lo remitido',
      hint: 'Sell-through',
      value: formatPercent(ops.network.sellThroughPct),
    },
    {
      label: 'Stock dormido',
      hint: 'Sin ventas en 90 días',
      value: formatNumber(ops.stock.dormantAtPointsOfSale),
    },
  ];

  return (
    <section className="book-reprint">
      <header className="book-reprint__header">
        <div className="book-reprint__heading">
          <h2 className="book-reprint__title">Reimpresión</h2>
          <p className="book-reprint__subtitle">
            Cuánto dura el inventario propio y cómo se mueve en las librerías.
          </p>
        </div>
        <div className="book-reprint__control">
          <span className="book-reprint__control-label">
            Tiempo de una reimpresión
          </span>
          <Select
            value={String(leadTime)}
            onValueChange={(value) => setLeadTime(Number(value))}
          >
            <SelectTrigger aria-label="Tiempo de una reimpresión">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_TIME_OPTIONS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {formatMonths(months)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div
        className={`book-reprint__banner book-reprint__banner--${status}`}
        role="status"
      >
        <strong className="book-reprint__banner-title">{message.title}</strong>
        <p className="book-reprint__banner-text">{message.text}</p>
        {dates && (
          <p className="book-reprint__banner-dates">
            Se agota hacia {formatDate(dates.stockoutDate)} ·{' '}
            {dates.overdue
              ? 'el plazo para pedir ya venció'
              : `pide antes del ${formatDate(dates.reprintByDate)}`}
          </p>
        )}
      </div>

      <StockBar ops={ops} />

      <div className="book-reprint__columns">
        <div className="book-reprint__card">
          <h3 className="book-reprint__card-title">
            Bodega propia y venta directa
          </h3>
          <StatList rows={ownRows} />
        </div>
        <div className="book-reprint__card">
          <h3 className="book-reprint__card-title">Librerías</h3>
          <StatList rows={networkRows} />
        </div>
      </div>

      <p className="book-reprint__note">
        Cobertura combinada: {formatMonths(ops.coverage.combined)} · Rotación
        del libro: {formatTurns(ops.rotation.turns)} al año. Promedios de los
        últimos 90 días; la rotación usa las ventas de 12 meses sobre el stock
        actual.
      </p>
    </section>
  );
}
