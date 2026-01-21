'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { CreateMovementDTO } from '@/types/movement';
import { CategorySelect } from '@/components/finance/CategorySelect';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { POSSelect } from '@/components/admin/POSSelect/POSSelect';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency } from '@/lib/utils';
import { InventoryMovementSearchSelect } from '@/components/inventory/InventoryMovementSearchSelect';
import '../movement-form.scss';


export default function CreateMovementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.FINANCE, PermissionAction.CREATE);

  const [formData, setFormData] = useState<Partial<CreateMovementDTO>>({
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME',
    currency: 'COP', // Default
    status: 'COMPLETED',
    salesChannel: 'OTRO',
    allocations: [],
  });
  const [useMultiCostCenter, setUseMultiCostCenter] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!canCreate) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para crear movimientos financieros',
        variant: 'destructive',
      });
      router.push('/dashboard/movements');
    }
  }, [canCreate, router, toast]);

  if (!canCreate) {
    return (
      <div className="movement-form__loading">Verificando permisos...</div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAllocationChange = (
    index: number,
    field: 'costCenter' | 'amount',
    value: string
  ) => {
    setFormData((prev) => {
      const newAllocations = [...(prev.allocations || [])];
      if (!newAllocations[index]) {
        newAllocations[index] = { costCenter: '', amount: 0 };
      }

      if (field === 'amount') {
        newAllocations[index].amount = parseFloat(value) || 0;
      } else {
        newAllocations[index].costCenter = value;
      }
      return { ...prev, allocations: newAllocations };
    });
  };

  const addAllocation = () => {
    setFormData((prev) => ({
      ...prev,
      allocations: [...(prev.allocations || []), { costCenter: '', amount: 0 }],
    }));
  };

  const removeAllocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allocations: (prev.allocations || []).filter((_, i) => i !== index),
    }));
  };

  const validateAllocations = (): boolean => {
    if (!useMultiCostCenter) return true;

    const allocations = formData.allocations || [];
    if (allocations.length === 0) {
      setAllocationError('Debe agregar al menos un centro de costo');
      return false;
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalAmount = Number(formData.amount) || 0;

    // Use small epsilon for float comparison
    if (Math.abs(totalAllocated - totalAmount) > 0.01) {
      setAllocationError(
        `La suma de las asignaciones (${formatCurrency(totalAllocated, formData.currency)}) no coincide con el total (${formatCurrency(totalAmount, formData.currency)})`
      );
      return false;
    }

    if (allocations.some(a => !a.costCenter || Number(a.amount) <= 0)) {
      setAllocationError('Todos los campos de asignación son obligatorios y mayores a 0');
      return false;
    }

    setAllocationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.description || !formData.date) {
      toast({
        title: 'Error',
        description: 'Faltan campos requeridos (Tipo, Descripción y Fecha)',
        variant: 'destructive',
      });
      return;
    }

    if (!validateAllocations()) {
      toast({
        title: 'Error de Validación',
        description: allocationError || 'Revise la distribución de costos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        fiscalYear: formData.date ? new Date(formData.date).getFullYear() : new Date().getFullYear(),
        allocations: useMultiCostCenter ? formData.allocations : undefined,
        costCenter: useMultiCostCenter ? (formData.allocations?.[0]?.costCenter || '') : formData.costCenter,
      };

      const res = await fetch('/api/finance/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error al crear' }));
        throw new Error(errorData.error || errorData.details || 'Error al crear');
      }

      toast({ title: 'Éxito', description: 'Movimiento creado correctamente' });
      router.push('/dashboard/movements');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: (err as Error).message || 'No se pudo crear el movimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralInfo = () => (
    <div className="movement-form__section">
      <h2 className="movement-form__section-title">Información General</h2>
      <div className="movement-form__grid movement-form__grid--2">
        <div className="movement-form__field-group">
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={formData.type}
            onValueChange={(val) => handleSelectChange('type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Ingreso</SelectItem>
              <SelectItem value="EXPENSE">Egreso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="movement-form__field-group">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date?.toString().split('T')[0]}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="movement-form__field-group">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          placeholder="Descripción breve del movimiento"
          value={formData.description || ''}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );

  const renderAllocationSection = () => (
    <>
      <div className="movement-form__field-group">
        <Label htmlFor="category">Categoría</Label>
        <CategorySelect
          value={formData.category}
          onValueChange={(val) => handleSelectChange('category', val)}
          type={formData.type as 'INCOME' | 'EXPENSE'}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="costCenter">Centro de Costo</Label>
        <div className="movement-form__toggle-group">
          <button
            type="button"
            onClick={() => setUseMultiCostCenter(false)}
            className={`movement-form__toggle-group-btn ${!useMultiCostCenter ? 'movement-form__toggle-group-btn--active' : ''}`}
          >
            Único
          </button>
          <button
            type="button"
            onClick={() => {
              setUseMultiCostCenter(true);
              if (!formData.allocations || formData.allocations.length === 0) {
                setFormData(prev => ({
                  ...prev,
                  allocations: [{
                    costCenter: prev.costCenter || '',
                    amount: Number(prev.amount) || 0
                  }]
                }));
              }
            }}
            className={`movement-form__toggle-group-btn movement-form__toggle-group-btn--multiple ${useMultiCostCenter ? 'movement-form__toggle-group-btn--active' : ''}`}
          >
            Múltiple
          </button>
        </div>
      </div>

      {!useMultiCostCenter ? (
        <CostCenterSelect
          value={formData.costCenter}
          onValueChange={(val) => handleSelectChange('costCenter', val)}
        />
      ) : (
        <div className="movement-form__allocation-container">
          <table className="movement-form__allocation-table">
            <thead>
              <tr>
                <th className="cost-center-col">Centro de Costo</th>
                <th className="amount-col">Monto</th>
                <th className="action-col"></th>
              </tr>
            </thead>
            <tbody>
              {formData.allocations?.map((alloc, idx) => (
                <tr key={idx}>
                  <td>
                    <CostCenterSelect
                      value={alloc.costCenter}
                      onValueChange={(val) => handleAllocationChange(idx, 'costCenter', val)}
                    />
                  </td>
                  <td>
                    <NumericInput
                      value={alloc.amount}
                      onValueChange={(val) => val !== undefined && handleAllocationChange(idx, 'amount', val.toString())}
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="movement-form__remove-allocation"
                      onClick={() => removeAllocation(idx)}
                      title="Eliminar asignación"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            className="movement-form__add-allocation"
            onClick={addAllocation}
          >
            <Plus size={14} /> Agregar Asignación
          </button>

          <div className="movement-form__allocation-summary">
            <div className="movement-form__allocation-summary-label">
              Total: <span className="font-semibold">{formatCurrency(Number(formData.amount) || 0, formData.currency)}</span>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex gap-2 items-center">
                <span>Asignado:</span>
                <span className={`movement-form__allocation-summary-total ${Math.abs((formData.allocations?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0) - (Number(formData.amount) || 0)) < 0.01
                  ? 'movement-form__allocation-summary-total--match'
                  : 'movement-form__allocation-summary-total--error'
                  }`}>
                  {formatCurrency(formData.allocations?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0, formData.currency)}
                </span>
              </div>

              {allocationError ? (
                <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--warning">
                  {allocationError}
                </span>
              ) : (
                Math.abs((formData.allocations?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0) - (Number(formData.amount) || 0)) < 0.01
                  ? <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--success">✓ Distribuido</span>
                  : <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--warning">
                    Falta: {formatCurrency((Number(formData.amount) || 0) - (formData.allocations?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0), formData.currency)}
                  </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="movement-form">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="movement-form__back-btn"
      >
        <ArrowLeft className="movement-form__back-btn-icon" />
        Volver
      </Button>

      <div className="movement-form__header">
        <h1 className="movement-form__title">Nuevo Movimiento</h1>
        <p className="movement-form__subtitle">
          Registra un nuevo ingreso o egreso.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="movement-form__container">
        {renderGeneralInfo()}

        <div className="movement-form__section">
          <h2 className="movement-form__section-title">
            Detalles de la Transacción
          </h2>
          <div className="movement-form__grid movement-form__grid--3">
            <div className="movement-form__field-group">
              <Label htmlFor="amount">Monto</Label>
              <NumericInput
                id="amount"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, amount: val }))
                }
              />
            </div>

            <div className="movement-form__field-group">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency || 'COP'}
                onValueChange={(val) => handleSelectChange('currency', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="movement-form__field-group">
              {formData.currency !== 'COP' && (
                <>
                  <Label htmlFor="exchangeRate">Tasa de Cambio (TRM)</Label>
                  <NumericInput
                    id="exchangeRate"
                    name="exchangeRate"
                    value={formData.exchangeRate}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, exchangeRate: val }))
                    }
                    placeholder="Ej: 4 000"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="movement-form__section">
          <h2 className="movement-form__section-title">Cantidades e Items</h2>
          <div className="movement-form__grid movement-form__grid--3">
            <div className="movement-form__field-group">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Input
                id="unit"
                name="unit"
                placeholder="Ej. Items, Horas, Kilos"
                value={formData.unit || ''}
                onChange={handleChange}
              />
            </div>

            <div className="movement-form__field-group">
              <Label htmlFor="quantity">Cantidad</Label>
              <NumericInput
                id="quantity"
                name="quantity"
                placeholder="0"
                value={formData.quantity}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, quantity: val }))
                }
              />
            </div>

            <div className="movement-form__field-group">
              <Label>Valor Unitario (Calculado)</Label>
              <div className="movement-form__calculated-value">
                {formData.amount &&
                  formData.quantity &&
                  Number(formData.quantity) !== 0
                  ? formatCurrency(
                    Number(formData.amount) / Number(formData.quantity),
                    formData.currency
                  )
                  : '$ 0'}
              </div>
            </div>
          </div>
        </div>

        <div className="movement-form__section">
          <h2 className="movement-form__section-title">
            Clasificación y Destino
          </h2>

          <div className="movement-form__field-group">
            {renderAllocationSection()}
          </div>

          <div className="movement-form__grid movement-form__grid--2">
            <div className="movement-form__field-group">
              <Label htmlFor="salesChannel">Canal de Venta</Label>
              <Select
                value={formData.salesChannel || 'OTRO'}
                onValueChange={(val) => handleSelectChange('salesChannel', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECTA">Venta Directa</SelectItem>
                  <SelectItem value="LIBRERIA">Librería</SelectItem>
                  <SelectItem value="FERIA">Feria</SelectItem>
                  <SelectItem value="OTRO">Otro / No Aplica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="movement-form__field-group">
              <Label htmlFor="beneficiary">Beneficiario / Pagador</Label>
              <Input
                id="beneficiary"
                name="beneficiary"
                placeholder="Nombre de la persona o entidad"
                value={formData.beneficiary || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="movement-form__grid movement-form__grid--2">
            {formData.salesChannel === 'LIBRERIA' && (
              <div className="movement-form__field-group">
                <POSSelect
                  value={formData.pointOfSale}
                  onValueChange={(val, name) => {
                    setFormData((prev) => ({
                      ...prev,
                      pointOfSale: val,
                      beneficiary: name || prev.beneficiary,
                    }));
                  }}
                />
              </div>
            )}

            <div className="movement-form__field-group">
              <Label htmlFor="paymentChannel">Canal de Pago</Label>
              <Input
                id="paymentChannel"
                name="paymentChannel"
                placeholder="Ej. Transferencia, Efectivo"
                value={formData.paymentChannel || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="movement-form__section">
          <h2 className="movement-form__section-title">Notas</h2>
          <div className="movement-form__field-group">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Detalles adicionales..."
              value={formData.notes || ''}
              onChange={handleChange}
            />
          </div>

          <div className="movement-form__field-group">
            <Label>Vincular Movimiento de Inventario / Liquidación (Opcional)</Label>
            <InventoryMovementSearchSelect
              value={formData.inventoryMovementId}
              onValueChange={(val) =>
                setFormData(prev => ({ ...prev, inventoryMovementId: val }))
              }
              type={formData.type === 'INCOME' ? 'LIQUIDACION' : 'INGRESO'}
              placeholder={
                formData.type === 'INCOME'
                  ? 'Buscar liquidación de venta...'
                  : 'Buscar compra de libros...'
              }
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Seleccione una liquidación o ingreso de inventario previo para vincularlo a este pago.
            </p>
          </div>
        </div>


        <div className="movement-form__footer">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Movimiento'}
          </Button>
        </div>
      </form >
    </div >
  );
}
