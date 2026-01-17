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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define a type for the data entries
interface ChartDataEntry {
  name: string;
  value: number;
}

interface CategoryBarChartProps {
  data: ChartDataEntry[]; // Changed from any[] to ChartDataEntry[]
}

const COLORS = [
  'hsl(var(--chart-1))', // Blue
  'hsl(var(--chart-2))', // Red
  'hsl(var(--chart-3))', // Yellow
  'hsl(var(--chart-4))', // Green
  'hsl(var(--chart-5))', // Orange
  'hsl(var(--chart-6))', // Purple
  'hsl(var(--chart-7))', // Cyan
  'hsl(var(--chart-8))', // Magenta
];

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="font-sans text-xl font-semibold text-foreground">
          Gastos por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} // Added type for value
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
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
                  ? new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(value)
                  : ''
              }
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
