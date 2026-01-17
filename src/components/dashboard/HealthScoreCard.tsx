'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthScoreCardProps {
  score?: number; // 0-100
  className?: string;
}

export function HealthScoreCard({ score = 0, className }: HealthScoreCardProps) {
  // Color coding: Green (>=70), Amber (40-69), Red (<40)
  const getHealthStatus = () => {
    if (score >= 70) return { color: 'text-flow', bg: 'bg-flow-bg', fill: 'hsl(var(--flow))', label: 'Excelente' };
    if (score >= 40) return { color: 'text-chart-amber', bg: 'bg-amber-50', fill: 'hsl(var(--chart-amber))', label: 'Moderado' };
    return { color: 'text-ebb', bg: 'bg-ebb-bg', fill: 'hsl(var(--ebb))', label: 'Crítico' };
  };

  const status = getHealthStatus();
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className={cn("transition-colors duration-200", status.bg, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/10 mb-2">
        <CardTitle className="text-sm font-medium text-foreground font-sans tracking-wide uppercase text-[0.7rem]">
          PUNTUACIÓN DE SALUD
        </CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-3xl font-serif font-medium tracking-tight mb-1">
              {score}
              <span className="text-lg font-sans ml-1 text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans mb-2">Índice de salud del negocio</p>
            <div className={cn("flex items-center gap-1 text-xs font-sans", status.color)}>
              <span className="font-medium">{status.label}</span>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted opacity-20"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke={status.fill}
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-2xl font-bold font-serif", status.color)}>{score}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
