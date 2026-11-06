'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  PieChart,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CostCenter } from '@/types/cost-center';
import { Movement } from '@/types/movement';
import { CategoryData, FinancialSummary } from '@/types/financial-summary';
import { useToast } from '@/components/ui/Toast';
import type { TopPointOfSale } from '@/lib/finance/salesChannels';
import { computeRecovery } from '@/lib/finance/costCenterInsights';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import CostCenterModal from '@/components/admin/CostCenterModal';
import { SummaryStrip } from './_components/SummaryStrip';
import { DetailTabs } from './_components/DetailTabs';
import type { CostCenterInsightsData } from './_components/types';
import './cost-center-detail.scss';

export default function CostCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(
    null
  );
  const [movements, setMovements] = useState<Movement[]>([]);
  const [salesChannels, setSalesChannels] = useState<CategoryData[]>([]);
  const [topPointsOfSale, setTopPointsOfSale] = useState<TopPointOfSale[]>([]);
  const [insights, setInsights] = useState<CostCenterInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canUpdate = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.UPDATE
  );
  const canDelete = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.DELETE
  );

  // Devuelve el JSON de la respuesta, o null (avisando con un toast) si falla.
  const fetchJson = useCallback(
    async (url: string, errorMessage: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      }
      return res.json();
    },
    [toast]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setExtrasLoading(true);
      const ccRes = await fetch(`/api/costcenters?id=${params.id}`);
      if (!ccRes.ok) throw new Error('Error al cargar el centro de costo');
      const ccData = await ccRes.json();

      const foundCC: CostCenter | null = Array.isArray(ccData.data)
        ? ccData.data.find((c: CostCenter) => c._id === params.id) || null
        : ccData.data;
      setCostCenter(foundCC);
      if (!foundCC) return;

      const [summary, channels, movs, insightsRes] = await Promise.all([
        fetchJson(
          `/api/finance/summary?costCenter=${foundCC.code}`,
          'No se pudo cargar el resumen financiero'
        ),
        fetchJson(
          `/api/costcenters/${foundCC._id}/sales-channels`,
          'No se pudieron cargar las ventas por canal'
        ),
        fetchJson(
          `/api/finance/movements?costCenter=${foundCC.code}&limit=10`,
          'No se pudieron cargar los movimientos recientes'
        ),
        fetchJson(
          `/api/costcenters/${foundCC._id}/insights`,
          'No se pudieron cargar los indicadores de gestión'
        ),
      ]);

      if (summary) setFinancialData(summary);
      setSalesChannels(channels?.data || []);
      setTopPointsOfSale(channels?.topPointsOfSale || []);
      setMovements(movs?.data || []);
      setInsights(insightsRes?.data ?? null);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar toda la información',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setExtrasLoading(false);
    }
  }, [params.id, toast, fetchJson]);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id, fetchData]);

  if (loading) {
    return (
      <div
        className="flex h-[80vh] w-full items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium">
            Cargando análisis detallado...
          </p>
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
          <h1 className="text-xl font-bold">Centro de costo no encontrado</h1>
          <p className="text-muted-foreground">
            El recurso que buscas no existe o ha sido movido.
          </p>
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
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas desactivar este centro de costo? Su historial financiero y relaciones se mantendrán intactos.'
      )
    )
      return;
    try {
      const res = await fetch(`/api/costcenters?id=${costCenter?._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({ title: 'Éxito', description: 'Centro de costo desactivado' });
        router.push('/dashboard/cost-centers');
      } else {
        throw new Error('Error al eliminar');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo desactivar el centro de costo',
        variant: 'destructive',
      });
    }
  };

  const recovery = financialData
    ? computeRecovery({
        income: financialData.totals?.income || 0,
        expenses: financialData.totals?.expenses || 0,
        revenuePerUnit: insights?.pace.revenuePerUnit ?? 0,
        avgMonthlyUnits: insights?.pace.avgMonthlyUnits ?? 0,
      })
    : null;
  return (
    <div className="cost-center-detail">
      {/* Header & Breadcrumbs */}
      <header className="cost-center-detail__header">
        <div className="flex flex-col gap-4">
          <nav
            aria-label="Ruta de navegación"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link
              href="/dashboard/cost-centers"
              className="hover:text-primary transition-colors"
            >
              Centros de Costo
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page" className="text-foreground font-medium">
              Detalle
            </span>
          </nav>

          <div className="cost-center-detail__title-area">
            <h1 className="cost-center-detail__title">{costCenter.name}</h1>
            <span className="cost-center-detail__code-badge">
              {costCenter.code}
            </span>
          </div>
          {costCenter.description && (
            <p className="cost-center-detail__description">
              {costCenter.description}
            </p>
          )}
          <p className="cost-center-detail__meta">
            Creado el {formatDate(costCenter.createdAt)}
            {costCenter.updatedAt &&
              ` · Actualizado el ${formatDate(costCenter.updatedAt)}`}
          </p>
        </div>

        <div className="cost-center-detail__actions">
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Pencil size={16} className="mr-2" />
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-danger hover:bg-danger/10 hover:border-danger hover:text-danger"
            >
              <Trash2 size={16} className="mr-2" />
              Desactivar
            </Button>
          )}
        </div>
      </header>

      {/* Resumen: lo primero que debe verse */}
      {financialData && recovery && (
        <SummaryStrip
          recovery={recovery}
          totalQuantity={financialData.totals?.totalQuantity || 0}
          insights={insights}
          extrasLoading={extrasLoading}
        />
      )}

      {/* Detalle por tema, una sola capa de pestañas */}
      {financialData && (
        <DetailTabs
          financialData={financialData}
          insights={insights}
          extrasLoading={extrasLoading}
          salesChannels={salesChannels}
          topPointsOfSale={topPointsOfSale}
          movements={movements}
          costCenterCode={costCenter.code}
        />
      )}
      <CostCenterModal
        isOpen={isModalOpen}
        costCenter={costCenter}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
