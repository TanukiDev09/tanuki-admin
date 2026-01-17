import { Suspense } from 'react';
import { Separator } from '@/components/ui/separator';
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
  return docs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    warehouseId: doc.warehouseId ? doc.warehouseId.toString() : null,
  }));
}

export default async function PointsOfSalePage() {
  const pointsOfSale = await getPointsOfSale();

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Puntos de Venta</h2>
          <p className="text-muted-foreground">
            Gestiona tus tiendas físicas, online y eventos aquí.
          </p>
        </div>
        <CreatePointOfSaleButton />
      </div>
      <Separator />
      <Suspense fallback={<div>Cargando...</div>}>
        <PointOfSaleList data={pointsOfSale} />
      </Suspense>
    </div>
  );
}
