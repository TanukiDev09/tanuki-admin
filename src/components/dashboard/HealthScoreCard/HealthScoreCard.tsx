'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity } from 'lucide-react';
import './HealthScoreCard.scss';

interface HealthScoreCardProps {
  score?: number; // 0-100
  className?: string;
}

export function HealthScoreCard({
  score = 0,
  className,
}: HealthScoreCardProps) {
  // Color coding: Green (>=70), Amber (40-69), Red (<40)
  const getHealthStatus = () => {
    if (score >= 70)
      return {
        variant: 'excellent',
        fill: 'var(--color-flow)',
        label: 'Excelente',
      };
    if (score >= 40)
      return {
        variant: 'moderate',
        fill: 'var(--color-chart-amber)',
        label: 'Moderado',
      };
    return { variant: 'critical', fill: 'var(--color-ebb)', label: 'Crítico' };
  };

  const status = getHealthStatus();
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card
      className={`health-score-card health-score-card--${status.variant} ${className || ''}`}
    >
      <CardHeader className="health-score-card__header">
        <CardTitle className="health-score-card__title">
          PUNTUACIÓN DE SALUD
        </CardTitle>
        <Activity className="health-score-card__header-icon" />
      </CardHeader>
      <CardContent className="health-score-card__content">
        <div className="health-score-card__body">
          <div className="health-score-card__info">
            <div className="health-score-card__score">
              {score}
              <span className="health-score-card__score-total">/100</span>
            </div>
            <p className="health-score-card__description">
              Índice de salud del negocio
            </p>
            <div
              className={`health-score-card__status health-score-card__status--${status.variant}`}
            >
              <span className="health-score-card__status-label">
                {status.label}
              </span>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="health-score-card__progress">
            <svg
              className="health-score-card__progress-svg"
              viewBox="0 0 96 96"
            >
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="45"
                className="health-score-card__progress-bg"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke={status.fill}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="health-score-card__progress-fill"
              />
            </svg>
            <div
              className={`health-score-card__progress-text health-score-card__progress-text--${status.variant}`}
            >
              {score}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
