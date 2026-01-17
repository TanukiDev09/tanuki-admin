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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight } from 'lucide-react';

interface Book {
  _id: string;
  title: string;
  isbn: string;
}

interface InventoryItem {
  _id: string;
  bookId: Book;
  quantity: number;
}

interface InventoryAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  item: InventoryItem | null;
  mode: 'add' | 'remove' | 'set';
  onSuccess: () => void;
}

interface StockComparisonProps {
  current: number;
  result: number;
}

const StockComparison = ({ current, result }: StockComparisonProps) => (
  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
    <div className="text-sm">
      <p className="text-muted-foreground">Actual</p>
      <p className="text-2xl font-bold">{current}</p>
    </div>
    <ArrowRight className="h-4 w-4 text-muted-foreground" />
    <div className="text-sm text-right">
      <p className="text-muted-foreground">Resultante</p>
      <p className={`text-2xl font-bold ${result < 0 ? 'text-red-600' : 'text-primary'}`}>
        {result}
      </p>
    </div>
  </div>
);

interface AdjustmentInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

const AdjustmentInput = ({ label, value, onChange }: AdjustmentInputProps) => (
  <div className="space-y-2">
    <Label htmlFor="adjustment">{label}</Label>
    <div className="flex gap-2">
      <Input
        id="adjustment"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="text-lg font-semibold"
      />
      <div className="flex gap-1">
        {[1, 10, 50].map(val => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            className="h-auto py-1 px-2 text-xs"
            onClick={() => onChange(value + val)}
          >
            +{val}
          </Button>
        ))}
      </div>
    </div>
  </div>
);

export function InventoryAdjustModal({
  isOpen,
  onClose,
  warehouseId,
  item,
  mode,
  onSuccess,
}: InventoryAdjustModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setAdjustmentValue(mode === 'set' ? item.quantity : 0);
    setReason('');
  }, [isOpen, item, mode]);

  if (!item) return null;

  const getCalculatedResult = () => {
    if (mode === 'add') return item.quantity + Math.abs(adjustmentValue);
    if (mode === 'remove') return item.quantity - Math.abs(adjustmentValue);
    return adjustmentValue;
  };

  const calculatedResult = getCalculatedResult();

  const validateInput = () => {
    if (adjustmentValue === 0 && mode !== 'set') {
      toast({
        title: 'Atención',
        description: 'El valor de ajuste debe ser diferente de 0',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const getFinalAdjustment = () => {
    if (mode === 'remove') return -Math.abs(adjustmentValue);
    if (mode === 'add') return Math.abs(adjustmentValue);
    return adjustmentValue - item.quantity;
  };

  const performUpdateRequest = async (finalAdj: number) => {
    const res = await fetch('/api/inventory/adjust', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouseId,
        bookId: item.bookId._id,
        adjustment: finalAdj,
        reason,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al ajustar inventario');
    }
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;
    setLoading(true);
    try {
      await performUpdateRequest(getFinalAdjustment());
      toast({ title: 'Éxito', description: 'Inventario ajustado correctamente' });
      onSuccess();
      router.refresh();
      onClose();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    title: mode === 'add' ? 'Aumentar Stock' : mode === 'remove' ? 'Disminuir Stock' : 'Ajustar Stock',
    input: mode === 'add' ? 'Cantidad a sumar' : mode === 'remove' ? 'Cantidad a restar' : 'Nueva cantidad'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>
            {item.bookId.title} (ISBN: {item.bookId.isbn})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <StockComparison current={item.quantity} result={calculatedResult} />
          <AdjustmentInput
            label={labels.input}
            value={adjustmentValue}
            onChange={setAdjustmentValue}
          />
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (Opcional)</Label>
            <Input
              id="reason"
              placeholder="Ej: Ingreso por compra, Devolución, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (mode === 'remove' && calculatedResult < 0)}
            className={mode === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {loading ? 'Procesando...' : 'Confirmar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
