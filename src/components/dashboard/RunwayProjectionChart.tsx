'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RunwayProjectionChartProps {
  data?: Array<{ month: string; balance: number }>;
}

export function RunwayProjectionChart({ data = [] }: RunwayProjectionChartProps) {
  // Find zero point
  const zeroPoint = data.findIndex((d) => d.balance === 0);
  const hasZeroPoint = zeroPoint !== -1;

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="font-sans text-xl font-semibold text-foreground">
          Proyección de Pista
        </CardTitle>
        <p className="text-xs text-muted-foreground font-sans mt-1">
          Estimación de efectivo disponible en los próximos 18 meses
        </p>
      </CardHeader>
      <CardContent className="px-0">
        {!data || data.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            <p className="text-sm">No hay datos de proyección disponibles</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--balance))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--balance))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
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
                formatter={(value: number | undefined) =>
                  value !== undefined
                    ? new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(value)
                    : ''
                }
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <ReferenceLine
                y={0}
                stroke="hsl(var(--ebb))"
                strokeDasharray="3 3"
              />
              {hasZeroPoint && (
                <ReferenceLine
                  x={data[zeroPoint].month}
                  stroke="hsl(var(--ebb))"
                  strokeWidth={2}
                  label={{
                    value: 'Advertencia: Se agota efectivo',
                    position: 'top',
                    fontSize: 11,
                    fill: 'hsl(var(--ebb))'
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="balance"
                name="Efectivo proyectado"
                stroke="hsl(var(--balance))"
                strokeWidth={2}
                fill="url(#cashGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
