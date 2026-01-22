'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import './CategoryBarChart.scss';

interface ChartDataEntry {
  name: string;
  value: number;
}

interface CategoryBarChartProps {
  data: ChartDataEntry[];
  title?: string;
}

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
];

export function CategoryBarChart({ data, title = 'Gastos por Categoría' }: CategoryBarChartProps) {
  const sortedData = (data || [])
    .filter(
      (item) =>
        item && typeof item.value === 'number' && typeof item.name === 'string'
    )
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 8);

  return (
    <Card className="category-bar-chart category-bar-chart--no-border">
      <CardHeader className="category-bar-chart__header">
        <CardTitle className="category-bar-chart__title">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="category-bar-chart__content">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                `$${formatNumber((value / 1000000).toFixed(1))}M`
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-popover-foreground)',
                fontFamily: 'var(--font-sans)',
                borderRadius: 'var(--radius-md)',
              }}
              formatter={(value: number | undefined) =>
                value !== undefined ? formatCurrency(value) : ''
              }
              cursor={{ fill: 'rgba(var(--color-muted-rgb), 0.2)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
