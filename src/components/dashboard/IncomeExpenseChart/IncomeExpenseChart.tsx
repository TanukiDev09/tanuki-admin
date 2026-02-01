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
  const xAxisKey = useMemo(() =>
    safeData.length > 0 && 'month' in safeData[0] ? 'month' : 'day'
    , [safeData]);

  const defaultTitle = xAxisKey === 'month' ? 'Evolución Mensual' : 'Flujo de Caja del Mes';

  return (
    <Card className="income-expense-chart income-expense-chart--no-border">
      <CardHeader className="income-expense-chart__header">
        <div className="income-expense-chart__header-content">
          <CardTitle className="income-expense-chart__title">
            {title || defaultTitle}
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
                  if (typeof value === 'string') {
                    // Handle Day: YYYY-MM-DD -> DD
                    if (xAxisKey === 'day' && value.includes('-')) {
                      return value.split('-')[2];
                    }
                    // Handle Month: YYYY-MM -> Month YY
                    if (xAxisKey === 'month' && value.includes('-')) {
                      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                      const [year, month] = value.split('-');
                      const monthIdx = parseInt(month) - 1;
                      return `${months[monthIdx]} ${year.slice(2)}`;
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
