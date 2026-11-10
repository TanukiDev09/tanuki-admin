'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { PaceTrend, SalesPace } from '@/lib/finance/costCenterInsights';
import './CostCenterInsights.scss';

const CHART_HEIGHT = 200;

const monthLabel = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  });
};

function TrendChip({ label, trend }: { label: string; trend: PaceTrend }) {
  let change = 'sin periodo previo';
  let tone = 'default';
  if (trend.changePct !== null) {
    const sign = trend.changePct > 0 ? '+' : '';
    change = `${sign}${trend.changePct.toFixed(0)}% vs. anterior`;
    if (trend.changePct > 0) tone = 'success';
    if (trend.changePct < 0) tone = 'danger';
  }

  return (
    <div className="cc-insights__stat">
      <dt className="cc-insights__stat-label">{label}</dt>
      <dd className="cc-insights__stat-value">
        {trend.last.toLocaleString('es-CO')} ejemplares
      </dd>
      <span
        className={`cc-insights__stat-hint cc-insights__stat-value--${tone}`}
      >
        {change}
      </span>
    </div>
  );
}

export function SalesPaceCard({ pace }: { pace: SalesPace }) {
  const hasPublicationAxis = pace.series.some(
    (p) => p.monthsSincePublication !== null
  );
  const data = pace.series.map((p) => ({
    ...p,
    label: monthLabel(p.month),
  }));

  return (
    <Card className="cc-insights">
      <CardHeader className="cc-insights__header">
        <CardTitle as="h2" className="cc-insights__title">
          Ritmo de ventas
        </CardTitle>
        <p className="cc-insights__subtitle">
          Ejemplares vendidos por mes
          {hasPublicationAxis ? ', desde la publicación' : ''}
        </p>
      </CardHeader>
      <CardContent className="cc-insights__content">
        <dl className="cc-insights__stats">
          <TrendChip label="Últimos 30 días" trend={pace.last30} />
          <TrendChip label="Últimos 90 días" trend={pace.last90} />
        </dl>

        {data.length === 0 ? (
          <p className="cc-insights__empty">Aún no hay ventas registradas.</p>
        ) : (
          <div
            role="img"
            aria-label={`Ejemplares vendidos por mes: ${data
              .map((d) => `${d.label} ${d.units}`)
              .join(', ')}`}
          >
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: 'var(--color-popover)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-popover-foreground)',
                    fontFamily: 'var(--font-sans)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  formatter={(value: number | undefined) => [
                    `${value ?? 0} ejemplares`,
                    'Vendidos',
                  ]}
                  labelFormatter={(label, payload) => {
                    const months =
                      payload?.[0]?.payload?.monthsSincePublication;
                    return months === null || months === undefined
                      ? label
                      : `${label} · mes ${months} desde la publicación`;
                  }}
                />
                <Bar
                  dataKey="units"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
