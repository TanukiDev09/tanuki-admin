import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { Separator } from '@/components/ui/Separator';

export const metadata = {
  title: 'Nueva Bodega - Admin',
};

import '../../dashboard.scss';

export default function NewWarehousePage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
        <div className="dashboard-page__header">
          <h2 className="dashboard-page__title">Crear Nueva Bodega</h2>
        </div>
        <Separator className="dashboard-page__section" />
        <div className="dashboard-page__section">
          <div className="dashboard-page__chart-card">
            <WarehouseForm mode="create" />
          </div>
        </div>
      </div>
    </div>
  );
}
