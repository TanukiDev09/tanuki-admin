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
import { Trash2, Eye, Link as LinkIcon, Search, X, Filter } from 'lucide-react';
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
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

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
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { hasPermission } = usePermission();
  const canDelete = hasPermission(
    ModuleName.WAREHOUSES,
    PermissionAction.DELETE
  );
  const canUpdate = hasPermission(
    ModuleName.WAREHOUSES,
    PermissionAction.UPDATE
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get unique cities for the dropdown
  const cities = Array.from(
    new Set(data.map((w) => w.city).filter(Boolean))
  ) as string[];

  const filteredData = data.filter((warehouse) => {
    const matchesSearch =
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (warehouse.city &&
        warehouse.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || warehouse.type === typeFilter;
    const matchesCity = cityFilter === 'all' || warehouse.city === cityFilter;
    const matchesStatus =
      statusFilter === 'all' || warehouse.status === statusFilter;

    return matchesSearch && matchesType && matchesCity && matchesStatus;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCityFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    cityFilter !== 'all' ||
    statusFilter !== 'all';

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
      const error =
        err instanceof Error ? err : new Error('No se pudo eliminar la bodega');
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
      <div className="warehouse-list__filter-bar">
        <div className="warehouse-list__filter-header">
          <div className="warehouse-list__filter-title">
            <Filter className="warehouse-list__filter-icon" />
            <span>Filtros de búsqueda</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="warehouse-list__reset-btn"
            >
              <X className="warehouse-list__icon-xs" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="warehouse-list__filters-content">
          <div className="warehouse-list__search-wrapper">
            <Search className="warehouse-list__search-icon" />
            <Input
              placeholder="Buscar por nombre, código o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="warehouse-list__search-input"
            />
          </div>

          <div className="warehouse-list__dropdowns">
            <div className="warehouse-list__filter-group">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="warehouse-list__filter-trigger">
                  <SelectValue placeholder="Tipo de bodega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="editorial">Editorial</SelectItem>
                  <SelectItem value="pos">Punto de Venta</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="warehouse-list__filter-group">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="warehouse-list__filter-trigger">
                  <SelectValue placeholder="Ciudad" />
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

            <div className="warehouse-list__filter-group">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="warehouse-list__filter-trigger">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

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
              <TableHead className="warehouse-list__header-cell--right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="warehouse-list__empty">
                  {data.length === 0
                    ? 'No hay bodegas registradas.'
                    : 'No se encontraron resultados para los filtros aplicados.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((warehouse) => (
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
                      <span className="warehouse-list__link--placeholder">
                        Sin asociar
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warehouse.city || (
                      <span className="warehouse-list__link--placeholder">
                        -
                      </span>
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
                          onClick={() =>
                            setItemToDelete({
                              id: warehouse._id,
                              name: warehouse.name,
                            })
                          }
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

      <Dialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              bodega {itemToDelete?.name ? `"${itemToDelete.name}"` : ''}.
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
