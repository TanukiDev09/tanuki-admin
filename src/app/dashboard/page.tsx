'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import dynamic from 'next/dynamic';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import { BurnRateCard } from '@/components/dashboard/BurnRateCard';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';

const IncomeExpenseChart = dynamic(() => import('@/components/dashboard/IncomeExpenseChart').then(mod => mod.IncomeExpenseChart), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full animate-pulse bg-muted rounded-xl" />
});

const CategoryBarChart = dynamic(() => import('@/components/dashboard/CategoryBarChart').then(mod => mod.CategoryBarChart), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full animate-pulse bg-muted rounded-xl" />
});

const RunwayProjectionChart = dynamic(() => import('@/components/dashboard/RunwayProjectionChart').then(mod => mod.RunwayProjectionChart), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full animate-pulse bg-muted rounded-xl" />
});
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

interface DashboardData {
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  monthly: Array<{ month: string; income: number; expenses: number }>;
  categories: Array<{ name: string; value: number }>;
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
}

interface Movement {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'Ingreso' | 'Egreso';
  date: string;
  category: string | { name: string };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, movementsRes] = await Promise.all([
          fetch('/api/finance/summary'),
          fetch('/api/finance/movements?limit=7')
        ]);

        if (!summaryRes.ok) throw new Error('Failed to fetch summary data');
        if (!movementsRes.ok) throw new Error('Failed to fetch movements data');

        const summaryData: DashboardData = await summaryRes.json();
        const movementsData: { data: Movement[] } = await movementsRes.json();

        setData(summaryData);
        setMovements(movementsData.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Cargando datos...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">Error al cargar datos.</div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8">

      {/* ZONE 0: BUSINESS HEALTH (Entrepreneur Metrics) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Salud del Negocio
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RunwayCard runway={data.health.runway} />
          <BurnRateCard
            grossBurn={data.health.burnRate.gross}
            netBurn={data.health.burnRate.net}
          />
          <HealthScoreCard score={data.health.healthScore} />
          {/* Empty column for 4th spot on large screens */}
          <div className="hidden lg:block" />
        </div>

        {/* Runway Projection Chart */}
        <div className="card">
          <RunwayProjectionChart data={data.health.runwayProjection} />
        </div>
      </section>

      {/* ZONE 1: CLARITY (KPIs) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Estado Actual
        </h2>
        <div className="flex flex-wrap gap-4">
          <StatCard
            className="flex-1 min-w-[300px]"
            title="Entradas Totales"
            value={formatCurrency(data.totals.income)}
            icon={ArrowUpRight}
            variant="success"
            subtext="Suma histórica de ingresos"
          />
          <StatCard
            className="flex-1 min-w-[300px]"
            title="Disponible Real"
            value={formatCurrency(data.totals.balance)}
            icon={Scale}
            variant="info"
            subtext="Lo que queda en caja hoy"
          />
          <StatCard
            className="flex-1 min-w-[300px]"
            title="Salidas Totales"
            value={formatCurrency(data.totals.expenses)}
            icon={ArrowDownRight}
            variant="danger"
            subtext="Suma histórica de gastos"
          />
        </div>
      </section>

      {/* ZONE 2: INSPECTION (Visualization) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Análisis Visual
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Flow Chart */}
          <div className="card">
            <IncomeExpenseChart data={data.monthly} />
          </div>

          {/* Category Bars */}
          <div className="card">
            <CategoryBarChart data={data.categories} />
          </div>
        </div>
      </section>

      {/* ZONE 3: DETAIL (Table) */}
      <section className="space-y-4">
        <RecentMovements movements={movements} />
      </section>
    </div>
  );
}
