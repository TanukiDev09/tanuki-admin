'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Timer, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import './RunwayCard.scss';

interface RunwayCardProps {
  runway: number; // months
  className?: string;
}

export function RunwayCard({ runway, className }: RunwayCardProps) {
  // Color coding: Green (>12), Amber (6-12), Red (<6)
  const getHealthStatus = () => {
    if (runway >= 12)
      return { variant: 'healthy', icon: CheckCircle, label: 'Saludable' };
    if (runway >= 6)
      return { variant: 'warning', icon: AlertTriangle, label: 'Atención' };
    return { variant: 'critical', icon: AlertTriangle, label: 'Crítico' };
  };

  const status = getHealthStatus();
  const Icon = status.icon;
  const safeRunway = runway ?? 0;
  const isInfinite = safeRunway === Infinity || safeRunway > 99;
  const displayValue = isInfinite ? 'Rentable' : formatNumber(safeRunway.toFixed(1));

  return (
    <Card
      className={`runway-card runway-card--${status.variant} ${className || ''}`}
    >
      <CardHeader className="runway-card__header">
        <CardTitle className="runway-card__title">PISTA FINANCIERA</CardTitle>
        <Timer className="runway-card__header-icon" />
      </CardHeader>
      <CardContent className="runway-card__content">
        <div className="runway-card__body">
          <div className="runway-card__info">
            <div className="runway-card__value">
              <span className={isInfinite ? "text-2xl" : ""}>{displayValue}</span>
              {!isInfinite && <span className="runway-card__unit">meses</span>}
            </div>
            <p className="runway-card__description">
              {isInfinite ? 'Operación autosostenible' : 'Tiempo hasta agotar efectivo'}
            </p>
            <div
              className={`runway-card__status runway-card__status--${status.variant}`}
            >
              <Icon className="runway-card__status-icon" />
              <span>{status.label}</span>
              {runway < 12 && runway >= 6 && (
                <span className="runway-card__status-hint">
                  • Planear recarga en 3-4m
                </span>
              )}
              {runway < 6 && (
                <span className="runway-card__status-hint">
                  • Acción inmediata requerida
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
