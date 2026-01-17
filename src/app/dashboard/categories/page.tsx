'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CategoriesTable from '@/components/finance/CategoriesTable';
import CreateCategoryModal from '@/components/finance/CreateCategoryModal';
import EditCategoryModal from '@/components/finance/EditCategoryModal';
import { Category } from '@/types/category';
import { Input } from '@/components/ui/input';

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/categories');
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Categoría eliminada correctamente',
      });
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        variant: 'destructive',
      });
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de ingresos y egresos.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Buscar categorías..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <CategoriesTable
        categories={filteredCategories}
        loading={loading}
        onEdit={(cat) => {
          setSelectedCategory(cat);
          setEditModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <CreateCategoryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchCategories}
      />

      <EditCategoryModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={fetchCategories}
        category={selectedCategory}
      />
    </div>
  );
}
