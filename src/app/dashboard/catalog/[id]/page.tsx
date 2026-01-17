'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookResponse } from '@/types/book';
import { useToast } from '@/components/ui/use-toast';
import EditBookModal from '@/components/admin/EditBookModal';
import AgreementList from '@/components/agreements/AgreementList';
import { Separator } from '@/components/ui/separator';
import { CreatorResponse } from '@/types/creator'; // Assuming this exists with name/etc
import BookFinancials from '@/components/books/BookFinancials';
import BookInventorySummary from '@/components/books/BookInventorySummary';

// Helper to display creators
const CreatorBadgeList = ({ creators, title }: { creators: string[] | CreatorResponse[] | undefined, title: string }) => {
  if (!creators || creators.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {(creators as any[]).map((c) => {
          const name = typeof c === 'string' ? c : c.name;
          const id = typeof c === 'string' ? c : c._id;
          return (
            <Badge key={id} variant="outline" className="text-sm py-1 px-3">
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

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/books/${params.id}`);
      if (!res.ok) throw new Error('Libro no encontrado');
      const data = await res.json();
      if (data.success) {
        setBook(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el libro',
        variant: 'destructive',
      });
      router.push('/dashboard/catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [params.id]);

  const handleEditSuccess = () => {
    fetchBook();
    setEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!book) return null;

  return (
    <>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header / Nav */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Catálogo
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          {/* Main Content - Two Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Cover & Key Info */}
            <div className="space-y-6">
              <div className="aspect-2/3 relative rounded-lg overflow-hidden border bg-muted shadow-sm">
                {book.coverImage ? (
                  <img
                    src={`/uploads/covers/${book.coverImage}`}
                    alt={book.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sin Portada
                  </div>
                )}
              </div>

              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio</span>
                  <span className="font-semibold text-lg">${book.price.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock</span>
                  <span className="font-medium">{book.stock} unidades</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant={book.isActive ? 'default' : 'secondary'}>
                    {book.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Description & Metadata */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
                <div className="text-muted-foreground mb-4">
                  ISBN: <span className="font-mono text-foreground">{book.isbn}</span>
                </div>
                <p className="text-lg leading-relaxed text-foreground/90">
                  {book.description || 'Sin descripción disponible.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="min-w-[200px] flex-1">
                  <h3 className="font-medium text-muted-foreground mb-1">Género</h3>
                  <p>{book.genre}</p>
                </div>
                <div className="min-w-[200px] flex-1">
                  <h3 className="font-medium text-muted-foreground mb-1">Idioma</h3>
                  <p>{book.language === 'es' ? 'Español' : book.language}</p>
                </div>
                <div className="min-w-[200px] flex-1">
                  <h3 className="font-medium text-muted-foreground mb-1">Páginas</h3>
                  <p>{book.pages}</p>
                </div>
                <div className="min-w-[200px] flex-1">
                  <h3 className="font-medium text-muted-foreground mb-1">Publicación</h3>
                  <p>{new Date(book.publicationDate).toLocaleDateString()}</p>
                </div>
                <div className="min-w-[200px] flex-1">
                  <h3 className="font-medium text-muted-foreground mb-1">Colección</h3>
                  <p>{book.collectionName || '-'}</p>
                </div>
                <div className="min-w-[200px] flex-1">
                  <h3 className="font-medium text-muted-foreground mb-1">Centro de Costos</h3>
                  <p>{book.costCenter || '-'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Créditos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <CreatorBadgeList creators={book.authors} title="Autores" />
                  <CreatorBadgeList creators={book.translators} title="Traductores" />
                  <CreatorBadgeList creators={book.illustrators} title="Ilustradores" />
                </div>
              </div>
            </div>
          </div>

          {/* Single Column Section - Financials, Inventory, Credits, and Agreements */}
          <div className="mt-8 space-y-8">
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
              <h2 className="text-xl font-semibold mb-4">Contratos y Acuerdos</h2>
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
