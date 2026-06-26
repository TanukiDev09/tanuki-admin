'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Filter, X, Calendar } from 'lucide-react';
import { InventoryMovementType } from '@/types/inventory-movement';

interface Warehouse {
  _id: string;
  name: string;
  type: string;
}

interface InventoryMovementFiltersProps {
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  warehouseFilter: string;
  setWarehouseFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  clearFilters: () => void;
}

export function InventoryMovementFilters({
  typeFilter,
  setTypeFilter,
  warehouseFilter,
  setWarehouseFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  clearFilters,
}: InventoryMovementFiltersProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/warehouses');
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data || []);
        }
      } catch (error) {
        console.error('Error fetching warehouses for filters:', error);
      }
    };
    fetchWarehouses();
  }, []);

  return (
    <div className="inventory-movement-filters">
      <div className="inventory-movement-filters__header">
        <div className="inventory-movement-filters__title">
          <Filter className="h-4 w-4 mr-2" />
          <span>Filtros</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Limpiar todos
        </Button>
      </div>

      <div className="inventory-movement-filters__grid">
        <div className="inventory-movement-filters__field">
          <Label className="mb-1.5 block text-xs font-medium">Tipo de Movimiento</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value={InventoryMovementType.INGRESO}>Ingreso</SelectItem>
              <SelectItem value={InventoryMovementType.REMISION}>Remisión</SelectItem>
              <SelectItem value={InventoryMovementType.DEVOLUCION}>Devolución</SelectItem>
              <SelectItem value={InventoryMovementType.LIQUIDACION}>Liquidación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="inventory-movement-filters__field">
          <Label className="mb-1.5 block text-xs font-medium">Bodega (Origen o Destino)</Label>
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todas las bodegas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las bodegas</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w._id} value={w._id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="inventory-movement-filters__field">
          <Label className="mb-1.5 block text-xs font-medium">Desde</Label>
          <div className="relative">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 pr-8"
            />
          </div>
        </div>

        <div className="inventory-movement-filters__field">
          <Label className="mb-1.5 block text-xs font-medium">Hasta</Label>
          <div className="relative">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 pr-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
