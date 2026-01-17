'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreatorResponse } from '@/types/creator';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { CreatorForm } from './CreatorForm';
import { useToast } from '@/components/ui/use-toast';

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
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Creadores</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Creador
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Nacionalidad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : creators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No se encontraron creadores
                </TableCell>
              </TableRow>
            ) : (
              creators.map((creator) => (
                <TableRow key={creator._id}>
                  <TableCell className="font-medium">
                    <a href={`/dashboard/creators/${creator._id}`} className="hover:underline hover:text-primary">
                      {creator.name}
                    </a>
                  </TableCell>
                  <TableCell>{creator.nationality || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(creator)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(creator._id)}
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

      <CreatorForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        creatorToEdit={selectedCreator}
        onSuccess={fetchCreators}
      />
    </div>
  );
}
