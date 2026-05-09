'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CostCenter } from '@/types/cost-center';
import { Check } from 'lucide-react';
import './CostCenterModal.scss';

interface CostCenterModalProps {
  isOpen: boolean;
  costCenter: CostCenter | null; // null means Create, non-null means Edit
  onClose: () => void;
  onSuccess: () => void;
}

export default function CostCenterModal({
  isOpen,
  costCenter,
  onClose,
  onSuccess,
}: CostCenterModalProps) {
  const isEditMode = !!costCenter;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (costCenter && isOpen) {
      setCode(costCenter.code);
      setName(costCenter.name);
      setDescription(costCenter.description || '');
      setIsActive(costCenter.isActive !== false); // default to true
    } else if (isOpen) {
      setCode('');
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError('');
  }, [costCenter, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!isEditMode && !trimmedCode) {
      setError('El código del centro de costo es requerido');
      setLoading(false);
      return;
    }

    if (!trimmedName) {
      setError('El nombre del centro de costo es requerido');
      setLoading(false);
      return;
    }

    try {
      const url = isEditMode
        ? `/api/costcenters/${costCenter._id}`
        : '/api/costcenters';

      const method = isEditMode ? 'PUT' : 'POST';

      const bodyData = isEditMode
        ? { name: trimmedName, description, isActive }
        : { code: trimmedCode, name: trimmedName, description };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Error al procesar la solicitud');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="cost-center-modal">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Centro de Costo' : 'Crear Centro de Costo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="cost-center-modal__form">
          {error && <div className="cost-center-modal__error">{error}</div>}

          <div className="cost-center-modal__field">
            <Label htmlFor="cc-code">Código *</Label>
            <Input
              id="cc-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: 01T001"
              disabled={isEditMode}
              required
              maxLength={20}
              className="font-mono text-sm tracking-wider uppercase"
            />
            {isEditMode && (
              <p className="cost-center-modal__hint">
                El código de identificación no se puede modificar por integridad histórica de facturas y movimientos.
              </p>
            )}
          </div>

          <div className="cost-center-modal__field">
            <Label htmlFor="cc-name">Nombre *</Label>
            <Input
              id="cc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Producción o Logística"
              required
              maxLength={100}
            />
          </div>

          <div className="cost-center-modal__field">
            <Label htmlFor="cc-description">Descripción</Label>
            <Textarea
              id="cc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe detalles adicionales sobre el propósito de este centro..."
              rows={3}
            />
          </div>

          {isEditMode && (
            <div className="cost-center-modal__field cost-center-modal__field--checkbox">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="cc-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(!!checked)}
                  className="mt-0.5"
                />
                <div className="grid gap-1 leading-none">
                  <Label
                    htmlFor="cc-active"
                    className="text-sm font-semibold leading-none cursor-pointer"
                  >
                    Centro de Costo Activo
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desmarcar esta casilla realiza una desactivación (borrado lógico). El centro no se ofrecerá para nuevos registros pero preservará todo su historial financiero.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="cost-center-modal__footer">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="cost-center-modal__submit"
            >
              {loading ? (
                <>
                  <div className="cost-center-modal__spinner" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Guardar Cambios' : 'Crear Centro'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
