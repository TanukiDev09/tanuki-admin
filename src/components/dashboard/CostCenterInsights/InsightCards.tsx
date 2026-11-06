'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import type {
  InventorySummary,
  Receivables,
  Recovery,
  Royalties,
} from '@/lib/finance/costCenterInsights';
import './CostCenterInsights.scss';

const formatInt = (n: number) => Math.round(n).toLocaleString('es-CO');

const formatMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

interface StatProps {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning';
  hint?: string;
}

function Stat({ label, value, tone = 'default', hint }: StatProps) {
  return (
    <div className="cc-insights__stat">
      <dt className="cc-insights__stat-label">{label}</dt>
      <dd
        className={`cc-insights__stat-value cc-insights__stat-value--${tone}`}
      >
        {value}
      </dd>
      {hint && <span className="cc-insights__stat-hint">{hint}</span>}
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}

/** Indicador compacto para la franja de resumen. */
export function KpiTile({
  label,
  value,
  hint,
  tone = 'default',
}: KpiTileProps) {
  return (
    <div className="cc-insights__kpi">
      <span className="cc-insights__stat-label">{label}</span>
      <span
        className={`cc-insights__kpi-value cc-insights__stat-value--${tone}`}
      >
        {value}
      </span>
      {hint && <span className="cc-insights__stat-hint">{hint}</span>}
    </div>
  );
}

function ProgressBar({
  value,
  label,
  tone = 'primary',
}: {
  value: number;
  label: string;
  tone?: 'primary' | 'success';
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="cc-insights__progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div
        className={`cc-insights__progress-fill cc-insights__progress-fill--${tone}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function InsightCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`cc-insights ${className}`}>
      <CardHeader className="cc-insights__header">
        <CardTitle as="h2" className="cc-insights__title">
          {title}
        </CardTitle>
        {subtitle && <p className="cc-insights__subtitle">{subtitle}</p>}
      </CardHeader>
      <CardContent className="cc-insights__content">{children}</CardContent>
    </Card>
  );
}

const NoBooks = () => (
  <p className="cc-insights__empty">
    Ningún libro está vinculado a este centro de costo, así que no hay datos de
    inventario ni regalías.
  </p>
);

// ---------------------------------------------------------------------------

export function RecoveryCard({
  recovery,
  hero = false,
}: {
  recovery: Recovery;
  /** Versión protagonista para la franja de resumen. */
  hero?: boolean;
}) {
  const { status } = recovery;

  let headline = `${recovery.recoveredPct.toFixed(0)}% recuperado`;
  if (status === 'no-investment') headline = 'Sin inversión registrada';
  if (status === 'recovered') headline = 'Inversión recuperada';

  let forecast: string | null = null;
  if (status === 'in-progress') {
    if (recovery.unitsToBreakEven === null) {
      forecast = 'Aún no hay ventas para estimar el punto de equilibrio.';
    } else {
      const units = `Faltan ~${formatInt(recovery.unitsToBreakEven)} ejemplares`;
      forecast = recovery.estimatedDate
        ? `${units}. Al ritmo de los últimos 3 meses, se recupera hacia ${formatMonthYear(recovery.estimatedDate)}.`
        : `${units}. Sin ventas en los últimos 3 meses no se puede estimar la fecha.`;
    }
  }

  return (
    <InsightCard
      title="Recuperación de inversión"
      subtitle="Ingresos acumulados frente a egresos acumulados del título"
      className={hero ? 'cc-insights--hero' : ''}
    >
      <p className="cc-insights__headline">{headline}</p>
      {status !== 'no-investment' && (
        <ProgressBar
          value={recovery.recoveredPct}
          label="Inversión recuperada"
          tone={status === 'recovered' ? 'success' : 'primary'}
        />
      )}
      <dl className="cc-insights__stats">
        <Stat label="Invertido" value={formatCurrency(recovery.invested)} />
        <Stat label="Recuperado" value={formatCurrency(recovery.recovered)} />
        <Stat
          label="Falta"
          value={formatCurrency(recovery.remaining)}
          tone={recovery.remaining > 0 ? 'warning' : 'success'}
        />
      </dl>
      {forecast && <p className="cc-insights__note">{forecast}</p>}
      {status === 'in-progress' && (
        <p className="cc-insights__footnote">
          Estimación: usa el ingreso promedio por ejemplar y supone que no habrá
          más egresos.
        </p>
      )}
    </InsightCard>
  );
}

// ---------------------------------------------------------------------------

export function InventoryCard({
  inventory,
  hasBooks,
}: {
  inventory: InventorySummary;
  hasBooks: boolean;
}) {
  return (
    <InsightCard
      title="Inventario"
      subtitle="Tiraje = suma de los ingresos al inventario"
    >
      {!hasBooks ? (
        <NoBooks />
      ) : (
        <>
          {inventory.soldPct !== null ? (
            <>
              <p className="cc-insights__headline">
                {inventory.soldPct.toFixed(0)}% del tiraje vendido
              </p>
              <ProgressBar value={inventory.soldPct} label="Tiraje vendido" />
            </>
          ) : (
            <p className="cc-insights__note">
              No hay ingresos de inventario registrados para calcular el tiraje.
            </p>
          )}
          <dl className="cc-insights__stats">
            <Stat label="Tiraje" value={formatInt(inventory.printRun)} />
            <Stat label="Vendidos" value={formatInt(inventory.sold)} />
            <Stat label="En bodega" value={formatInt(inventory.inWarehouse)} />
            <Stat
              label="En puntos de venta"
              value={formatInt(inventory.atPointsOfSale)}
            />
            <Stat
              label="Cobertura"
              value={
                inventory.coverageMonths === null
                  ? '—'
                  : `${inventory.coverageMonths.toFixed(1)} meses`
              }
              hint="Existencias ÷ ventas mensuales (3 meses)"
            />
            <Stat
              label="Devoluciones"
              value={formatInt(inventory.returned)}
              tone={
                inventory.returnRate !== null && inventory.returnRate > 20
                  ? 'danger'
                  : 'default'
              }
              hint={
                inventory.returnRate === null
                  ? 'Sin remisiones registradas'
                  : `${inventory.returnRate.toFixed(1)}% de lo remitido`
              }
            />
          </dl>
        </>
      )}
    </InsightCard>
  );
}

// ---------------------------------------------------------------------------

const AGING_LABELS: Array<[keyof Receivables['aging'], string]> = [
  ['current', 'Al día'],
  ['days1to30', '1–30 días'],
  ['days31to60', '31–60 días'],
  ['days61to90', '61–90 días'],
  ['over90', 'Más de 90'],
];

export function ReceivablesCard({ receivables }: { receivables: Receivables }) {
  const hasPending = receivables.pending > 0;

  return (
    <InsightCard
      title="Cartera"
      subtitle="Facturas del título: facturado, cobrado y pendiente"
    >
      <dl className="cc-insights__stats">
        <Stat label="Facturado" value={formatCurrency(receivables.invoiced)} />
        <Stat label="Cobrado" value={formatCurrency(receivables.collected)} />
        <Stat
          label="Pendiente"
          value={formatCurrency(receivables.pending)}
          tone={hasPending ? 'warning' : 'success'}
          hint={
            receivables.overdue > 0
              ? `${formatCurrency(receivables.overdue)} vencido`
              : undefined
          }
        />
      </dl>

      {hasPending && (
        <ul
          className="cc-insights__aging"
          aria-label="Antigüedad de la cartera"
        >
          {AGING_LABELS.map(([key, label]) => (
            <li key={key} className="cc-insights__aging-row">
              <span>{label}</span>
              <span
                className={
                  key !== 'current' && receivables.aging[key] > 0
                    ? 'cc-insights__stat-value--danger'
                    : undefined
                }
              >
                {formatCurrency(receivables.aging[key])}
              </span>
            </li>
          ))}
        </ul>
      )}

      {receivables.unverified > 0 && (
        <p className="cc-insights__footnote">
          {formatCurrency(receivables.unverified)} en facturas sin verificar: no
          se sabe si están cobradas y no se cuentan arriba.
        </p>
      )}
    </InsightCard>
  );
}

// ---------------------------------------------------------------------------

export function RoyaltiesCard({
  royalties,
  hasBooks,
}: {
  royalties: Royalties;
  hasBooks: boolean;
}) {
  return (
    <InsightCard
      title="Regalías y anticipo"
      subtitle="Acuerdos con autores y liquidaciones aprobadas o pagadas"
    >
      {!hasBooks ? (
        <NoBooks />
      ) : (
        <dl className="cc-insights__stats">
          <Stat
            label="Anticipo pactado"
            value={formatCurrency(royalties.advance)}
          />
          <Stat
            label="Regalías causadas"
            value={formatCurrency(royalties.accrued)}
          />
          {royalties.toPay > 0 ? (
            <Stat
              label="Por pagar al autor"
              value={formatCurrency(royalties.toPay)}
              tone="danger"
            />
          ) : (
            <Stat
              label="Anticipo por recuperar"
              value={formatCurrency(royalties.advanceToRecover)}
              tone={royalties.advanceToRecover > 0 ? 'warning' : 'success'}
            />
          )}
        </dl>
      )}
    </InsightCard>
  );
}
