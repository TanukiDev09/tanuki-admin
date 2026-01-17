'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BookResponse } from '@/types/book';
import ImageUploader from './ImageUploader';
import CostCenterSelect from './CostCenterSelect';
import CollectionSelect from './CollectionSelect';
import MonthYearSelect from './MonthYearSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgreementList from '@/components/agreements/AgreementList';

interface EditBookModalProps {
  isOpen: boolean;
  book: BookResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBookModal({
  isOpen,
  book,
  onClose,
  onSuccess,
}: EditBookModalProps) {
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
    stock: '',
    description: '',
    coverImage: '',
    collectionName: '',
    costCenter: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        isbn: book.isbn,
        title: book.title,
        publicationMonth: new Date(book.publicationDate).toISOString().substring(5, 7),
        publicationYear: new Date(book.publicationDate).toISOString().substring(0, 4),
        genre: book.genre,
        language: book.language,
        pages: book.pages.toString(),
        height: book.height?.toString() || '',
        width: book.width?.toString() || '',
        spine: book.spine?.toString() || '',
        weight: book.weight?.toString() || '',
        price: book.price.toString(),
        stock: book.stock?.toString() || book.totalStock?.toString() || '0',
        description: book.description || '',
        coverImage: book.coverImage || '',
        collectionName: book.collectionName || '',
        costCenter: book.costCenter || '',
      });
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;

    setError('');
    setLoading(true);

    try {
      // NOTE: Authors/Translators/Illustrators are NOT updated here.
      // They are managed via Contracts (Agreements).
      const updateData = {
        isbn: formData.isbn,
        title: formData.title,
        publicationDate: new Date(`${formData.publicationYear}-${formData.publicationMonth}-01`),
        genre: formData.genre,
        language: formData.language,
        pages: parseInt(formData.pages),
        height: formData.height ? parseFloat(formData.height) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        spine: formData.spine ? parseFloat(formData.spine) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description,
        coverImage: formData.coverImage,
        collectionName: formData.collectionName,
        costCenter: formData.costCenter,
      };

      const response = await fetch(`/api/books/${book._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar libro');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Editar Libro</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">Información General</TabsTrigger>
              <TabsTrigger value="contracts" className="flex-1">Contratos & Autoría</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

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
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground border border-border">
                  <p>
                    Para editar los <strong>Autores, Traductores o Ilustradores</strong>, por favor utilice la pestaña &quot;Contratos &amp; Autoría&quot;.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                  </div>

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    />
                  </div>

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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      min="0"
                      className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

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

                <ImageUploader
                  value={formData.coverImage}
                  onChange={(filename) => setFormData({ ...formData, coverImage: filename })}
                  onRemove={() => setFormData({ ...formData, coverImage: '' })}
                />

                <CollectionSelect
                  value={formData.collectionName}
                  onChange={(value) => setFormData({ ...formData, collectionName: value })}
                />

                <CostCenterSelect
                  value={formData.costCenter}
                  onChange={(value) => setFormData({ ...formData, costCenter: value })}
                />

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
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="contracts" className="mt-4">
              <AgreementList bookId={book._id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
