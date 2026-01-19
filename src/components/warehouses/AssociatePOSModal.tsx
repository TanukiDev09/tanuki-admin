'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface PointOfSale {
  _id: string;
  name: string;
  code: string;
}

interface AssociatePOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  currentPOSId?: string;
}

export function AssociatePOSModal({
  isOpen,
  onClose,
  warehouseId,
  currentPOSId,
}: AssociatePOSModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [selectedPOSId, setSelectedPOSId] = useState(currentPOSId || 'none');

  useEffect(() => {
    if (isOpen) {
      fetchPointsOfSale();
      setSelectedPOSId(currentPOSId || 'none');
    }
  }, [isOpen, currentPOSId]);

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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/warehouses/${warehouseId}/associate-pos`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pointOfSaleId: selectedPOSId === 'none' ? null : selectedPOSId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asociar');
      }

      toast({
        title: 'Éxito',
        description:
          selectedPOSId === 'none'
            ? 'Punto de venta desasociado correctamente'
            : 'Punto de venta asociado correctamente',
      });

      router.refresh();
      onClose();
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('No se pudo asociar el punto de venta');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asociar Punto de Venta</DialogTitle>
          <DialogDescription>
            Asocia o desasocia un punto de venta a esta bodega.
          </DialogDescription>
        </DialogHeader>

        <div className="associate-pos-modal__content">
          <div className="associate-pos-modal__field-group">
            <Label htmlFor="pos" className="associate-pos-modal__label">
              Punto de Venta
            </Label>
            <Select
              value={selectedPOSId}
              onValueChange={setSelectedPOSId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar punto de venta" />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
