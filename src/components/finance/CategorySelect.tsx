'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Category } from '@/types/category';
import './CategorySelect.scss';

interface CategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  type?: 'Ingreso' | 'Egreso' | 'Ambos' | 'INCOME' | 'EXPENSE';
  placeholder?: string;
  showSearch?: boolean;
  allowNull?: boolean;
  nullLabel?: string;
  allowCreation?: boolean;
}

export function CategorySelect({
  value,
  onValueChange,
  type,
  allowNull,
  nullLabel = 'Ninguna',
  allowCreation = true,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Creation Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'Ingreso' | 'Egreso'>(
    'Ingreso'
  );
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Determine fixed type if prop is specific
  const fixedType =
    type === 'INCOME' || type === 'Ingreso'
      ? 'Ingreso'
      : type === 'EXPENSE' || type === 'Egreso'
        ? 'Egreso'
        : null;

  useEffect(() => {
    if (fixedType) {
      setNewCategoryType(fixedType);
    }
  }, [fixedType]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('active', 'true');

      let filterType = type;
      if (type === 'INCOME') filterType = 'Ingreso';
      if (type === 'EXPENSE') filterType = 'Egreso';

      if (filterType) params.append('type', filterType);

      const res = await fetch(`/api/finance/categories?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateNew = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCategoryName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          type: newCategoryType,
          description: newCategoryDescription,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la categoría');
      }

      // Add to list and select it
      // Note: We might need to re-fetch if we want to ensure sort order,
      // but simplistic append is usually fine for UX feedback
      setCategories([...categories, data.data]);
      onValueChange(data.data._id);

      setShowNewModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      // Type resets to fixed or default
      if (fixedType) setNewCategoryType(fixedType);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Select
        value={value}
        onValueChange={(val) => {
          if (val === 'ADD_NEW') {
            setShowNewModal(true);
          } else {
            onValueChange(val);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={loading ? 'Cargando...' : 'Selecciona categoría'}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" disabled style={{ display: 'none' }}>
            Selecciona categoría
          </SelectItem>
          {allowNull && (
            <SelectItem value="__UNDEFINED__">{nullLabel}</SelectItem>
          )}
          {categories.map((cat) => (
            <SelectItem key={cat._id} value={cat._id}>
              {cat.name}
            </SelectItem>
          ))}
          {categories.length === 0 && !loading && (
            <div className="category-select__empty-message">
              No hay categorías disponibles
            </div>
          )}

          {allowCreation && (
            <>
              <SelectSeparator />
              <SelectItem value="ADD_NEW" className="category-select__add-item">
                <div className="category-select__add-content">
                  <Plus className="category-select__add-icon" />
                  <span>Crear nueva categoría...</span>
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
        <DialogContent className="category-select__modal">
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleCreateNew}
            className="category-select__create-form"
          >
            {error && (
              <div className="category-select__form-error">{error}</div>
            )}

            <div className="category-select__form-field">
              <Label htmlFor="cat-name">Nombre *</Label>
              <Input
                id="cat-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Transporte, Alimentación"
                autoFocus
                required
              />
            </div>

            {!fixedType && (
              <div className="category-select__form-field">
                <Label htmlFor="cat-type">Tipo *</Label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button
                    type="button"
                    variant={
                      newCategoryType === 'Ingreso' ? 'default' : 'outline'
                    }
                    onClick={() => setNewCategoryType('Ingreso')}
                    className="flex-1"
                  >
                    Ingreso
                  </Button>
                  <Button
                    type="button"
                    variant={
                      newCategoryType === 'Egreso' ? 'default' : 'outline'
                    }
                    onClick={() => setNewCategoryType('Egreso')}
                    className="flex-1"
                  >
                    Egreso
                  </Button>
                </div>
              </div>
            )}

            <div className="category-select__form-field">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Textarea
                id="cat-desc"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
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
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                  setError('');
                }}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating || !newCategoryName.trim()}
                className="category-select__create-action-btn"
              >
                {creating ? (
                  <>
                    <div className="category-select__spinner" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="category-select__icon" />
                    Crear
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
