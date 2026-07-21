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
import { Check, Tag, Type, FileText, Info } from 'lucide-react';
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
        <DialogHeader className="cost-center-modal__header">
          <div className="cost-center-modal__icon-container">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {isEditMode ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="cost-center-modal__form">
          {error && <div className="cost-center-modal__error">{error}</div>}

          <div className="cost-center-modal__grid">
            <div className="cost-center-modal__field">
              <Label htmlFor="cc-code" className="flex items-center gap-2 mb-1.5">
                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                Código de Identificación
              </Label>
              <div className="relative">
                <Input
                  id="cc-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: 01T001"
                  disabled={isEditMode}
                  required
                  maxLength={20}
                  className="font-mono text-sm tracking-wider uppercase pl-3 border-muted-foreground/20 focus:border-primary/50 transition-all"
                />
                {isEditMode && (
                  <div className="mt-2 p-2.5 bg-muted/50 rounded-md border border-border flex gap-2">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      El código es inmutable para preservar la integridad de los registros históricos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="cost-center-modal__field">
              <Label htmlFor="cc-name" className="flex items-center gap-2 mb-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre del Centro
              </Label>
              <Input
                id="cc-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Producción, Logística, Marketing..."
                required
                maxLength={100}
                className="pl-3 border-muted-foreground/20 focus:border-primary/50 transition-all"
              />
            </div>

            <div className="cost-center-modal__field">
              <Label htmlFor="cc-description" className="flex items-center gap-2 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Descripción Detallada
              </Label>
              <Textarea
                id="cc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el propósito y alcance de este centro de costo..."
                rows={3}
                className="resize-none border-muted-foreground/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {isEditMode && (
            <div className="cost-center-modal__status">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="cc-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(!!checked)}
                  className="mt-0.5 data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                <div className="grid gap-1 leading-none">
                  <Label
                    htmlFor="cc-active"
                    className="text-sm font-semibold leading-none cursor-pointer flex items-center gap-2"
                  >
                    Estado Activo
                    {!isActive && (
                      <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                        Desactivado
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si se desactiva, el centro no podrá seleccionarse en nuevos registros pero mantendrá sus datos históricos.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="cost-center-modal__footer">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="cost-center-modal__submit px-8"
            >
              {loading ? (
                <>
                  <div className="cost-center-modal__spinner" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Actualizar Centro' : 'Crear Centro de Costo'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

