'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Filter, X } from 'lucide-react';
import { CategorySelect } from '@/components/finance/CategorySelect';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';

interface MovementFiltersProps {
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  search: string;
  setSearch: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  costCenterFilter: string;
  setCostCenterFilter: (val: string) => void;
  paymentChannelFilter: string;
  setPaymentChannelFilter: (val: string) => void;
  salesChannelFilter: string;
  setSalesChannelFilter: (val: string) => void;
  minAmount: string | number | undefined;
  setMinAmount: (val: string | number | undefined) => void;
  maxAmount: string | number | undefined;
  setMaxAmount: (val: string | number | undefined) => void;
  unitFilter: string;
  setUnitFilter: (val: string) => void;
  minQuantity: string | number | undefined;
  setMinQuantity: (val: string | number | undefined) => void;
  maxQuantity: string | number | undefined;
  setMaxQuantity: (val: string | number | undefined) => void;
  quantityUndefined: boolean;
  setQuantityUndefined: (val: boolean) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  sortOrder: string;
  setSortOrder: (val: string) => void;
  clearFilters: () => void;
  availablePaymentChannels: string[];
  availableUnits: string[];
}

export function MovementFilters({
  showAdvancedFilters,
  setShowAdvancedFilters,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  costCenterFilter,
  setCostCenterFilter,
  paymentChannelFilter,
  setPaymentChannelFilter,
  salesChannelFilter,
  setSalesChannelFilter,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  unitFilter,
  setUnitFilter,
  minQuantity,
  setMinQuantity,
  maxQuantity,
  setMaxQuantity,
  quantityUndefined,
  setQuantityUndefined,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sortOrder,
  setSortOrder,
  clearFilters,
  availablePaymentChannels,
  availableUnits,
}: MovementFiltersProps) {
  return (
    <div
      className={`movements-list__filters ${showAdvancedFilters ? 'movements-list__filters--expanded' : ''}`}
    >
      <div className="movements-list__filters-primary">
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
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="movements-list__toggle-filters"
        >
          {showAdvancedFilters ? (
            <X className="movements-list__icon-sm" />
          ) : (
            <Filter className="movements-list__icon-sm" />
          )}
          <span>{showAdvancedFilters ? 'Ocultar' : 'Filtros'}</span>
        </Button>
      </div>

      <div className="movements-list__filters-advanced">
        <div className="movements-list__filters-row">
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
              onValueChange={(val: string | null) =>
                setCostCenterFilter(val || 'ALL')
              }
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
          <div className="movements-list__sales-channel-wrapper">
            <Label className="movements-list__label">Canal de Venta</Label>
            <Select
              value={salesChannelFilter}
              onValueChange={setSalesChannelFilter}
            >
              <SelectTrigger className="movements-list__select">
                <SelectValue placeholder="Todos los Canales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los Canales</SelectItem>
                <SelectItem value="DIRECTA">Venta Directa</SelectItem>
                <SelectItem value="LIBRERIA">Librería</SelectItem>
                <SelectItem value="FERIA">Feria</SelectItem>
                <SelectItem value="OTRO">Otro / No Aplica</SelectItem>
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
    </div>
  );
}
