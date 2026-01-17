'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImageUploader from './ImageUploader';
import CostCenterSelect from './CostCenterSelect';
import CollectionSelect from './CollectionSelect';
import MonthYearSelect from './MonthYearSelect';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBookModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBookModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    publicationMonth: '',
    publicationYear: '',
    genre: '',
    language: 'es',
    pages: '',
    height: '',
    width: '',
    spine: '',
    weight: '',
    price: '',
    description: '',
    coverImage: '',
    collectionName: '',
    costCenter: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Preparar datos
      const submitData = {
        isbn: formData.isbn,
        title: formData.title,
        // Removed creators from creation step to enforce contract-first logic
        authors: [],
        translators: [],
        illustrators: [],
        publicationDate: new Date(`${formData.publicationYear}-${formData.publicationMonth}-01`),
        genre: formData.genre,
        language: formData.language,
        pages: parseInt(formData.pages),
        height: formData.height ? parseFloat(formData.height) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        spine: formData.spine ? parseFloat(formData.spine) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        price: parseFloat(formData.price),
        description: formData.description,
        coverImage: formData.coverImage,
        collectionName: formData.collectionName,
        costCenter: formData.costCenter,
      };

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear libro');
      }

      // Reset form
      setFormData({
        isbn: '',
        title: '',
        publicationMonth: '',
        publicationYear: '',
        genre: '',
        language: 'es',
        pages: '',
        height: '',
        width: '',
        spine: '',
        weight: '',
        price: '',
        description: '',
        coverImage: '',
        collectionName: '',
        costCenter: '',
      });

      onSuccess();
      onClose();

      // Redirect to Detail Page to add Contracts (Authors)
      router.push(`/dashboard/catalog/${data.data._id}`);

    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Crear Libro</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* SECCIÓN 1: IDENTIFICACIÓN BÁSICA */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ISBN *
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                  required
                  pattern="\d{10}|\d{13}"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="9781234567890"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  10 o 13 dígitos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fecha de Publicación *
                </label>
                <MonthYearSelect
                  month={formData.publicationMonth}
                  year={formData.publicationYear}
                  onMonthChange={(month) => setFormData({ ...formData, publicationMonth: month })}
                  onYearChange={(year) => setFormData({ ...formData, publicationYear: year })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="El nombre del viento"
              />
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 text-sm text-blue-500">
            <p><strong>Nota:</strong> Los autores, traductores e ilustradores se asignarán mediante <strong>Contratos</strong> una vez creado el libro.</p>
          </div>

          {/* SECCIÓN 3: CATEGORIZACIÓN */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
              Categorización
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Idioma *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="fr">Francés</option>
                  <option value="de">Alemán</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Portugués</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Género *
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) =>
                    setFormData({ ...formData, genre: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Fantasía, Ciencia Ficción, etc."
                />
              </div>
            </div>

            <CollectionSelect
              value={formData.collectionName}
              onChange={(value) => setFormData({ ...formData, collectionName: value })}
            />
          </div>

          {/* SECCIÓN 4: DETALLES FÍSICOS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
              Detalles Físicos
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Páginas *
              </label>
              <input
                type="number"
                value={formData.pages}
                onChange={(e) =>
                  setFormData({ ...formData, pages: e.target.value })
                }
                required
                min="1"
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="350"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Alto (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="23.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ancho (cm)
                </label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) =>
                    setFormData({ ...formData, width: e.target.value })
                  }
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="15.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Lomo (cm)
                </label>
                <input
                  type="number"
                  value={formData.spine}
                  onChange={(e) =>
                    setFormData({ ...formData, spine: e.target.value })
                  }
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Peso (gr)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="450"
                />
              </div>
            </div>

            <ImageUploader
              value={formData.coverImage}
              onChange={(filename) => setFormData({ ...formData, coverImage: filename })}
              onRemove={() => setFormData({ ...formData, coverImage: '' })}
            />
          </div>

          {/* SECCIÓN 5: GESTIÓN COMERCIAL */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
              Gestión Comercial
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="29.99"
                />
              </div>
            </div>

            <CostCenterSelect
              value={formData.costCenter}
              onChange={(value) => setFormData({ ...formData, costCenter: value })}
            />
          </div>

          {/* SECCIÓN 6: INFORMACIÓN ADICIONAL */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
              Información Adicional
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Sinopsis del libro..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Libro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
