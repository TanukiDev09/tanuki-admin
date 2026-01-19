'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BookResponse } from '@/types/book';
import { useToast } from '@/components/ui/Toast';
import EditBookModal from '@/components/admin/EditBookModal';
import AgreementList from '@/components/agreements/AgreementList';
import { Separator } from '@/components/ui/Separator';
import { CreatorResponse } from '@/types/creator';
import BookFinancials from '@/components/books/BookFinancials';
import BookInventorySummary from '@/components/books/BookInventorySummary';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency, formatNumber } from '@/lib/utils';
import './book-detail.scss';

// Helper to display creators
const CreatorBadgeList = ({ creators, title }: { creators: string[] | CreatorResponse[] | undefined, title: string }) => {
  if (!creators || creators.length === 0) return null;
  return (
    <div className="book-detail__creator-group">
      <h4>{title}</h4>
      <div className="book-detail__badge-list">
        {(creators as Array<string | CreatorResponse>).map((c) => {
          const name = typeof c === 'string' ? c : c.name;
          const id = typeof c === 'string' ? c : c._id;
          return (
            <Badge key={id} variant="outline" className="book-detail__badge">
              {name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default function BookDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(ModuleName.BOOKS, PermissionAction.UPDATE);

  const fetchBook = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/books/${params.id}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) throw new Error('Libro no encontrado');
      const data = await res.json();
      if (data.success) {
        setBook(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el libro',
        variant: 'destructive',
      });
      router.push('/dashboard/catalog');
    } finally {
      setLoading(false);
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const handleEditSuccess = () => {
    fetchBook();
    setEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="book-detail__loading">
        Cargando...
      </div>
    );
  }

  if (!book) return null;

  return (
    <>
      <div className="book-detail">
        <div className="book-detail__container">
          {/* Header / Nav */}
          <div className="book-detail__header">
            <Button variant="ghost" className="book-detail__back-button" onClick={() => router.back()}>
              <ArrowLeft className="book-detail__icon" />
              Volver al Catálogo
            </Button>
            <div className="book-detail__header-actions">
              {canUpdate && (
                <Button onClick={() => setEditModalOpen(true)}>
                  <Edit className="book-detail__icon" />
                  Editar
                </Button>
              )}
            </div>
          </div>

          {/* Main Content - Two Column Section */}
          <div className="book-detail__grid">
            {/* Left Column: Cover & Key Info */}
            <div className="book-detail__left-column">
              <div className="book-detail__cover-wrapper">
                {book.coverImage ? (
                  <Image
                    src={book.coverImage.startsWith('http') ? book.coverImage : `/uploads/covers/${book.coverImage}`}
                    alt={book.title}
                    fill
                    className="book-detail__cover-image"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="book-detail__cover-placeholder">
                    Sin Portada
                  </div>
                )}
              </div>

              <div className="book-detail__info-card">
                <div className="book-detail__info-row">
                  <span className="book-detail__label">Precio</span>
                  <span className="book-detail__value">{formatCurrency(book.price)}</span>
                </div>
                <Separator />
                <div className="book-detail__info-row">
                  <span className="book-detail__label">Stock</span>
                  <span className="book-detail__value book-detail__value--medium">{formatNumber(book.stock)} unidades</span>
                </div>
                <Separator />
                <div className="book-detail__info-row">
                  <span className="book-detail__label">Estado</span>
                  <Badge variant={book.isActive ? 'default' : 'secondary'}>
                    {book.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Description & Metadata */}
            <div className="book-detail__main-content">
              <div className="book-detail__title-section">
                <h1 className="book-detail__title">{book.title}</h1>
                <div className="book-detail__isbn">
                  ISBN: <span className="book-detail__isbn-value">{book.isbn}</span>
                </div>
                <p className="book-detail__description">
                  {book.description || 'Sin descripción disponible.'}
                </p>
              </div>

              <div className="book-detail__metadata-grid">
                <div className="book-detail__metadata-item">
                  <h3>Género</h3>
                  <p>{book.genre}</p>
                </div>
                <div className="book-detail__metadata-item">
                  <h3>Idioma</h3>
                  <p>{book.language === 'es' ? 'Español' : book.language}</p>
                </div>
                <div className="book-detail__metadata-item">
                  <h3>Páginas</h3>
                  <p>{formatNumber(book.pages)}</p>
                </div>
                <div className="book-detail__metadata-item">
                  <h3>Publicación</h3>
                  <p>{new Date(book.publicationDate).toLocaleDateString()}</p>
                </div>
                <div className="book-detail__metadata-item">
                  <h3>Colección</h3>
                  <p>{book.collectionName || '-'}</p>
                </div>
                <div className="book-detail__metadata-item">
                  <h3>Centro de Costos</h3>
                  <p>{book.costCenter || '-'}</p>
                </div>
              </div>

              <Separator />

              <div className="book-detail__credits-section">
                <h2 className="book-detail__credits-title">Créditos</h2>
                <div className="book-detail__credits-grid">
                  <CreatorBadgeList creators={book.authors} title="Autores" />
                  <CreatorBadgeList creators={book.translators} title="Traductores" />
                  <CreatorBadgeList creators={book.illustrators} title="Ilustradores" />
                </div>
              </div>
            </div>
          </div>

          {/* Single Column Section - Financials, Inventory, Credits, and Agreements */}
          <div className="book-detail__extra-section">
            <Separator />

            {/* Cost Center Financials */}
            {book.costCenter && (
              <>
                <BookFinancials costCenterName={book.costCenter} />
                <Separator />
              </>
            )}

            {/* Inventory Summary */}
            <div>
              <BookInventorySummary
                totalStock={book.totalStock}
                inventoryDetails={book.inventoryDetails}
                bookId={book._id}
                onUpdate={fetchBook}
              />
            </div>

            <Separator />

            <div>
              <h2 className="book-detail__section-title">Contratos y Acuerdos</h2>
              <AgreementList
                bookId={book._id}
                requiredCreators={[]}
                onUpdate={fetchBook}
              />
            </div>
          </div>
        </div>
      </div>

      <EditBookModal
        isOpen={editModalOpen}
        book={book}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
