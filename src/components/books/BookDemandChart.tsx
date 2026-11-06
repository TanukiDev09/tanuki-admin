'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getDemandTrend,
  type DemandTrend,
  type MonthlyDemand,
} from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import { formatDecimal, formatPercent } from './opsFormat';
import './BookDemandChart.scss';

interface BookDemandChartProps {
  data: MonthlyDemand[];
}

// Mes abreviado y año de dos dígitos ("ene 25") a partir de AAAA-MM.
const formatMonth = (value: string): string => {
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
};

const CHANNELS = [
  { key: 'pointsOfSale', label: 'Librerías', color: 'var(--color-info)' },
  { key: 'direct', label: 'Venta directa', color: 'var(--color-primary)' },
] as const;

function Trend({ trend }: { trend: DemandTrend }) {
  if (trend.changePct === null) {
    return <span className="book-demand__hint">Sin ventas antes</span>;
  }
  const up = trend.changePct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="book-demand__hint">
      <Icon className="book-demand__trend-icon" aria-hidden="true" />
      {up ? '+' : ''}
      {formatPercent(trend.changePct)} vs. 3 meses antes
    </span>
  );
}

export default function BookDemandChart({ data }: BookDemandChartProps) {
  const totals = {
    pointsOfSale: data.reduce((sum, m) => sum + m.pointsOfSale, 0),
    direct: data.reduce((sum, m) => sum + m.direct, 0),
  };
  const total = totals.pointsOfSale + totals.direct;
  const average = data.length > 0 ? total / data.length : 0;
  const trend = getDemandTrend(data);
  const chartData = data.map((m) => ({ ...m, label: formatMonth(m.month) }));

  return (
    <section className="book-demand">
      <header className="book-demand__header">
        <h2 className="book-demand__title">Demanda por canal</h2>
        <p className="book-demand__subtitle">
          Ejemplares vendidos por mes, últimos 12 meses.
        </p>
      </header>

      {total === 0 ? (
        <p className="book-demand__empty">
          Sin ventas en los últimos 12 meses.
        </p>
      ) : (
        <>
          <dl className="book-demand__stats">
            <div className="book-demand__stat">
              <dt>12 meses</dt>
              <dd>{formatNumber(total)}</dd>
              <dd className="book-demand__hint">
                {formatPercent((totals.pointsOfSale / total) * 100)} en
                librerías
              </dd>
            </div>
            {trend && (
              <div className="book-demand__stat">
                <dt>Últimos 3 meses</dt>
                <dd>{formatNumber(trend.recent)}</dd>
                <dd className="book-demand__hint">
                  <Trend trend={trend} />
                </dd>
              </div>
            )}
            <div className="book-demand__stat">
              <dt>Promedio mensual</dt>
              <dd>{formatDecimal(average)}</dd>
              <dd className="book-demand__hint">ejemplares por mes</dd>
            </div>
          </dl>

          <ul className="book-demand__legend">
            {CHANNELS.map((channel) => (
              <li key={channel.key} className="book-demand__legend-item">
                <i
                  className="book-demand__swatch"
                  style={{ background: channel.color }}
                  aria-hidden="true"
                />
                {channel.label}
                <span className="book-demand__legend-total">
                  {formatNumber(totals[channel.key])}
                </span>
              </li>
            ))}
          </ul>

          <table className="book-demand__table">
            <caption>Ejemplares vendidos por mes y canal</caption>
            <thead>
              <tr>
                <th scope="col">Mes</th>
                <th scope="col">Librerías</th>
                <th scope="col">Venta directa</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.label}</th>
                  <td>{row.pointsOfSale}</td>
                  <td>{row.direct}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="book-demand__chart" aria-hidden="true">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: 'var(--color-popover)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine
                  y={average}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="4 4"
                />
                {CHANNELS.map((channel) => (
                  <Bar
                    key={channel.key}
                    dataKey={channel.key}
                    name={channel.label}
                    stackId="demand"
                    fill={channel.color}
                    radius={channel.key === 'direct' ? [3, 3, 0, 0] : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="book-demand__hint">
            La línea punteada es el promedio mensual.
          </p>
        </>
      )}
    </section>
  );
}
