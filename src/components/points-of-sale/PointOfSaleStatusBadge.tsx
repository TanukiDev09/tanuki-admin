import { Badge } from '@/components/ui/Badge';

interface PointOfSaleStatusBadgeProps {
  status: 'active' | 'inactive';
}

export function PointOfSaleStatusBadge({
  status,
}: PointOfSaleStatusBadgeProps) {
  const variants = {
    active: 'bg-green-100 text-green-900 hover:bg-green-100',
    inactive: 'bg-red-100 text-red-900 hover:bg-red-100',
  };

  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
  };

  return (
    <Badge className={variants[status] || variants.active} variant="secondary">
      {labels[status] || status}
    </Badge>
  );
}
