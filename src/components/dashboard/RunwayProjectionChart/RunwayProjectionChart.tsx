'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import './RunwayProjectionChart.scss';

interface RunwayProjectionChartProps {
  data?: Array<{ month: string; balance: number }>;
  className?: string;
}

export function RunwayProjectionChart({ data = [], className }: RunwayProjectionChartProps) {
  // Find zero point
  const zeroPoint = data.findIndex((d) => d.balance === 0);
  const hasZeroPoint = zeroPoint !== -1;

  return (
    <Card className={`runway-projection-chart ${className || ''}`}>
      <CardHeader className="runway-projection-chart__header">
        <CardTitle className="runway-projection-chart__title">
          Proyección de Pista
        </CardTitle>
        <p className="runway-projection-chart__subtitle">
          Estimación de efectivo disponible en los próximos 18 meses
        </p>
      </CardHeader>
      <CardContent className="runway-projection-chart__content">
        {!data || data.length === 0 ? (
          <div className="runway-projection-chart__empty">
            <p>No hay datos de proyección disponibles</p>
          </div>
        ) : (
          <div className="runway-projection-chart__chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--balance))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--balance))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$ ${formatNumber((value / 1000000).toFixed(0))} M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                    fontFamily: 'var(--font-sans)',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: number | undefined) =>
                    value !== undefined
                      ? formatCurrency(value)
                      : ''
                  }
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--ebb))"
                  strokeDasharray="3 3"
                />
                {hasZeroPoint && (
                  <ReferenceLine
                    x={data[zeroPoint].month}
                    stroke="hsl(var(--ebb))"
                    strokeWidth={2}
                    label={{
                      value: 'Advertencia: Se agota efectivo',
                      position: 'top',
                      fontSize: 11,
                      fill: 'hsl(var(--ebb))'
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Efectivo proyectado"
                  stroke="hsl(var(--balance))"
                  strokeWidth={2}
                  fill="url(#cashGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
