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
import { PointOfSaleStatusBadge } from './PointOfSaleStatusBadge';
import { IPointOfSale } from '@/models/PointOfSale';
import { Trash2, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PointOfSaleListProps {
  data: IPointOfSale[];
}

export function PointOfSaleList({ data }: PointOfSaleListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeletingId(itemToDelete.id);
      const response = await fetch(`/api/points-of-sale/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      toast({
        title: 'Éxito',
        description: 'Punto de venta eliminado correctamente',
      });
      router.refresh();
      setItemToDelete(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el punto de venta',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderArrayCell = (items: string[] | undefined) => {
    if (!items || items.length === 0) return <span className="text-muted-foreground">-</span>;

    // Legacy support for single string
    if (typeof items === 'string') return items;

    // Filter out empty strings
    const validItems = items.filter(i => i && i.trim() !== '');

    if (validItems.length === 0) return <span className="text-muted-foreground">-</span>;

    const firstItem = validItems[0];
    const count = validItems.length;

    if (count === 1) return firstItem;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <span className="cursor-pointer underline decoration-dotted hover:text-primary">
            {firstItem} <span className="text-xs text-muted-foreground">(+{count - 1})</span>
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <ul className="list-disc pl-4 text-sm">
            {validItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
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
              <TableHead>Encargado</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No hay puntos de venta registrados.
                </TableCell>
              </TableRow>
            ) : (
              data.map((pos) => (
                <TableRow key={pos._id as unknown as string}>
                  <TableCell className="font-medium">
                    {pos.code}
                    {pos.identificationNumber && (
                      <div className="text-xs text-muted-foreground">
                        {pos.identificationType} {pos.identificationNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{pos.name}</TableCell>
                  <TableCell className="capitalize">
                    {pos.type === 'physical' ? 'Físico' :
                      pos.type === 'online' ? 'Online' : 'Evento'}
                  </TableCell>
                  <TableCell>{renderArrayCell(pos.managers)}</TableCell>
                  <TableCell>{renderArrayCell(pos.phones)}</TableCell>
                  <TableCell>
                    <PointOfSaleStatusBadge status={pos.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/points-of-sale/${pos._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setItemToDelete({ id: pos._id as unknown as string, name: pos.name })}
                        disabled={deletingId === (pos._id as unknown as string)}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el punto de venta {itemToDelete?.name ? `&quot;${itemToDelete.name}&quot;` : ""}.
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
