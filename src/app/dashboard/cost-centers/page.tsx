'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CostCentersTable from '@/components/admin/CostCentersTable/CostCentersTable';
import { CostCenter } from '@/types/cost-center';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './page.scss';

export default function CostCentersPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.COST_CENTERS, PermissionAction.CREATE);

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // NOTE: Full CRUD modals are not yet refactored from CostCenterSelect.
  // For now, we fix the 404 and list them. Creation needs the full modal component extraction.
  // To avoid breaking the flow, we won't implement the create/edit modals in this immediate step
  // unless explicitly refactored, but the user just asked to fix the link/access.
  // HOWEVER, to provide a "premium" feel, we should at least verify if we can
  // easily implement a simple create modal or if we should notify the user.
  // Given the "Creating" task status, I will implement a basic placeholder for create
  // or just show the list for now to fix the 404 immediately.

  const fetchCostCenters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/costcenters');
      if (!res.ok) throw new Error('Error al cargar centros de costo');
      const data = await res.json();
      setCostCenters(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los centros de costo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este centro de costo?')) {
      return;
    }

    try {
      const res = await fetch(`/api/costcenters?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Centro de costo eliminado correctamente',
      });
      fetchCostCenters();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el centro de costo',
        variant: 'destructive',
      });
    }
  };

  const filteredCostCenters = costCenters.filter(
    (cc) =>
      cc.name.toLowerCase().includes(search.toLowerCase()) ||
      cc.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="cost-centers-page">
      <div className="cost-centers-page__header">
        <div className="cost-centers-page__title-group">
          <h1 className="cost-centers-page__title">Centros de Costo</h1>
          <p className="cost-centers-page__subtitle">
            Catalogación de áreas para imputación de gastos.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => toast({ title: "Próximamente", description: "La creación desde esta vista está en construcción. Usa el selector en movimientos." })}>
            <Plus className="cost-centers-page__icon" />
            Nuevo Centro
          </Button>
        )}
      </div>

      <div className="cost-centers-page__controls">
        <Input
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="cost-centers-page__search"
        />
      </div>

      <CostCentersTable
        costCenters={filteredCostCenters}
        loading={loading}
        onEdit={(cc) => toast({ title: "Próximamente", description: "La edición estará disponible pronto." })}
        onDelete={handleDelete}
      />
    </div>
  );
}
