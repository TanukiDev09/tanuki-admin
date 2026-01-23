'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import dynamic from 'next/dynamic';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import { BurnRateCard } from '@/components/dashboard/BurnRateCard';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import {
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { FinanceMovementsTable } from '@/components/dashboard/FinanceMovementsTable';
import { CostCenterChart } from '@/components/dashboard/CostCenterChart';
import { useSearchParams, useRouter } from 'next/navigation';
import { Movement } from '@/types/movement';
import './financial-health.scss';

function buildSummaryQueryParams(
  view: string,
  year: number,
  month: number | null,
  page: number = 1
): string {
  const params = new URLSearchParams();
  if (view !== 'global') {
    params.append('year', year.toString());
    if (view === 'monthly' && month) {
      params.append('month', month.toString());
    }
    params.append('page', page.toString());
    params.append('limit', '20'); // Hardcoded limit for consistency
  }
  return params.toString();
}

const RunwayProjectionChart = dynamic(
  () =>
    import('@/components/dashboard/RunwayProjectionChart').then(
      (mod) => mod.RunwayProjectionChart
    ),
  {
    ssr: false,
    loading: () => <div className="chart-loading-placeholder" />,
  }
);

const ScrollableIncomeExpenseChart = dynamic(
  () =>
    import('@/components/dashboard/ScrollableIncomeExpenseChart').then(
      (mod) => mod.ScrollableIncomeExpenseChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading-placeholder" style={{ height: '400px' }} />
    ),
  }
);

const CategoryPieChart = dynamic(
  () =>
    import('@/components/dashboard/CategoryPieChart').then(
      (mod) => mod.CategoryPieChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading-placeholder" style={{ height: '300px' }} />
    ),
  }
);

const CategoryBarChart = dynamic(
  () =>
    import('@/components/dashboard/CategoryBarChart').then(
      (mod) => mod.CategoryBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading-placeholder" style={{ height: '300px' }} />
    ),
  }
);

