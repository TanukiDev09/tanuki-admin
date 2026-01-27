'use client';

import { useState, useEffect } from 'react';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryMatrixTable } from '@/components/inventory/InventoryMatrixTable';
import { InventoryMovementsList } from '@/components/inventory/InventoryMovementsList';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import './inventory-page.scss';

const InventoryMovementModal = dynamic(
  () =>
    import('@/components/inventory/InventoryMovementModal').then(
      (mod) => mod.InventoryMovementModal
    ),
  { ssr: false }
);

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalUnits: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    editorialUnits: 0,
    otherUnits: 0,
  });
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movementModalOpen, setMovementModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, movementsRes] = await Promise.all([
        fetch('/api/inventory/stats'),
        fetch('/api/inventory/movements?limit=10'),
      ]);

      const statsData = await statsRes.json();
      const movementsData = await movementsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (movementsData.success) {
        setMovements(movementsData.data);
      }
    } catch (error) {
      console.error('Error fetching inventory data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="inventory-page">
      <div className="inventory-page__header">
        <div className="inventory-page__title-group">
          <h1 className="inventory-page__title">Inventario</h1>
          <p className="inventory-page__description">
            Resumen general del estado del inventario y movimientos recientes.
          </p>
        </div>
        <div className="inventory-page__header-actions">
          <Button
            onClick={() => setMovementModalOpen(true)}
            className="inventory-page__btn"
          >
            <Plus className="inventory-page__icon" /> Nuevo Movimiento
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <h2 className="sr-only">Resumen de Inventario</h2>
      <InventoryStats stats={stats} isLoading={loading} />

      <div className="inventory-page__content">
        <InventoryMatrixTable />

        <div className="inventory-page__section">
          <h2 className="inventory-page__section-title">Últimos Movimientos</h2>
          <InventoryMovementsList
            movements={movements}
            isLoading={loading}
            onRefresh={fetchData}
          />
        </div>
      </div>

      <InventoryMovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
