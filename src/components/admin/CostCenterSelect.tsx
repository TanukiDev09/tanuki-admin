'use client';

import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';

interface CostCenter {
  _id: string;
  code: string;
  name: string;
}

interface CostCenterSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function CostCenterSelect({
  value,
  onChange,
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

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Agregar a la lista y seleccionar
      setCostCenters([...costCenters, data.data]);
      onChange(data.data.code);

      // Cerrar modal y limpiar
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
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Centro de Costo
      </label>

      <div className="flex gap-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <option value="">Sin asignar</option>
          {costCenters.map((cc) => (
            <option key={cc._id} value={cc.code}>
              {cc.code} - {cc.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2"
          title="Crear nuevo centro de costo"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* Modal para crear nuevo centro de costo */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !creating && setShowNewModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Crear Centro de Costo
            </h3>

            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  placeholder="Ej: 01T001"
                  autoFocus
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Producción"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCode.trim() && newName.trim()) {
                      e.preventDefault();
                      handleCreateNew(e as any);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descripción
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Descripción opcional..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    setNewCode('');
                    setNewName('');
                    setNewDescription('');
                    setError('');
                  }}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-surface hover:bg-muted text-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={creating || !newCode.trim() || !newName.trim()}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Crear
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
