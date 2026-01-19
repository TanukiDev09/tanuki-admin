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
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/Toast';
import { ArrowRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import './InventoryAdjustModal.scss';

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
  <div className="inventory-adjust-modal__comparison">
    <div className="inventory-adjust-modal__comparison-column">
      <p className="inventory-adjust-modal__comparison-label">Actual</p>
      <p className="inventory-adjust-modal__comparison-value">{formatNumber(current)}</p>
    </div>
    <ArrowRight className="inventory-adjust-modal__comparison-arrow" />
    <div className="inventory-adjust-modal__comparison-column inventory-adjust-modal__comparison-column--right">
      <p className="inventory-adjust-modal__comparison-label">Resultante</p>
      <p className={`inventory-adjust-modal__comparison-value ${result < 0 ? 'inventory-adjust-modal__comparison-value--negative' : 'inventory-adjust-modal__comparison-value--positive'}`}>
        {formatNumber(result)}
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
  <div className="inventory-adjust-modal__field">
    <Label htmlFor="adjustment">{label}</Label>
    <div className="inventory-adjust-modal__input-group">
      <NumericInput
        id="adjustment"
        placeholder="0"
        value={value}
        onValueChange={(val) => onChange(val || 0)}
        allowDecimals={false}
        className="inventory-adjust-modal__input"
      />
      <div className="inventory-adjust-modal__quick-actions">
        {[1, 10, 50].map(val => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            className="inventory-adjust-modal__quick-btn"
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

        <div className="inventory-adjust-modal__section">
          <StockComparison current={item.quantity} result={calculatedResult} />
          <AdjustmentInput
            label={labels.input}
            value={adjustmentValue}
            onChange={setAdjustmentValue}
          />
          <div className="inventory-adjust-modal__field">
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
            className={mode === 'remove' ? 'inventory-adjust-modal__btn-confirm--remove' : ''}
          >
            {loading ? 'Procesando...' : 'Confirmar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
