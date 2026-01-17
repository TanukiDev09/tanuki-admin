'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgreementResponse } from '@/types/agreement';
import { useToast } from '@/components/ui/use-toast';
import { AgreementForm } from '@/components/agreements/AgreementForm';
import { Separator } from '@/components/ui/separator';
import { ICreator } from '@/types/creator';
import { IBook } from '@/types/book';

export default function AgreementDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [agreement, setAgreement] = useState<AgreementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchAgreement = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/agreements/${params.id}`);
      if (!res.ok) throw new Error('Contrato no encontrado');
      const data = await res.json();
      setAgreement(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el contrato',
        variant: 'destructive',
      });
      router.push('/dashboard/agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreement();
  }, [params.id]);

  const handleEditSuccess = () => {
    fetchAgreement();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!agreement) return null;

  const creatorName = (agreement.creator as unknown as ICreator)?.name || 'Desconocido';
  const bookTitle = (agreement.book as unknown as IBook)?.title || 'Desconocido';
  const roleLabel = agreement.role === 'author' ? 'Autor' : agreement.role === 'illustrator' ? 'Ilustrador' : 'Traductor';

  return (
    <>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-muted/20">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Contrato: {bookTitle}</h1>
                  <p className="text-muted-foreground text-lg">{creatorName} — {roleLabel}</p>
                </div>
                {getStatusBadge(agreement.status)}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Tipo de Acuerdo</h3>
                  <p className="text-lg font-semibold">{agreement.royaltyPercentage > 0 ? 'Regalías' : 'Pago de Contado'}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {agreement.royaltyPercentage > 0 ? '% Royalties' : 'Monto Pago'}
                  </h3>
                  <p className="text-lg font-mono">
                    {agreement.royaltyPercentage > 0 ? `${agreement.royaltyPercentage}%` : `$${agreement.advancePayment || 0}`}
                  </p>
                </div>
                {agreement.royaltyPercentage > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Adelanto</h3>
                    <p className="text-lg font-mono">${agreement.advancePayment || 0}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Fechas</h3>
                  <p>
                    {agreement.validFrom ? new Date(agreement.validFrom).toLocaleDateString() : '—'}
                    {' -> '}
                    {agreement.validUntil ? new Date(agreement.validUntil).toLocaleDateString() : 'Indefinido'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Documento Firmado</h3>
                {agreement.signedContractUrl ? (
                  <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/10">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Contrato Firmado.pdf</p>
                      <p className="text-xs text-muted-foreground">Disponible para descarga</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/uploads/contracts/${agreement.signedContractUrl}`} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar / Ver
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">No se ha subido ningún documento PDF.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AgreementForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        bookId={(agreement.book as unknown as IBook)?._id.toString()}
        agreementToEdit={agreement}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
