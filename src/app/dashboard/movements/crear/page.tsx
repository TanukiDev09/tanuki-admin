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
import { ArrowLeft } from 'lucide-react';
import { CreateMovementDTO } from '@/types/movement';
import { POSSelect } from '@/components/admin/POSSelect/POSSelect';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency } from '@/lib/utils';
import { multiply, divide, gtZero, add, toNumber, compare } from '@/lib/math';
import { InventoryMovementSearchSelect } from '@/components/inventory/InventoryMovementSearchSelect';
import { MovementItemsTable } from '@/components/finance/MovementItemsTable';
import { GeneralInfoSection, AllocationSection } from '@/components/finance/MovementFormSections';
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
    items: [],
  });
  const [useItems, setUseItems] = useState(false);
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
        newAllocations[index] = { costCenter: '', amount: '0' };
      }

      if (field === 'amount') {
        newAllocations[index].amount = value;
      } else {
        newAllocations[index].costCenter = value;
      }
      return { ...prev, allocations: newAllocations };
    });
  };

  const addAllocation = () => {
    setFormData((prev) => ({
      ...prev,
      allocations: [
        ...(prev.allocations || []),
        { costCenter: '', amount: '0' },
      ],
    }));
  };

  const removeAllocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allocations: (prev.allocations || []).filter((_, i) => i !== index),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          type: 'servicio',
          description: '',
          quantity: 1,
          unitValue: 0,
          total: 0,
          costCenter: prev.costCenter || '',
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => {
      const newItems = (prev.items || []).filter((_, i) => i !== index);


      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number | boolean | null | undefined
  ) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };


      const newQuantity = newItems.reduce((sum, item) => add(sum, item.quantity || '0'), '0');

      // Auto-generate allocations from items if using items
      const ccMap: Record<string, string> = {};
      newItems.forEach(item => {
        if (item.costCenter) {
          ccMap[item.costCenter] = add(ccMap[item.costCenter] || '0', item.total || '0');
        }
      });

      const newAllocations = Object.entries(ccMap).map(([costCenter, amount]) => ({
        costCenter,
        amount
      }));

      return {
        ...prev,
        items: newItems,
        quantity: newQuantity,
        allocations: newAllocations,
        useMultiCostCenter: newAllocations.length > 1
      };
    });
  };

  const validateAllocations = (): boolean => {
    if (!useMultiCostCenter) return true;

    const allocations = formData.allocations || [];
    if (allocations.length === 0) {
      setAllocationError('Debe agregar al menos un centro de costo');
      return false;
    }

    const totalAllocated = allocations.reduce(
      (sum, a) => add(sum, a.amount || '0'),
      '0'
    );
    const totalAmount = formData.amount || '0';

    if (compare(totalAllocated, totalAmount) !== 0) {
      setAllocationError(
        `La suma de las asignaciones (${formatCurrency(toNumber(totalAllocated), formData.currency)}) no coincide con el total (${formatCurrency(toNumber(totalAmount), formData.currency)})`
      );
      return false;
    }

    if (allocations.some((a) => !a.costCenter || !gtZero(a.amount))) {
      setAllocationError(
        'Todos los campos de asignación son obligatorios y mayores a 0'
      );
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
        fiscalYear: formData.date
          ? new Date(formData.date).getFullYear()
          : new Date().getFullYear(),
        allocations: useMultiCostCenter ? formData.allocations : undefined,
        costCenter: useMultiCostCenter
          ? formData.allocations?.[0]?.costCenter || ''
          : formData.costCenter,
      };

      const res = await fetch('/api/finance/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Error al crear' }));
        throw new Error(
          errorData.error || errorData.details || 'Error al crear'
        );
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
        <GeneralInfoSection
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          setFormData={setFormData}
        />

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
                  setFormData((prev) => {
                    const amount = val;
                    const rate = prev.exchangeRate;
                    const cop = prev.amountInCOP;

                    let nextCOP = prev.amountInCOP;
                    let nextRate = prev.exchangeRate;

                    if (gtZero(rate)) {
                      nextCOP = multiply(amount, rate);
                    } else if (gtZero(cop) && gtZero(amount)) {
                      nextRate = divide(cop, amount);
                    }

                    return {
                      ...prev,
                      amount: val,
                      amountInCOP: nextCOP,
                      exchangeRate: nextRate,
                    };
                  })
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
                  <SelectItem value="JPY">Yen Japonés (JPY)</SelectItem>
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
                    onValueChange={(val) => {
                      setFormData((prev) => {
                        const rate = val;
                        const amount = prev.amount;
                        const cop = prev.amountInCOP;

                        let nextCOP = prev.amountInCOP;
                        let nextAmount = prev.amount;

                        if (gtZero(amount)) {
                          nextCOP = multiply(amount, rate);
                        } else if (gtZero(cop) && gtZero(rate)) {
                          nextAmount = divide(cop, rate);
                        }

                        return {
                          ...prev,
                          exchangeRate: val,
                          amountInCOP: nextCOP,
                          amount: nextAmount,
                        };
                      });
                    }}
                    placeholder="Ej: 4 000"
                  />
                </>
              )}
            </div>
          </div>

          {formData.currency !== 'COP' && (
            <div className="movement-form__grid movement-form__grid--3 mt-4">
              <div className="movement-form__field-group">
                <Label htmlFor="amountInCOP">Equivalente en COP</Label>
                <NumericInput
                  id="amountInCOP"
                  name="amountInCOP"
                  placeholder="0.00"
                  value={formData.amountInCOP}
                  onValueChange={(val) => {
                    setFormData((prev) => {
                      const cop = val;
                      const amount = prev.amount;
                      const rate = prev.exchangeRate;

                      let nextAmount = prev.amount;
                      let nextRate = prev.exchangeRate;

                      if (gtZero(amount)) {
                        nextRate = divide(cop, amount);
                      } else if (gtZero(rate)) {
                        nextAmount = divide(cop, rate);
                      }

                      return {
                        ...prev,
                        amountInCOP: val,
                        exchangeRate: nextRate,
                        amount: nextAmount,
                      };
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="movement-form__section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="movement-form__section-title">Cantidades e Items</h2>
            <div className="movement-form__toggle-group">
              <button
                type="button"
                onClick={() => setUseItems(false)}
                className={`movement-form__toggle-group-btn ${!useItems ? 'movement-form__toggle-group-btn--active' : ''}`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseItems(true);
                  if (!formData.items || formData.items.length === 0) {
                    setFormData((prev) => ({
                      ...prev,
                      items: [
                        {
                          type: 'servicio',
                          description: prev.description || '',
                          quantity: prev.quantity || 1,
                          unitValue: divide(prev.amount || 0, prev.quantity || 1),
                          total: prev.amount || 0,
                          costCenter: prev.costCenter || '',
                        },
                      ],
                    }));
                  }
                }}
                className={`movement-form__toggle-group-btn movement-form__toggle-group-btn--multiple ${useItems ? 'movement-form__toggle-group-btn--active' : ''}`}
              >
                Detallado
              </button>
            </div>
          </div>

          {!useItems ? (
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
                  {gtZero(formData.amount) && gtZero(formData.quantity)
                    ? formatCurrency(
                      toNumber(divide(formData.amount, formData.quantity)),
                      formData.currency
                    )
                    : '$ 0'}
                </div>
              </div>
            </div>
          ) : (
            <MovementItemsTable
              items={formData.items || []}
              currency={formData.currency || 'COP'}
              targetAmount={formData.amount}
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
            />
          )}
        </div>

        <div className="movement-form__section">
          <h2 className="movement-form__section-title">
            Clasificación y Destino
          </h2>

          <div className="movement-form__field-group">
            <AllocationSection
              formData={formData}
              handleSelectChange={handleSelectChange}
              setFormData={setFormData}
              useMultiCostCenter={useMultiCostCenter}
              setUseMultiCostCenter={setUseMultiCostCenter}
              handleAllocationChange={handleAllocationChange}
              addAllocation={addAllocation}
              removeAllocation={removeAllocation}
              allocationError={allocationError}
            />
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
            <Label>
              Vincular Movimiento de Inventario / Liquidación (Opcional)
            </Label>
            <InventoryMovementSearchSelect
              value={formData.inventoryMovementId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, inventoryMovementId: val }))
              }
              type={formData.type === 'INCOME' ? 'LIQUIDACION' : 'INGRESO'}
              placeholder={
                formData.type === 'INCOME'
                  ? 'Buscar liquidación de venta...'
                  : 'Buscar compra de libros...'
              }
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Seleccione una liquidación o ingreso de inventario previo para
              vincularlo a este pago.
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
      </form>
    </div>
  );
}
