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
import {
  Plus,
  Package,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Movement } from '@/types/movement';
import { formatCurrency } from '@/lib/utils';
import { MovementFilters } from './components/MovementFilters';
import './movements-list.scss';

interface MovementTableRowProps {
  movement: Movement;
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

const MovementTableRow = ({
  movement,
  canUpdate,
  canDelete,
  onDelete,
  onEdit,
  onView,
}: MovementTableRowProps) => {
  const renderSalesChannel = () => {
    if (!movement.salesChannel) {
      return <span className="movements-list__no-category">-</span>;
    }

    let channelLabel = '';
    switch (movement.salesChannel) {
      case 'LIBRERIA':
        channelLabel = `Librería: ${typeof movement.pointOfSale === 'object'
            ? movement.pointOfSale.name
            : 'Varios'
          }`;
        break;
      case 'DIRECTA':
        channelLabel = 'Directa';
        break;
      case 'FERIA':
        channelLabel = 'Feria';
        break;
      default:
        channelLabel = 'Otro';
    }

    return <Badge variant="outline">{channelLabel}</Badge>;
  };

  return (
    <TableRow key={movement._id}>
      <TableCell data-label="Fecha">
        {new Date(movement.date).toLocaleDateString('es-CO', {
          timeZone: 'UTC',
        })}
      </TableCell>
      <TableCell
        data-label="Descripción"
        className="movements-list__description-link"
      >
        <a
          href={`/dashboard/movements/${movement._id}`}
          className="movements-list__link"
        >
          {movement.description}
        </a>
        {movement.inventoryMovementId && (
          <Package className="w-3 h-3 ml-2 inline text-primary opacity-70" />
        )}
      </TableCell>

      <TableCell data-label="Tipo">
        <Badge variant={movement.type === 'INCOME' ? 'default' : 'destructive'}>
          {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
        </Badge>
      </TableCell>
      <TableCell data-label="Categoría">
        {movement.category ? (
          typeof movement.category === 'string' ? (
            <Badge>{movement.category}</Badge>
          ) : (
            <Badge
              style={{
                backgroundColor: movement.category.color || '#64748b',
                color: '#fff',
                borderColor: 'transparent',
              }}
            >
              {movement.category.name}
            </Badge>
          )
        ) : (
          <span className="movements-list__no-category">Sin categoría</span>
        )}
      </TableCell>
      <TableCell data-label="Centro Costo">
        {movement.allocations && movement.allocations.length > 1 ? (
          <Badge variant="secondary" className="opacity-80">
            Múltiple ({movement.allocations.length})
          </Badge>
        ) : (
          movement.costCenter ||
          movement.allocations?.[0]?.costCenter || (
            <span className="movements-list__no-category">Sin definir</span>
          )
        )}
      </TableCell>
      <TableCell data-label="Monto">
        <span
          className={`movements-list__amount ${movement.type === 'INCOME'
              ? 'movements-list__amount--income'
              : 'movements-list__amount--expense'
            }`}
        >
          {movement.type === 'INCOME' ? '+' : '-'}
          {formatCurrency(movement.amount)}
        </span>
      </TableCell>
      <TableCell data-label="Canal">{renderSalesChannel()}</TableCell>
      <TableCell data-label="Cantidad">
        {movement.quantity ? (
          <span className="movements-list__quantity">
            {movement.quantity}{' '}
            {movement.unit && (
              <span className="movements-list__unit">{movement.unit}</span>
            )}
          </span>
        ) : (
          <span className="movements-list__no-category">-</span>
        )}
      </TableCell>
      <TableCell className="movements-list__actions-cell">
        <div className="movements-list__actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(movement._id)}
            title="Ver detalle"
          >
            <Eye className="movements-list__icon-sm" />
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(movement._id)}
              title="Editar"
            >
              <Pencil className="movements-list__icon-sm" />
            </Button>
          )}

          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(movement._id)}
              className="movements-list__delete-btn"
              title="Eliminar"
            >
              <Trash2 className="movements-list__icon-sm" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function MovementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [costCenterFilter, setCostCenterFilter] = useState('ALL');
  const [minAmount, setMinAmount] = useState<string | number | undefined>('');
  const [maxAmount, setMaxAmount] = useState<string | number | undefined>('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [minQuantity, setMinQuantity] = useState<string | number | undefined>(
    ''
  );
  const [maxQuantity, setMaxQuantity] = useState<string | number | undefined>(
    ''
  );
  const [quantityUndefined, setQuantityUndefined] = useState(false);
  const [paymentChannelFilter, setPaymentChannelFilter] = useState('ALL');
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [availablePaymentChannels, setAvailablePaymentChannels] = useState<
    string[]
  >([]);
  const [salesChannelFilter, setSalesChannelFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 10;
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.FINANCE, PermissionAction.CREATE);
  const canUpdate = hasPermission(ModuleName.FINANCE, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.FINANCE, PermissionAction.DELETE);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const addParam = (
        key: string,
        value: string | undefined | null,
        condition = true
      ) => {
        if (value && condition) params.append(key, value.toString());
      };

      addParam('search', search);
      addParam('type', typeFilter, typeFilter !== 'ALL');
      addParam('category', categoryFilter, categoryFilter !== 'ALL');
      addParam('costCenter', costCenterFilter, costCenterFilter !== 'ALL');
      addParam(
        'paymentChannel',
        paymentChannelFilter,
        paymentChannelFilter !== 'ALL'
      );
      addParam(
        'salesChannel',
        salesChannelFilter,
        salesChannelFilter !== 'ALL'
      );
      addParam('minAmount', minAmount?.toString());
      addParam('maxAmount', maxAmount?.toString());
      addParam('unit', unitFilter, unitFilter !== 'ALL');
      addParam('startDate', startDate);
      addParam('endDate', endDate);
      addParam('sort', sortOrder);
      addParam('page', page.toString());
      addParam('limit', limit.toString());

      if (quantityUndefined) {
        params.append('minQuantity', '__UNDEFINED__');
      } else {
        addParam('minQuantity', minQuantity?.toString());
        addParam('maxQuantity', maxQuantity?.toString());
      }

      const res = await fetch(`/api/finance/movements?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar movimientos');
      const data = await res.json();
      setMovements(data.data || []);
      setTotalPages(data.meta?.total_pages || 1);
      setTotalResults(data.meta?.total || 0);
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
  }, [
    search,
    typeFilter,
    categoryFilter,
    costCenterFilter,
    paymentChannelFilter,
    minAmount,
    maxAmount,
    unitFilter,
    minQuantity,
    maxQuantity,
    startDate,
    endDate,
    salesChannelFilter,
    toast,
    quantityUndefined,
    sortOrder,
    page,
    limit,
  ]);

  const fetchUnitsAndChannels = useCallback(async () => {
    try {
      const [unitsRes, channelsRes] = await Promise.all([
        fetch('/api/finance/movements?distinct=unit'),
        fetch('/api/finance/movements?distinct=paymentChannel'),
      ]);

      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setAvailableUnits(data.data || []);
      }
      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setAvailablePaymentChannels(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar filtros dinámicos:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnitsAndChannels();
  }, [fetchUnitsAndChannels]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovements();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchMovements]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setCostCenterFilter('ALL');
    setPaymentChannelFilter('ALL');
    setSalesChannelFilter('ALL');
    setMinAmount('');
    setMaxAmount('');
    setUnitFilter('ALL');
    setMinQuantity('');
    setMaxQuantity('');
    setQuantityUndefined(false);
    setStartDate('');
    setEndDate('');
    setSortOrder('newest');
    setPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    search,
    typeFilter,
    categoryFilter,
    costCenterFilter,
    paymentChannelFilter,
    minAmount,
    maxAmount,
    unitFilter,
    minQuantity,
    maxQuantity,
    startDate,
    endDate,
    quantityUndefined,
    sortOrder,
  ]);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.'
      )
    ) {
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
        <MovementFilters
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          search={search}
          setSearch={setSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          costCenterFilter={costCenterFilter}
          setCostCenterFilter={setCostCenterFilter}
          paymentChannelFilter={paymentChannelFilter}
          setPaymentChannelFilter={setPaymentChannelFilter}
          salesChannelFilter={salesChannelFilter}
          setSalesChannelFilter={setSalesChannelFilter}
          minAmount={minAmount}
          setMinAmount={setMinAmount}
          maxAmount={maxAmount}
          setMaxAmount={setMaxAmount}
          unitFilter={unitFilter}
          setUnitFilter={setUnitFilter}
          minQuantity={minQuantity}
          setMinQuantity={setMinQuantity}
          maxQuantity={maxQuantity}
          setMaxQuantity={setMaxQuantity}
          quantityUndefined={quantityUndefined}
          setQuantityUndefined={setQuantityUndefined}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          clearFilters={clearFilters}
          availablePaymentChannels={availablePaymentChannels}
          availableUnits={availableUnits}
        />

        <div className="movements-list__table-wrapper">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Centro Costo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="movements-list__th-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="movements-list__loading-row"
                  >
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="movements-list__empty-row">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <MovementTableRow
                    key={movement._id}
                    movement={movement}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onDelete={handleDelete}
                    onEdit={(id) =>
                      router.push(`/dashboard/movements/${id}/editar`)
                    }
                    onView={(id) => router.push(`/dashboard/movements/${id}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="movements-list__pagination">
          <div className="movements-list__pagination-info">
            Mostrando <strong>{movements.length}</strong> de{' '}
            <strong>{totalResults}</strong> resultados
          </div>
          <div className="movements-list__pagination-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="movements-list__pagination-btn"
            >
              <ChevronLeft className="movements-list__icon-xs" />
              Anterior
            </Button>
            <div className="movements-list__pagination-current">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="movements-list__pagination-btn"
            >
              Siguiente
              <ChevronRight className="movements-list__icon-xs" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
