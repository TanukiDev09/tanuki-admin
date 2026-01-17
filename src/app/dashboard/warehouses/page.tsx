import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { WarehouseList } from '@/components/warehouses/WarehouseList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Bodegas - Admin',
  description: 'Gestión de bodegas e inventario',
};

async function getWarehouses() {
  await dbConnect();
  // We need to populate pointOfSaleId to get the name
  const warehouses = await Warehouse.find({})
    .populate('pointOfSaleId', 'name code')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(warehouses));
}

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bodegas</h2>
          <p className="text-muted-foreground">
            Administra las bodegas físicas, virtuales y de puntos de venta.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/dashboard/warehouses/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva Bodega
            </Link>
          </Button>
        </div>
      </div>
      <Separator />

      <Suspense fallback={<div>Cargando bodegas...</div>}>
        <WarehouseList data={warehouses} />
      </Suspense>
    </div>
  );
}
