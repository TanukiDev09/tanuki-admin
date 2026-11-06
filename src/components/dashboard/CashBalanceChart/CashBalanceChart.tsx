'use client';

import { useEffect, useRef } from 'react';
import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import {
  monthName,
  shortMonth,
  type CashMonth,
} from '@/lib/finance/cashBalance';
import './CashBalanceChart.scss';

interface CashBalanceChartProps {
  months: CashMonth[];
  className?: string;
  /** Muestra el año en cada mes (para gráficas que cruzan de un año a otro). */
  showYear?: boolean;
  /** Ancho fijo por mes con scroll horizontal dentro del contenedor. */
  scrollable?: boolean;
}

const MONTH_WIDTH = 56;

function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

interface TooltipPayload {
  payload?: CashMonth;
}

function CashTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  const month = payload?.[0]?.payload;
  if (!active || !month || month.closing === null) return null;

  return (
    <div className="cash-balance-chart__tooltip">
      <p className="cash-balance-chart__tooltip-title">
        {monthName(month.month)}
      </p>
      <p>Plata en caja a fin de mes: {formatCurrency(month.closing)}</p>
      {month.flow !== null && (
        <p>
          Lo que subió o bajó en el mes: {month.flow > 0 ? '+' : ''}
          {formatCurrency(month.flow)}
        </p>
      )}
      {month.flowEstimated && month.flowRange && (
        <p>
          Lo que subió o bajó (aproximado): entre{' '}
          {formatCurrency(month.flowRange.low)} y{' '}
          {formatCurrency(month.flowRange.high)}
        </p>
      )}
    </div>
  );
}

export function CashBalanceChart({
  months,
  className,
  showYear = false,
  scrollable = false,
}: CashBalanceChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthCount = months.length;

  // Al abrir, muestra lo más reciente (el final de la serie).
  useEffect(() => {
    const el = scrollRef.current;
    if (scrollable && el) el.scrollLeft = el.scrollWidth;
  }, [scrollable, monthCount]);

  const visible = months.filter((m) => m.closing !== null);

  return (
    <div className={`cash-balance-chart ${className || ''}`}>
      <div className="cash-balance-chart__header">
        <h3 className="cash-balance-chart__title">Plata en caja mes a mes</h3>
        <p className="cash-balance-chart__subtitle">
          La línea es lo que hay en todas las cuentas (banco y billeteras) a fin
          de cada mes. Las barras muestran cuánto subió o bajó en el mes.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="cash-balance-chart__empty">
          <p>Todavía no hay cierres documentados para este año</p>
        </div>
      ) : (
        <div
          className={`cash-balance-chart__scroll ${
            scrollable ? 'cash-balance-chart__scroll--active' : ''
          }`}
          ref={scrollRef}
        >
          <div
            className="cash-balance-chart__chart"
            style={
              scrollable
                ? { minWidth: `${monthCount * MONTH_WIDTH}px` }
                : undefined
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={months.map((m) => ({
                  ...m,
                  label: shortMonth(m.month, showYear),
                  // Mes con flujo no determinable: no se dibuja barra.
                  flowBar: m.flowEstimated ? null : m.flow,
                }))}
                margin={{ top: 16, right: 16, bottom: 8, left: 8 }}
              >
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={compactCurrency}
                />
                <Tooltip content={<CashTooltip />} />
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="flowBar" name="Flujo del mes" maxBarSize={28}>
                  {months.map((m) => (
                    <Cell
                      key={m.month}
                      className={
                        (m.flow ?? 0) >= 0
                          ? 'cash-balance-chart__bar--up'
                          : 'cash-balance-chart__bar--down'
                      }
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="closing"
                  name="Plata en caja"
                  className="cash-balance-chart__line"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
