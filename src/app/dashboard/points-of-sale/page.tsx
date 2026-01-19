import { Suspense } from 'react';

import { PointOfSaleList } from '@/components/points-of-sale/PointOfSaleList';
import { CreatePointOfSaleButton } from '@/components/points-of-sale/CreatePointOfSaleButton';
import dbConnect from '@/lib/mongodb';
import PointOfSale from '@/models/PointOfSale';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

async function getPointsOfSale() {
  await dbConnect();
  // Lean queries for performance
  const docs = await PointOfSale.find({}).sort({ createdAt: -1 }).lean();

  // Serialize ObjectId and dates
  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    warehouseId: doc.warehouseId ? doc.warehouseId.toString() : null,
  }));
}

import '../dashboard.scss';

export default async function PointsOfSalePage() {
  const pointsOfSale = await getPointsOfSale();

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__container">
        <div className="dashboard-page__header">
          <div className="dashboard-page__title-group">
            <h2 className="dashboard-page__title">Puntos de Venta</h2>
            <p className="dashboard-page__subtitle">
              Gestiona tus tiendas físicas, online y eventos aquí.
            </p>
          </div>
          <div className="dashboard-page__action-btn">
            <CreatePointOfSaleButton />
          </div>
        </div>

        <Suspense fallback={<div>Cargando...</div>}>
          <PointOfSaleList data={pointsOfSale} />
        </Suspense>
      </div>
    </div>
  );
}
