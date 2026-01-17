'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { InventoryList } from '@/components/inventory/InventoryList';
import dynamic from 'next/dynamic';
import { WarehouseTypeBadge } from '@/components/warehouses/WarehouseTypeBadge';
import { WarehouseStatusBadge } from '@/components/warehouses/WarehouseStatusBadge';


const AddBookToInventoryModal = dynamic(() => import('@/components/inventory/AddBookToInventoryModal').then(mod => mod.AddBookToInventoryModal), { ssr: false });
const InventoryMovementModal = dynamic(() => import('@/components/inventory/InventoryMovementModal').then(mod => mod.InventoryMovementModal), { ssr: false });
const InventoryAdjustModal = dynamic(() => import('@/components/inventory/InventoryAdjustModal').then(mod => mod.InventoryAdjustModal), { ssr: false });

import { Package, MapPin, Building2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

interface WarehouseData {
  _id: string;
  name: string;
  code: string;
  type: 'editorial' | 'pos' | 'general';
  status: 'active' | 'inactive';
  city?: string;
  address?: string;
  description?: string;
  pointOfSaleId?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface InventoryItem {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    isbn: string;
    price: number;
    coverImage?: string;
  };
  quantity: number;
  minStock?: number;
  maxStock?: number;
}

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };



  const fetchData = useCallback(async () => {
    try {
      const [warehouseRes, inventoryRes] = await Promise.all([
        fetch(`/api/warehouses/${id}`),
        fetch(`/api/inventory/warehouse/${id}`)
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
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  if (loading) return <div className="p-8">Cargando...</div>;
  if (!warehouse) return <div className="p-8">Bodega no encontrada</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="default" className="gap-2" asChild>
            <Link href="/dashboard/warehouses">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{warehouse.name}</h2>
              <WarehouseTypeBadge type={warehouse.type} />
              <WarehouseStatusBadge status={warehouse.status} />
            </div>
            <p className="text-muted-foreground">Código: {warehouse.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMovementModalOpen(true)}>
            Registrar Movimiento
          </Button>
          <Button onClick={() => setAddBookModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Libro
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventario Actual</TabsTrigger>
          <TabsTrigger value="info">Información General</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listado de Libros</CardTitle>
              <CardDescription>
                Gestión de existencias en esta bodega
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryList
                data={inventory}
                onAdjust={handleAdjustStock}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Detalles de la Bodega</CardTitle>
              </CardHeader>
              <CardContent>
                <WarehouseForm mode="edit" initialData={warehouse as any} />
              </CardContent>
            </Card>

            <div className="col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Ubicación y Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 underline-offset-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{warehouse.city || 'Sin ciudad registrada'}</p>
                      <p className="text-sm text-muted-foreground">{warehouse.address || 'Sin dirección registrada'}</p>
                    </div>
                  </div>
                  {warehouse.pointOfSaleId && (
                    <div className="flex items-start gap-2 pt-2 border-t">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Punto de Venta Asociado:</p>
                        <Link
                          href={`/dashboard/points-of-sale/${warehouse.pointOfSaleId._id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {warehouse.pointOfSaleId.name} ({warehouse.pointOfSaleId.code})
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {warehouse.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">Descripción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{warehouse.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>



      <AddBookToInventoryModal
        isOpen={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        warehouseId={id as string}
        onSuccess={fetchData}
        existingBookIds={inventory.map(item => item.bookId?._id).filter(Boolean)}
      />

      {warehouse && (
        <InventoryMovementModal
          isOpen={movementModalOpen}
          onClose={() => setMovementModalOpen(false)}
          warehouseId={warehouse._id}
          warehouseType={warehouse.type}
          onSuccess={fetchData}
        />
      )}

      {selectedItem && warehouse && (
        <InventoryAdjustModal
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedItem(null);
          }}
          warehouseId={warehouse._id}
          item={selectedItem}
          mode="set"
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
