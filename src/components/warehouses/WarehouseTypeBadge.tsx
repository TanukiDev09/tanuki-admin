'use client';

import { Badge } from '@/components/ui/badge';
import { Building2, Package, Warehouse } from 'lucide-react';

interface WarehouseTypeBadgeProps {
  type: 'editorial' | 'pos' | 'general';
}

export function WarehouseTypeBadge({ type }: WarehouseTypeBadgeProps) {
  if (type === 'editorial') {
    return (
      <Badge className="bg-purple-500 flex gap-1 items-center w-fit">
        <Building2 className="w-3 h-3" />
        Editorial
      </Badge>
    );
  }

  if (type === 'pos') {
    return (
      <Badge className="bg-blue-500 flex gap-1 items-center w-fit">
        <Package className="w-3 h-3" />
        Punto de Venta
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex gap-1 items-center w-fit">
      <Warehouse className="w-3 h-3" />
      General
    </Badge>
  );
}
