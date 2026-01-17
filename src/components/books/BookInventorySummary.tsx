'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Warehouse, ExternalLink, Edit } from 'lucide-react';
import { InventoryByWarehouse } from '@/types/book';
import { InventoryAdjustModal } from '@/components/inventory/InventoryAdjustModal';
import Link from 'next/link';

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
  const [allWarehouses, setAllWarehouses] = useState<WarehouseWithStock[]>([]);
  const [loading, setLoading] = useState(true);
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
          const inventoryResponse = await fetch(`/api/inventory?bookId=${bookId}`);
          const inventoryData = await inventoryResponse.json();
          const inventoryItems = Array.isArray(inventoryData) ? inventoryData : [];

          // Merge warehouse data with inventory data
          const warehousesWithStock = (data as { _id: string, name: string, code: string, type: string }[]).map((warehouse) => {
            const inventoryItem = inventoryDetails.find(
              (inv) => inv.warehouseId === warehouse._id
            );

            const fullInventoryItem = (inventoryItems as { warehouseId: string, _id: string }[]).find(
              (item) => item.warehouseId === warehouse._id
            );

            return {
              _id: warehouse._id as string,
              name: warehouse.name as string,
              code: warehouse.code as string,
              type: warehouse.type as 'main' | 'secondary' | 'point_of_sale',
              quantity: inventoryItem?.quantity || 0,
              hasStock: !!inventoryItem,
              inventoryItemId: fullInventoryItem?._id as string,
            };
          });

          // Sort: warehouses with stock first
          warehousesWithStock.sort((a, b) => {
            if (a.hasStock && !b.hasStock) return -1;
            if (!a.hasStock && b.hasStock) return 1;
            return b.quantity - a.quantity;
          });

          setAllWarehouses(warehousesWithStock);
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
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Stock Bajo</Badge>;
    }
    if (totalStock < 50) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Stock Normal</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Stock Alto</Badge>;
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
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventario por Bodega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Stock */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Stock Total</p>
              <p className="text-3xl font-bold">{totalStock}</p>
            </div>
            <div>{getStockBadge()}</div>
          </div>

          {/* All Warehouses */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
              <p className="text-sm">Cargando bodegas...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Estado en Todas las Bodegas ({allWarehouses.filter(w => w.hasStock).length}/{allWarehouses.length} con stock)
              </h4>
              {allWarehouses.length > 0 ? (
                allWarehouses.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${warehouse.hasStock
                      ? 'hover:bg-muted/50 border-green-200 bg-green-50/30'
                      : 'hover:bg-muted/50 border-border bg-muted/20'
                      }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Warehouse className={`w-4 h-4 ${warehouse.hasStock ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{warehouse.name}</span>
                        {getWarehouseTypeBadge(warehouse.type)}
                        {!warehouse.hasStock && (
                          <Badge variant="outline" className="text-xs">
                            No disponible
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Código: {warehouse.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${warehouse.hasStock ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {warehouse.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">unidades</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditStock(warehouse)}
                        title="Ajustar cantidad"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Link href={`/dashboard/warehouses/${warehouse._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay bodegas registradas en el sistema.</p>
                </div>
              )}
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
