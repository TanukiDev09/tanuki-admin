'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit, Book as BookIcon, Globe, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreatorResponse } from '@/types/creator';
import { BookResponse } from '@/types/book';
import { AgreementResponse } from '@/types/agreement';
import { useToast } from '@/components/ui/Toast';
import { Separator } from '@/components/ui/Separator';
import { CreatorForm } from '@/components/creators/CreatorForm';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatNumber } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

import './creator-detail.scss';

const BookProfitabilityChart = dynamic(() => import('@/components/dashboard/BookProfitabilityChart/BookProfitabilityChart').then(mod => mod.BookProfitabilityChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted/10 animate-pulse rounded-lg" />
});

export default function CreatorDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [creator, setCreator] = useState<CreatorResponse | null>(null);
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(ModuleName.CREATORS, PermissionAction.UPDATE);

  const fetchData = useCallback(async () => {
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

      // Fetch Agreements by Creator
      const resAgreements = await fetch(`/api/agreements?creatorId=${params.id}`);
      if (resAgreements.ok) {
        const dataAgreements = await resAgreements.json();
        setAgreements(dataAgreements);
      }

      // Fetch Financial Summary (Profitability by Book)
      const resFinance = await fetch(`/api/finance/summary?creatorId=${params.id}&groupBy=book`);
      if (resFinance.ok) {
        const dataFinance = await resFinance.json();
        setFinancialData(dataFinance);
      }
    } catch {
      // ...
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del creador',
        variant: 'destructive',
      });
      router.push('/dashboard/creators');
    } finally {
      setLoading(false);
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditSuccess = () => {
    fetchData();
    setEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="creator-detail__loading">
        Cargando...
      </div>
    );
  }

  if (!creator) return null;

  return (
    <>
      <div className="creator-detail">
        <div className="creator-detail__container">
          {/* Header / Nav */}
          <div className="creator-detail__header">
            <Button variant="ghost" className="creator-detail__header-btn" onClick={() => router.back()}>
              <ArrowLeft className="creator-detail__icon" />
              Volver a Creadores
            </Button>
            <div className="creator-detail__header-actions">
              {canUpdate && (
                <Button onClick={() => setEditModalOpen(true)}>
                  <Edit className="creator-detail__icon" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="creator-detail__grid">
            {/* Left Column: Profile Info */}
            <div className="creator-detail__profile-section">
              <div className="creator-detail__avatar-wrapper">
                {creator.photo ? (
                  <Image
                    src={`/uploads/creators/${creator.photo}`}
                    alt={creator.name}
                    fill
                    className="creator-detail__avatar-image"
                    sizes="(max-width: 768px) 192px, 192px"
                  />
                ) : (
                  <div className="creator-detail__avatar-placeholder">
                    {creator.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="creator-detail__info-card">
                <div className="creator-detail__info-row">
                  <MapPin className="creator-detail__icon" />
                  <span className="creator-detail__text-foreground">{creator.nationality || 'Nacionalidad no especificada'}</span>
                </div>
                {(creator.website) && (
                  <>
                    <Separator />
                    <div className="creator-detail__info-row">
                      <Globe className="creator-detail__icon" />
                      <a href={creator.website} target="_blank" rel="noopener noreferrer" className="creator-detail__link">
                        {creator.website}
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Bio & Works */}
            <div className="creator-detail__content-section">
              <div>
                <h1 className="creator-detail__name">{creator.name}</h1>
                <p className="creator-detail__bio">
                  {creator.bio || 'Sin biografía disponible.'}
                </p>
              </div>

              <Separator />

              {Array.isArray(financialData) && financialData.length > 0 && (
                <>
                  <div>
                    <h2 className="creator-detail__section-title">
                      <TrendingUp className="creator-detail__icon-lg" />
                      Rentabilidad por Libro (Histórico)
                    </h2>
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <BookProfitabilityChart data={financialData} />
                    </div>
                  </div>
                  <Separator className="my-6" />
                </>
              )}

              <div>
                <h2 className="creator-detail__section-title">
                  <BookIcon className="creator-detail__icon-lg" />
                  Bibliografía ({books.length})
                </h2>

                {books.length === 0 ? (
                  <p className="creator-detail__book-list-empty">No hay libros registrados para este creador.</p>
                ) : (
                  <div className="creator-detail__books-grid">
                    {books.map(book => (
                      <div key={book._id} className="creator-detail__book-card" onClick={() => router.push(`/dashboard/catalogo/${book._id}`)}>
                        <div className="creator-detail__book-cover">
                          {book.coverImage && <Image src={`/uploads/covers/${book.coverImage}`} alt={book.title} fill className="creator-detail__book-image" sizes="56px" />}
                        </div>
                        <div className="creator-detail__book-info">
                          <h3 className="creator-detail__book-title">{book.title}</h3>
                          <p className="creator-detail__book-genre">{book.genre}</p>
                          <div className="creator-detail__badges">
                            {book.authors?.some(a => (typeof a === 'string' ? a : a._id) === creator._id) && <Badge variant="secondary" className="creator-detail__badge-small">Autor</Badge>}
                            {book.translators?.some(a => (typeof a === 'string' ? a : a._id) === creator._id) && <Badge variant="secondary" className="creator-detail__badge-small">Traductor</Badge>}
                            {book.illustrators?.some(a => (typeof a === 'string' ? a : a._id) === creator._id) && <Badge variant="secondary" className="creator-detail__badge-small">Ilustrador</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="creator-detail__section-title">
                  <FileText className="creator-detail__icon-lg" />
                  Contratos ({agreements.length})
                </h2>

                {agreements.length === 0 ? (
                  <p className="creator-detail__book-list-empty">No hay contratos registrados.</p>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Libro</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Royalties</TableHead>
                          <TableHead>Documento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agreements.map((agreement) => (
                          <TableRow key={agreement._id}>
                            <TableCell className="font-medium">
                              {/* Safe cast or check if book is object */}
                              {typeof agreement.book === 'object' && agreement.book !== null
                                ? (agreement.book as { title: string }).title
                                : 'Libro no disponible'}
                            </TableCell>
                            <TableCell className="capitalize">
                              {agreement.role === 'author' && 'Autor'}
                              {agreement.role === 'translator' && 'Traductor'}
                              {agreement.role === 'illustrator' && 'Ilustrador'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                agreement.status === 'active' ? 'success' :
                                  agreement.status === 'draft' ? 'secondary' : 'destructive'
                              }>
                                {agreement.status === 'active' ? 'Activo' :
                                  agreement.status === 'draft' ? 'Borrador' : 'Terminado'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {agreement.isPublicDomain ? (
                                <Badge variant="outline">Dominio Público</Badge>
                              ) : (
                                `${formatNumber(agreement.royaltyPercentage)}%`
                              )}
                            </TableCell>
                            <TableCell>
                              {agreement.signedContractUrl ? (
                                <a
                                  href={`/uploads/contracts/${agreement.signedContractUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <FileText size={14} /> PDF
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
