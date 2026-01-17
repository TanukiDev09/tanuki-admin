'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Book as BookIcon, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreatorResponse } from '@/types/creator';
import { BookResponse } from '@/types/book';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { CreatorForm } from '@/components/creators/CreatorForm';

export default function CreatorDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [creator, setCreator] = useState<CreatorResponse | null>(null);
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Creator
      const resCreator = await fetch(`/api/creators/${params.id}`);
      if (!resCreator.ok) throw new Error('Creador no encontrado');
      const dataCreator = await resCreator.json();
      setCreator(dataCreator);

      // Fetch Books by Creator
      const resBooks = await fetch(`/api/books?creatorId=${params.id}&limit=100`);
      if (resBooks.ok) {
        const dataBooks = await resBooks.json();
        setBooks(dataBooks.data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del creador',
        variant: 'destructive',
      });
      router.push('/dashboard/creators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const handleEditSuccess = () => {
    fetchData();
    setEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!creator) return null;

  return (
    <>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header / Nav */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Creadores
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Perfil
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Profile Info */}
            <div className="space-y-6">
              <div className="aspect-square relative rounded-full overflow-hidden border bg-muted shadow-sm mx-auto w-48 h-48 md:w-full md:h-auto">
                {creator.photo ? (
                  <img
                    src={`/uploads/creators/${creator.photo}`} // Assuming path
                    alt={creator.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-3xl bg-primary/10 text-primary">
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-foreground">{creator.nationality || 'Nacionalidad no especificada'}</span>
                </div>
                {(creator.website) && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={creator.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {creator.website}
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Bio & Works */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">{creator.name}</h1>
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {creator.bio || 'Sin biografía disponible.'}
                </p>
              </div>

              <Separator />

              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BookIcon className="h-5 w-5" />
                  Bibliografía ({books.length})
                </h2>

                {books.length === 0 ? (
                  <p className="text-muted-foreground">No hay libros registrados para este creador.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {books.map(book => (
                      <div key={book._id} className="border rounded-lg p-4 flex gap-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/catalogo/${book._id}`)}>
                        <div className="h-20 w-14 bg-muted rounded shrink-0 overflow-hidden">
                          {book.coverImage && <img src={`/uploads/covers/${book.coverImage}`} alt={book.title} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                          <p className="text-xs text-muted-foreground mb-1">{book.genre}</p>
                          <div className="flex flex-wrap gap-1">
                            {(book.authors as any[]).some((a: any) => (typeof a === 'string' ? a : a._id) === creator._id) && <Badge variant="secondary" className="text-[10px]">Autor</Badge>}
                            {(book.translators as any[]).some((a: any) => (typeof a === 'string' ? a : a._id) === creator._id) && <Badge variant="secondary" className="text-[10px]">Traductor</Badge>}
                            {(book.illustrators as any[]).some((a: any) => (typeof a === 'string' ? a : a._id) === creator._id) && <Badge variant="secondary" className="text-[10px]">Ilustrador</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CreatorForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
        creatorToEdit={creator}
      />
    </>
  );
}
