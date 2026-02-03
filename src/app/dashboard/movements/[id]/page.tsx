'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  ExternalLink,
  Wallet,
  Calendar,
  CreditCard,
  User,
  Tag,
  Hash,
  ShoppingBag,
  Layers,
} from 'lucide-react';

import { Movement } from '@/types/movement';
import { IDebt } from '@/types/debt';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { toNumber } from '@/lib/math';
import '../movement-detail.scss';

interface HeaderProps {
  movement: Movement;
  deleting: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

function MovementDetailHeader({
  movement,
  deleting,
  canUpdate,
  canDelete,
  onDelete,
  onEdit,
}: HeaderProps) {
  return (
    <div className="movement-detail__header">
      <div className="movement-detail__title-group">
        <div className="movement-detail__status-row">
          <Badge variant="outline" className="movement-detail__status-badge">
            {movement.status || 'COMPLETED'}
          </Badge>
          <span className="movement-detail__id-badge">
            ID: {movement._id.slice(-6).toUpperCase()}
          </span>
        </div>
        <h1 className="movement-detail__title">{movement.description}</h1>
      </div>
      <div className="movement-detail__actions">
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="movement-detail__delete-btn"
          >
            <Trash2 />
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
        {canUpdate && (
          <button onClick={onEdit} className="movement-detail__edit-btn">
            <Pencil />
            Editar Movimiento
          </button>
        )}
      </div>
    </div>
  );
}

function MovementDetailContent({
  movement,
  router,
}: {
  movement: Movement;
  router: AppRouterInstance;
}) {
  const isIncome = movement.type === 'INCOME';

  return (
    <div className="movement-detail__container">
      <div className="movement-detail__main-card">
        <div className="movement-detail__amount-display">
          <div className="movement-detail__amount-display-label">
            Ingreso Neto del Movimiento
          </div>
          <div
            className={`movement-detail__amount-display-value ${isIncome
              ? 'movement-detail__amount-display-value--income'
              : 'movement-detail__amount-display-value--expense'
              }`}
          >
            {isIncome ? '+' : '-'} {formatCurrency(toNumber(movement.amountInCOP || movement.amount), 'COP')}
          </div>
          {movement.currency !== 'COP' && (
            <div className="movement-detail__amount-display-hint">
              {formatCurrency(toNumber(movement.amount), movement.currency)}
              {movement.exchangeRate
                ? ` @ TRM ${formatNumber(toNumber(movement.exchangeRate))}`
                : ''}
            </div>
          )}
        </div>

        <div className="movement-detail__section">
          <h2 className="movement-detail__section-title">Información de la Transacción</h2>
          <div className="movement-detail__info-grid">
            <div className="movement-detail__field">
              <span className="movement-detail__field-label">
                <Calendar className="inline-block w-3 h-3 mr-1 mb-0.5" /> Fecha
              </span>
              <span className="movement-detail__field-value">
                {new Date(movement.date).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="movement-detail__field">
              <span className="movement-detail__field-label">
                <Tag className="inline-block w-3 h-3 mr-1 mb-0.5" /> Categoría
              </span>
              <span className="movement-detail__field-value">
                {movement.category
                  ? typeof movement.category === 'string'
                    ? movement.category
                    : movement.category.name
                  : '-'}
              </span>
            </div>
            <div className="movement-detail__field">
              <span className="movement-detail__field-label">
                <User className="inline-block w-3 h-3 mr-1 mb-0.5" /> Beneficiario / Pagador
              </span>
              <span className="movement-detail__field-value">{movement.beneficiary}</span>
            </div>
            <div className="movement-detail__field">
              <span className="movement-detail__field-label">
                <CreditCard className="inline-block w-3 h-3 mr-1 mb-0.5" /> Canal de Pago
              </span>
              <span className="movement-detail__field-value">{movement.paymentChannel}</span>
            </div>
            <div className="movement-detail__field">
              <span className="movement-detail__field-label">
                <Layers className="inline-block w-3 h-3 mr-1 mb-0.5" /> Centro de Costo
              </span>
              <span className="movement-detail__field-value">
                {movement.costCenter || movement.allocations?.[0]?.costCenter || '-'}
              </span>
            </div>
            {movement.invoiceRef && (
              <div className="movement-detail__field">
                <span className="movement-detail__field-label">
                  <Hash className="inline-block w-3 h-3 mr-1 mb-0.5" /> Ref. Factura
                </span>
                <span className="movement-detail__field-value movement-detail__field-value--mono">
                  {movement.invoiceRef}
                </span>
              </div>
            )}
          </div>
        </div>

        {movement.notes && (
          <div className="movement-detail__section">
            <h2 className="movement-detail__section-title">Notas Adicionales</h2>
            <div className="movement-detail__notes-box">{movement.notes}</div>
          </div>
        )}
      </div>

      <div className="movement-detail__sidebar">
        {movement.items && movement.items.length > 0 && (
          <div className="movement-detail__side-card">
            <h3 className="movement-detail__side-card-title">
              <ShoppingBag /> Desglose de Items
            </h3>
            <div className="movement-detail__items-list">
              {movement.items.map((item, idx) => (
                <div key={idx} className="movement-detail__item-row">
                  <div className="movement-detail__item-row-info">
                    <span className="movement-detail__item-row-name">{item.description}</span>
                    <span className="movement-detail__item-row-details">
                      {formatNumber(toNumber(item.quantity))} x {formatCurrency(toNumber(item.unitValue), movement.currency)}
                    </span>
                  </div>
                  <div className="movement-detail__item-row-total">
                    {formatCurrency(toNumber(item.total), movement.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {movement.debtId && typeof movement.debtId === 'object' && (
          <div className="movement-detail__side-card">
            <h3 className="movement-detail__side-card-title">
              <Wallet /> Deuda Relacionada
            </h3>
            <div
              className="movement-detail__link-card"
              onClick={() =>
                router.push(
                  `/dashboard/debts/entity/${(movement.debtId as unknown as IDebt)._id}`
                )
              }
              style={{ cursor: 'pointer' }}
            >
              <div className="movement-detail__link-card-content">
                <span className="movement-detail__link-card-title">
                  {(movement.debtId as unknown as IDebt).source?.reference || 'Documento de Deuda'}
                </span>
                <span className="movement-detail__link-card-subtitle">
                  Haga clic para ver detalles de la obligación
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-primary opacity-50" />
            </div>
          </div>
        )}

        {movement.inventoryMovementId && (
          <div className="movement-detail__side-card">
            <h3 className="movement-detail__side-card-title">
              <Package /> Inventario
            </h3>
            <div
              className="movement-detail__link-card"
              onClick={() => router.push('/dashboard/inventory')}
              style={{ cursor: 'pointer' }}
            >
              <div className="movement-detail__link-card-content">
                <span className="movement-detail__link-card-title">Gestión de Stock</span>
                <span className="movement-detail__link-card-subtitle">
                  Este movimiento afectó el inventario de libros
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-primary opacity-50" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MovementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(ModuleName.FINANCE, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.FINANCE, PermissionAction.DELETE);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchMovement = async () => {
      try {
        const res = await fetch(`/api/finance/movements/${params.id}`);
        if (!res.ok) throw new Error('No se encontró el movimiento');
        const data = await res.json();
        setMovement(data.data);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el movimiento',
          variant: 'destructive',
        });
        router.push('/dashboard/movements');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchMovement();
  }, [params.id, router, toast]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/finance/movements/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('No se pudo eliminar el movimiento');

      toast({
        title: 'Movimiento eliminado',
        description: 'El movimiento ha sido eliminado exitosamente',
      });

      if (
        typeof window !== 'undefined' &&
        document.referrer &&
        document.referrer.includes(window.location.origin) &&
        !document.referrer.includes(params.id as string)
      ) {
        router.back();
      } else {
        router.push('/dashboard/movements');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el movimiento',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  if (loading) return <div className="movement-detail__loading">Preparando vista premium...</div>;
  if (!movement) return <div className="movement-detail__error">Movimiento no encontrado</div>;

  return (
    <div className="movement-detail">
      <Button variant="ghost" onClick={() => router.back()} className="movement-detail__back-btn">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Listado
      </Button>

      <MovementDetailHeader
        movement={movement}
        deleting={deleting}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onDelete={handleDelete}
        onEdit={() => router.push(`/dashboard/movements/${movement._id}/editar`)}
      />

      <MovementDetailContent movement={movement} router={router} />
    </div>
  );
}
