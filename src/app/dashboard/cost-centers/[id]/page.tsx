'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, TrendingDown, ArrowUpRight, ArrowDownRight, Scale, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CostCenter } from '@/types/cost-center';
import { Movement } from '@/types/movement';
import { FinancialSummary } from '@/types/financial-summary';
import { useToast } from '@/components/ui/Toast';
import { RunwayCard } from '@/components/dashboard/RunwayCard';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils';
import './cost-center-detail.scss';
import { RecentMovements } from '@/components/dashboard/RecentMovements';

const IncomeExpenseChart = dynamic(() => import('@/components/dashboard/IncomeExpenseChart').then(mod => mod.IncomeExpenseChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />
});

export default function CostCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch Cost Center Details
        const ccRes = await fetch(`/api/costcenters?id=${params.id}`);
        if (!ccRes.ok) throw new Error('Error al cargar el centro de costo');
        const ccData = await ccRes.json();

        let foundCC: CostCenter | null = null;
        if (Array.isArray(ccData.data)) {
          foundCC = ccData.data.find((c: CostCenter) => c._id === params.id) || null;
        } else {
          foundCC = ccData.data;
        }
        setCostCenter(foundCC);

        // 2. Fetch Financial Data & Movements if CC found
        if (foundCC) {
          // Summary
          const summaryRes = await fetch(`/api/finance/summary?costCenter=${foundCC.code}`);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            setFinancialData(summaryData);
          }

          // Movements
          const movementsRes = await fetch(`/api/finance/movements?costCenter=${foundCC.code}&limit=10`);
          if (movementsRes.ok) {
            const movementsData = await movementsRes.json();
            setMovements(movementsData.data || []);
          }
        }

      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar toda la información',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id, toast]);

  if (loading) {
    return <div className="dashboard__container"><p>Cargando información...</p></div>;
  }

  if (!costCenter) {
    return (
      <div className="dashboard__container">
        <p>Centro de costo no encontrado.</p>
        <Button variant="link" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="cost-center-detail">
      <div className="cost-center-detail__header">
        <Button
          variant="ghost"
          className="cost-center-detail__back-btn"
          onClick={() => router.push('/dashboard/cost-centers')}
        >
          <ArrowLeft size={16} />
          Volver a la lista
        </Button>
      </div>

      <div className="cost-center-detail__title-group">
        <h1 className="cost-center-detail__title">
          {costCenter.name}
          <span className="cost-center-detail__code-badge">{costCenter.code}</span>
        </h1>
      </div>

      <div className="cost-center-detail__card">
        <div className="cost-center-detail__section">
          <span className="cost-center-detail__label">Descripción</span>
          <p className="cost-center-detail__value">
            {costCenter.description || 'Sin descripción disponible.'}
          </p>
        </div>

        <div className="cost-center-detail__meta-grid">
          <div className="cost-center-detail__meta-item">
            <span className="cost-center-detail__label">
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Fecha de Creación
            </span>
            <p className="cost-center-detail__value">{formatDate(costCenter.createdAt)}</p>
          </div>
          {costCenter.updatedAt && (
            <div className="cost-center-detail__meta-item">
              <span className="cost-center-detail__label">
                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Última Actualización
              </span>
              <p className="cost-center-detail__value">{formatDate(costCenter.updatedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {financialData && (
        <div className="cost-center-detail__financial-section">
          <h2 className="cost-center-detail__section-title">
            Salud Financiera
          </h2>

          {/* 1. ACUMULADOS HISTÓRICOS */}
          <h3 className="cost-center-detail__section-title subsection">Acumulados Históricos</h3>
          <div className="cost-center-detail__hero-stats">
            {/* Custom Wide Cards for Hero Stats */}
            <div className="premium-stat-card">
              <div className="premium-stat-card__header">
                <span className="premium-stat-card__label">Ingresos Históricos</span>
                <ArrowUpRight className="premium-stat-card__icon" size={20} />
              </div>
              <div className="premium-stat-card__value">
                {formatCurrency(financialData.totals?.income || 0)}
              </div>
              <div className="premium-stat-card__subtext">
                Total facturado históricamente
              </div>
            </div>

            <div className="premium-stat-card premium-stat-card--highlight">
              <div className="premium-stat-card__header">
                <span className="premium-stat-card__label">Caja Total Actual (Balance)</span>
                <Scale className="premium-stat-card__icon" size={20} />
              </div>
              <div className="premium-stat-card__value">
                {formatCurrency(financialData.totals?.balance || 0)}
              </div>
              <div className="premium-stat-card__subtext">
                Disponible real en cuentas hoy
              </div>
            </div>

            <div className="premium-stat-card">
              <div className="premium-stat-card__header">
                <span className="premium-stat-card__label">Egresos Históricos</span>
                <ArrowDownRight className="premium-stat-card__icon" size={20} />
              </div>
              <div className="premium-stat-card__value">
                {formatCurrency(financialData.totals?.expenses || 0)}
              </div>
              <div className="premium-stat-card__subtext">
                Total gastos históricos
              </div>
            </div>
          </div>

          {/* 2. INDICADORES DE SOSTENIBILIDAD */}
          <h3 className="cost-center-detail__section-title subsection" style={{ marginTop: '2rem' }}>Indicadores de Sostenibilidad</h3>
          <div className="cost-center-detail__indicators-grid">
            <RunwayCard runway={financialData.health?.runway || 0} />

            {/* Burn Rate Card */}
            <Card className="runway-card"> {/* Reuse card style base */}
              <CardHeader className="runway-card__header">
                <CardTitle className="runway-card__title">GASTO MENSUAL PROMEDIO</CardTitle>
                <TrendingDown size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent className="runway-card__content">
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(financialData.health?.avgMonthlyExpense || 0)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/mes</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Promedio últimos 6 meses
                </p>
              </CardContent>
            </Card>

            {/* Health Score Card */}
            <Card className="runway-card runway-card--healthy"> {/* Reuse green style */}
              <CardHeader className="runway-card__header">
                <CardTitle className="runway-card__title">PUNTUACIÓN DE SALUD</CardTitle>
                <Activity size={18} className="text-emerald-600" />
              </CardHeader>
              <CardContent className="runway-card__content flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {financialData.health?.healthScore || 100}
                    <span className="text-sm font-normal text-muted-foreground">/100</span>
                  </div>
                  <p className="text-sm text-emerald-600 font-medium mt-2">Excelente</p>
                </div>
                {/* Simple circular placeholder */}
                <div className="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-700 font-bold">
                  {financialData.health?.healthScore || 100}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. HISTORIA FINANCIERA */}
          <h3 className="cost-center-detail__section-title subsection" style={{ marginTop: '2rem' }}>Historia Financiera</h3>
          <div className="cost-center-detail__chart-section">
            <div style={{ height: '400px', width: '100%' }}>
              <IncomeExpenseChart data={financialData.daily} />
            </div>
          </div>

          {movements.length > 0 && (
            <div className="cost-center-detail__movements-section">
              <div className="cost-center-detail__section-title">
                Últimos Movimientos
              </div>
              <RecentMovements movements={movements} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
