'use client';

import { useState } from 'react';
import './WarehouseList.scss';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { WarehouseTypeBadge } from './WarehouseTypeBadge';
import { Trash2, Eye, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface Warehouse {
  _id: string;
  code: string;
  name: string;
  type: 'editorial' | 'pos' | 'general';
  pointOfSaleId?: {
    _id: string;
    name: string;
    code: string;
  };
  city?: string;
  status: 'active' | 'inactive';
}

interface WarehouseListProps {
  data: Warehouse[];
  onAssociateClick?: (warehouseId: string) => void;
}

export function WarehouseList({ data, onAssociateClick }: WarehouseListProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const { hasPermission } = usePermission();
  const canDelete = hasPermission(ModuleName.WAREHOUSES, PermissionAction.DELETE);
  const canUpdate = hasPermission(ModuleName.WAREHOUSES, PermissionAction.UPDATE);

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeletingId(itemToDelete.id);
      const response = await fetch(`/api/warehouses/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar');
      }

      toast({
        title: 'Éxito',
        description: 'Bodega eliminada correctamente',
      });
      router.refresh();
      setItemToDelete(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('No se pudo eliminar la bodega');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="warehouse-list">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Punto de Venta</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="warehouse-list__header-cell--right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="warehouse-list__empty">
                  No hay bodegas registradas.
                </TableCell>
              </TableRow>
            ) : (
              data.map((warehouse) => (
                <TableRow key={warehouse._id}>
                  <TableCell className="warehouse-list__code">
                    {warehouse.code}
                  </TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>
                    <WarehouseTypeBadge type={warehouse.type} />
                  </TableCell>
                  <TableCell>
                    {warehouse.pointOfSaleId ? (
                      <Link
                        href={`/dashboard/points-of-sale/${warehouse.pointOfSaleId._id}`}
                        className="warehouse-list__link"
                      >
                        {warehouse.pointOfSaleId.name}
                      </Link>
                    ) : (
                      <span className="warehouse-list__link--placeholder">Sin asociar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warehouse.city || (
                      <span className="warehouse-list__link--placeholder">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <WarehouseStatusBadge status={warehouse.status} />
                  </TableCell>
                  <TableCell className="warehouse-list__cell--right">
                    <div className="warehouse-list__actions">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/warehouses/${warehouse._id}`}>
                          <Eye className="warehouse-list__icon" />
                        </Link>
                      </Button>
                      {onAssociateClick && canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onAssociateClick(warehouse._id)}
                          title="Asociar punto de venta"
                        >
                          <LinkIcon className="warehouse-list__icon" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="warehouse-list__action-btn--delete"
                          onClick={() => setItemToDelete({ id: warehouse._id, name: warehouse.name })}
                          disabled={deletingId === warehouse._id}
                        >
                          <Trash2 className="warehouse-list__icon" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la bodega {itemToDelete?.name ? `&quot;${itemToDelete.name}&quot;` : ""}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
