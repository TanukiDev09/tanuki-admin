'use client';

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import './ScrollableIncomeExpenseChart.scss';

interface ScrollableIncomeExpenseChartProps {
  data: Array<{ month: string; income: number; expenses: number }>;
  className?: string;
  scrollable?: boolean;
  variant?: 'daily' | 'monthly';
}

export function ScrollableIncomeExpenseChart({
  data,
  className,
  scrollable = false,
  variant = 'monthly',
}: ScrollableIncomeExpenseChartProps) {
  const isDaily = variant === 'daily';

  return (
    <Card
      className={`scrollable-income-expense-chart ${className || ''} ${scrollable ? 'scrollable-income-expense-chart--scrollable' : ''}`}
    >
      <CardHeader className="scrollable-income-expense-chart__header">
        <CardTitle className="scrollable-income-expense-chart__title">
          {isDaily ? 'Flujo de Efectivo Diario' : 'Flujo de Caja Histórico'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="scrollable-income-expense-chart__scroll-container">
          <div
            className="scrollable-income-expense-chart__chart-wrapper"
            style={
              scrollable
                ? {
                    width: `${Math.max(data.length * (isDaily ? 40 : 80), 800)}px`,
                  }
                : { width: '100%' }
            }
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                barSize={isDaily && !scrollable ? undefined : isDaily ? 20 : 40}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={isDaily && !scrollable ? 2 : 0}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value >= 1000000)
                      return `$${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                    return `$${value}`;
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                    fontFamily: 'var(--font-sans)',
                    borderRadius: 'var(--radius)',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number | string | undefined) =>
                    value !== undefined ? formatCurrency(Number(value)) : ''
                  }
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    paddingTop: '20px',
                  }}
                />
                <Bar
                  dataKey="income"
                  name="Ingresos"
                  fill="hsl(var(--flow))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Egresos"
                  fill="hsl(var(--ebb))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
