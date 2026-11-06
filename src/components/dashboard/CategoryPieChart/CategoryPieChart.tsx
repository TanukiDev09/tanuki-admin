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
import { renderPiePercentLabel } from '../PiePercentLabel';
import './CategoryPieChart.scss';

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title?: string;
  /** Formatea el valor del tooltip; por defecto, moneda. */
  valueFormatter?: (value: number) => string;
  /** Alto de la gráfica en px (por defecto 360). */
  height?: number;
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

export function CategoryPieChart({
  data,
  title = 'Gastos por Categoría',
  valueFormatter = formatCurrency,
  height = 360,
}: CategoryPieChartProps) {
  // Sort by value (descending) and take top 5 for better pie visualization
  const sortedData = (data || [])
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <Card className="category-pie-chart category-pie-chart--no-border">
      <CardHeader className="category-pie-chart__header">
        <CardTitle as="h2" className="category-pie-chart__title">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="category-pie-chart__content">
        {sortedData.length === 0 ? (
          <div className="category-pie-chart__empty" style={{ height }}>
            No hay datos para mostrar
          </div>
        ) : (
          <div
            role="img"
            aria-label={`${title}: ${sortedData
              .map((item) => `${item.name} ${valueFormatter(item.value)}`)
              .join(', ')}`}
          >
            <ResponsiveContainer width="100%" height={height}>
              <PieChart margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="46%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={renderPiePercentLabel}
                  labelLine={false}
                >
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
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
                    value !== undefined ? valueFormatter(value) : ''
                  }
                  itemStyle={{ color: 'var(--color-foreground)' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconSize={10}
                  iconType="circle"
                  wrapperStyle={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    paddingTop: '20px',
                    lineHeight: '1.8',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
