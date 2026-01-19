import { Badge } from '@/components/ui/Badge';
import { Building2, Package, Warehouse } from 'lucide-react';
import './WarehouseTypeBadge.scss';

interface WarehouseTypeBadgeProps {
  type: 'editorial' | 'pos' | 'general';
}

export function WarehouseTypeBadge({ type }: WarehouseTypeBadgeProps) {
  if (type === 'editorial') {
    return (
      <Badge className="warehouse-type-badge warehouse-type-badge--editorial">
        <Building2 />
        Editorial
      </Badge>
    );
  }

  if (type === 'pos') {
    return (
      <Badge className="warehouse-type-badge warehouse-type-badge--pos">
        <Package />
        Punto de Venta
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="warehouse-type-badge warehouse-type-badge--general"
    >
      <Warehouse />
      General
    </Badge>
  );
}
