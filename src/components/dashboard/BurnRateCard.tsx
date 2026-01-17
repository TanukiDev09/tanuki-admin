'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BurnRateCardProps {
  grossBurn: number;
  netBurn: number;
  trendDirection?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}

export function BurnRateCard({
  grossBurn,
  netBurn,
  trendDirection,
  trendValue,
  className
}: BurnRateCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isProfitable = netBurn <= 0;
  const displayBurn = isProfitable ? grossBurn : netBurn;

  return (
    <Card className={cn("transition-colors duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/10 mb-2">
        <CardTitle className="text-sm font-medium text-foreground font-sans tracking-wide uppercase text-[0.7rem]">
          Gasto Mensual
        </CardTitle>
        <Flame className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="text-2xl md:text-3xl font-serif font-medium tracking-tight mb-1 truncate">
              {formatCurrency(displayBurn)}
              <span className="text-sm font-sans ml-1 text-muted-foreground">/mes</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans mb-2">
              {isProfitable ? 'Operaciones (eres rentable)' : 'Quema neta de efectivo'}
            </p>
            {trendValue && trendDirection && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-sans",
                trendDirection === 'down' ? 'text-flow' : 'text-ebb'
              )}>
                {trendDirection === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
