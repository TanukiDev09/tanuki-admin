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
import { formatCurrency } from '@/lib/utils';
import './RunwayProjectionChart.scss';

interface NetIncomeChartProps {
  data?: Array<{ month: string; income: number; expenses: number }>;
  className?: string;
}

export function RunwayProjectionChart({
  data = [],
  className,
}: NetIncomeChartProps) {
  // Calculate Net Income per month
  const chartData = data.map((d) => ({
    ...d,
    netIncome: d.income - d.expenses,
  }));

  return (
    <Card className={`runway-projection-chart ${className || ''}`}>
      <CardHeader className="runway-projection-chart__header">
        <CardTitle className="runway-projection-chart__title">
          Evolución del Resultado
        </CardTitle>
        <p className="runway-projection-chart__subtitle">
          Utilidad (o Pérdida) Neta mes a mes
        </p>
      </CardHeader>
      <CardContent className="runway-projection-chart__content">
        {!chartData || chartData.length === 0 ? (
          <div className="runway-projection-chart__empty">
            <p>No hay datos históricos disponibles</p>
          </div>
        ) : (
          <div className="runway-projection-chart__chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <defs>
                  <linearGradient
                    id="netIncomeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
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
                    value !== undefined ? formatCurrency(value) : ''
                  }
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                />
                <Area
                  type="monotone"
                  dataKey="netIncome"
                  name="Resultado Neto"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#netIncomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
