'use client';

import { useState, useEffect } from 'react';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryMatrixTable } from '@/components/inventory/InventoryMatrixTable';
import { InventoryMovementsList } from '@/components/inventory/InventoryMovementsList';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalUnits: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, movementsRes] = await Promise.all([
        fetch('/api/inventory/stats'),
        fetch('/api/inventory/movements?limit=10')
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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Resumen general del estado del inventario y movimientos recientes.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} title="Actualizar">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <InventoryStats stats={stats} isLoading={loading} />

      <div className="space-y-6">
        <InventoryMatrixTable />

        <div>
          <h2 className="text-xl font-semibold mb-4">Últimos Movimientos</h2>
          <InventoryMovementsList movements={movements} isLoading={loading} />
        </div>
      </div>
    </div>
  );
}
