'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InventoryList } from '@/components/inventory/InventoryList';
import { InventoryAdjustModal } from '@/components/inventory/InventoryAdjustModal';
import { AddBookToInventoryModal } from '@/components/inventory/AddBookToInventoryModal';
import { Warehouse, Package, Building2, ExternalLink, Plus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import './PointOfSaleStock.scss';

interface PointOfSaleStockProps {
  warehouseId?: string;
}

interface Book {
  _id: string;
  title: string;
  isbn: string;
  price: number;
  coverImage?: string;
}

interface InventoryItem {
  _id: string;
  bookId: Book;
  quantity: number;
  minStock?: number;
  maxStock?: number;
}

export function PointOfSaleStock({ warehouseId }: PointOfSaleStockProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouse, setWarehouse] = useState<{ name: string; code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    mode: 'add' | 'remove' | 'set';
  }>({
    isOpen: false,
    item: null,
    mode: 'add',
  });

  const fetchData = useCallback(async () => {
    if (!warehouseId) {
      setLoading(false);
      return;
    }

    try {
      const [warehouseRes, inventoryRes] = await Promise.all([
        fetch(`/api/warehouses/${warehouseId}`),
        fetch(`/api/inventory/warehouse/${warehouseId}`)
      ]);

      if (warehouseRes.ok) {
        setWarehouse(await warehouseRes.json());
      }

      if (inventoryRes.ok) {
        setInventory(await inventoryRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustStock = (item: InventoryItem, mode: 'add' | 'remove' | 'set') => {
    setAdjustModal({
      isOpen: true,
      item,
      mode,
    });
  };

  if (!warehouseId) {
    return (
      <div className="pos-stock__empty">
        <Warehouse className="pos-stock__empty-icon" />
        <h3 className="pos-stock__empty-title">No hay bodega asociada</h3>
        <p className="pos-stock__empty-text">
          Este punto de venta aún no tiene una bodega asociada para gestionar inventario.
        </p>
        <div className="pos-stock__empty-actions">
          <Button variant="outline" asChild>
            <Link href="/dashboard/warehouses/new">
              Crear Nueva Bodega
            </Link>
          </Button>
          <Button disabled>Asociar Bodega Existente</Button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="pos-stock__loading">Cargando inventario...</div>;

  return (
    <div className="pos-stock__container">
      <div className="pos-stock__grid">
        <Card>
          <CardHeader className="pos-stock__stat-header">
            <CardTitle className="pos-stock__stat-title">Total Productos</CardTitle>
            <Package className="pos-stock__stat-icon" />
          </CardHeader>
          <CardContent>
            <div className="pos-stock__stat-value">{formatNumber(inventory.length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pos-stock__stat-header">
            <CardTitle className="pos-stock__stat-title">Unidades Totales</CardTitle>
            <Building2 className="pos-stock__stat-icon" />
          </CardHeader>
          <CardContent>
            <div className="pos-stock__stat-value">
              {formatNumber(inventory.reduce((acc, curr) => acc + curr.quantity, 0))}
            </div>
          </CardContent>
        </Card>

        {warehouse && (
          <Card className="pos-stock__warehouse-card">
            <CardHeader className="pos-stock__stat-header">
              <CardTitle className="pos-stock__stat-title">Información de Bodega</CardTitle>
              <Warehouse className="pos-stock__stat-icon" />
            </CardHeader>
            <CardContent>
              <div className="pos-stock__warehouse-info-row">
                <div>
                  <p className="pos-stock__warehouse-name">{warehouse.name}</p>
                  <p className="pos-stock__warehouse-code">Código: {warehouse.code}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/warehouses/${warehouseId}`}>
                    Gestionar <ExternalLink className="pos-stock__external-icon" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="pos-stock__inventory-header">
          <div>
            <CardTitle>Inventario en Punto de Venta</CardTitle>
            <CardDescription>
              Resumen de existencias disponibles para este local
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddBookModalOpen(true)}>
            <Plus className="pos-stock__add-icon" /> Agregar Libro
          </Button>
        </CardHeader>
        <CardContent>
          <InventoryList
            data={inventory}
            onAdjust={(item) => handleAdjustStock(item, 'set')}
          />
        </CardContent>
      </Card>

      <InventoryAdjustModal
        isOpen={adjustModal.isOpen}
        onClose={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))}
        warehouseId={warehouseId}
        item={adjustModal.item}
        mode={adjustModal.mode}
        onSuccess={fetchData}
      />

      <AddBookToInventoryModal
        isOpen={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        warehouseId={warehouseId}
        onSuccess={fetchData}
        existingBookIds={inventory.map(item => item.bookId?._id).filter(Boolean)}
      />
    </div>
  );
}
