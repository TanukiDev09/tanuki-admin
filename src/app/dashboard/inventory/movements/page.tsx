'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { InventoryMovementsList } from '@/components/inventory/InventoryMovementsList';
import { InventoryMovementFilters } from './components/InventoryMovementFilters';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Loader2,
  PackageSearch
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import './movements-history.scss';

export default function InventoryMovementsHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for movements and pagination
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 15;

  // Filters State
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (warehouseFilter !== 'ALL') params.append('warehouseId', warehouseFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/inventory/movements?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMovements(data.data);
        setTotalPages(data.meta.totalPages);
        setTotalResults(data.meta.total);
      } else {
        throw new Error(data.error || 'Error al cargar movimientos');
      }
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos de inventario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, warehouseFilter, startDate, endDate, toast]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const clearFilters = () => {
    setTypeFilter('ALL');
    setWarehouseFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, warehouseFilter, startDate, endDate]);

  return (
    <div className="movements-history">
      <div className="movements-history__header">
        <div className="movements-history__title-group">
          <div className="flex items-center gap-2 mb-1">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="h-8 w-8"
             >
                <ArrowLeft className="h-4 w-4" />
             </Button>
             <h1 className="movements-history__title">Historial de Movimientos</h1>
          </div>
          <p className="movements-history__description">
            Consulta todos los registros de entrada, salida y ajustes de inventario.
          </p>
        </div>
      </div>

      <InventoryMovementFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        warehouseFilter={warehouseFilter}
        setWarehouseFilter={setWarehouseFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        clearFilters={clearFilters}
      />

      <div className="movements-history__content">
        {loading ? (
          <div className="movements-history__loader">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando historial...</span>
          </div>
        ) : movements.length === 0 ? (
          <div className="movements-history__empty">
            <PackageSearch className="movements-history__empty-icon" />
            <p>No se encontraron movimientos con los filtros aplicados</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="movements-history__table-wrapper">
              <InventoryMovementsList 
                movements={movements} 
                isLoading={false} 
                onRefresh={fetchMovements} 
              />
            </div>

            <div className="movements-history__pagination">
              <div className="movements-history__pagination-info">
                Mostrando <strong>{movements.length}</strong> de <strong>{totalResults}</strong> movimientos
              </div>
              <div className="movements-history__pagination-controls">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="movements-history__pagination-btn"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="movements-history__pagination-current">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                  className="movements-history__pagination-btn"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
