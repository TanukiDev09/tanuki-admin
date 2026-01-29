'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Check } from 'lucide-react';
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

interface ExternalEntity {
  _id: string;
  name: string;
  type: string;
  status: string;
}

interface ExternalEntitySelectProps {
  value?: string;
  onValueChange: (value: string, name?: string) => void;
  placeholder?: string;
  allowCreation?: boolean;
}

export function ExternalEntitySelect({
  value,
  onValueChange,
  placeholder = 'Seleccionar entidad externa...',
  allowCreation = true,
}: ExternalEntitySelectProps) {
  const [entities, setEntities] = useState<ExternalEntity[]>([]);
  const [loading, setLoading] = useState(false);

  // Creation Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Socio');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/external-entities');
      if (res.ok) {
        const data = await res.json();
        setEntities(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load external entities', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleCreateNew = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/external-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          status: 'active',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la entidad');
      }

      setEntities([...entities, data.data]);
      onValueChange(data.data._id, data.data.name);

      setShowNewModal(false);
      setNewName('');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const selectedEntity = entities.find((e) => e._id === value);

  return (
    <>
      <Select
        value={value}
        onValueChange={(val) => {
          if (val === 'ADD_NEW') {
            setShowNewModal(true);
          } else {
            const entity = entities.find((e) => e._id === val);
            onValueChange(val, entity?.name);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedEntity && (
              <div className="flex items-center gap-2 overflow-hidden">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedEntity.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {entities.map((entity) => (
            <SelectItem key={entity._id} value={entity._id}>
              {entity.name} ({entity.type})
            </SelectItem>
          ))}
          {entities.length === 0 && !loading && (
            <div className="p-2 text-sm text-center text-muted-foreground">
              No hay entidades registradas
            </div>
          )}

          {allowCreation && (
            <>
              <SelectSeparator />
              <SelectItem value="ADD_NEW" className="text-primary font-medium">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Crear nueva entidad externa...</span>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Entidad Externa</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNew} className="space-y-4">
            {error && <div className="text-xs text-rose-500">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="entity-name">Nombre *</Label>
              <Input
                id="entity-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Banco Davivienda, Socio Juan..."
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-type">Tipo *</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Socio">Socio</SelectItem>
                  <SelectItem value="Banco">Banco</SelectItem>
                  <SelectItem value="Persona Natural">Persona Natural</SelectItem>
                  <SelectItem value="Proveedor">Proveedor</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewModal(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? 'Creando...' : 'Crear Entidad'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
