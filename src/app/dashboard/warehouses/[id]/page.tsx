'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
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
import { WarehouseMovementsTable } from '@/components/warehouses/WarehouseMovementsTable';

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

import { 
  Package, 
  MapPin, 
  Building2, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2 
} from 'lucide-react';
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
  isDeleted?: boolean;
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
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('inventory');
  const [isDeletingWarehouse, setIsDeletingWarehouse] = useState(false);
  const { toast } = useToast();

  const { hasPermission } = usePermission();
  const canUpdateWarehouse = hasPermission(
    ModuleName.WAREHOUSES,
    PermissionAction.UPDATE
  );
  const canDeleteWarehouse = hasPermission(
    ModuleName.WAREHOUSES,
    PermissionAction.DELETE
  );
  const canCreateInventory = hasPermission(
    ModuleName.INVENTORY,
    PermissionAction.CREATE
  );
  const canUpdateInventory = hasPermission(
    ModuleName.INVENTORY,
    PermissionAction.UPDATE
  );
  const canDeleteInventory = hasPermission(
    ModuleName.INVENTORY,
    PermissionAction.DELETE
  );

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };

  const handleDeleteInventoryItem = async (item: InventoryItem) => {
    if (item.quantity > 0) {
      if (
        !window.confirm(
          `Atención: El libro "${item.bookId.title}" tiene ${item.quantity} unidades en stock. ¿Está seguro de que desea eliminarlo del inventario de todas formas?`
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm(
          `¿Está seguro de que desea eliminar el libro "${item.bookId.title}" de este inventario?`
        )
      ) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/inventory/${item._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast({
        title: 'Éxito',
        description: 'Libro eliminado del inventario correctamente',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'No se pudo eliminar el libro',
        variant: 'destructive',
      });
    }
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

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDeleteWarehouse = async () => {
    // Calculate total quantity of items currently in inventory
    const totalQty = inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    if (totalQty > 0) {
      toast({
        title: 'Error',
        description: 'No se puede eliminar una bodega con inventario activo (unidades > 0)',
        variant: 'destructive',
      });
      return;
    }

    if (
      !window.confirm(
        `¿Está seguro de que desea eliminar la bodega "${warehouse?.name}"? Esta es una eliminación lógica y preservará los históricos, pero no estará disponible para nuevos movimientos.`
      )
    ) {
      return;
    }

    try {
      setIsDeletingWarehouse(true);
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar la bodega');
      }

      toast({
        title: 'Éxito',
        description: 'La bodega ha sido eliminada correctamente (eliminación lógica)',
      });
      router.push('/dashboard/warehouses');
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'No se pudo eliminar la bodega',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingWarehouse(false);
    }
  };

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
              {warehouse.isDeleted ? (
                <Badge
                  variant="destructive"
                  className="bg-red-50 text-red-700 border-red-200 font-bold uppercase"
                >
                  Eliminada (Histórica)
                </Badge>
              ) : (
                <WarehouseStatusBadge status={warehouse.status} />
              )}
            </div>
            <p className="warehouse-detail__code">Código: {warehouse.code}</p>
          </div>
        </div>
        <div className="warehouse-detail__header-actions">
          {/* Edit & Delete Actions (adjusted to permission matrix) */}
          {!warehouse.isDeleted && canUpdateWarehouse && (
            <Button
              variant="outline"
              onClick={() => setActiveTab('info')}
              className="hover:bg-slate-50"
            >
              <Edit className="w-4 h-4 mr-2 text-slate-500" />
              Editar Bodega
            </Button>
          )}

          {!warehouse.isDeleted && canDeleteWarehouse && (
            <Button
              variant="outline"
              onClick={handleDeleteWarehouse}
              disabled={isDeletingWarehouse}
              className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
            >
              {isDeletingWarehouse ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar
            </Button>
          )}

          {/* New movements are restricted on soft-deleted warehouses */}
          {!warehouse.isDeleted && canCreateInventory && (
            <Button
              variant="outline"
              onClick={() => setMovementModalOpen(true)}
            >
              Registrar Movimiento
            </Button>
          )}
          {!warehouse.isDeleted && canUpdateInventory && (
            <Button onClick={() => setAddBookModalOpen(true)}>
              <Plus className="warehouse-detail__icon" /> Agregar Libro
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="warehouse-detail__tabs">
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
              <InventoryList
                data={inventory}
                onAdjust={handleAdjustStock}
                onDelete={
                  canDeleteInventory ? handleDeleteInventoryItem : undefined
                }
              />
            </CardContent>
          </Card>

          <WarehouseMovementsTable key={refreshTrigger} warehouseId={id as string} />
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
