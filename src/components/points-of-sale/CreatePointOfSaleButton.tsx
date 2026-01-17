'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { PointOfSaleForm } from './PointOfSaleForm';

export function CreatePointOfSaleButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Punto de Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
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
