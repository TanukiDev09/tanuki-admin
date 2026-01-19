'use client';

import { useState, useEffect, useCallback } from 'react';
import { AgreementResponse } from '@/types/agreement';
import { Edit, Trash2, Plus, FileText, BookOpen } from 'lucide-react';
import { AgreementForm } from '../AgreementForm';
import { useToast } from '@/components/ui/Toast';
import { ICreator } from '@/types/creator';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatNumber } from '@/lib/utils';
import './AgreementList.scss';

interface AgreementListProps {
  bookId: string;
  requiredCreators?: { _id: string; name: string; role: string }[];
  onUpdate?: () => void;
}

export default function AgreementList({ bookId, requiredCreators = [], onUpdate }: AgreementListProps) {
  const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementResponse | null>(null);
  const [preselectedCreator, setPreselectedCreator] = useState<string>('');

  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.AGREEMENTS, PermissionAction.CREATE);
  const canUpdate = hasPermission(ModuleName.AGREEMENTS, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.AGREEMENTS, PermissionAction.DELETE);

  const fetchAgreements = useCallback(async () => {
    if (!bookId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/agreements?bookId=${bookId}`);
      if (!res.ok) throw new Error('Error al cargar contratos');
      const data = await res.json();
      setAgreements(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los contratos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [bookId, toast]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  // Identify creators without agreements
  const missingAgreements = requiredCreators.filter(req => {
    // Check if there is an active or draft agreement for this creator
    const hasAgreement = agreements.some(a => {
      const creatorId = typeof a.creator === 'object'
        ? String((a.creator as { _id: unknown })._id)
        : a.creator;
      return creatorId === req._id && a.status !== 'terminated';
    });
    return !hasAgreement;
  });

  const handleAgreementChangeSuccess = () => {
    fetchAgreements();
    if (onUpdate) onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este contrato?')) return;

    try {
      const res = await fetch(`/api/agreements/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Contrato eliminado correctamente',
        variant: 'default',
      });
      handleAgreementChangeSuccess();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el contrato',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (agreement: AgreementResponse) => {
    setSelectedAgreement(agreement);
    setPreselectedCreator('');
    setIsModalOpen(true);
  };

  const handleCreate = (creatorId: string = '') => {
    setSelectedAgreement(null);
    setPreselectedCreator(creatorId);
    setIsModalOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'terminated': return 'Terminado';
      default: return status;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'author': return 'Autor';
      case 'illustrator': return 'Ilustrador';
      case 'translator': return 'Traductor';
      default: return role;
    }
  };

  return (
    <div className="agreement-list">
      {/* Warnings for missing agreements */}
      {missingAgreements.length > 0 && !loading && (
        <div className="agreement-list__warning">
          <h4 className="agreement-list__warning-title">
            ⚠️ Contratos Faltantes (Obligatorio)
          </h4>
          <div className="agreement-list__warning-list">
            {missingAgreements.map(req => (
              <div key={`${req._id}-${req.role}`} className="agreement-list__warning-item">
                <span>
                  Falta contrato para <strong>{req.name}</strong> ({req.role})
                </span>
                {canCreate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="agreement-list__create-btn"
                    onClick={() => handleCreate(req._id)}
                  >
                    Crear Contrato
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="agreement-list__header">
        <h3 className="agreement-list__title">Contratos y Acuerdos</h3>
        {canCreate && (
          <Button onClick={() => handleCreate()} size="sm" className="agreement-list__new-btn">
            <Plus className="agreement-list__icon" />
            Nuevo Contrato
          </Button>
        )}
      </div>

      <div className="agreement-list__table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creador</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Royalties (%)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead className="agreement-list__actions-head">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="agreement-list__loading-cell">
                  <div className="agreement-list__loading">
                    <div className="agreement-list__spinner" />
                    <span>Cargando contratos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : agreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="agreement-list__empty-cell">
                  <span className="agreement-list__empty-text">No hay contratos registrados para este libro.</span>
                </TableCell>
              </TableRow>
            ) : (
              agreements.map((agreement) => (
                <TableRow key={agreement._id}>
                  <TableCell className="agreement-list__creator-name">
                    <a
                      href={`/dashboard/agreements/${agreement._id}`}
                      className="agreement-list__link"
                    >
                      {(agreement.creator as unknown as ICreator)?.name || 'Desconocido'}
                    </a>
                  </TableCell>
                  <TableCell>
                    {getRoleLabel(agreement.role)}
                  </TableCell>
                  <TableCell>
                    {(agreement as { isPublicDomain?: boolean }).isPublicDomain ? (
                      <Badge variant="outline" className="agreement-list__public-domain">
                        <BookOpen className="agreement-list__icon-sm" />
                        Dominio Público
                      </Badge>
                    ) : (
                      `${formatNumber(agreement.royaltyPercentage)}%`
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(agreement.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>
                      {getStatusLabel(agreement.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {agreement.signedContractUrl ? (
                      <a
                        href={`/uploads/contracts/${agreement.signedContractUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="agreement-list__pdf-link"
                      >
                        <FileText className="agreement-list__icon-sm" />
                        PDF
                      </a>
                    ) : (
                      <span className="agreement-list__no-contract">-</span>
                    )}
                  </TableCell>
                  <TableCell className="agreement-list__actions-cell">
                    <div className="agreement-list__actions">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(agreement)}
                          title="Editar"
                        >
                          <Edit className="agreement-list__icon" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(agreement._id)}
                          className="agreement-list__delete-btn"
                          title="Eliminar"
                        >
                          <Trash2 className="agreement-list__icon" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Note: AgreementForm will need to be migrated next, for now imports from parent dir */}
      <AgreementForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        bookId={bookId}
        agreementToEdit={selectedAgreement}
        preselectedCreator={preselectedCreator}
        onSuccess={handleAgreementChangeSuccess}
      />
    </div>
  );
}
