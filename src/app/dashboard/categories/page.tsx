'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CategoriesTable from '@/components/finance/CategoriesTable';
import CreateCategoryModal from '@/components/finance/CreateCategoryModal';
import EditCategoryModal from '@/components/finance/EditCategoryModal';
import { Category } from '@/types/category';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import './categories-page.scss';


export default function CategoriesPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(
    ModuleName.CATEGORIES,
    PermissionAction.CREATE
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [typeFilter, setTypeFilter] = useState('all');


  const fetchCategories = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || c.type === typeFilter;

    return matchesSearch && matchesType;
  });


  return (
    <div className="categories-page">
      <div className="categories-page__header">
        <div className="categories-page__title-group">
          <h1 className="categories-page__title">Categorías</h1>
          <p className="categories-page__subtitle">
            Gestiona las categorías de ingresos y egresos.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="categories-page__icon" />
            Nueva Categoría
          </Button>
        )}
      </div>

      <div className="categories-page__controls">
        <Input
          placeholder="Buscar categorías..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="categories-page__search"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="categories-page__filter">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Ingreso">Ingreso</SelectItem>
            <SelectItem value="Egreso">Egreso</SelectItem>
            <SelectItem value="Ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
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
