'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Plus } from 'lucide-react';
import { PointOfSaleForm } from './PointOfSaleForm';
import './CreatePointOfSaleButton.scss';

export function CreatePointOfSaleButton() {
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(
    ModuleName.POINTS_OF_SALE,
    PermissionAction.CREATE
  );

  if (!canCreate) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="create-pos-button__icon" /> Nuevo Punto de Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="create-pos-button__dialog-content">
        <DialogHeader>
          <DialogTitle>Crear Punto de Venta</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del nuevo punto de venta.
          </DialogDescription>
        </DialogHeader>
        <PointOfSaleForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
