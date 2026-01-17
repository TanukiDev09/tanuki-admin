'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AgreementResponse } from '@/types/agreement';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';
import { AgreementForm } from './AgreementForm';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ICreator } from '@/types/creator';

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

  return (
    <div className="space-y-4 pt-4">
      {/* Warnings for missing agreements */}
      {missingAgreements.length > 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠️ Contratos Faltantes (Obligatorio)
          </h4>
          <div className="space-y-2">
            {missingAgreements.map(req => (
              <div key={`${req._id}-${req.role}`} className="flex items-center justify-between text-sm text-yellow-700">
                <span>
                  Falta contrato para <strong>{req.name}</strong> ({req.role})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-yellow-300 hover:bg-yellow-100"
                  onClick={() => handleCreate(req._id)}
                >
                  Crear Contrato
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contratos y Acuerdos</h3>
        <Button onClick={() => handleCreate()} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Contrato
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creador</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Royalties (%)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : agreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No hay contratos registrados para este libro.
                </TableCell>
              </TableRow>
            ) : (
              agreements.map((agreement) => (
                <TableRow key={agreement._id}>
                  <TableCell className="font-medium">
                    {(agreement.creator as unknown as ICreator)?.name || 'Desconocido'}
                  </TableCell>
                  <TableCell>
                    {agreement.role === 'author'
                      ? 'Autor'
                      : agreement.role === 'illustrator'
                        ? 'Ilustrador'
                        : 'Traductor'}
                  </TableCell>
                  <TableCell>{agreement.royaltyPercentage}%</TableCell>
                  <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                  <TableCell>
                    {agreement.signedContractUrl ? (
                      <a
                        href={`/uploads/contracts/${agreement.signedContractUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(agreement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(agreement._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
