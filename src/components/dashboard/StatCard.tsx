import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/Sparkline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: string;
  className?: string;
  variant?: 'flow' | 'ebb' | 'balance' | 'default' | 'success' | 'info' | 'danger';
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
  const variantStyles = {
    default: '',
    flow: 'zone-flow', // Legacy support - maps to success
    ebb: 'zone-ebb',   // Legacy support - maps to danger
    balance: 'zone-balance', // Legacy support - maps to info
    success: 'stat-card-success',
    info: 'stat-card-info',
    danger: 'stat-card-danger',
  };

  const sparklineColor = {
    default: 'hsl(var(--primary))',
    flow: 'hsl(var(--success))',     // Updated to use new semantic color
    ebb: 'hsl(var(--danger))',       // Updated to use new semantic color
    balance: 'hsl(var(--info))',     // Updated to use new semantic color
    success: '#ffffff',
    info: '#ffffff',
    danger: '#ffffff',
  };

  return (
    <Card className={cn("transition-colors duration-200", variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/10 mb-2">
        <CardTitle className="text-sm font-medium text-foreground font-sans tracking-wide uppercase text-[0.7rem]">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-2xl md:text-3xl font-sans font-bold tracking-tight mb-1 truncate" title={String(value)}>
              {value}
            </div>
            {subtext && <p className="text-xs text-muted-foreground font-sans">{subtext}</p>}
            {trendValue && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-sans mt-1",
                trendDirection === 'up' ? 'text-flow' : 'text-ebb'
              )}>
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <div className="w-24 h-12">
              <Sparkline data={sparklineData} color={sparklineColor[variant]} height={48} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
