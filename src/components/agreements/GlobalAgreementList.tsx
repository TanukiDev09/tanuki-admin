'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AgreementResponse } from '@/types/agreement';
import { FileText, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ICreator } from '@/types/creator';
import { IBook } from '@/types/book';
import { Input } from '@/components/ui/input';

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por libro, creador o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Libro</TableHead>
              <TableHead>Creador</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Royalties (%)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contrato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredAgreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron contratos.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgreements.map((agreement) => (
                <TableRow key={agreement._id}>
                  <TableCell className="font-medium">
                    <a href={`/dashboard/catalog/${(agreement.book as unknown as IBook)?._id}`} className="hover:underline hover:text-primary">
                      {(agreement.book as unknown as IBook)?.title || 'Desconocido'}
                    </a>
                  </TableCell>
                  <TableCell>
                    <a href={`/dashboard/creators/${(agreement.creator as unknown as ICreator)?._id}`} className="hover:underline hover:text-primary">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
