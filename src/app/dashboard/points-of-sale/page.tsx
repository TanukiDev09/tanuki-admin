import { Suspense } from 'react';

import { PointOfSaleList } from '@/components/points-of-sale/PointOfSaleList';
import { CreatePointOfSaleButton } from '@/components/points-of-sale/CreatePointOfSaleButton';
import dbConnect from '@/lib/mongodb';
import PointOfSale, { IPOSContact } from '@/models/PointOfSale';
import { Types } from 'mongoose';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

async function getPointsOfSale() {
  await dbConnect();
  // Lean queries for performance
  const docs = await PointOfSale.find({}).sort({ createdAt: -1 }).lean();

  // Deep serialize by converting to string and back to ensure a plain object
  // Next.js Server Components require plain objects (no toJSON methods, etc.)
  return JSON.parse(JSON.stringify(docs));
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
