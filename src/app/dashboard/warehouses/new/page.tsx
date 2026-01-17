import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Nueva Bodega - Admin',
};

export default function NewWarehousePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Crear Nueva Bodega</h2>
      </div>
      <Separator />
      <div className="max-w-4xl border rounded-md p-6 bg-card">
        <WarehouseForm mode="create" />
      </div>
    </div>
  );
}
