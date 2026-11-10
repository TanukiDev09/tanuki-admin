'use client';

import { formatCurrency } from '@/lib/utils';
import type { Recovery } from '@/lib/finance/costCenterInsights';
import {
  KpiTile,
  RecoveryCard,
} from '@/components/dashboard/CostCenterInsights';
import type { CostCenterInsightsData } from './types';

const formatInt = (n: number) => Math.round(n).toLocaleString('es-CO');

interface SummaryStripProps {
  recovery: Recovery;
  totalQuantity: number;
  insights: CostCenterInsightsData | null;
  extrasLoading: boolean;
}

function soldHint(insights: CostCenterInsightsData | null): string {
  const pct = insights?.inventory.soldPct;
  return pct == null ? 'Total histórico' : `${pct.toFixed(0)}% del tiraje`;
}

function coverageValue(insights: CostCenterInsightsData | null): string {
  const months = insights?.inventory.coverageMonths;
  return months == null ? '—' : `${months.toFixed(1)} meses`;
}

function overdueHint(insights: CostCenterInsightsData): string {
  const { overdue } = insights.receivables;
  return overdue > 0
    ? `${formatCurrency(overdue)} vencido`
    : 'Sin cartera vencida';
}

/** Franja de resumen: la recuperación de inversión y tres KPIs de apoyo. */
export function SummaryStrip({
  recovery,
  totalQuantity,
  insights,
  extrasLoading,
}: SummaryStripProps) {
  const pendingHint = extrasLoading ? 'Cargando…' : 'No disponible';

  return (
    <section
      className="cost-center-detail__summary"
      aria-label="Resumen del título"
    >
      <RecoveryCard hero recovery={recovery} />
      <div className="cost-center-detail__kpis">
        <KpiTile
          label="Unidades vendidas"
          value={formatInt(totalQuantity)}
          hint={soldHint(insights)}
        />
        <KpiTile
          label="Cobertura de inventario"
          value={coverageValue(insights)}
          hint={
            insights
              ? `${formatInt(insights.inventory.onHand)} ejemplares en existencia`
              : pendingHint
          }
        />
        <KpiTile
          label="Cartera pendiente"
          value={insights ? formatCurrency(insights.receivables.pending) : '—'}
          tone={
            insights && insights.receivables.overdue > 0 ? 'danger' : 'default'
          }
          hint={insights ? overdueHint(insights) : pendingHint}
        />
      </div>
    </section>
  );
}
