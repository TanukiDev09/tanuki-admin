import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Sparkline } from '@/components/ui/Sparkline';
import './StatCard.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: string;
  className?: string;
  variant?:
    | 'flow'
    | 'ebb'
    | 'balance'
    | 'default'
    | 'success'
    | 'info'
    | 'danger';
  sparklineData?: number[];
  trendDirection?: 'up' | 'down';
  trendValue?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtext,
  className,
  variant = 'default',
  sparklineData,
  trendDirection,
  trendValue,
}: StatCardProps) {
  const sparklineColor = {
    default: 'hsl(var(--primary))',
    flow: 'hsl(var(--success))',
    ebb: 'hsl(var(--danger))',
    balance: 'hsl(var(--info))',
    success: '#ffffff',
    info: '#ffffff',
    danger: '#ffffff',
  };

  return (
    <div className={`stat-card stat-card--${variant} ${className || ''}`}>
      <div className="stat-card__header">
        <h3 className="stat-card__title">{title}</h3>
        <Icon className="stat-card__icon" />
      </div>
      <div className="stat-card__content">
        <div className="stat-card__main">
          <div className="stat-card__value-wrapper">
            <div className="stat-card__value" title={String(value)}>
              {value}
            </div>
            {subtext && <p className="stat-card__subtext">{subtext}</p>}
            {trendValue && (
              <div
                className={`stat-card__trend stat-card__trend--${trendDirection}`}
              >
                {trendDirection === 'up' ? (
                  <TrendingUp className="stat-card__trend-icon" />
                ) : (
                  <TrendingDown className="stat-card__trend-icon" />
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <div className="stat-card__sparkline">
              <Sparkline
                data={sparklineData}
                color={sparklineColor[variant]}
                height={48}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
