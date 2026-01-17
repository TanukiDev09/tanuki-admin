import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  status?: string;
  warehouseId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  phones?: string[];
  emails?: string[];
  managers?: Record<string, any>[];
  images?: string[];
  address?: string;
  city?: string;
  department?: string;
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

export default async function PointOfSaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pos = await getPointOfSale(id);

  if (!pos) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{pos.name}</h2>
      </div>
      <Separator />
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="stock">Inventario</TabsTrigger>
          <TabsTrigger value="sales" disabled>Ventas (Próximamente)</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 border rounded-md p-4">
              <h3 className="mb-4 text-lg font-medium">Editar Detalles</h3>
              <PointOfSaleForm initialData={pos as any} />
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