interface FinancialHealthData {
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  monthly: Array<{ month: string; income: number; expenses: number }>;
  daily?: Array<{
    month: string;
    day: string;
    date: string;
    income: number;
    expenses: number;
  }>;
  categories?: Array<{ name: string; value: number }>;
  categoriesIncome?: Array<{ name: string; value: number }>;
  categoriesExpense?: Array<{ name: string; value: number }>;
  costCenters?: Array<{ name: string; value: number }>;
  costCentersIncome?: Array<{ name: string; value: number }>;
  costCentersExpense?: Array<{ name: string; value: number }>;
  movements?: Movement[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  health: {
    runway: number;
    burnRate: {
      gross: number;
      net: number;
    };
    profitMargin: number;
    avgMonthlyIncome: number;
    avgMonthlyExpense: number;
    healthScore?: number;
    runwayProjection?: Array<{ month: string; balance: number }>;
  };
  balances?: {
    previousMonth: number;
    currentMonth: number;
  };
}

interface ViewProps {
  data: FinancialHealthData;
  breakdownType?: 'income' | 'expense';
  setBreakdownType?: (v: 'income' | 'expense') => void;
  onPageChange?: (page: number) => void;
}

function GlobalView({ data }: ViewProps) {
  return (
    <div className="mt-6">
      {/* Global Totals */}
      <section className="financial-health__section">
        <h2 className="financial-health__section-title">
          Acumulados Históricos
        </h2>
        <div className="financial-health__stat-grid">
          <StatCard
            title="Ingresos Históricos"
            value={formatCurrency(data.totals.income)}
            icon={ArrowUpRight}
            variant="default"
            subtext="Total facturado históricamente"
          />
          <StatCard
            title="Caja Total Actual"
            value={formatCurrency(data.totals.balance)}
            icon={Scale}
            variant="info"
            subtext="Disponible real en cuentas hoy"
          />
          <StatCard
            title="Egresos Históricos"
            value={formatCurrency(data.totals.expenses)}
            icon={ArrowDownRight}
            variant="default"
            subtext="Total gastos históricos"
          />
        </div>
      </section>

      {/* Health Metrics */}
      <section className="financial-health__section">
        <h2 className="financial-health__section-title">
          Indicadores de Sostenibilidad
        </h2>
        <div className="financial-health__metrics-grid">
          <RunwayCard runway={data.health.runway} />
          <BurnRateCard
            grossBurn={data.health.burnRate.gross}
            netBurn={data.health.burnRate.net}
          />
          <HealthScoreCard score={data.health.healthScore} />
        </div>
      </section>

      {/* Historical Flow Chart */}
      <section className="financial-health__section">
        <h2 className="financial-health__section-title">Historia Financiera</h2>
        <ScrollableIncomeExpenseChart data={data.monthly} scrollable={true} />
      </section>

      {/* Net Income Trend Chart */}
      <section className="financial-health__section">
        <h2 className="financial-health__section-title">
          Evolución del Resultado
        </h2>
        <div className="financial-health__chart-container">
          <RunwayProjectionChart data={data.monthly || []} />
        </div>
      </section>
    </div>
  );
}

function MonthlyView({
  data,
  breakdownType,
  setBreakdownType,
  onPageChange,
}: ViewProps) {
  return (
    <div className="mt-6">
      {/* Balance Indicators - Compact */}
      <section className="financial-health__balance-bar">
        <div className="balance-indicator">
          <Scale className="balance-indicator__icon" size={16} />
          <div className="balance-indicator__content">
            <span className="balance-indicator__label">Saldo Mes Anterior</span>
            <span className="balance-indicator__value">{formatCurrency(data.balances?.previousMonth || 0)}</span>
          </div>
        </div>
        <div className="balance-indicator">
          <Scale className="balance-indicator__icon" size={16} />
          <div className="balance-indicator__content">
            <span className="balance-indicator__label">Nuevo Saldo</span>
            <span className="balance-indicator__value">{formatCurrency(data.balances?.currentMonth || 0)}</span>
          </div>
        </div>
      </section>

      {/* Main Statistics */}
      <section className="financial-health__section">
        <div className="financial-health__stat-grid financial-health__stat-grid--triple">
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(data.totals.income)}
            icon={ArrowUpRight}
            variant="default"
          />
          <StatCard
            title="Resultado del Ejercicio"
            value={formatCurrency(data.totals.balance)}
            icon={Activity}
            variant={data.totals.balance >= 0 ? 'info' : 'danger'}
          />
          <StatCard
            title="Gastos del Mes"
            value={formatCurrency(data.totals.expenses)}
            icon={ArrowDownRight}
            variant="default"
          />
        </div>
      </section>

      <section className="financial-health__section">
        <h2 className="financial-health__section-title">
          Flujo de Efectivo Diario
        </h2>
        <div className="financial-health__chart-container">
          <ScrollableIncomeExpenseChart
            data={data.daily || []}
            variant="daily"
            initialBalance={data.balances?.previousMonth || 0}
          />
        </div>
      </section>

      <div className="flex justify-center mb-4">
        <Tabs
          value={breakdownType}
          onValueChange={(v) => setBreakdownType?.(v as 'income' | 'expense')}
          className="w-auto"
        >
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="expense">Gastos (Egresos)</TabsTrigger>
            <TabsTrigger value="income">Ingresos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="financial-health__grid-breakdown">
        <CategoryPieChart
          data={
            breakdownType === 'expense'
              ? data.categoriesExpense || []
              : data.categoriesIncome || []
          }
          title={
            breakdownType === 'expense'
              ? 'Gastos por Categoría'
              : 'Ingresos por Categoría'
          }
        />
        <CostCenterChart
          data={
            breakdownType === 'expense'
              ? data.costCentersExpense || []
              : data.costCentersIncome || []
          }
          title={
            breakdownType === 'expense'
              ? 'Gastos por Centro de Costo'
              : 'Ingresos por Centro de Costo'
          }
        />
      </div>

      <section className="financial-health__section">
        <h2 className="financial-health__section-title">
          Movimientos del Periodo
        </h2>
        <FinanceMovementsTable
          movements={data.movements || []}
          pagination={
            data.pagination
              ? {
                ...data.pagination,
                hasPrevPage: data.pagination.page > 1,
                hasNextPage:
                  data.pagination.page < data.pagination.totalPages,
              }
              : undefined
          }
          onPageChange={onPageChange}
        />
      </section>
    </div>
  );
}

