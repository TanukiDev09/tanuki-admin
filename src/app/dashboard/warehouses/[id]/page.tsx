'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { InventoryList } from '@/components/inventory/InventoryList';
import dynamic from 'next/dynamic';
import { WarehouseTypeBadge } from '@/components/warehouses/WarehouseTypeBadge';
import { WarehouseStatusBadge } from '@/components/warehouses/WarehouseStatusBadge';

const AddBookToInventoryModal = dynamic(
  () =>
    import('@/components/inventory/AddBookToInventoryModal').then(
      (mod) => mod.AddBookToInventoryModal
    ),
  { ssr: false }
);
const InventoryMovementModal = dynamic(
  () =>
    import('@/components/inventory/InventoryMovementModal').then(
      (mod) => mod.InventoryMovementModal
    ),
  { ssr: false }
);
const InventoryAdjustModal = dynamic(
  () =>
    import('@/components/inventory/InventoryAdjustModal').then(
      (mod) => mod.InventoryAdjustModal
    ),
  { ssr: false }
);

import { Package, MapPin, Building2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './warehouse-detail.scss';

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

  const { hasPermission } = usePermission();
  const canUpdateWarehouse = hasPermission(
    ModuleName.WAREHOUSES,
    PermissionAction.UPDATE
  );
  const canCreateInventory = hasPermission(
    ModuleName.INVENTORY,
    PermissionAction.CREATE
  );
  const canUpdateInventory = hasPermission(
    ModuleName.INVENTORY,
    PermissionAction.UPDATE
  );

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };

  const fetchData = useCallback(async () => {
    try {
      const [warehouseRes, inventoryRes] = await Promise.all([
        fetch(`/api/warehouses/${id}`),
        fetch(`/api/inventory/warehouse/${id}`),
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

  if (loading)
    return <div className="warehouse-detail__loading">Cargando...</div>;
  if (!warehouse)
    return <div className="warehouse-detail__error">Bodega no encontrada</div>;

  return (
    <div className="warehouse-detail">
      <div className="warehouse-detail__header">
        <div className="warehouse-detail__header-left">
          <Button
            variant="outline"
            size="default"
            className="warehouse-detail__back-btn"
            asChild
          >
            <Link
              href="/dashboard/warehouses"
              className="warehouse-detail__back-link"
            >
              <ArrowLeft className="warehouse-detail__icon" />
              <span className="warehouse-detail__back-text">Volver</span>
            </Link>
          </Button>
          <div className="warehouse-detail__title-group">
            <div className="warehouse-detail__title-row">
              <h2 className="warehouse-detail__title">{warehouse.name}</h2>
              <WarehouseTypeBadge type={warehouse.type} />
              <WarehouseStatusBadge status={warehouse.status} />
            </div>
            <p className="warehouse-detail__code">Código: {warehouse.code}</p>
          </div>
        </div>
        <div className="warehouse-detail__header-actions">
          {canCreateInventory && (
            <Button
              variant="outline"
              onClick={() => setMovementModalOpen(true)}
            >
              Registrar Movimiento
            </Button>
          )}
          {canUpdateInventory && (
            <Button onClick={() => setAddBookModalOpen(true)}>
              <Plus className="warehouse-detail__icon" /> Agregar Libro
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="inventory" className="warehouse-detail__tabs">
        <TabsList>
          <TabsTrigger value="inventory">Inventario Actual</TabsTrigger>
          <TabsTrigger value="info">Información General</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="warehouse-detail__section">
          <div className="warehouse-detail__stats-grid">
            <Card>
              <CardHeader className="warehouse-detail__stat-header">
                <CardTitle className="warehouse-detail__stat-title">
                  Total Productos
                </CardTitle>
                <Package className="warehouse-detail__stat-icon" />
              </CardHeader>
              <CardContent>
                <div className="warehouse-detail__stat-value">
                  {inventory.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="warehouse-detail__stat-header">
                <CardTitle className="warehouse-detail__stat-title">
                  Unidades Totales
                </CardTitle>
                <Building2 className="warehouse-detail__stat-icon" />
              </CardHeader>
              <CardContent>
                <div className="warehouse-detail__stat-value">
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
              <InventoryList data={inventory} onAdjust={handleAdjustStock} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="warehouse-detail__section">
          <div className="warehouse-detail__info-grid">
            <Card className="warehouse-detail__main-info-card">
              <CardHeader>
                <CardTitle>Detalles de la Bodega</CardTitle>
              </CardHeader>
              <CardContent>
                <WarehouseForm
                  mode="edit"
                  initialData={{
                    ...warehouse,
                    pointOfSaleId: warehouse.pointOfSaleId?._id,
                  }}
                  readOnly={!canUpdateWarehouse}
                />
              </CardContent>
            </Card>

            <div className="warehouse-detail__sidebar">
              <Card>
                <CardHeader>
                  <CardTitle className="warehouse-detail__card-title-sm">
                    Ubicación y Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="warehouse-detail__location-content">
                  <div className="warehouse-detail__location-item">
                    <MapPin className="warehouse-detail__icon" />
                    <div>
                      <p className="warehouse-detail__location-city">
                        {warehouse.city || 'Sin ciudad registrada'}
                      </p>
                      <p className="warehouse-detail__location-address">
                        {warehouse.address || 'Sin dirección registrada'}
                      </p>
                    </div>
                  </div>
                  {warehouse.pointOfSaleId && (
                    <div className="warehouse-detail__pos-section">
                      <Building2 className="warehouse-detail__icon" />
                      <div>
                        <p className="warehouse-detail__pos-label">
                          Punto de Venta Asociado:
                        </p>
                        <Link
                          href={`/dashboard/points-of-sale/${warehouse.pointOfSaleId._id}`}
                          className="warehouse-detail__pos-link"
                        >
                          {warehouse.pointOfSaleId.name} (
                          {warehouse.pointOfSaleId.code})
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {warehouse.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="warehouse-detail__card-title-sm">
                      Descripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="warehouse-detail__description-text">
                      {warehouse.description}
                    </p>
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
        existingBookIds={inventory
          .map((item) => item.bookId?._id)
          .filter(Boolean)}
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
