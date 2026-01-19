'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AgreementResponse } from '@/types/agreement';
import { useToast } from '@/components/ui/Toast';
import { AgreementForm } from '@/components/agreements/AgreementForm';
import { AgreementDetails } from '@/components/agreements/AgreementDetails';
import { SignedContractInfo } from '@/components/agreements/SignedContractInfo';
import { Separator } from '@/components/ui/Separator';
import { ICreator } from '@/types/creator';
import { IBook } from '@/types/book';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './agreement-page.scss';

export default function AgreementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [agreement, setAgreement] = useState<AgreementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.AGREEMENTS,
    PermissionAction.UPDATE
  );

  const fetchAgreement = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/agreements/${params.id}`);
      if (!res.ok) throw new Error('Contrato no encontrado');
      const data = await res.json();
      setAgreement(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el contrato',
        variant: 'destructive',
      });
      router.push('/dashboard/agreements');
    } finally {
      setLoading(false);
    }
  }, [params.id, router, toast]);

  useEffect(() => {
    fetchAgreement();
  }, [fetchAgreement]);

  const handleEditSuccess = () => {
    fetchAgreement();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
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
      <div className="agreement-page__loading">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!agreement) return null;

  const creatorName =
    (agreement.creator as unknown as ICreator)?.name || 'Desconocido';
  const bookTitle =
    (agreement.book as unknown as IBook)?.title || 'Desconocido';
  const roleLabel =
    agreement.role === 'author'
      ? 'Autor'
      : agreement.role === 'illustrator'
        ? 'Ilustrador'
        : 'Traductor';

  return (
    <>
      <div className="agreement-page">
        <div className="agreement-page__container">
          <div className="agreement-page__header-nav">
            <Button
              variant="ghost"
              className="agreement-page__back-btn"
              onClick={() => router.back()}
            >
              <ArrowLeft className="agreement-page__icon" />
              Volver
            </Button>
            <div className="agreement-page__actions">
              {canUpdate && (
                <Button onClick={() => setEditModalOpen(true)}>
                  <Edit className="agreement-page__icon" />
                  Editar
                </Button>
              )}
            </div>
          </div>

          <div className="agreement-page__card">
            <div className="agreement-page__card-header">
              <div>
                <h1 className="agreement-page__title">Contrato: {bookTitle}</h1>
                <p className="agreement-page__subtitle">
                  {creatorName} — {roleLabel}
                </p>
              </div>
              {getStatusBadge(agreement.status)}
            </div>

            <div className="agreement-page__card-content">
              <AgreementDetails agreement={agreement} />

              <Separator />

              <div>
                <h3 className="agreement-page__section-title">
                  Documento Firmado
                </h3>
                <SignedContractInfo url={agreement.signedContractUrl} />
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
