'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePermission } from '@/hooks/usePermissions';
import { usePersistentFilters } from '@/hooks/usePersistentFilters';
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
import { toNumber } from '@/lib/math';
import { MovementFilters } from './components/MovementFilters';
import { getSemanticCategoryColor } from '@/styles/category-utils';
import './movements-list.scss';

function firstCC(cc: unknown): string {
  if (!cc) return '';
  if (Array.isArray(cc)) return cc[0] ?? '';
  return String(cc);
}

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
        channelLabel = `Librería: ${
          movement.pointOfSale && typeof movement.pointOfSale === 'object'
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
      case 'WEB':
        channelLabel = 'Web';
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
                backgroundColor: getSemanticCategoryColor(
                  movement.type,
                  movement.category.color,
                  movement.category._id
                ),
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
        {(movement.allocations && movement.allocations.length > 1) ||
        (movement.items && movement.items.length > 1) ? (
          <Badge variant="secondary" className="opacity-80">
            Múltiple (
            {movement.allocations?.length || 0 || movement.items?.length || 0})
          </Badge>
        ) : (
          firstCC(movement.costCenter) ||
          firstCC(movement.allocations?.[0]?.costCenter) ||
          firstCC(movement.items?.[0]?.costCenter) || (
            <span className="movements-list__no-category">Sin definir</span>
          )
        )}
      </TableCell>
      <TableCell data-label="Monto">
        <div className="flex flex-col items-end">
          <span
            className={`movements-list__amount ${
              movement.type === 'INCOME'
                ? 'movements-list__amount--income'
                : 'movements-list__amount--expense'
            }`}
          >
            {movement.type === 'INCOME' ? '+' : '-'}
            {formatCurrency(
              toNumber(movement.amountInCOP || movement.amount),
              'COP'
            )}
          </span>
          {movement.currency !== 'COP' && (
            <span className="movements-list__secondary-amount">
              {' ('}
              {formatCurrency(
                toNumber(movement.amount),
                movement.currency
              ).trim()}
              {')'}
            </span>
          )}
        </div>
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

  const {
    filters,
    updateFilters,
    clearFilters: resetAllFilters,
    hasInitializedRef,
  } = usePersistentFilters({
    key: 'movements_filters',
    initialFilters: {
      search: '',
      type: 'ALL',
      category: 'ALL',
      costCenter: 'ALL',
      minAmount: '' as string | number | undefined,
      maxAmount: '' as string | number | undefined,
      unit: 'ALL',
      minQuantity: '' as string | number | undefined,
      maxQuantity: '' as string | number | undefined,
      quantityUndefined: false,
      paymentChannel: 'ALL',
      salesChannel: 'ALL',
      startDate: '',
      endDate: '',
      sortOrder: 'newest',
      page: 1,
      showAdvanced: false,
    },
  });

  const {
    search,
    type: typeFilter,
    category: categoryFilter,
    costCenter: costCenterFilter,
    minAmount,
    maxAmount,
    unit: unitFilter,
    minQuantity,
    maxQuantity,
    quantityUndefined,
    paymentChannel: paymentChannelFilter,
    salesChannel: salesChannelFilter,
    startDate,
    endDate,
    sortOrder,
    page,
    showAdvanced: showAdvancedFilters,
  } = filters;

  const setShowAdvancedFilters = useCallback(
    (val: boolean) => updateFilters({ showAdvanced: val }),
    [updateFilters]
  );
  const setSearch = useCallback(
    (val: string) => updateFilters({ search: val }),
    [updateFilters]
  );
  const setTypeFilter = useCallback(
    (val: string) => updateFilters({ type: val }),
    [updateFilters]
  );
  const setCategoryFilter = useCallback(
    (val: string) => updateFilters({ category: val }),
    [updateFilters]
  );
  const setCostCenterFilter = useCallback(
    (val: string) => updateFilters({ costCenter: val }),
    [updateFilters]
  );
  const setMinAmount = useCallback(
    (val: string | number | undefined) => updateFilters({ minAmount: val }),
    [updateFilters]
  );
  const setMaxAmount = useCallback(
    (val: string | number | undefined) => updateFilters({ maxAmount: val }),
    [updateFilters]
  );
  const setUnitFilter = useCallback(
    (val: string) => updateFilters({ unit: val }),
    [updateFilters]
  );
  const setMinQuantity = useCallback(
    (val: string | number | undefined) => updateFilters({ minQuantity: val }),
    [updateFilters]
  );
  const setMaxQuantity = useCallback(
    (val: string | number | undefined) => updateFilters({ maxQuantity: val }),
    [updateFilters]
  );
  const setQuantityUndefined = useCallback(
    (val: boolean) => updateFilters({ quantityUndefined: val }),
    [updateFilters]
  );
  const setPaymentChannelFilter = useCallback(
    (val: string) => updateFilters({ paymentChannel: val }),
    [updateFilters]
  );
  const setSalesChannelFilter = useCallback(
    (val: string) => updateFilters({ salesChannel: val }),
    [updateFilters]
  );
  const setStartDate = useCallback(
    (val: string) => updateFilters({ startDate: val }),
    [updateFilters]
  );
  const setEndDate = useCallback(
    (val: string) => updateFilters({ endDate: val }),
    [updateFilters]
  );
  const setSortOrder = useCallback(
    (val: string) => updateFilters({ sortOrder: val }),
    [updateFilters]
  );
  const setPage = useCallback(
    (val: number) => updateFilters({ page: val }),
    [updateFilters]
  );

  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [availablePaymentChannels, setAvailablePaymentChannels] = useState<
    string[]
  >([]);
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
      const normalize = (val: string) => (val !== 'ALL' ? val : '');

      const queryParams: Record<string, string> = {
        search,
        type: normalize(typeFilter),
        category: normalize(categoryFilter),
        costCenter: normalize(costCenterFilter),
        paymentChannel: normalize(paymentChannelFilter),
        salesChannel: normalize(salesChannelFilter),
        minAmount: minAmount?.toString() || '',
        maxAmount: maxAmount?.toString() || '',
        unit: normalize(unitFilter),
        startDate,
        endDate,
        sort: sortOrder,
        page: page.toString(),
        limit: limit.toString(),
        minQuantity: quantityUndefined
          ? '__UNDEFINED__'
          : minQuantity?.toString() || '',
        maxQuantity: quantityUndefined ? '' : maxQuantity?.toString() || '',
      };

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

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
    resetAllFilters();
  };

  // Reset to first page when filters change
  useEffect(() => {
    if (!hasInitializedRef.current) {
      return;
    }
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
    setPage,
    hasInitializedRef,
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
              onClick={() => setPage(Math.max(1, page - 1))}
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
              onClick={() => setPage(Math.min(totalPages, page + 1))}
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
