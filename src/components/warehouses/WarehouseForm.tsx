'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import './WarehouseForm.scss';

// ... (imports remain)

interface PointOfSale {
  _id: string;
  name: string;
  code: string;
}

interface WarehouseFormData {
  code: string;
  name: string;
  type: 'editorial' | 'pos' | 'general';
  pointOfSaleId?: string;
  address?: string;
  city?: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface WarehouseFormProps {
  initialData?: Partial<WarehouseFormData> & { _id?: string };
  mode?: 'create' | 'edit';
  readOnly?: boolean;
}

export function WarehouseForm({ initialData, mode = 'create', readOnly = false }: WarehouseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [formData, setFormData] = useState<WarehouseFormData>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    type: initialData?.type || 'general',
    pointOfSaleId: (initialData?.pointOfSaleId as unknown as { _id: string })?._id || (initialData?.pointOfSaleId as string) || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    description: initialData?.description || '',
    status: initialData?.status || 'active',
  });

  useEffect(() => {
    fetchPointsOfSale();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        type: initialData.type || 'general',
        pointOfSaleId: (initialData.pointOfSaleId as unknown as { _id: string })?._id || (initialData.pointOfSaleId as string) || '',
        address: initialData.address || '',
        city: initialData.city || '',
        description: initialData.description || '',
        status: initialData.status || 'active',
      });
    }
  }, [initialData]);

  const fetchPointsOfSale = async () => {
    try {
      const response = await fetch('/api/points-of-sale');
      if (response.ok) {
        const data = await response.json();
        setPointsOfSale(data);
      }
    } catch (error) {
      console.error('Error fetching points of sale:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'edit' && initialData?._id
        ? `/api/warehouses/${initialData._id}`
        : '/api/warehouses';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      // Clean up data - remove empty pointOfSaleId
      const submitData = { ...formData };
      if (!submitData.pointOfSaleId) {
        delete submitData.pointOfSaleId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      toast({
        title: 'Éxito',
        description: `Bodega ${mode === 'edit' ? 'actualizada' : 'creada'} correctamente`,
      });

      router.push(`/dashboard/warehouses/${data._id}`);
      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('No se pudo guardar la bodega');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof WarehouseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="warehouse-form">
      <div className="warehouse-form__grid">

        {mode === 'edit' && (
          <div className="warehouse-form__field-group">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.code}
              disabled={true}
              className="warehouse-form__input-disabled"
            />
          </div>
        )}

        <div className="warehouse-form__field-group">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Bodega Principal"
            required
            disabled={loading || readOnly}
          />
        </div>

        <div className="warehouse-form__field-group">
          <Label htmlFor="type">Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: WarehouseFormData['type']) => handleChange('type', value)}
            disabled={loading || readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="pos">Punto de Venta</SelectItem>
              <SelectItem value="editorial">Editorial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="warehouse-form__field-group">
          <Label htmlFor="status">Estado *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: WarehouseFormData['status']) => handleChange('status', value)}
            disabled={loading || readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="warehouse-form__field-group">
          <Label htmlFor="pointOfSale">Punto de Venta</Label>
          <Select
            value={formData.pointOfSaleId || 'none'}
            onValueChange={(value) => handleChange('pointOfSaleId', value === 'none' ? '' : value)}
            disabled={loading || readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin asociar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asociar</SelectItem>
              {pointsOfSale.map((pos) => (
                <SelectItem key={pos._id} value={pos._id}>
                  {pos.name} ({pos.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="warehouse-form__field-group">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Bogotá"
            disabled={loading || readOnly}
          />
        </div>

        <div className="warehouse-form__field-group warehouse-form__field-group--full-width">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Calle 123 #45-67"
            disabled={loading || readOnly}
          />
        </div>

        <div className="warehouse-form__field-group warehouse-form__field-group--full-width">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descripción de la bodega..."
            rows={3}
            disabled={loading || readOnly}
          />
        </div>
      </div>

      <div className="warehouse-form__actions">
        {!readOnly && (
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear Bodega'}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
