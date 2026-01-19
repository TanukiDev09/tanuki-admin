'use client';

import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import './CreateWarehouseButton.scss';

export function CreateWarehouseButton() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(
    ModuleName.WAREHOUSES,
    PermissionAction.CREATE
  );

  if (!canCreate) return null;

  return (
    <Button asChild>
      <Link href="/dashboard/warehouses/new">
        <Plus className="create-warehouse-button__icon" /> Nueva Bodega
      </Link>
    </Button>
  );
}
