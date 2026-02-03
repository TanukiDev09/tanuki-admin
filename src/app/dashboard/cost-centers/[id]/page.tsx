'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  PieChart,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { CostCenter } from '@/types/cost-center';
import { Movement } from '@/types/movement';
import { FinancialSummary } from '@/types/financial-summary';
import { useToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './cost-center-detail.scss';

const ScrollableIncomeExpenseChart = dynamic(
  () =>
    import('@/components/dashboard/ScrollableIncomeExpenseChart').then(
      (mod) => mod.ScrollableIncomeExpenseChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-muted/10 animate-pulse rounded-lg" />
    ),
  }
);

export default function CostCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const canUpdate = hasPermission(ModuleName.COST_CENTERS, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.COST_CENTERS, PermissionAction.DELETE);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
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

        if (foundCC) {
          const summaryRes = await fetch(`/api/finance/summary?costCenter=${foundCC.code}`);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            setFinancialData(summaryData);
          }

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
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium">Cargando análisis detallado...</p>
        </div>
      </div>
    );
  }

  if (!costCenter) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <PieChart size={40} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold">Centro de costo no encontrado</h3>
          <p className="text-muted-foreground">El recurso que buscas no existe o ha sido movido.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/cost-centers')}>
          <ArrowLeft size={16} className="mr-2" />
          Volver al Dashboard
        </Button>
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

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este centro de costo?')) return;
    try {
      const res = await fetch(`/api/costcenters?id=${costCenter._id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Éxito', description: 'Centro de costo eliminado' });
        router.push('/dashboard/cost-centers');
      } else {
        throw new Error('Error al eliminar');
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el centro de costo', variant: 'destructive' });
    }
  };

  return (
    <div className="cost-center-detail">
      {/* Header & Breadcrumbs */}
      <header className="cost-center-detail__header">
        <div className="flex flex-col gap-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => router.push('/dashboard/cost-centers')}
            >
              Centros de Costo
            </span>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">Detalle</span>
          </nav>

          <div className="cost-center-detail__title-area">
            <h1 className="cost-center-detail__title">{costCenter.name}</h1>
            <span className="cost-center-detail__code-badge">{costCenter.code}</span>
          </div>
        </div>

        <div className="cost-center-detail__actions">
          {canUpdate && (
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Próximamente', description: 'La edición estará disponible pronto.' })}>
              <Pencil size={16} className="mr-2" />
              Editar
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-danger hover:bg-danger/10 hover:border-danger hover:text-danger">
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </header>

      {/* Stats Overview */}
      {financialData && (
        <div className="cost-center-detail__stats-grid">
          <StatCard
            title="Ingresos"
            value={formatCurrency(financialData.totals?.income || 0)}
            icon={TrendingUp}
            variant="success"
            subtext="Total histórico"
          />
          <StatCard
            title="Egresos"
            value={formatCurrency(financialData.totals?.expenses || 0)}
            icon={TrendingDown}
            variant="danger"
            subtext="Total histórico"
          />
          <StatCard
            title="Unidades Vendidas"
            value={(financialData.totals?.totalQuantity || 0).toString()}
            icon={Tag}
            variant="default"
            subtext="Volumen de ventas"
          />
          <StatCard
            title="Balance Neto"
            value={formatCurrency(financialData.totals?.balance || 0)}
            icon={DollarSign}
            variant="info"
            subtext="Saldo disponible"
          />
          <StatCard
            title="Salud (Runway)"
            value={`${Math.floor(financialData.health?.runway || 0)} meses`}
            icon={Activity}
            variant="default"
            subtext="Supervivencia estimada"
          />
        </div>
      )}

      {/* Main Grid: Analysis & Side Info */}
      <div className="cost-center-detail__main-grid">
        <div className="cost-center-detail__content-area">
          {/* Main Chart */}
          {financialData && (
            <ScrollableIncomeExpenseChart
              data={financialData.monthly}
              variant="monthly"
              scrollable={financialData.monthly.length > 8}
            />
          )}

          {/* Recent Movements */}
          <div className="cost-center-detail__movements-card">
            <div className="cost-center-detail__movements-card__header">
              <h3 className="cost-center-detail__movements-card__title">Últimos Movimientos</h3>
              <Button variant="link" size="sm" onClick={() => router.push(`/dashboard/movements?costCenter=${costCenter.code}`)}>
                Ver todos
              </Button>
            </div>
            <div className="p-2">
              <RecentMovements movements={movements} />
            </div>
          </div>
        </div>

        <aside className="cost-center-detail__side-area">
          <Card className="cost-center-detail__info-card">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="cost-center-detail__info-item">
                <label>Descripción</label>
                <p>{costCenter.description || 'Sin descripción disponible.'}</p>
              </div>
              <div className="cost-center-detail__info-item">
                <label>Fecha de Creación</label>
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar size={14} className="text-muted-foreground" />
                  <p>{formatDate(costCenter.createdAt)}</p>
                </div>
              </div>
              {costCenter.updatedAt && (
                <div className="cost-center-detail__info-item">
                  <label>Última Actualización</label>
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock size={14} className="text-muted-foreground" />
                    <p>{formatDate(costCenter.updatedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {financialData?.health && (
            <Card className="cost-center-detail__info-card">
              <CardHeader>
                <CardTitle>Métricas de Gestión</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="cost-center-detail__info-item">
                  <label>Gasto Promedio Histórico</label>
                  <p className="text-xl font-bold">{formatCurrency(financialData.health.avgMonthlyExpense)}</p>
                </div>
                <div className="cost-center-detail__info-item">
                  <label>Score de Salud</label>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${financialData.health.healthScore > 70 ? 'bg-success' : 'bg-warning'}`}
                        style={{ width: `${financialData.health.healthScore}%` }}
                      />
                    </div>
                    <span className="font-bold">{Math.floor(financialData.health.healthScore)}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
