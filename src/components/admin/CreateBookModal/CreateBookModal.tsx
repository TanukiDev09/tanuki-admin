'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookPlus } from 'lucide-react';
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
import ImageUploader from '../ImageUploader/ImageUploader';
import CostCenterSelect from '../CostCenterSelect/CostCenterSelect';
import CollectionSelect from '../CollectionSelect/CollectionSelect';
import MonthYearSelect from '../MonthYearSelect/MonthYearSelect';
import './CreateBookModal.scss';

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
      const submitData = {
        isbn: formData.isbn,
        title: formData.title,
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
      router.push(`/dashboard/catalog/${data.data._id}`);

    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="create-book-modal">
        <DialogHeader>
          <DialogTitle>Crear Libro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="create-book-modal__form">
          {error && (
            <div className="create-book-modal__error">
              {error}
            </div>
          )}

          {/* SECTION: Basic Info */}
          <div className="create-book-modal__section">
            <h3 className="create-book-modal__section-title">Información Básica</h3>

            <div className="create-book-modal__grid create-book-modal__grid--2col">
              <div className="create-book-modal__field">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  required
                  pattern="\d{10}|\d{13}"
                  placeholder="9781234567890"
                />
                <p className="create-book-modal__hint">10 o 13 dígitos</p>
              </div>

              <div className="create-book-modal__field">
                <Label>Fecha de Publicación *</Label>
                <MonthYearSelect
                  month={formData.publicationMonth}
                  year={formData.publicationYear}
                  onMonthChange={(month: string) => setFormData({ ...formData, publicationMonth: month })}
                  onYearChange={(year: string) => setFormData({ ...formData, publicationYear: year })}
                  required
                />
              </div>
            </div>

            <div className="create-book-modal__field">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="El nombre del viento"
              />
            </div>

            <div className="create-book-modal__note">
              <strong>Nota:</strong> Los autores, traductores e ilustradores se asignarán mediante <strong>Contratos</strong> una vez creado el libro.
            </div>
          </div>

          {/* SECTION: Categorization */}
          <div className="create-book-modal__section">
            <h3 className="create-book-modal__section-title">Categorización</h3>

            <div className="create-book-modal__grid create-book-modal__grid--2col">
              <div className="create-book-modal__field">
                <Label htmlFor="language">Idioma *</Label>
                <Select value={formData.language} onValueChange={(val: string) => setFormData({ ...formData, language: val })}>
                  <SelectTrigger id="language">
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

              <div className="create-book-modal__field">
                <Label htmlFor="genre">Género *</Label>
                <Input
                  id="genre"
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  required
                  placeholder="Fantasía, Ciencia Ficción, etc."
                />
              </div>
            </div>

            <div className="create-book-modal__field">
              <CollectionSelect
                value={formData.collectionName}
                onChange={(value: string) => setFormData({ ...formData, collectionName: value })}
              />
            </div>
          </div>

          {/* SECTION: Physical Details */}
          <div className="create-book-modal__section">
            <h3 className="create-book-modal__section-title">Detalles Físicos</h3>

            <div className="create-book-modal__field">
              <Label htmlFor="pages">Páginas *</Label>
              <NumericInput
                id="pages"
                placeholder="350"
                value={formData.pages}
                onValueChange={(val) => setFormData({ ...formData, pages: val?.toString() || '' })}
                allowDecimals={false}
                required
              />
            </div>

            <div className="create-book-modal__grid create-book-modal__grid--4col">
              <div className="create-book-modal__field">
                <Label htmlFor="height">Alto (cm)</Label>
                <NumericInput
                  id="height"
                  placeholder="23.0"
                  value={formData.height}
                  onValueChange={(val) => setFormData({ ...formData, height: val?.toString() || '' })}
                />
              </div>
              <div className="create-book-modal__field">
                <Label htmlFor="width">Ancho (cm)</Label>
                <NumericInput
                  id="width"
                  placeholder="15.0"
                  value={formData.width}
                  onValueChange={(val) => setFormData({ ...formData, width: val?.toString() || '' })}
                />
              </div>
              <div className="create-book-modal__field">
                <Label htmlFor="spine">Lomo (cm)</Label>
                <NumericInput
                  id="spine"
                  placeholder="2.5"
                  value={formData.spine}
                  onValueChange={(val) => setFormData({ ...formData, spine: val?.toString() || '' })}
                />
              </div>
              <div className="create-book-modal__field">
                <Label htmlFor="weight">Peso (gr)</Label>
                <NumericInput
                  id="weight"
                  placeholder="450"
                  value={formData.weight}
                  onValueChange={(val) => setFormData({ ...formData, weight: val?.toString() || '' })}
                  allowDecimals={false}
                />
              </div>
            </div>

            <div className="create-book-modal__field">
              <ImageUploader
                value={formData.coverImage}
                onChange={(filename: string) => setFormData({ ...formData, coverImage: filename })}
                onRemove={() => setFormData({ ...formData, coverImage: '' })}
              />
            </div>
          </div>

          {/* SECTION: Commercial */}
          <div className="create-book-modal__section">
            <h3 className="create-book-modal__section-title">Gestión Comercial</h3>

            <div className="create-book-modal__grid create-book-modal__grid--2col">
              <div className="create-book-modal__field">
                <Label htmlFor="price">Precio *</Label>
                <NumericInput
                  id="price"
                  placeholder="29.99"
                  value={formData.price}
                  onValueChange={(val) => setFormData({ ...formData, price: val?.toString() || '' })}
                  required
                />
              </div>
              <div className="create-book-modal__field">
                <CostCenterSelect
                  value={formData.costCenter}
                  onChange={(value: string) => setFormData({ ...formData, costCenter: value })}
                />
              </div>
            </div>
          </div>

          {/* SECTION: Description */}
          <div className="create-book-modal__section">
            <h3 className="create-book-modal__section-title">Información Adicional</h3>
            <div className="create-book-modal__field">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Sinopsis del libro..."
              />
            </div>
          </div>

          <DialogFooter className="create-book-modal__footer">
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
              className="create-book-modal__btn-submit"
            >
              <BookPlus className="create-book-modal__icon" />
              {loading ? 'Creando...' : 'Crear Libro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
