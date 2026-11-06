'use client';

import { useState, useEffect, use, useCallback, type ReactNode } from 'react';
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
import BookPointsOfSale from '@/components/books/BookPointsOfSale';
import BookSalesStats from '@/components/books/BookSalesStats';
import BookAttention from '@/components/books/BookAttention';
import BookKpiStrip from '@/components/books/BookKpiStrip';
import BookReprint from '@/components/books/BookReprint';
import BookPosRotation from '@/components/books/BookPosRotation';
import BookDemandChart from '@/components/books/BookDemandChart';
import BookUnitFlow from '@/components/books/BookUnitFlow';
import BookConsignment from '@/components/books/BookConsignment';
import BookKardex from '@/components/books/BookKardex';
import BookVolumes from '@/components/books/BookVolumes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useBookOperations } from '@/hooks/useBookOperations';
import type { BookOperations } from '@/lib/inventory/bookOperations';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getBookCoverAlt } from '@/lib/accessibility';
import './book-detail.scss';

// Helper to display creators
const CreatorBadgeList = ({
  creators,
  title,
}: {
  creators: string[] | CreatorResponse[] | undefined;
  title: string;
}) => {
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

// Estados de carga, error y obra completa de los datos de operaciones.
function OperationsGate({
  state,
  bundle,
  children,
}: {
  state: ReturnType<typeof useBookOperations>;
  /** Contenido alterno para obras completas (sin inventario propio). */
  bundle?: ReactNode;
  children: (operations: BookOperations) => ReactNode;
}) {
  if (state.loading) {
    return <p className="book-detail__tab-message">Cargando...</p>;
  }
  if (state.isBundle && bundle) return <>{bundle}</>;
  if (state.isBundle) {
    return (
      <p className="book-detail__tab-message">
        Esta obra completa no tiene inventario propio: sus movimientos se
        registran en cada volumen.
      </p>
    );
  }
  if (state.error || !state.operations) {
    return (
      <p className="book-detail__tab-message">
        No se pudieron cargar los datos de inventario.
      </p>
    );
  }
  return <>{children(state.operations)}</>;
}

export default function BookDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [book, setBook] = useState<BookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const operations = useBookOperations(params.id);

  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(ModuleName.BOOKS, PermissionAction.UPDATE);

  const fetchBook = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/books/${params.id}`, {
        cache: 'no-store',
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }

      if (data.success) {
        setBook(data.data);
      } else {
        throw new Error(data.error || 'Libro no encontrado');
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
    return <div className="book-detail__loading">Cargando...</div>;
  }

  if (!book) return null;

  return (
    <>
      <div className="book-detail">
        <div className="book-detail__container">
          {/* Header / Nav */}
          <div className="book-detail__header">
            <Button
              variant="ghost"
              className="book-detail__back-button"
              onClick={() => router.back()}
            >
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
                    src={
                      book.coverImage.startsWith('http')
                        ? book.coverImage
                        : `/uploads/covers/${book.coverImage}`
                    }
                    alt={getBookCoverAlt(book.title)}
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
                  <span className="book-detail__value">
                    {formatCurrency(book.price)}
                  </span>
                </div>
                <Separator />
                <div className="book-detail__info-row">
                  <span className="book-detail__label">Stock</span>
                  <div className="book-detail__stock-display">
                    <span
                      className={`book-detail__value book-detail__value--medium ${book.isBundle ? 'book-detail__value--bundle' : ''}`}
                    >
                      {formatNumber(book.totalStock ?? book.stock)} unidades
                    </span>
                    {book.isBundle && (
                      <Badge
                        variant="secondary"
                        className="book-detail__virtual-badge"
                      >
                        Virtual
                      </Badge>
                    )}
                  </div>
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
                <div className="book-detail__title-row">
                  <h1 className="book-detail__title">{book.title}</h1>
                  {book.isBundle && (
                    <Badge
                      variant="secondary"
                      className="book-detail__bundle-badge"
                    >
                      Obra Completa
                    </Badge>
                  )}
                </div>
                <div className="book-detail__isbn">
                  ISBN:{' '}
                  <span className="book-detail__isbn-value">{book.isbn}</span>
                </div>
                {book.isBundle && (
                  <div className="book-detail__bundle-notice">
                    <p>
                      <strong>Nota de Inventario:</strong> Este es un artículo
                      virtual. Su stock se calcula automáticamente basándose en
                      la disponibilidad mínima de sus volúmenes individuales.
                    </p>
                  </div>
                )}
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
                  <CreatorBadgeList
                    creators={book.translators}
                    title="Traductores"
                  />
                  <CreatorBadgeList
                    creators={book.illustrators}
                    title="Ilustradores"
                  />
                </div>
              </div>

              {book.isBundle &&
                book.bundleBooks &&
                book.bundleBooks.length > 0 && (
                  <div className="book-detail__bundle-volumes">
                    <h2 className="book-detail__section-title--small">
                      Contenido de la Obra
                    </h2>
                    <div className="book-detail__volumes-list">
                      {(book.bundleBooks as BookResponse[]).map((vol) => (
                        <a
                          key={vol._id}
                          href={`/dashboard/catalog/${vol._id}`}
                          className="book-detail__volume-item"
                        >
                          <div className="book-detail__volume-dot" />
                          <span className="book-detail__volume-title">
                            {vol.title}
                          </span>
                          <span className="book-detail__volume-isbn">
                            {vol.isbn}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Operations: key figures + tabs */}
          <div className="book-detail__extra-section">
            <Separator />

            <BookAttention operations={operations.operations} />
            <BookKpiStrip
              operations={operations.operations}
              loading={operations.loading}
              unitCost={operations.unitCost}
            />

            <Tabs defaultValue="summary" className="book-detail__tabs">
              <TabsList>
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="reprint">Reimpresión</TabsTrigger>
                <TabsTrigger value="points-of-sale">
                  Puntos de venta
                </TabsTrigger>
                <TabsTrigger value="movements">Movimientos</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="book-detail__tab">
                <BookSalesStats bookId={book._id} />

                {book.costCenter && (
                  <BookFinancials costCenterName={book.costCenter} />
                )}

                <div>
                  <h2 className="book-detail__section-title">
                    Contratos y Acuerdos
                  </h2>
                  <AgreementList
                    bookId={book._id}
                    requiredCreators={[]}
                    onUpdate={fetchBook}
                  />
                </div>
              </TabsContent>

              <TabsContent value="reprint" className="book-detail__tab">
                <OperationsGate
                  state={operations}
                  bundle={
                    <BookVolumes
                      volumes={(book.bundleBooks ?? []) as BookResponse[]}
                    />
                  }
                >
                  {(ops) => (
                    <>
                      <BookReprint operations={ops} />
                      <BookDemandChart data={ops.monthlyDemand} />
                    </>
                  )}
                </OperationsGate>
              </TabsContent>

              <TabsContent value="points-of-sale" className="book-detail__tab">
                <OperationsGate state={operations}>
                  {(ops) => <BookPosRotation operations={ops} />}
                </OperationsGate>
                <BookPointsOfSale bookId={book._id} />
              </TabsContent>

              <TabsContent value="movements" className="book-detail__tab">
                <OperationsGate state={operations}>
                  {(ops) => (
                    <>
                      <BookUnitFlow operations={ops} />
                      <BookConsignment operations={ops} />
                      <BookKardex
                        bookId={book._id}
                        movements={operations.recentMovements}
                      />
                    </>
                  )}
                </OperationsGate>
              </TabsContent>
            </Tabs>
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
