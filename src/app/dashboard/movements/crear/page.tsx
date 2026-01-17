'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming exists
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { CreateMovementDTO } from '@/types/movement';
import { CategorySelect } from '@/components/finance/CategorySelect';

export default function CreateMovementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateMovementDTO>>({
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME',
    currency: 'COP', // Default
    status: 'COMPLETED',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enforce validations
      if (!formData.amount || !formData.description || !formData.category) {
        toast({ title: 'Error', description: 'Faltan campos requeridos', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        fiscalYear: new Date(formData.date as string).getFullYear(),
      };

      const res = await fetch('/api/finance/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al crear');

      toast({ title: 'Éxito', description: 'Movimiento creado correctamente' });
      router.push('/dashboard/movements');
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo crear el movimiento', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Nuevo Movimiento</h1>
          <p className="text-muted-foreground">Registra un nuevo ingreso o egreso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              {formData.currency !== 'COP' && (
                <>
                  <Label htmlFor="exchangeRate">Tasa de Cambio (TRM)</Label>
                  <Input
                    id="exchangeRate"
                    name="exchangeRate"
                    type="number"
                    step="0.01"
                    value={formData.exchangeRate || ''}
                    onChange={handleChange}
                    required={formData.currency !== 'COP'}
                    placeholder="Ej: 4000"
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Input
                id="unit"
                name="unit"
                placeholder="Ej. Items, Horas, Kilos"
                value={formData.unit || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.quantity || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Unitario (Calculado)</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {formData.amount && formData.quantity && Number(formData.quantity) !== 0
                  ? (Number(formData.amount) / Number(formData.quantity)).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: formData.currency || 'COP'
                  })
                  : '$ 0'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <CategorySelect
                value={formData.category as any}
                onChange={(val) => handleSelectChange('category', val)}
                type={formData.type as any}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter">Centro de Costos</Label>
              <Input
                id="costCenter"
                name="costCenter"
                placeholder="Ej. General, Proyecto A"
                value={formData.costCenter || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Beneficiario / Pagador</Label>
              <Input
                id="beneficiary"
                name="beneficiary"
                placeholder="Nombre de la persona o entidad"
                value={formData.beneficiary || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentChannel">Canal de Pago</Label>
              <Input
                id="paymentChannel"
                name="paymentChannel"
                placeholder="Ej. Transferencia, Efectivo"
                value={formData.paymentChannel || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Detalles adicionales..."
              value={formData.notes || ''}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="mr-2">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Movimiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
