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
import { formatCurrency, formatNumber } from '@/lib/utils';
import './ScrollableIncomeExpenseChart.scss';

interface ScrollableIncomeExpenseChartProps {
  data: Array<{ month: string; income: number; expenses: number }>;
  className?: string;
}

export function ScrollableIncomeExpenseChart({
  data,
  className,
}: ScrollableIncomeExpenseChartProps) {
  // Calculate width based on data length to enable scrolling
  // 100px per data point seems reasonable for readability
  const minWidth = Math.max(data.length * 80, 800);

  return (
    <Card className={`scrollable-income-expense-chart ${className || ''}`}>
      <CardHeader className="scrollable-income-expense-chart__header">
        <CardTitle className="scrollable-income-expense-chart__title">
          Flujo de Caja Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="scrollable-income-expense-chart__scroll-container">
          <div
            className="scrollable-income-expense-chart__chart-wrapper"
            style={{ width: `${minWidth}px` }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `$ ${formatNumber((value / 1000000).toFixed(0))} M`
                  }
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
