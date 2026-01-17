'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--flow))',
  'hsl(var(--ebb))',
  'hsl(var(--balance))',
  '#78716c', // stone-500
  '#a8a29e'  // stone-400
];

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Gastos por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
