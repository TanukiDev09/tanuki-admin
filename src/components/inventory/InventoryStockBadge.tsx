'use client';

import { Badge } from '@/components/ui/badge';

interface InventoryStockBadgeProps {
  quantity: number;
  minStock?: number;
}

export function InventoryStockBadge({ quantity, minStock }: InventoryStockBadgeProps) {
  if (quantity === 0) {
    return <Badge variant="destructive">Sin Stock</Badge>;
  }

  if (minStock && quantity < minStock) {
    return <Badge className="bg-yellow-500">Stock Bajo</Badge>;
  }

  return <Badge className="bg-green-500">Disponible</Badge>;
}
