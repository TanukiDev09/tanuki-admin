'use client';

import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import './CollectionSelect.scss';

interface Collection {
  _id: string;
  name: string;
}

interface CollectionSelectProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function CollectionSelect({
  value,
  onChange,
  label = 'Colección',
}: CollectionSelectProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      if (data.success) {
        setCollections(data.data);
      }
    } catch (error) {
      console.error('Error al cargar colecciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear colección');
      }

      setCollections([...collections, data.data]);
      onChange(data.data.name);

      setShowNewModal(false);
      setNewName('');
      setNewDescription('');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="collection-select">
      <Label className="collection-select__label">{label}</Label>

      <div className="collection-select__controls">
        <div className="collection-select__select-wrapper">
          <Select
            value={value || 'none'}
            onValueChange={(val) => onChange(val === 'none' ? '' : val)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin colección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin colección</SelectItem>
              {collections.map((col) => (
                <SelectItem key={col._id} value={col.name}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="collection-select__create-btn"
          title="Crear nueva colección"
          size="icon"
          variant="outline"
        >
          <Plus className="collection-select__icon" />
        </Button>
      </div>

      <Dialog
        open={showNewModal}
        onOpenChange={(open) => !creating && setShowNewModal(open)}
      >
        <DialogContent className="collection-select__modal">
          <DialogHeader>
            <DialogTitle>Crear Colección</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleCreateNew}
            className="collection-select__create-form"
          >
            {error && (
              <div className="collection-select__form-error">{error}</div>
            )}

            <div className="collection-select__form-field">
              <Label htmlFor="col-name">Nombre *</Label>
              <Input
                id="col-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Clásicos de la Literatura"
                autoFocus
                required
              />
            </div>

            <div className="collection-select__form-field">
              <Label htmlFor="col-desc">Descripción</Label>
              <Textarea
                id="col-desc"
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
                disabled={creating || !newName.trim()}
                className="collection-select__submit-btn"
              >
                {creating ? (
                  <>
                    <div className="collection-select__spinner" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="collection-select__icon" />
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
