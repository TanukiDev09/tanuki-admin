'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Pencil, Trash2, Package, ExternalLink } from 'lucide-react';

import { Movement } from '@/types/movement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
  onEdit
}: HeaderProps) {
  return (
    <div className="movement-detail__header">
      <div className="movement-detail__title-group">
        <h1 className="movement-detail__title">Detalle de Movimiento</h1>
        <Badge variant="outline" className="movement-detail__status-badge">
          {movement.status || 'COMPLETED'}
        </Badge>
      </div>
      <div className="movement-detail__actions">
        {canDelete && (
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={deleting}
            className="movement-detail__delete-btn"
          >
            <Trash2 className="movement-detail__icon" />
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
        {canUpdate && (
          <Button onClick={onEdit}>
            <Pencil className="movement-detail__icon" />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}

function MovementDetailContent({ movement, router }: { movement: Movement; router: AppRouterInstance }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{movement.description}</CardTitle>
        <p className="movement-detail__date">
          {new Date(movement.date).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="movement-detail__content">
        <div className="movement-detail__grid-2">
          <div>
            <h3 className="movement-detail__label">Tipo</h3>
            <p
              className={
                movement.type === 'INCOME'
                  ? 'movement-detail__value--income'
                  : 'movement-detail__value--expense'
              }
            >
              {movement.type === 'INCOME' ? 'INGRESO' : 'EGRESO'}
            </p>
          </div>
          <div>
            <h3 className="movement-detail__label">Monto (COP)</h3>
            <p className="movement-detail__value--xl">
              {formatCurrency(
                toNumber(movement.amountInCOP || movement.amount),
                'COP'
              )}
            </p>
            {movement.currency !== 'COP' && (
              <p className="movement-detail__amount-hint">
                Original:{' '}
                {formatCurrency(toNumber(movement.amount), movement.currency)}
                {movement.exchangeRate
                  ? ` @ TRM ${formatNumber(toNumber(movement.exchangeRate))}`
                  : ''}
              </p>
            )}
          </div>
        </div>

        <div className="movement-detail__grid-3">
          <div>
            <h3 className="movement-detail__label">Unidad</h3>
            <p>{movement.unit || '-'}</p>
          </div>
          <div>
            <h3 className="movement-detail__label">Cantidad</h3>
            <p>
              {movement.quantity
                ? formatNumber(toNumber(movement.quantity))
                : '-'}
            </p>
          </div>
          <div>
            <h3 className="movement-detail__label">Valor Unitario</h3>
            <p>
              {movement.unitValue
                ? formatCurrency(
                  toNumber(movement.unitValue),
                  movement.currency
                )
                : '-'}
            </p>
          </div>
        </div>

        <div className="movement-detail__grid-2">
          <div>
            <h3 className="movement-detail__label">Categoría</h3>
            <p>
              {movement.category
                ? typeof movement.category === 'string'
                  ? movement.category
                  : movement.category.name
                : '-'}
            </p>
          </div>
          <div>
            <h3 className="movement-detail__label">Centro de Costo</h3>
            {movement.allocations && movement.allocations.length > 1 ? (
              <div className="movement-detail__allocation-list">
                <table className="movement-detail__allocation-table">
                  <thead>
                    <tr>
                      <th>Centro</th>
                      <th className="text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movement.allocations.map((alloc, idx) => (
                      <tr key={idx}>
                        <td>{alloc.costCenter}</td>
                        <td className="movement-detail__allocation-amount">
                          {formatCurrency(
                            toNumber(alloc.amount),
                            movement.currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                {movement.costCenter ||
                  movement.allocations?.[0]?.costCenter ||
                  '-'}
              </p>
            )}
          </div>
        </div>

        <div className="movement-detail__grid-2">
          <div>
            <h3 className="movement-detail__label">Beneficiario / Pagador</h3>
            <p>{movement.beneficiary}</p>
          </div>
          <div>
            <h3 className="movement-detail__label">Canal de Pago</h3>
            <p>{movement.paymentChannel}</p>
          </div>
        </div>

        <div>
          <h3 className="movement-detail__label">Notas</h3>
          <p className="movement-detail__notes">
            {movement.notes || 'Sin notas adicionales.'}
          </p>
        </div>

        {movement.invoiceRef && (
          <div>
            <h3 className="movement-detail__label">Referencia Factura</h3>
            <p>{movement.invoiceRef}</p>
          </div>
        )}

        {movement.inventoryMovementId && (
          <div className="movement-detail__link-section">
            <h3 className="movement-detail__link-title">
              <Package className="movement-detail__icon" /> Movimiento de
              Inventario Vinculado
            </h3>
            <div className="movement-detail__link-card">
              <div className="movement-detail__link-text">
                <strong>Relacionado con Control de Stock</strong>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/inventory')}
              >
                <ExternalLink className="movement-detail__icon" /> Ir a
                Inventario
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
    if (!window.confirm('¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.')) {
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

      // Smart navigation: go back if we came from another internal page, otherwise go to default list
      if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.origin) && !document.referrer.includes(params.id as string)) {
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

  if (loading)
    return <div className="movement-detail__loading">Cargando...</div>;
  if (!movement)
    return (
      <div className="movement-detail__error">Movimiento no encontrado</div>
    );

  return (
    <div className="movement-detail">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="movement-detail__back-btn"
      >
        <ArrowLeft className="movement-detail__icon" />
        Volver
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
