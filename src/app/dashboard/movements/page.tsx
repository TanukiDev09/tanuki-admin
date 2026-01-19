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
import { CategorySelect } from '@/components/finance/CategorySelect';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { useToast } from '@/components/ui/Toast';
import { Movement } from '@/types/movement';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';
import './movements-list.scss';

export default function MovementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.FINANCE, PermissionAction.CREATE);
  const canUpdate = hasPermission(ModuleName.FINANCE, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.FINANCE, PermissionAction.DELETE);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const addParam = (key: string, value: string | undefined | null, condition = true) => {
        if (value && condition) params.append(key, value.toString());
      };

      addParam('search', search);
      addParam('type', typeFilter, typeFilter !== 'ALL');
      addParam('category', categoryFilter, categoryFilter !== 'ALL');
      addParam('costCenter', costCenterFilter, costCenterFilter !== 'ALL');
      addParam('paymentChannel', paymentChannelFilter, paymentChannelFilter !== 'ALL');
      addParam('minAmount', minAmount?.toString());
      addParam('maxAmount', maxAmount?.toString());
      addParam('unit', unitFilter, unitFilter !== 'ALL');
      addParam('startDate', startDate);
      addParam('endDate', endDate);
      addParam('sort', sortOrder);

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
    toast,
    quantityUndefined,
    sortOrder,
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
    setMinAmount('');
    setMaxAmount('');
    setUnitFilter('ALL');
    setMinQuantity('');
    setMaxQuantity('');
    setQuantityUndefined(false);
    setStartDate('');
    setEndDate('');
    setSortOrder('newest');
  };

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
        <div className="movements-list__filters">
          <div className="movements-list__filters-row">
            <div className="movements-list__search-wrapper">
              <Label className="movements-list__label">Búsqueda</Label>
              <Input
                type="text"
                placeholder="Descripción, categoría, beneficiario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="movements-list__input"
              />
            </div>
            <div className="movements-list__type-wrapper">
              <Label className="movements-list__label">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="movements-list__select">
                  <SelectValue placeholder="Todos los Tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los Tipos</SelectItem>
                  <SelectItem value="INCOME">Ingresos</SelectItem>
                  <SelectItem value="EXPENSE">Egresos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="movements-list__category-wrapper">
              <Label className="movements-list__label">Categoría</Label>
              <CategorySelect
                value={categoryFilter === 'ALL' ? '' : categoryFilter}
                onValueChange={(val) => setCategoryFilter(val || 'ALL')}
                placeholder="Todas"
                showSearch={true}
                allowNull={true}
                nullLabel="Sin definir"
                allowCreation={false}
                type={
                  typeFilter === 'INCOME'
                    ? 'Ingreso'
                    : typeFilter === 'EXPENSE'
                      ? 'Egreso'
                      : undefined
                }
              />
            </div>
            <div className="movements-list__cost-center-wrapper">
              <Label className="movements-list__label">Centro Costos</Label>
              <CostCenterSelect
                value={costCenterFilter === 'ALL' ? '' : costCenterFilter}
                onValueChange={(val) => setCostCenterFilter(val || 'ALL')}
                allowNull={true}
                nullLabel="Sin definir"
                allowCreation={false}
                hideLabel={true}
              />
            </div>
            <div className="movements-list__payment-channel-wrapper">
              <Label className="movements-list__label">Canal de Pago</Label>
              <Select
                value={paymentChannelFilter}
                onValueChange={setPaymentChannelFilter}
              >
                <SelectTrigger className="movements-list__select">
                  <SelectValue placeholder="Todos los Canales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los Canales</SelectItem>
                  <SelectItem value="__UNDEFINED__">Sin definir (-)</SelectItem>
                  {availablePaymentChannels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="movements-list__filters-row">
            <div className="movements-list__range-group">
              <div className="movements-list__field">
                <Label className="movements-list__label">Monto</Label>
                <div className="movements-list__range-inputs">
                  <NumericInput
                    placeholder="Min 0"
                    value={minAmount}
                    onValueChange={setMinAmount}
                    className="movements-list__input"
                  />
                  <span className="movements-list__range-separator">-</span>
                  <NumericInput
                    placeholder="Máx"
                    value={maxAmount}
                    onValueChange={setMaxAmount}
                    className="movements-list__input"
                  />
                </div>
              </div>
            </div>

            <div className="movements-list__unit-wrapper">
              <Label className="movements-list__label">Unidad</Label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="movements-list__select">
                  <SelectValue placeholder="Todas las Unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las Unidades</SelectItem>
                  <SelectItem value="__UNDEFINED__">Sin definir (-)</SelectItem>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="movements-list__range-group">
              <div className="movements-list__field">
                <div className="movements-list__label-with-action">
                  <Label className="movements-list__label">Cantidad</Label>
                  <label className="movements-list__inline-checkbox">
                    <input
                      type="checkbox"
                      checked={quantityUndefined}
                      onChange={(e) => setQuantityUndefined(e.target.checked)}
                    />
                    <span>Sin definir</span>
                  </label>
                </div>
                <div className="movements-list__range-inputs">
                  <NumericInput
                    placeholder="Min 0"
                    value={minQuantity}
                    onValueChange={setMinQuantity}
                    className="movements-list__input"
                    disabled={quantityUndefined}
                  />
                  <span className="movements-list__range-separator">-</span>
                  <NumericInput
                    placeholder="Máx"
                    value={maxQuantity}
                    onValueChange={setMaxQuantity}
                    className="movements-list__input"
                    disabled={quantityUndefined}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="movements-list__filters-row movements-list__filters-row--bottom">
            <div className="movements-list__date-range">
              <div className="movements-list__field">
                <Label className="movements-list__label">Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="movements-list__input"
                />
              </div>
              <div className="movements-list__field">
                <Label className="movements-list__label">Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="movements-list__input"
                />
              </div>
            </div>

            <div className="movements-list__field movements-list__sort-field">
              <Label className="movements-list__label">Orden</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="movements-list__select">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                </SelectContent>
              </Select>
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
                <TableHead className="movements-list__th-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="movements-list__loading-row"
                  >
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
                      {new Date(movement.date).toLocaleDateString('es-CO', {
                        timeZone: 'UTC',
                      })}
                    </TableCell>
                    <TableCell className="movements-list__description-link">
                      <a
                        href={`/dashboard/movements/${movement._id}`}
                        className="movements-list__link"
                      >
                        {movement.description}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.type === 'INCOME' ? 'default' : 'destructive'
                        }
                      >
                        {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.category ? (
                        typeof movement.category === 'string' ? (
                          movement.category
                        ) : (
                          movement.category.name
                        )
                      ) : (
                        <span className="movements-list__no-category">
                          Sin categoría
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`movements-list__amount ${movement.type === 'INCOME' ? 'movements-list__amount--income' : 'movements-list__amount--expense'}`}
                      >
                        {movement.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(movement.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.status && (
                        <Badge variant="outline">{movement.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="movements-list__actions-cell">
                      <div className="movements-list__actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/dashboard/movements/${movement._id}`)
                          }
                          title="Ver detalle"
                        >
                          <Eye className="movements-list__icon-sm" />
                        </Button>
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/dashboard/movements/${movement._id}/editar`
                              )
                            }
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