function AnnualView({
  data,
  breakdownType,
  setBreakdownType,
  onPageChange,
}: ViewProps) {
  return (
    <div className="mt-6">
      <section className="financial-health__section">
        <div className="financial-health__stat-grid">
          <StatCard
            title="Ingresos del Año"
            value={formatCurrency(data.totals.income)}
            icon={TrendingUp}
            variant="default"
          />
          <StatCard
            title="Rentabilidad Anual"
            value={formatCurrency(data.totals.balance)}
            icon={Activity}
            variant={data.totals.balance >= 0 ? 'info' : 'danger'}
            subtext={`${((data.totals.balance / (data.totals.income || 1)) * 100).toFixed(1)}% Margen`}
          />
          <StatCard
            title="Gastos Totales"
            value={formatCurrency(data.totals.expenses)}
            icon={ArrowDownRight}
            variant="default"
          />
        </div>
      </section>

      <section className="financial-health__section">
        <h2 className="financial-health__section-title">Desempeño Mensual</h2>
        <ScrollableIncomeExpenseChart data={data.monthly} />
      </section>

      <div className="flex justify-center mb-4">
        <Tabs
          value={breakdownType}
          onValueChange={(v) => setBreakdownType?.(v as 'income' | 'expense')}
          className="w-auto"
        >
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="expense">Gastos (Egresos)</TabsTrigger>
            <TabsTrigger value="income">Ingresos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="financial-health__grid-breakdown">
        <CategoryBarChart
          data={
            breakdownType === 'expense'
              ? data.categoriesExpense || []
              : data.categoriesIncome || []
          }
          title={
            breakdownType === 'expense'
              ? 'Gastos por Categoría'
              : 'Ingresos por Categoría'
          }
        />
        <CostCenterChart
          data={
            breakdownType === 'expense'
              ? data.costCentersExpense || []
              : data.costCentersIncome || []
          }
          title={
            breakdownType === 'expense'
              ? 'Gastos por Centro de Costo'
              : 'Ingresos por Centro de Costo'
          }
        />
      </div>

      <section className="financial-health__section">
        <h2 className="financial-health__section-title">Movimientos del Año</h2>
        <FinanceMovementsTable
          movements={data.movements || []}
          pagination={
            data.pagination
              ? {
                ...data.pagination,
                hasPrevPage: data.pagination.page > 1,
                hasNextPage:
                  data.pagination.page < data.pagination.totalPages,
              }
              : undefined
          }
          onPageChange={onPageChange}
        />
      </section>
    </div>
  );
}

export default function FinancialHealthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get('view') || 'global';
  const year = parseInt(
    searchParams.get('year') || new Date().getFullYear().toString()
  );
  const month = searchParams.get('month')
    ? parseInt(searchParams.get('month')!)
    : view === 'monthly'
      ? new Date().getMonth() + 1
      : null;
  const page = parseInt(searchParams.get('page') || '1');

  const [data, setData] = useState<FinancialHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [breakdownType, setBreakdownType] = useState<'income' | 'expense'>(
    'expense'
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = buildSummaryQueryParams(view, year, month, page);

      const response = await fetch(`/api/finance/summary?${queryString}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch summary data');
      const summaryData: FinancialHealthData = await response.json();
      setData(summaryData);
    } catch (error) {
      console.error('Failed to fetch financial health data', error);
    } finally {
      setLoading(false);
    }
  }, [view, year, month, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) current.delete(key);
        else current.set(key, value);
      });
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handleTabChange = (val: string) => {
    if (val === 'global') {
      updateParams({ view: 'global', year: null, month: null, page: '1' });
    } else if (val === 'monthly') {
      updateParams({
        view: 'monthly',
        year: year.toString(),
        month: (month || new Date().getMonth() + 1).toString(),
        page: '1',
      });
    } else if (val === 'annual') {
      updateParams({
        view: 'annual',
        year: year.toString(),
        month: null,
        page: '1',
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="financial-health__container">
        <div
          className="chart-loading-placeholder"
          style={{ height: '100px', marginTop: '20px' }}
        />
        <div
          className="chart-loading-placeholder"
          style={{ marginTop: '20px' }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="financial-health__container">
        <p>Error al cargar datos financieros.</p>
      </div>
    );
  }

  return (
    <div className="financial-health__container">
      {/* Header */}
      <div className="financial-health__header">
        <div>
          <h1 className="financial-health__title">Salud Financiera</h1>
          <p className="financial-health__subtitle">
            Visión global del estado económico y proyecciones a largo plazo.
          </p>
        </div>

        {view !== 'global' && (
          <PeriodSelector
            type={view === 'monthly' ? 'monthly' : 'annual'}
            year={year}
            month={month}
            onYearChange={(y) => updateParams({ year: y.toString() })}
            onMonthChange={(m) =>
              updateParams({ month: m ? m.toString() : null })
            }
          />
        )}
      </div>

      <Tabs
        value={view}
        onValueChange={handleTabChange}
        className="financial-health__tabs"
      >
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <GlobalView data={data} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyView
            data={data}
            breakdownType={breakdownType}
            setBreakdownType={setBreakdownType}
            onPageChange={(p) => updateParams({ page: p.toString() })}
          />
        </TabsContent>

        <TabsContent value="annual">
          <AnnualView
            data={data}
            breakdownType={breakdownType}
            setBreakdownType={setBreakdownType}
            onPageChange={(p) => updateParams({ page: p.toString() })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
