'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { BookResponse } from '@/types/book';
import ImageUploader from '../ImageUploader';
import CostCenterSelect from '../CostCenterSelect';
import CollectionSelect from '../CollectionSelect';
import MonthYearSelect from '../MonthYearSelect';
import BookSearchMultiSelect from '../BookSearchMultiSelect/BookSearchMultiSelect';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import AgreementList from '@/components/agreements/AgreementList';
import './EditBookModal.scss';

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
    isBundle: false,
    bundleBooks: [] as string[],
  });
  const [bundleBooksData, setBundleBooksData] = useState<BookResponse[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        isbn: book.isbn,
        title: book.title,
        publicationMonth: new Date(book.publicationDate)
          .toISOString()
          .substring(5, 7),
        publicationYear: new Date(book.publicationDate)
          .toISOString()
          .substring(0, 4),
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
        isBundle: book.isBundle || false,
        bundleBooks: (book.bundleBooks || []).map((b: string | BookResponse) =>
          typeof b === 'string' ? b : b._id
        ),
      });
      setBundleBooksData((book.bundleBooks || []).filter((b: string | BookResponse) => typeof b !== 'string') as BookResponse[]);
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;

    setError('');
    setLoading(true);

    try {
      const updateData = {
        isbn: formData.isbn,
        title: formData.title,
        publicationDate: new Date(
          `${formData.publicationYear}-${formData.publicationMonth}-01`
        ),
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
        isBundle: formData.isBundle,
        bundleBooks: formData.bundleBooks,
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

  if (!book) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !loading && !open && onClose()}
    >
      <DialogContent className="edit-book-modal">
        <DialogHeader>
          <DialogTitle>Editar Libro</DialogTitle>
        </DialogHeader>

        <div className="edit-book-modal__tabs-container">
          <Tabs defaultValue="general" className="edit-book-modal__tabs">
            <TabsList className="edit-book-modal__tabs-list">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="contracts">Contratos & Autoría</TabsTrigger>
            </TabsList>

            <TabsContent
              value="general"
              className="edit-book-modal__tabs-content"
            >
              <form onSubmit={handleSubmit} className="edit-book-modal__form">
                {error && <div className="edit-book-modal__error">{error}</div>}

                <div className="edit-book-modal__grid edit-book-modal__grid--2col">
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-isbn">ISBN *</Label>
                    <Input
                      id="edit-isbn"
                      type="text"
                      value={formData.isbn}
                      onChange={(e) =>
                        setFormData({ ...formData, isbn: e.target.value })
                      }
                      required
                      pattern="\d{10}|\d{13}"
                    />
                    <p className="edit-book-modal__hint">10 o 13 dígitos</p>
                  </div>

                  <div className="edit-book-modal__field">
                    <Label>Fecha de Publicación *</Label>
                    <MonthYearSelect
                      month={formData.publicationMonth}
                      year={formData.publicationYear}
                      onMonthChange={(month) =>
                        setFormData({ ...formData, publicationMonth: month })
                      }
                      onYearChange={(year) =>
                        setFormData({ ...formData, publicationYear: year })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="edit-book-modal__field">
                  <Label htmlFor="edit-title">Título *</Label>
                  <Input
                    id="edit-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="edit-book-modal__note">
                  Para editar los{' '}
                  <strong>Autores, Traductores o Ilustradores</strong>, por
                  favor utilice la pestaña &quot;Contratos &amp; Autoría&quot;.
                </div>

                <div className="edit-book-modal__grid edit-book-modal__grid--2col">
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-genre">Género *</Label>
                    <Input
                      id="edit-genre"
                      type="text"
                      value={formData.genre}
                      onChange={(e) =>
                        setFormData({ ...formData, genre: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-language">Idioma *</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(val) =>
                        setFormData({ ...formData, language: val })
                      }
                    >
                      <SelectTrigger id="edit-language">
                        <SelectValue placeholder="Seleccionar idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="fr">Francés</SelectItem>
                        <SelectItem value="de">Alemán</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="pt">Portugués</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="edit-book-modal__grid edit-book-modal__grid--3col">
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-pages">Páginas *</Label>
                    <NumericInput
                      id="edit-pages"
                      value={formData.pages}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          pages: val?.toString() || '',
                        })
                      }
                      allowDecimals={false}
                      required
                    />
                  </div>
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-price">Precio *</Label>
                    <NumericInput
                      id="edit-price"
                      value={formData.price}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          price: val?.toString() || '',
                        })
                      }
                      required
                    />
                  </div>
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-stock">Stock</Label>
                    <NumericInput
                      id="edit-stock"
                      value={formData.stock}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          stock: val?.toString() || '',
                        })
                      }
                      allowDecimals={false}
                    />
                  </div>
                </div>

                <div className="edit-book-modal__grid edit-book-modal__grid--4col">
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-height">Alto (cm)</Label>
                    <NumericInput
                      id="edit-height"
                      placeholder="23.0"
                      value={formData.height}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          height: val?.toString() || '',
                        })
                      }
                    />
                  </div>
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-width">Ancho (cm)</Label>
                    <NumericInput
                      id="edit-width"
                      placeholder="15.0"
                      value={formData.width}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          width: val?.toString() || '',
                        })
                      }
                    />
                  </div>
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-spine">Lomo (cm)</Label>
                    <NumericInput
                      id="edit-spine"
                      placeholder="2.5"
                      value={formData.spine}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          spine: val?.toString() || '',
                        })
                      }
                    />
                  </div>
                  <div className="edit-book-modal__field">
                    <Label htmlFor="edit-weight">Peso (gr)</Label>
                    <NumericInput
                      id="edit-weight"
                      placeholder="450"
                      value={formData.weight}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          weight: val?.toString() || '',
                        })
                      }
                      allowDecimals={false}
                    />
                  </div>
                </div>

                <div className="edit-book-modal__field">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <ImageUploader
                  value={formData.coverImage}
                  onChange={(filename) =>
                    setFormData({ ...formData, coverImage: filename })
                  }
                  onRemove={() => setFormData({ ...formData, coverImage: '' })}
                />

                <CollectionSelect
                  value={formData.collectionName}
                  onChange={(value) =>
                    setFormData({ ...formData, collectionName: value })
                  }
                />

                <div className="edit-book-modal__field edit-book-modal__field--checkbox">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isBundle"
                      checked={formData.isBundle}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isBundle: !!checked })
                      }
                    />
                    <Label htmlFor="edit-isBundle" className="cursor-pointer">
                      Es una Obra Completa (Asocia volúmenes)
                    </Label>
                  </div>
                </div>

                {formData.isBundle && (
                  <div className="edit-book-modal__bundle-section">
                    <BookSearchMultiSelect
                      label="Asociar Volúmenes"
                      selectedBookIds={formData.bundleBooks}
                      selectedBooksData={bundleBooksData}
                      onAdd={(book: BookResponse) => {
                        setFormData({
                          ...formData,
                          bundleBooks: [...formData.bundleBooks, book._id],
                        });
                        setBundleBooksData([...bundleBooksData, book]);
                      }}
                      onRemove={(bookId: string) => {
                        setFormData({
                          ...formData,
                          bundleBooks: formData.bundleBooks.filter(
                            (id) => id !== bookId
                          ),
                        });
                        setBundleBooksData(
                          bundleBooksData.filter((b) => b._id !== bookId)
                        );
                      }}
                    />
                  </div>
                )}

                <CostCenterSelect
                  value={formData.costCenter}
                  onValueChange={(value) =>
                    setFormData({ ...formData, costCenter: value })
                  }
                />

                <DialogFooter className="edit-book-modal__footer">
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
                    className="edit-book-modal__submit-btn"
                  >
                    <Save className="edit-book-modal__icon" />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent
              value="contracts"
              className="edit-book-modal__tabs-content"
            >
              <div className="edit-book-modal__agreements">
                <AgreementList bookId={book._id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
