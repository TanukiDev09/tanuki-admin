'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { Eye, Plus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Movement } from '@/types/movement';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import './movements-list.scss';

export default function MovementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.FINANCE, PermissionAction.CREATE);
  const canUpdate = hasPermission(ModuleName.FINANCE, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.FINANCE, PermissionAction.DELETE);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/finance/movements?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar movimientos');
      const data = await res.json();
      setMovements(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, startDate, endDate, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovements();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchMovements]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/movements/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Movimiento eliminado correctamente',
      });
      fetchMovements();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el movimiento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="movements-list">
      <div className="movements-list__container">
        <div className="movements-list__header">
          <h1 className="movements-list__title">Movimientos Financieros</h1>
          {canCreate && (
            <Button onClick={() => router.push('/dashboard/movements/crear')}>
              <Plus className="movements-list__icon" />
              Nuevo Movimiento
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="movements-list__filters">
          <div className="movements-list__filters-row">
            <div className="movements-list__search-wrapper">
              <label className="movements-list__label">Búsqueda</label>
              <Input
                type="text"
                placeholder="Buscar por descripción, categoría, beneficiario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="movements-list__input"
              />
            </div>
            <div className="movements-list__type-wrapper">
              <label className="movements-list__label">Tipo</label>
              <select
                className="movements-list__select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Egresos</option>
              </select>
            </div>
          </div>

          <div className="movements-list__filters-row movements-list__filters-row--bottom">
            <div className="movements-list__date-wrapper">
              <label className="movements-list__label">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="movements-list__input"
              />
            </div>
            <div className="movements-list__date-wrapper">
              <label className="movements-list__label">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="movements-list__input"
              />
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="movements-list__clear-btn"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>

        <div className="movements-list__table-wrapper">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="movements-list__th-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="movements-list__loading-row">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="movements-list__empty-row">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell>
                      {new Date(movement.date).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell className="movements-list__description-link">
                      <a href={`/dashboard/movements/${movement._id}`} className="movements-list__link">
                        {movement.description}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'INCOME' ? 'default' : 'destructive'}>
                        {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.category
                        ? (typeof movement.category === 'string' ? movement.category : movement.category.name)
                        : <span className="movements-list__no-category">Sin categoría</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`movements-list__amount ${movement.type === 'INCOME' ? 'movements-list__amount--income' : 'movements-list__amount--expense'}`}>
                        {movement.type === 'INCOME' ? '+' : '-'}{formatCurrency(movement.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.status && <Badge variant="outline">{movement.status}</Badge>}
                    </TableCell>
                    <TableCell className="movements-list__actions-cell">
                      <div className="movements-list__actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/movements/${movement._id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="movements-list__icon-sm" />
                        </Button>
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/movements/${movement._id}/editar`)}
                            title="Editar"
                          >
                            <Pencil className="movements-list__icon-sm" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(movement._id)}
                            className="movements-list__delete-btn"
                            title="Eliminar"
                          >
                            <Trash2 className="movements-list__icon-sm" />
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
      </div>

    </div>
  );
}
