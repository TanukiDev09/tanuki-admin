'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RunwayCardProps {
  runway: number; // months
  className?: string;
}

export function RunwayCard({ runway, className }: RunwayCardProps) {
  // Color coding: Green (>12), Amber (6-12), Red (<6)
  const getHealthStatus = () => {
    if (runway >= 12) return { color: 'text-flow', bg: 'bg-flow-bg', icon: CheckCircle, label: 'Saludable' };
    if (runway >= 6) return { color: 'text-chart-amber', bg: 'bg-amber-50', icon: AlertTriangle, label: 'Atención' };
    return { color: 'text-ebb', bg: 'bg-ebb-bg', icon: AlertTriangle, label: 'Crítico' };
  };

  const status = getHealthStatus();
  const Icon = status.icon;
  const displayValue = runway > 99 ? '∞' : runway.toFixed(1);

  return (
    <Card className={cn("transition-colors duration-200", status.bg, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/10 mb-2">
        <CardTitle className="text-sm font-medium text-foreground font-sans tracking-wide uppercase text-[0.7rem]">
          PISTA FINANCIERA
        </CardTitle>
        <Timer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="text-3xl font-serif font-medium tracking-tight mb-1">
              {displayValue}
              <span className="text-lg font-sans ml-1 text-muted-foreground">meses</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans mb-2">Tiempo hasta agotar efectivo</p>
            <div className={cn("flex items-center gap-1 text-xs font-sans", status.color)}>
              <Icon className="h-3 w-3" />
              <span>{status.label}</span>
              {runway < 12 && runway >= 6 && <span className="ml-1">• Planear recarga en 3-4m</span>}
              {runway < 6 && <span className="ml-1">• Acción inmediata requerida</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
