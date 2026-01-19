'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { AgreementResponse } from '@/types/agreement';
import { FileText, Search, Eye, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { ICreator } from '@/types/creator';
import { IBook } from '@/types/book';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import './GlobalAgreementList.scss';

export default function GlobalAgreementList() {
  const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
  const [filteredAgreements, setFilteredAgreements] = useState<AgreementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchAgreements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/agreements`);
      if (!res.ok) throw new Error('Error al cargar contratos');
      const data = await res.json();
      setAgreements(data);
      setFilteredAgreements(data);
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
  }, [toast]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = agreements.filter(agreement => {
      const creatorName = ((agreement.creator as unknown as ICreator)?.name || '').toLowerCase();
      const bookTitle = ((agreement.book as unknown as IBook)?.title || '').toLowerCase();
      const role = (agreement.role || '').toLowerCase();
      return creatorName.includes(term) || bookTitle.includes(term) || role.includes(term);
    });
    setFilteredAgreements(filtered);
  }, [searchTerm, agreements]);

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

  return (
    <div className="global-agreement-list">
      <div className="global-agreement-list__controls">
        <div className="global-agreement-list__search">
          <Search className="global-agreement-list__search-icon" />
          <Input
            placeholder="Buscar por libro, creador o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="global-agreement-list__search-input"
          />
        </div>
      </div>

      <div className="global-agreement-list__table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Libro</TableHead>
              <TableHead>Creador</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Royalties (%)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead className="global-agreement-list__text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="global-agreement-list__loading-cell">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredAgreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="global-agreement-list__loading-cell">
                  No se encontraron contratos.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgreements.map((agreement) => (
                <TableRow key={agreement._id}>
                  <TableCell className="global-agreement-list__book-title">
                    <a href={`/dashboard/catalog/${(agreement.book as unknown as IBook)?._id}`} className="global-agreement-list__link">
                      {(agreement.book as unknown as IBook)?.title || 'Desconocido'}
                    </a>
                  </TableCell>
                  <TableCell>
                    <a href={`/dashboard/creators/${(agreement.creator as unknown as ICreator)?._id}`} className="global-agreement-list__link">
                      {(agreement.creator as unknown as ICreator)?.name || 'Desconocido'}
                    </a>
                  </TableCell>
                  <TableCell>
                    {agreement.role === 'author'
                      ? 'Autor'
                      : agreement.role === 'illustrator'
                        ? 'Ilustrador'
                        : 'Traductor'}
                  </TableCell>
                  <TableCell>
                    {(agreement as { isPublicDomain?: boolean }).isPublicDomain ? (
                      <Badge variant="outline" className="global-agreement-list__public-domain">
                        <BookOpen className="global-agreement-list__icon--small" />
                        Dominio Público
                      </Badge>
                    ) : (
                      `${agreement.royaltyPercentage}%`
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                  <TableCell>
                    {agreement.signedContractUrl ? (
                      <a
                        href={`/uploads/contracts/${agreement.signedContractUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="global-agreement-list__pdf-link"
                      >
                        <FileText className="global-agreement-list__icon" />
                        PDF
                      </a>
                    ) : (
                      <span className="global-agreement-list__text-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell className="global-agreement-list__text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/agreements/${agreement._id}`}
                    >
                      <Eye className="global-agreement-list__action-icon" />
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
