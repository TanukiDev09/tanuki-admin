import { Badge } from '@/components/ui/Badge';
import './WarehouseStatusBadge.scss';

interface WarehouseStatusBadgeProps {
  status: 'active' | 'inactive';
}

export function WarehouseStatusBadge({ status }: WarehouseStatusBadgeProps) {
  const variantClass = status === 'active'
    ? 'warehouse-status-badge--active'
    : 'warehouse-status-badge--inactive';

  return (
    <Badge className={`warehouse-status-badge ${variantClass}`}>
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}
