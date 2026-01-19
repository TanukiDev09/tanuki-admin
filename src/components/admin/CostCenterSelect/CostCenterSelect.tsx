'use client';

import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import './CostCenterSelect.scss';

interface CostCenter {
  _id: string;
  code: string;
  name: string;
}

interface CostCenterSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  allowNull?: boolean;
  nullLabel?: string;
  allowCreation?: boolean;
  hideLabel?: boolean;
}

export default function CostCenterSelect({
  value,
  onValueChange,
  label = 'Centro de Costo',
  allowNull = false,
  nullLabel = 'Sin asignar',
  allowCreation = true,
  hideLabel = false,
}: CostCenterSelectProps) {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const response = await fetch('/api/costcenters');
      const data = await response.json();
      if (data.success) {
        setCostCenters(data.data);
      }
    } catch (error) {
      console.error('Error al cargar centros de costo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCode.trim() || !newName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/costcenters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          description: newDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear centro de costo');
      }

      setCostCenters([...costCenters, data.data]);
      onValueChange(data.data.code);

      setShowNewModal(false);
      setNewCode('');
      setNewName('');
      setNewDescription('');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="cost-center-select">
      {!hideLabel && <Label className="cost-center-select__label">{label}</Label>}

      <div className="cost-center-select__controls">
        <div className="cost-center-select__select-wrapper">
          <Select
            value={value || 'none'}
            onValueChange={(val) => {
              if (val === 'ADD_NEW') {
                setShowNewModal(true);
              } else {
                onValueChange(val === 'none' ? '' : val);
              }
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              {allowNull && (
                <SelectItem value="__UNDEFINED__">{nullLabel}</SelectItem>
              )}
              {costCenters.map((cc) => (
                <SelectItem key={cc._id} value={cc.code}>
                  {cc.code} - {cc.name}
                </SelectItem>
              ))}
              {allowCreation && (
                <>
                  <SelectSeparator />
                  <SelectItem
                    value="ADD_NEW"
                    className="cost-center-select__add-item"
                  >
                    <div className="cost-center-select__add-content">
                      <Plus className="cost-center-select__add-icon" />
                      <span>Crear nuevo centro de costo...</span>
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog
        open={showNewModal}
        onOpenChange={(open) => !creating && setShowNewModal(open)}
      >
        <DialogContent className="cost-center-select__modal">
          <DialogHeader>
            <DialogTitle>Crear Centro de Costo</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleCreateNew}
            className="cost-center-select__create-form"
          >
            {error && (
              <div className="cost-center-select__form-error">{error}</div>
            )}

            <div className="cost-center-select__form-field">
              <Label htmlFor="cc-code">Código *</Label>
              <Input
                id="cc-code"
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Ej: 01T001"
                autoFocus
                required
              />
            </div>

            <div className="cost-center-select__form-field">
              <Label htmlFor="cc-name">Nombre *</Label>
              <Input
                id="cc-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Producción"
                required
              />
            </div>

            <div className="cost-center-select__form-field">
              <Label htmlFor="cc-desc">Descripción</Label>
              <Textarea
                id="cc-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción opcional..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewModal(false);
                  setNewCode('');
                  setNewName('');
                  setNewDescription('');
                  setError('');
                }}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating || !newCode.trim() || !newName.trim()}
                className="cost-center-select__create-action-btn"
              >
                {creating ? (
                  <>
                    <div className="cost-center-select__spinner" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="cost-center-select__icon" />
                    Crear
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
