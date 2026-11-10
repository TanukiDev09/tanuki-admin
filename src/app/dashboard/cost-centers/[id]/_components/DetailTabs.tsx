'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  InventoryCard,
  ReceivablesCard,
  RoyaltiesCard,
} from '@/components/dashboard/CostCenterInsights';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { TopPointsOfSale } from '@/components/dashboard/TopPointsOfSale';
import type { TopPointOfSale } from '@/lib/finance/salesChannels';
import { formatCurrency } from '@/lib/utils';
import type { Movement } from '@/types/movement';
import type { CategoryData, FinancialSummary } from '@/types/financial-summary';
import type { CostCenterInsightsData } from './types';

// Altura compacta de las donas para que el panel quepa en menos scroll.
const PIE_HEIGHT = 300;

const chartSkeleton = (
  <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted/10" />
);

// Mismo gráfico "Evolución del Resultado" que usa Salud Financiera. El saldo
// de caja (CashBalanceChart) es de toda la empresa y no aplica por centro de
// costo, así que aquí se muestra el resultado neto mensual.
const RunwayProjectionChart = dynamic(
  () =>
    import('@/components/dashboard/RunwayProjectionChart').then(
      (mod) => mod.RunwayProjectionChart
    ),
  { ssr: false, loading: () => chartSkeleton }
);

const SalesPaceCard = dynamic(
  () =>
    import('@/components/dashboard/CostCenterInsights/SalesPaceCard').then(
      (mod) => mod.SalesPaceCard
    ),
  { ssr: false, loading: () => chartSkeleton }
);

const CategoryPieChart = dynamic(
  () =>
    import('@/components/dashboard/CategoryPieChart').then(
      (mod) => mod.CategoryPieChart
    ),
  { ssr: false, loading: () => chartSkeleton }
);

interface DetailTabsProps {
  financialData: FinancialSummary;
  insights: CostCenterInsightsData | null;
  extrasLoading: boolean;
  salesChannels: CategoryData[];
  topPointsOfSale: TopPointOfSale[];
  movements: Movement[];
  costCenterCode: string;
}

function Placeholder({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div
        className="h-[300px] w-full animate-pulse rounded-lg bg-muted/10"
        aria-hidden="true"
      />
    );
  }
  return (
    <p className="cost-center-detail__placeholder" role="alert">
      No se pudieron cargar estos indicadores.
    </p>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="cost-center-detail__chart-card">{children}</div>;
}

function ManagementMetrics({
  health,
}: {
  health: NonNullable<FinancialSummary['health']>;
}) {
  const scoreTone = health.healthScore > 70 ? 'bg-success' : 'bg-warning';
  return (
    <Card className="cost-center-detail__info-card">
      <CardHeader>
        <CardTitle as="h2">Métricas de Gestión</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="cost-center-detail__info-item">
          <label>Gasto Promedio Histórico</label>
          <p className="text-xl font-bold">
            {formatCurrency(health.avgMonthlyExpense)}
          </p>
        </div>
        <div className="cost-center-detail__info-item">
          <label>Score de Salud</label>
          <div className="flex items-center gap-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${scoreTone}`}
                style={{ width: `${health.healthScore}%` }}
              />
            </div>
            <span className="font-bold">
              {Math.floor(health.healthScore)}/100
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultTab({ financialData }: { financialData: FinancialSummary }) {
  return (
    <>
      <div className="cost-center-detail__grid cost-center-detail__grid--split">
        <Panel>
          <RunwayProjectionChart data={financialData.monthly || []} />
        </Panel>
        {financialData.health && (
          <ManagementMetrics health={financialData.health} />
        )}
      </div>
      <div className="cost-center-detail__grid cost-center-detail__grid--halves">
        <Panel>
          <CategoryPieChart
            data={financialData.categoriesIncome || []}
            title="Ingresos por Categoría"
            height={PIE_HEIGHT}
          />
        </Panel>
        <Panel>
          <CategoryPieChart
            data={financialData.categoriesExpense || []}
            title="Gastos por Categoría"
            height={PIE_HEIGHT}
          />
        </Panel>
      </div>
    </>
  );
}

function SalesTab({
  insights,
  extrasLoading,
  salesChannels,
  topPointsOfSale,
}: Pick<
  DetailTabsProps,
  'insights' | 'extrasLoading' | 'salesChannels' | 'topPointsOfSale'
>) {
  return (
    <>
      <div className="cost-center-detail__grid cost-center-detail__grid--halves">
        {insights ? (
          <SalesPaceCard pace={insights.pace} />
        ) : (
          <Placeholder loading={extrasLoading} />
        )}
        <Panel>
          {extrasLoading ? (
            <Placeholder loading />
          ) : (
            <CategoryPieChart
              data={salesChannels}
              title="Ejemplares por Canal de Venta"
              valueFormatter={(value) => `${value} ejemplares`}
              height={PIE_HEIGHT}
            />
          )}
        </Panel>
      </div>
      {!extrasLoading && <TopPointsOfSale items={topPointsOfSale} />}
    </>
  );
}

function InventoryTab({
  insights,
  extrasLoading,
}: Pick<DetailTabsProps, 'insights' | 'extrasLoading'>) {
  if (!insights) return <Placeholder loading={extrasLoading} />;
  return (
    <div className="cost-center-detail__grid cost-center-detail__grid--thirds">
      <InventoryCard
        inventory={insights.inventory}
        hasBooks={insights.hasBooks}
      />
      <ReceivablesCard receivables={insights.receivables} />
      <RoyaltiesCard
        royalties={insights.royalties}
        hasBooks={insights.hasBooks}
      />
    </div>
  );
}

function MovementsTab({
  movements,
  costCenterCode,
}: Pick<DetailTabsProps, 'movements' | 'costCenterCode'>) {
  const router = useRouter();
  return (
    <div className="cost-center-detail__movements-card">
      <div className="flex justify-end p-2 pb-0">
        <Button
          variant="link"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/movements?costCenter=${costCenterCode}`)
          }
        >
          Ver todos
        </Button>
      </div>
      <div className="p-2 pt-0">
        <RecentMovements movements={movements} />
      </div>
    </div>
  );
}

/** Detalle por tema, en una sola capa de pestañas. */
export function DetailTabs(props: DetailTabsProps) {
  return (
    <Tabs defaultValue="resultado" className="cost-center-detail__tabs">
      <TabsList aria-label="Secciones del panel">
        <TabsTrigger value="resultado">Resultado</TabsTrigger>
        <TabsTrigger value="ventas">Ventas</TabsTrigger>
        <TabsTrigger value="inventario">Inventario y cobros</TabsTrigger>
        <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
      </TabsList>

      <TabsContent value="resultado">
        <ResultTab financialData={props.financialData} />
      </TabsContent>
      <TabsContent value="ventas">
        <SalesTab
          insights={props.insights}
          extrasLoading={props.extrasLoading}
          salesChannels={props.salesChannels}
          topPointsOfSale={props.topPointsOfSale}
        />
      </TabsContent>
      <TabsContent value="inventario">
        <InventoryTab
          insights={props.insights}
          extrasLoading={props.extrasLoading}
        />
      </TabsContent>
      <TabsContent value="movimientos">
        <MovementsTab
          movements={props.movements}
          costCenterCode={props.costCenterCode}
        />
      </TabsContent>
    </Tabs>
  );
}
