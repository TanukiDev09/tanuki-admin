'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InventoryList } from '@/components/inventory/InventoryList';
import { InventoryAdjustModal } from '@/components/inventory/InventoryAdjustModal';
import { AddBookToInventoryModal } from '@/components/inventory/AddBookToInventoryModal';
import { Warehouse, Package, Building2, ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';

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
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20 text-center">
        <Warehouse className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No hay bodega asociada</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-2">
          Este punto de venta aún no tiene una bodega asociada para gestionar inventario.
        </p>
        <div className="mt-6 flex gap-2">
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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades Totales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.reduce((acc, curr) => acc + curr.quantity, 0)}
            </div>
          </CardContent>
        </Card>

        {warehouse && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Información de Bodega</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">{warehouse.name}</p>
                  <p className="text-sm text-muted-foreground">Código: {warehouse.code}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/warehouses/${warehouseId}`}>
                    Gestionar <ExternalLink className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Inventario en Punto de Venta</CardTitle>
            <CardDescription>
              Resumen de existencias disponibles para este local
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddBookModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Libro
          </Button>
        </CardHeader>
        <CardContent>
          <InventoryList
            data={inventory}
            onAdjustStock={handleAdjustStock}
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
