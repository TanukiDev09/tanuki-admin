'use client';

import { useState } from 'react';
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
import { PointOfSaleStatusBadge } from './PointOfSaleStatusBadge';
import { IPointOfSale } from '@/models/PointOfSale';
import { Trash2, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import './PointOfSaleList.scss';

interface PointOfSaleListProps {
  data: IPointOfSale[];
}

export function PointOfSaleList({ data }: PointOfSaleListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { hasPermission } = usePermission();
  const canDelete = hasPermission(
    ModuleName.POINTS_OF_SALE,
    PermissionAction.DELETE
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  // Get unique cities for the dropdown
  const cities = Array.from(
    new Set(data.map((pos) => pos.city).filter(Boolean))
  ) as string[];

  const filteredData = data.filter((pos) => {
    const matchesSearch =
      pos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pos.address &&
        pos.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = cityFilter === 'all' || pos.city === cityFilter;

    return matchesSearch && matchesCity;
  });

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
    if (!items || items.length === 0)
      return <span className="pos-list__empty-text">-</span>;

    // Legacy support for single string
    if (typeof items === 'string') return items;

    // Filter out empty strings
    const validItems = items.filter((i) => i && i.trim() !== '');

    if (validItems.length === 0)
      return <span className="pos-list__empty-text">-</span>;

    const firstItem = validItems[0];
    const count = validItems.length;

    if (count === 1) return firstItem;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <span className="pos-list__expand-trigger">
            {firstItem}{' '}
            <span className="pos-list__expand-count">(+{count - 1})</span>
          </span>
        </PopoverTrigger>
        <PopoverContent className="pos-list__popover-content">
          <ul className="pos-list__popover-list">
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
      <div className="pos-list__filters">
        <div className="pos-list__search">
          <Search className="pos-list__search-icon" />
          <Input
            placeholder="Buscar por nombre, código o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pos-list__search-input"
          />
        </div>
        <div className="pos-list__city-filter">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="pos-list__city-trigger">
              <SelectValue placeholder="Filtrar por ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.sort().map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pos-list__container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Encargado</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="pos-list__actions-cell">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="pos-list__empty-cell">
                  {data.length === 0
                    ? 'No hay puntos de venta registrados.'
                    : 'No se encontraron resultados para los filtros aplicados.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((pos) => (
                <TableRow key={pos._id as unknown as string}>
                  <TableCell className="pos-list__code-cell">
                    {pos.code}
                    {pos.identificationNumber && (
                      <div className="pos-list__identification">
                        {pos.identificationType} {pos.identificationNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{pos.name}</TableCell>
                  <TableCell className="pos-list__type-cell">
                    {pos.type === 'physical'
                      ? 'Físico'
                      : pos.type === 'online'
                        ? 'Online'
                        : 'Evento'}
                  </TableCell>
                  <TableCell>
                    {pos.discountPercentage
                      ? `${pos.discountPercentage}%`
                      : '0%'}
                  </TableCell>
                  <TableCell>{renderArrayCell(pos.managers)}</TableCell>
                  <TableCell>{renderArrayCell(pos.phones)}</TableCell>
                  <TableCell>{renderArrayCell(pos.emails)}</TableCell>
                  <TableCell>
                    <PointOfSaleStatusBadge status={pos.status} />
                  </TableCell>
                  <TableCell className="pos-list__actions-cell">
                    <div className="pos-list__actions-group">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/points-of-sale/${pos._id}`}>
                          <Eye className="pos-list__icon" />
                        </Link>
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="pos-list__delete-btn"
                          onClick={() =>
                            setItemToDelete({
                              id: pos._id as unknown as string,
                              name: pos.name,
                            })
                          }
                          disabled={
                            deletingId === (pos._id as unknown as string)
                          }
                        >
                          <Trash2 className="pos-list__icon" />
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

      <Dialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              punto de venta{' '}
              {itemToDelete?.name ? `&quot;${itemToDelete.name}&quot;` : ''}.
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
