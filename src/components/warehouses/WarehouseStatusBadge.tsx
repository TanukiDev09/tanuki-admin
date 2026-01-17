'use client';

import { Badge } from '@/components/ui/badge';

interface WarehouseStatusBadgeProps {
  status: 'active' | 'inactive';
}

export function WarehouseStatusBadge({ status }: WarehouseStatusBadgeProps) {
  if (status === 'active') {
    return <Badge className="bg-green-500">Activo</Badge>;
  }

  return <Badge variant="secondary">Inactivo</Badge>;
}
