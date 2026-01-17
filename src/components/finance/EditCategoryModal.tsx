'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Category } from '@/types/category';
import { Checkbox } from '@/components/ui/checkbox';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
}

export default function EditCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
}: EditCategoryModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Ambos',
    isActive: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        type: category.type as 'Ingreso' | 'Egreso' | 'Ambos',
        isActive: category.isActive,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/finance/categories/${category._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al actualizar categoría');

      toast({
        title: 'Éxito',
        description: 'Categoría actualizada correctamente',
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Servicios Públicos"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Egreso">Egreso</SelectItem>
                <SelectItem value="Ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descripción opcional..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked as boolean })
              }
            />
            <Label htmlFor="edit-active">Activo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
