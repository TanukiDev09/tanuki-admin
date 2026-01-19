import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import { PointOfSaleForm } from '@/components/points-of-sale/PointOfSaleForm';
import { PointOfSaleStock } from '@/components/points-of-sale/PointOfSaleStock';
import dbConnect from '@/lib/mongodb';
import PointOfSale from '@/models/PointOfSale';
import { Types } from 'mongoose';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface LeanPointOfSale {
  _id: Types.ObjectId;
  name: string;
  code?: string;
  status?: 'active' | 'inactive';
  type?: 'physical' | 'online' | 'event';
  identificationType?: 'NIT' | 'CC' | 'CE' | 'TI' | 'PP';
  identificationNumber?: string;
  warehouseId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  phones?: string[];
  emails?: string[];
  managers?: string[];
  images?: string[];
  address?: string;
  city?: string;
  department?: string;
  discountPercentage?: number;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  await dbConnect();
  const pos = await PointOfSale.findById(id).select('name').lean() as LeanPointOfSale | null;

  if (!pos) {
    return { title: 'Punto de Venta no encontrado' };
  }

  return {
    title: `${pos.name} - Detalle`,
  };
}

async function getPointOfSale(id: string) {
  await dbConnect();
  const doc = await PointOfSale.findById(id).lean() as LeanPointOfSale | null;

  if (!doc) return null;

  // Serialize keys
  return {
    ...doc,
    _id: doc._id.toString(),
    warehouseId: doc.warehouseId ? doc.warehouseId.toString() : null,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

import { formatNumber } from '@/lib/utils';
import './pos-detail.scss';

export default async function PointOfSaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pos = await getPointOfSale(id);

  if (!pos) {
    notFound();
  }

  return (
    <div className="pos-detail">
      <div className="pos-detail__header">
        <div className="pos-detail__title-group">
          <h2 className="pos-detail__title">{pos.name}</h2>
          {pos.discountPercentage && pos.discountPercentage > 0 && (
            <span className="pos-detail__discount-badge">
              Descuento: {formatNumber(pos.discountPercentage)}%
            </span>
          )}
        </div>
      </div>
      <Separator />
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="stock">Inventario</TabsTrigger>
          <TabsTrigger value="sales" disabled>Ventas (Próximamente)</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-4">
          <div className="pos-detail__grid">
            <div className="pos-detail__main-col pos-detail__card">
              <h3 className="pos-detail__section-title">Editar Detalles</h3>
              <PointOfSaleForm initialData={pos} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="stock" className="space-y-4">
          <PointOfSaleStock warehouseId={pos.warehouseId?.toString()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
