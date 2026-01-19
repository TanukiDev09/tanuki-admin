import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Package, Warehouse, ExternalLink, Edit } from 'lucide-react';
import { InventoryByWarehouse } from '@/types/book';
import { InventoryAdjustModal } from '@/components/inventory/InventoryAdjustModal';
import Link from 'next/link';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatNumber } from '@/lib/utils';
import './BookInventorySummary.scss';

interface BookInventorySummaryProps {
  totalStock?: number;
  inventoryDetails?: InventoryByWarehouse[];
  bookId: string;
  onUpdate?: () => void;
}

interface WarehouseWithStock {
  _id: string;
  name: string;
  code: string;
  type: 'main' | 'secondary' | 'point_of_sale';
  quantity: number;
  hasStock: boolean;
  inventoryItemId?: string;
}

export default function BookInventorySummary({
  totalStock = 0,
  inventoryDetails = [],
  bookId,
  onUpdate,
}: BookInventorySummaryProps) {
  const { hasPermission } = usePermission();
  const canUpdateInventory = hasPermission(ModuleName.INVENTORY, PermissionAction.UPDATE);

  const [allWarehouses, setAllWarehouses] = useState<WarehouseWithStock[]>(() => {
    if (inventoryDetails && inventoryDetails.length > 0) {
      return inventoryDetails
        .map((detail) => ({
          _id: detail.warehouseId,
          name: detail.warehouseName,
          code: detail.warehouseCode,
          type: detail.warehouseType as 'main' | 'secondary' | 'point_of_sale',
          quantity: detail.quantity,
          hasStock: detail.quantity > 0,
          inventoryItemId: detail.inventoryItemId,
        }))
        .sort((a, b) => {
          if (a.hasStock && !b.hasStock) return -1;
          if (!a.hasStock && b.hasStock) return 1;
          return b.quantity - a.quantity;
        });
    }
    return [];
  });
  const [loading, setLoading] = useState(allWarehouses.length === 0);
  const [adjustModal, setAdjustModal] = useState<{
    isOpen: boolean;
    warehouseId: string;
    warehouseName: string;
    bookId: string;
    currentQuantity: number;
    inventoryItemId?: string;
  } | null>(null);

  useEffect(() => {
    const fetchAllWarehouses = async () => {
      try {
        const response = await fetch(`/api/warehouses?limit=100&t=${new Date().getTime()}`);
        const data = await response.json();

        if (data && Array.isArray(data)) {
          // Fetch inventory items for this book to get IDs
          const inventoryResponse = await fetch(`/api/inventory?bookId=${bookId}&t=${new Date().getTime()}`);
          const inventoryData = await inventoryResponse.json();
          const fetchedInventoryItems = Array.isArray(inventoryData) ? inventoryData : [];

          // Create a map of existing warehouses from the API response
          const warehouseMap = new Map<string, WarehouseWithStock>();

          (data as { _id: string, name: string, code: string, type: string }[]).forEach(warehouse => {
            warehouseMap.set(warehouse._id, {
              _id: warehouse._id,
              name: warehouse.name,
              code: warehouse.code,
              type: warehouse.type as 'main' | 'secondary' | 'point_of_sale',
              quantity: 0,
              hasStock: false,
              inventoryItemId: undefined
            });
          });

          // Ensure warehouses from inventoryDetails are present (even if not returned by API)
          inventoryDetails?.forEach(detail => {
            if (detail.warehouseId && !warehouseMap.has(detail.warehouseId)) {
              warehouseMap.set(detail.warehouseId, {
                _id: detail.warehouseId,
                name: detail.warehouseName || 'Bodega Desconocida',
                code: detail.warehouseCode || '???',
                type: (detail.warehouseType as 'main' | 'secondary' | 'point_of_sale') || 'secondary',
                quantity: 0,
                hasStock: false,
                inventoryItemId: undefined
              });
            }
          });

          // Convert map to array and populate stock data
          const mergedWarehouses = Array.from(warehouseMap.values()).map(warehouse => {
            // 1. Try to find in generic inventoryDetails (from props)
            const propInventory = inventoryDetails?.find(
              (inv) => String(inv.warehouseId) === String(warehouse._id)
            );

            // 2. Try to find in fresh inventory fetch (for specific InventoryItem ID)
            const fetchedInventory = (fetchedInventoryItems as { warehouseId: string | { _id: string }; quantity: number; _id: string }[]).find(
              (item) => {
                const itemWarehouseId = typeof item.warehouseId === 'object' ? item.warehouseId._id : item.warehouseId;
                return String(itemWarehouseId) === String(warehouse._id);
              }
            );

            const quantity = fetchedInventory?.quantity ?? propInventory?.quantity ?? 0;

            return {
              ...warehouse,
              quantity,
              hasStock: quantity > 0,
              inventoryItemId: fetchedInventory?._id
            };
          });

          // Sort: warehouses with stock first
          mergedWarehouses.sort((a, b) => {
            if (a.hasStock && !b.hasStock) return -1;
            if (!a.hasStock && b.hasStock) return 1;
            return b.quantity - a.quantity;
          });

          setAllWarehouses(mergedWarehouses);
        }
      } catch (err) {
        console.error('Error fetching warehouses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWarehouses();
  }, [inventoryDetails, bookId]);

  const handleEditStock = (warehouse: WarehouseWithStock) => {
    setAdjustModal({
      isOpen: true,
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      bookId: bookId,
      currentQuantity: warehouse.quantity,
      inventoryItemId: warehouse.inventoryItemId,
    });
  };

  const handleAdjustSuccess = () => {
    setAdjustModal(null);
    if (onUpdate) {
      onUpdate();
    }
  };

  // Stock status
  const getStockBadge = () => {
    if (totalStock === 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    }
    if (totalStock < 10) {
      return <Badge className="badge--warning">Stock Bajo</Badge>;
    }
    if (totalStock < 50) {
      return <Badge className="badge--success">Stock Normal</Badge>;
    }
    return <Badge className="badge--info">Stock Alto</Badge>;
  };

  const getWarehouseTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      main: { label: 'Principal', variant: 'default' },
      secondary: { label: 'Secundaria', variant: 'secondary' },
      point_of_sale: { label: 'Punto de Venta', variant: 'outline' },
    };
    const config = typeMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="book-inventory-summary__header-title">
            <Package className="book-inventory-summary__icon" />
            Inventario por Bodega
          </CardTitle>
        </CardHeader>
        <CardContent className="book-inventory-summary__content">
          {/* Total Stock */}
          <div className="book-inventory-summary__total-stock">
            <div>
              <p className="book-inventory-summary__total-label">Stock Total</p>
              <p className="book-inventory-summary__total-value">{formatNumber(totalStock)}</p>
            </div>
            <div>{getStockBadge()}</div>
          </div>

          {/* All Warehouses */}
          {loading ? (
            <div className="book-inventory-summary__loading">
              <Package className="book-inventory-summary__loading-icon" />
              <p className="book-inventory-summary__loading-text">Cargando bodegas...</p>
            </div>
          ) : (
            <div className="book-inventory-summary__list">
              <h4 className="book-inventory-summary__list-header">
                Bodegas ({allWarehouses.length})
              </h4>
              <div className="book-inventory-summary__list">
                {allWarehouses.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    className={`book-inventory-summary__item ${warehouse.hasStock ? 'book-inventory-summary__item--has-stock' : ''}`}
                  >
                    <div className="book-inventory-summary__item-info">
                      <div className="book-inventory-summary__item-header">
                        <Warehouse className={`book-inventory-summary__warehouse-icon ${warehouse.hasStock ? 'book-inventory-summary__warehouse-icon--stock' : ''}`} />
                        <span className="book-inventory-summary__warehouse-name">{warehouse.name}</span>
                        {getWarehouseTypeBadge(warehouse.type)}
                        {!warehouse.hasStock && (
                          <Badge variant="outline" className="book-inventory-summary__unavailable-badge">
                            No disponible
                          </Badge>
                        )}
                      </div>
                      <p className="book-inventory-summary__item-code">
                        Código: {warehouse.code}
                      </p>
                    </div>
                    <div className="book-inventory-summary__item-actions">
                      <div className="book-inventory-summary__stock-display">
                        <p className={`book-inventory-summary__stock-value ${warehouse.hasStock ? 'book-inventory-summary__stock-value--stock' : ''}`}>
                          {formatNumber(warehouse.quantity)}
                        </p>
                        <p className="book-inventory-summary__stock-unit">unidades</p>
                      </div>
                      {canUpdateInventory && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="book-inventory-summary__action-btn"
                          onClick={() => handleEditStock(warehouse)}
                          title="Ajustar cantidad"
                        >
                          <Edit className="book-inventory-summary__action-icon" />
                        </Button>
                      )}
                      <Link href={`/dashboard/warehouses/${warehouse._id}`}>
                        <Button variant="ghost" size="icon" className="book-inventory-summary__action-btn">
                          <ExternalLink className="book-inventory-summary__action-icon" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Modal */}
      {adjustModal && (
        <InventoryAdjustModal
          isOpen={adjustModal.isOpen}
          onClose={() => setAdjustModal(null)}
          warehouseId={adjustModal.warehouseId}
          item={{
            _id: adjustModal.inventoryItemId || '',
            bookId: {
              _id: adjustModal.bookId,
              title: '',
              isbn: '',
            },
            quantity: adjustModal.currentQuantity,
          }}
          mode="set"
          onSuccess={handleAdjustSuccess}
        />
      )}
    </>
  );
}
