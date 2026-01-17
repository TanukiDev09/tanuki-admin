'use client';

import { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IncomeExpenseChartProps {
  data: Array<{ month: string; income: number; expenses: number }>;
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const periodLabel = useMemo(() => {
    if (paginatedData.length === 0) return '';
    const first = paginatedData[0].month;
    const last = paginatedData[paginatedData.length - 1].month;
    return `${first} - ${last}`;
  }, [paginatedData]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-sans text-xl font-semibold text-foreground">
            Flujo de Caja Histórico
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground font-sans min-w-[120px] text-center">
              {periodLabel}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Período siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-0 pr-0">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={paginatedData} barSize={24} barCategoryGap="15%">
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--popover-foreground))',
                fontFamily: 'var(--font-sans)',
                borderRadius: 'var(--radius)',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
              formatter={(value: number | undefined) =>
                value !== undefined
                  ? new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(value)
                  : ''
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
              fill="hsl(var(--flow))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Salieron (Egresos)"
              fill="hsl(var(--ebb))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
