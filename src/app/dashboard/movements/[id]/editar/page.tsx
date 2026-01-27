'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { UpdateMovementDTO } from '@/types/movement';
import { CategorySelect } from '@/components/finance/CategorySelect';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { POSSelect } from '@/components/admin/POSSelect/POSSelect';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency } from '@/lib/utils';
import { multiply, divide, gtZero, add, toNumber, compare } from '@/lib/math';
import { InventoryMovementSearchSelect } from '@/components/inventory/InventoryMovementSearchSelect';
import { AllocationTable } from '@/components/finance/AllocationTable';
import '../../movement-form.scss';

export default function EditMovementPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<UpdateMovementDTO>>({});
  const [useMultiCostCenter, setUseMultiCostCenter] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(ModuleName.FINANCE, PermissionAction.UPDATE);

  useEffect(() => {
    if (!canUpdate) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para editar movimientos financieros',
        variant: 'destructive',
      });
      router.push('/dashboard/movements');
      return;
    }

    const loadData = async () => {
      try {
        const res = await fetch(`/api/finance/movements/${params.id}`);
        if (!res.ok) throw new Error('No se encontró el movimiento');
        const data = await res.json();
        const m = data.data;

        // Determine if we should start in multi-cost center mode
        const hasMultipleAllocations =
          m.allocations && m.allocations.length > 1;
        setUseMultiCostCenter(hasMultipleAllocations);

        setFormData({
          ...m,
          currency: m.currency || 'COP', // Default to COP
          exchangeRate: m.exchangeRate,
          date: m.date ? m.date.split('T')[0] : '', // Format date for input
          salesChannel: m.salesChannel || 'OTRO',
          pointOfSale:
            typeof m.pointOfSale === 'object'
              ? m.pointOfSale?._id
              : m.pointOfSale,
          category:
            typeof m.category === 'object' ? m.category?._id : m.category,
          inventoryMovementId:
            typeof m.inventoryMovementId === 'object'
              ? m.inventoryMovementId?._id
              : m.inventoryMovementId,
          allocations:
            m.allocations?.map(
              (a: {
                costCenter: string | { _id: string };
                amount: number | string;
              }) => ({
                costCenter:
                  typeof a.costCenter === 'object'
                    ? a.costCenter?._id
                    : a.costCenter,
                amount: a.amount?.toString() || '0',
              })
            ) || [],
        });
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el movimiento',
          variant: 'destructive',
        });
        router.push('/dashboard/movements');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadData();
  }, [params.id, router, toast, canUpdate]);

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
    setFormData((prev) => {
      const newAllocations = (prev.allocations || []).filter(
        (_, i) => i !== index
      );
      return { ...prev, allocations: newAllocations };
    });
  };

  const validateAllocations = () => {
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
        `La suma de asignaciones (${formatCurrency(toNumber(totalAllocated), formData.currency)}) no coincide con el total (${formatCurrency(toNumber(totalAmount), formData.currency)})`
      );
      return false;
    }

    for (const alloc of allocations) {
      if (!alloc.costCenter) {
        setAllocationError('Cada asignación debe tener un centro de costo');
        return false;
      }
      if (!gtZero(alloc.amount)) {
        setAllocationError('El monto de cada asignación debe ser mayor a 0');
        return false;
      }
    }

    setAllocationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllocations()) {
      toast({
        title: 'Error de Asignación',
        description:
          allocationError || 'Revise la distribución de centros de costo',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        fiscalYear: formData.date
          ? new Date(formData.date).getFullYear()
          : new Date().getFullYear(),
        allocations: useMultiCostCenter
          ? formData.allocations
          : [
              {
                costCenter: formData.costCenter || '01T001',
                amount: Number(formData.amount) || 0,
              },
            ],
        costCenter: useMultiCostCenter
          ? formData.allocations?.[0]?.costCenter || ''
          : formData.costCenter,
      };

      const res = await fetch(`/api/finance/movements/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = {
            error: `Server error (${res.status}): ${res.statusText}`,
          };
        }
        throw new Error(
          errorData.error || errorData.details || 'Error al actualizar'
        );
      }

      toast({
        title: 'Éxito',
        description: 'Movimiento actualizado correctamente',
      });
      router.back();
    } catch (err) {
      console.error(err);
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el movimiento',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canUpdate) {
    return (
      <div className="movement-form__loading">Verificando permisos...</div>
    );
  }

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
                setFormData((prev) => ({
                  ...prev,
                  allocations: [
                    {
                      costCenter: prev.costCenter || '',
                      amount: prev.amount || 0,
                    },
                  ],
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
        <AllocationTable
          allocations={formData.allocations || []}
          totalAmount={formData.amount || '0'}
          currency={formData.currency || 'COP'}
          onAllocationChange={handleAllocationChange}
          onAddAllocation={addAllocation}
          onRemoveAllocation={removeAllocation}
          error={allocationError}
        />
      )}
    </>
  );

  if (loading) return <div className="movement-form__loading">Cargando...</div>;

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
        <h1 className="movement-form__title">Editar Movimiento</h1>
        <p className="movement-form__subtitle">
          Modifica los detalles del movimiento registrado.
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
                {gtZero(formData.amount) && gtZero(formData.quantity)
                  ? formatCurrency(
                      toNumber(divide(formData.amount, formData.quantity)),
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
            <Label>
              Vincular Movimiento de Inventario / Liquidación (Opcional)
            </Label>
            <InventoryMovementSearchSelect
              value={formData.inventoryMovementId as string}
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
              Relacione este pago con un registro de inventario previo.
            </p>
          </div>
        </div>

        <div className="movement-form__footer">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
