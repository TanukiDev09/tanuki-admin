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
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils'; // Assuming this utility exists

interface BookProfitability {
  id: string;
  title: string;
  income: number;
  expenses: number;
  profit: number;
}

interface BookProfitabilityChartProps {
  data: BookProfitability[];
}

export function BookProfitabilityChart({ data }: BookProfitabilityChartProps) {
  // Sorting data by profit descent ensures the most profitable books are at the top (for horizontal layout)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.profit - a.profit);
  }, [data]);

  if (!sortedData || sortedData.length === 0) {
    return (
      <Card className="h-[400px] flex items-center justify-center text-muted-foreground">
        No hay datos financieros disponibles para sus libros.
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Rentabilidad por Libro</CardTitle>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedData}
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke="var(--color-border)"
                opacity={0.5}
              />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="title"
                width={150}
                tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-popover-foreground)',
                  borderRadius: '8px',
                }}
                formatter={(value: number | undefined) =>
                  value !== undefined ? formatCurrency(value) : ''
                }
                cursor={{ fill: '#F1F5F9', opacity: 0.4 }}
              />
              <Legend iconType="circle" />

              {/* Income Bar - Green #16A34A */}
              <Bar
                dataKey="income"
                name="Ingresos"
                fill="#16A34A"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />

              {/* Expense Bar - Red #DC2626 */}
              <Bar
                dataKey="expenses"
                name="Egresos"
                fill="#DC2626"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
