'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { WarehouseTypeBadge } from './WarehouseTypeBadge';
import { Trash2, Eye, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Punto de Venta</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No hay bodegas registradas.
                </TableCell>
              </TableRow>
            ) : (
              data.map((warehouse) => (
                <TableRow key={warehouse._id}>
                  <TableCell className="font-medium">
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
                        className="text-blue-600 hover:underline"
                      >
                        {warehouse.pointOfSaleId.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Sin asociar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warehouse.city || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <WarehouseStatusBadge status={warehouse.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/warehouses/${warehouse._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      {onAssociateClick && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onAssociateClick(warehouse._id)}
                          title="Asociar punto de venta"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setItemToDelete({ id: warehouse._id, name: warehouse.name })}
                        disabled={deletingId === warehouse._id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
