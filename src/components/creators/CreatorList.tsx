'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { CreatorResponse } from '@/types/creator';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { CreatorForm } from './CreatorForm';
import { useToast } from '@/components/ui/Toast';
import './CreatorList.scss';

export default function CreatorList() {
  const router = useRouter();
  const [creators, setCreators] = useState<CreatorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<
    CreatorResponse | null
  >(null);

  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(ModuleName.CREATORS, PermissionAction.CREATE);
  const canUpdate = hasPermission(ModuleName.CREATORS, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.CREATORS, PermissionAction.DELETE);

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(`/api/creators?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar creadores');
      const data = await res.json();
      setCreators(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los creadores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este creador?')) return;

    try {
      const res = await fetch(`/api/creators/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Creador eliminado correctamente',
      });
      fetchCreators();
      router.refresh();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el creador',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (creator: CreatorResponse) => {
    setSelectedCreator(creator);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCreator(null);
    setIsModalOpen(true);
  };

  return (
    <div className="creator-list">
      <div className="creator-list__header">
        <h2 className="creator-list__title">Gestión de Creadores</h2>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="creator-list__create-icon" />
            Nuevo Creador
          </Button>
        )}
      </div>

      <div className="creator-list__search-container">
        <div className="creator-list__search-wrapper">
          <Search className="creator-list__search-icon" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="creator-list__search-input"
          />
        </div>
      </div>

      <div className="creator-list__table-wrapper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Nacionalidad</TableHead>
              <TableHead className="creator-list__actions-head">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="creator-list__loading-cell">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : creators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="creator-list__loading-cell">
                  No se encontraron creadores
                </TableCell>
              </TableRow>
            ) : (
              creators.filter(c => c).map((creator) => (
                <TableRow key={creator._id}>
                  <TableCell className="creator-list__name-cell">
                    <a href={`/dashboard/creators/${creator._id}`} className="creator-list__name-link">
                      {creator.name}
                    </a>
                  </TableCell>
                  <TableCell>{creator.nationality || '-'}</TableCell>
                  <TableCell className="creator-list__actions-cell">
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(creator)}
                      >
                        <Edit className="creator-list__action-icon" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(creator._id)}
                        className="creator-list__delete-btn"
                      >
                        <Trash2 className="creator-list__action-icon" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreatorForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        creatorToEdit={selectedCreator}
        onSuccess={fetchCreators}
      />
    </div>
  );
}
