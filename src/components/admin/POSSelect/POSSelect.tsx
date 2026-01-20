'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Store } from 'lucide-react';
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
import './POSSelect.scss';

interface PointOfSale {
  _id: string;
  name: string;
  code: string;
  status: string;
}

interface POSSelectProps {
  value?: string;
  onValueChange: (value: string, name?: string) => void;
  label?: string;
  placeholder?: string;
  allowCreation?: boolean;
}

export function POSSelect({
  value,
  onValueChange,
  label = 'Punto de Venta',
  placeholder = 'Selecciona punto de venta',
  allowCreation = true,
}: POSSelectProps) {
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(false);

  // Creation Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchPointsOfSale = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/points-of-sale?status=active');
      if (res.ok) {
        const data = await res.json();
        // The API returns an array directly based on route.ts
        setPointsOfSale(data || []);
      }
    } catch (error) {
      console.error('Failed to load points of sale', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPointsOfSale();
  }, [fetchPointsOfSale]);

  const handleCreateNew = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/points-of-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          status: 'active',
          type: 'physical', // Default type
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el punto de venta');
      }

      setPointsOfSale([...pointsOfSale, data]);
      onValueChange(data._id, data.name);

      setShowNewModal(false);
      setNewName('');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const selectedPOS = pointsOfSale.find((pos) => pos._id === value);

  return (
    <div className="pos-select">
      {label && <Label className="pos-select__label">{label}</Label>}
      <Select
        value={value}
        onValueChange={(val) => {
          if (val === 'ADD_NEW') {
            setShowNewModal(true);
          } else {
            const pos = pointsOfSale.find((p) => p._id === val);
            onValueChange(val, pos?.name);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Cargando...' : placeholder}>
            {selectedPOS ? (
              <div className="pos-select__selected">
                <Store className="pos-select__icon" />
                <span>{selectedPOS.name}</span>
              </div>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {pointsOfSale.map((pos) => (
            <SelectItem key={pos._id} value={pos._id}>
              {pos.name} ({pos.code})
            </SelectItem>
          ))}
          {pointsOfSale.length === 0 && !loading && (
            <div className="pos-select__empty-message">
              No hay puntos de venta activos
            </div>
          )}

          {allowCreation && (
            <>
              <SelectSeparator />
              <SelectItem value="ADD_NEW" className="pos-select__add-item">
                <div className="pos-select__add-content">
                  <Plus className="pos-select__add-icon" />
                  <span>Configurar nuevo punto de venta...</span>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <Dialog
        open={showNewModal}
        onOpenChange={(open) => !creating && setShowNewModal(open)}
      >
        <DialogContent className="pos-select__modal">
          <DialogHeader>
            <DialogTitle>Nuevo Punto de Venta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNew} className="pos-select__create-form">
            {error && <div className="pos-select__form-error">{error}</div>}

            <div className="pos-select__form-field">
              <Label htmlFor="pos-name">Nombre *</Label>
              <Input
                id="pos-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Librería Central"
                autoFocus
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewModal(false);
                  setNewName('');
                  setError('');
                }}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating || !newName.trim()}
                className="pos-select__create-action-btn"
              >
                {creating ? 'Creando...' : 'Crear Punto de Venta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
