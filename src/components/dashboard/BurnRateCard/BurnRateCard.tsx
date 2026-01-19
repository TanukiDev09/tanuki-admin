'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import './BurnRateCard.scss';

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
  const isProfitable = netBurn <= 0;
  const displayBurn = isProfitable ? grossBurn : netBurn;

  return (
    <Card className={`burn-rate-card ${className || ''}`}>
      <CardHeader className="burn-rate-card__header">
        <CardTitle className="burn-rate-card__title">
          Gasto Mensual
        </CardTitle>
        <Flame className="burn-rate-card__header-icon" />
      </CardHeader>
      <CardContent className="burn-rate-card__content">
        <div className="burn-rate-card__body">
          <div className="burn-rate-card__info">
            <div className="burn-rate-card__value">
              {formatCurrency(displayBurn)}
              <span className="burn-rate-card__unit">/mes</span>
            </div>
            <p className="burn-rate-card__description">
              {isProfitable ? 'Operaciones (eres rentable)' : 'Quema neta de efectivo'}
            </p>
            {trendValue && trendDirection && (
              <div className={`burn-rate-card__trend burn-rate-card__trend--${trendDirection}`}>
                {trendDirection === 'down' ? (
                  <TrendingDown className="burn-rate-card__trend-icon" />
                ) : (
                  <TrendingUp className="burn-rate-card__trend-icon" />
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
