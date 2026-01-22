'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import './CategoryPieChart.scss';

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
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

export function CategoryPieChart({ data, title = 'Gastos por Categoría' }: CategoryPieChartProps) {
  // Sort by value (descending) and take top 5 for better pie visualization
  const sortedData = (data || [])
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <Card className="category-pie-chart category-pie-chart--no-border">
      <CardHeader className="category-pie-chart__header">
        <CardTitle className="category-pie-chart__title">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="category-pie-chart__content">
        {sortedData.length === 0 ? (
          <div className="category-pie-chart__empty">
            No hay datos para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-popover-foreground)',
                  fontFamily: 'var(--font-sans)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                formatter={(value: number | undefined) =>
                  value !== undefined ? formatCurrency(value) : ''
                }
                itemStyle={{ color: 'var(--color-foreground)' }}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  paddingLeft: '10px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
