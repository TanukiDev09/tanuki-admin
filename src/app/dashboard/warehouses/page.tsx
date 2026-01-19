import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { WarehouseList } from '@/components/warehouses/WarehouseList';
import { CreateWarehouseButton } from '@/components/warehouses/CreateWarehouseButton';

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

import '../dashboard.scss';

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
        <div className="dashboard-page__header">
          <div className="dashboard-page__title-group">
            <h2 className="dashboard-page__title">Bodegas</h2>
            <p className="dashboard-page__subtitle">
              Administra las bodegas físicas, virtuales y de puntos de venta.
            </p>
          </div>
          <div className="dashboard-page__action-btn">
            <CreateWarehouseButton />
          </div>
        </div>

        <Suspense fallback={<div>Cargando bodegas...</div>}>
          <WarehouseList data={warehouses} />
        </Suspense>
      </div>
    </div>
  );
}
