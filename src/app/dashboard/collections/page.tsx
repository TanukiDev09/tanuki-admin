'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CollectionsTable from '@/components/collections/CollectionsTable';
import CreateCollectionModal from '@/components/collections/CreateCollectionModal';
import EditCollectionModal from '@/components/collections/EditCollectionModal';
import { Collection } from '@/types/collection';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './collections-page.scss';

export default function CollectionsPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(
    ModuleName.COLLECTIONS,
    PermissionAction.CREATE
  );

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(
    null
  );

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/collections');
      if (!res.ok) throw new Error('Error al cargar colecciones');
      const data = await res.json();
      setCollections(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las colecciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta colección?')) {
      return;
    }

    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Colección eliminada correctamente',
      });
      fetchCollections();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la colección',
        variant: 'destructive',
      });
    }
  };

  const filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="collections-page">
      <div className="collections-page__header">
        <div className="collections-page__title-group">
          <h1 className="collections-page__title">Colecciones</h1>
          <p className="collections-page__subtitle">
            Gestiona las colecciones de libros del catálogo.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="collections-page__icon" />
            Nueva Colección
          </Button>
        )}
      </div>

      <div className="collections-page__controls">
        <Input
          placeholder="Buscar colecciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="collections-page__search"
        />
      </div>

      <CollectionsTable
        collections={filteredCollections}
        loading={loading}
        onEdit={(coll) => {
          setSelectedCollection(coll);
          setEditModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchCollections}
      />

      <EditCollectionModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCollection(null);
        }}
        onSuccess={fetchCollections}
        collection={selectedCollection}
      />
    </div>
  );
}
