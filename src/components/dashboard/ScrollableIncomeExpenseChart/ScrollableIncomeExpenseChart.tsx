'use client';

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import './ScrollableIncomeExpenseChart.scss';

interface ScrollableIncomeExpenseChartProps {
  data: Array<{ month: string; income: number; expenses: number }>;
  className?: string;
  scrollable?: boolean;
  variant?: 'daily' | 'monthly';
  initialBalance?: number;
}

export function ScrollableIncomeExpenseChart({
  data,
  className,
  scrollable = false,
  variant = 'monthly',
  initialBalance = 0,
}: ScrollableIncomeExpenseChartProps) {
  const isDaily = variant === 'daily';

  // Calculate cumulative balance for each data point, starting from initial balance
  const dataWithBalance = data.reduce((acc: Array<{ month: string; income: number; expenses: number; balance: number }>, item) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : initialBalance;
    const dailyBalance = item.income - item.expenses;
    acc.push({
      ...item,
      balance: prevBalance + dailyBalance,
    });
    return acc;
  }, []);

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
              <ComposedChart
                data={dataWithBalance}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
              >
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.3}
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
                    if (value <= -1000000)
                      return `-$${Math.abs(value / 1000000).toFixed(1)}M`;
                    if (value <= -1000)
                      return `-$${Math.abs(value / 1000).toFixed(0)}k`;
                    return `$${value}`;
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#06b6d4', strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: '#06b6d4',
                    color: 'hsl(var(--popover-foreground))',
                    fontFamily: 'var(--font-sans)',
                    borderRadius: 'var(--radius)',
                    borderWidth: '2px',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number | string | undefined, name: string) => {
                    if (name === 'balance') {
                      return [
                        value !== undefined ? formatCurrency(Number(value)) : '',
                        'Saldo en Caja',
                      ];
                    }
                    return value !== undefined ? formatCurrency(Number(value)) : '';
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} strokeDasharray="5 5" opacity={0.5} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  fill="url(#balanceGradient)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="balance"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{
                    fill: '#06b6d4',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                    r: 5
                  }}
                  activeDot={{
                    r: 8,
                    fill: '#06b6d4',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 3,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
