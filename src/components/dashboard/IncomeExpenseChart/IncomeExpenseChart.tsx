'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import './IncomeExpenseChart.scss';

interface IncomeExpenseChartProps {
  data?: Array<{
    day?: string;
    month?: string;
    income: number;
    expenses: number;
  }>;
  title?: string;
}

export function IncomeExpenseChart({ data, title }: IncomeExpenseChartProps) {
  // Handle undefined or empty data
  const safeData = useMemo(() => data || [], [data]);

  // Detect key
  const xAxisKey = safeData.length > 0 && safeData[0].month ? 'month' : 'day';

  return (
    <Card className="income-expense-chart income-expense-chart--no-border">
      <CardHeader className="income-expense-chart__header">
        <div className="income-expense-chart__header-content">
          <CardTitle className="income-expense-chart__title">
            {title || 'Flujo de Caja del Mes'}
          </CardTitle>
          <div className="income-expense-chart__controls">
            {/* ... buttons ... */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="income-expense-chart__content">
        {safeData.length === 0 ? (
          <div className="income-expense-chart__empty">
            <p>No hay datos disponibles para mostrar</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={safeData} barSize={24} barCategoryGap="15%">
              <XAxis
                dataKey={xAxisKey}
                xAxisId={0}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  // If it's a date string YYYY-MM-DD, show only DD
                  if (typeof value === 'string') {
                    if (xAxisKey === 'day' && value.includes('-')) {
                      return value.split('-')[2];
                    }
                    if (xAxisKey === 'month' && value.includes('-')) {
                      // Return Month Name or MM
                      return value; // Or format it nicer if needed
                    }
                  }
                  return value;
                }}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-popover-foreground)',
                  fontFamily: 'var(--font-sans)',
                  borderRadius: 'var(--radius-md)',
                }}
                itemStyle={{ color: 'var(--color-foreground)' }}
                cursor={{ fill: 'rgba(var(--color-muted-rgb), 0.4)' }}
                formatter={(value: number | undefined) =>
                  value !== undefined ? formatCurrency(value) : ''
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
                name="Entraron (Ingresos)"
                fill="var(--color-flow)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Salieron (Egresos)"
                fill="var(--color-ebb)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
