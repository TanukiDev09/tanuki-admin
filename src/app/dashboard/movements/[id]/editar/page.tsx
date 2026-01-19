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
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency } from '@/lib/utils';
import '../../movement-form.scss';

export default function EditMovementPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<UpdateMovementDTO>>({});
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

    const fetchMovement = async () => {
      try {
        const res = await fetch(`/api/finance/movements/${params.id}`);
        if (!res.ok) throw new Error('No se encontró el movimiento');
        const data = await res.json();
        const m = data.data;
        setFormData({
          ...m,
          currency: m.currency || 'COP', // Default to COP
          exchangeRate: m.exchangeRate,
          date: m.date ? m.date.split('T')[0] : '', // Format date for input
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

    if (params.id) fetchMovement();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        fiscalYear: formData.date
          ? new Date(formData.date).getFullYear()
          : new Date().getFullYear(),
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
      router.push('/dashboard/movements');
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
          <div className="movement-form__grid movement-form__grid--2">
            <div className="movement-form__field-group">
              <Label htmlFor="category">Categoría</Label>
              <CategorySelect
                value={
                  typeof formData.category === 'object' &&
                    formData.category !== null
                    ? (formData.category as { _id: string })._id
                    : (formData.category as string)
                }
                onValueChange={(val) => handleSelectChange('category', val)}
                type={formData.type as 'INCOME' | 'EXPENSE'}
              />
            </div>
            <div className="movement-form__field-group">
              <CostCenterSelect
                value={formData.costCenter}
                onValueChange={(val) => handleSelectChange('costCenter', val)}
              />
            </div>
          </div>

          <div className="movement-form__grid movement-form__grid--2">
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
