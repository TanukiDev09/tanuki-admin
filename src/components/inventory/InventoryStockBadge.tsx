'use client';

import { Badge } from '@/components/ui/Badge';

interface InventoryStockBadgeProps {
  quantity: number;
  minStock?: number;
}

export function InventoryStockBadge({
  quantity,
  minStock,
}: InventoryStockBadgeProps) {
  if (quantity === 0) {
    return <Badge variant="destructive">Sin Stock</Badge>;
  }

  if (minStock && quantity < minStock) {
    return <Badge variant="warning">Stock Bajo</Badge>;
  }

  return <Badge variant="success">Disponible</Badge>;
}
