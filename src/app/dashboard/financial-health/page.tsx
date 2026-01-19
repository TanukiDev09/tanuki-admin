'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import dynamic from 'next/dynamic';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import { BurnRateCard } from '@/components/dashboard/BurnRateCard';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import './financial-health.scss';

const RunwayProjectionChart = dynamic(() => import('@/components/dashboard/RunwayProjectionChart').then(mod => mod.RunwayProjectionChart), {
  ssr: false,
  loading: () => <div className="chart-loading-placeholder" />
});

const ScrollableIncomeExpenseChart = dynamic(() => import('@/components/dashboard/ScrollableIncomeExpenseChart').then(mod => mod.ScrollableIncomeExpenseChart), {
  ssr: false,
  loading: () => <div className="chart-loading-placeholder" style={{ height: '400px' }} />
});

interface FinancialHealthData {
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  monthly: Array<{ month: string; income: number; expenses: number }>;
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

export default function FinancialHealthPage() {
  const [data, setData] = useState<FinancialHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/finance/summary', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch summary data');
        const summaryData: FinancialHealthData = await response.json();
        setData(summaryData);
      } catch (error) {
        console.error("Failed to fetch financial health data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="financial-health__container">
        <div className="chart-loading-placeholder" style={{ height: '100px', marginTop: '20px' }} />
        <div className="chart-loading-placeholder" style={{ marginTop: '20px' }} />
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
        <h1 className="financial-health__title">Salud Financiera</h1>
        <p className="financial-health__subtitle">
          Visión global del estado económico y proyecciones a largo plazo.
        </p>
      </div>

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
        <h2 className="financial-health__section-title">
          Historia Financiera
        </h2>
        <ScrollableIncomeExpenseChart data={data.monthly} />
      </section>

      {/* Runway Projection Chart */}
      <section className="financial-health__section">
        <h2 className="financial-health__section-title">
          Proyección de Flujo de Caja
        </h2>
        <div className="financial-health__projection-wrapper">
          <RunwayProjectionChart data={data.health.runwayProjection} />
        </div>
      </section>
    </div>
  );
}
