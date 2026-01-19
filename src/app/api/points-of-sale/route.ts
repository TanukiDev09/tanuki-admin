import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.POINTS_OF_SALE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const pointsOfSale = await PointOfSale.find(query).sort({ createdAt: -1 });

    return NextResponse.json(pointsOfSale);
  } catch (error) {
    console.error('Points of Sale List Error:', error);
    return NextResponse.json(
      { error: 'Error fetching points of sale' },
      { status: 500 }
    );
  }
}

async function generatePOSCode() {
  const lastPOS = await PointOfSale.findOne({
    code: { $regex: /^POS-\d+$/ },
  }).sort({ code: -1 });

  let nextNum = 1;
  if (lastPOS && lastPOS.code) {
    const match = lastPOS.code.match(/^POS-(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  return `POS-${nextNum.toString().padStart(3, '0')}`;
}

async function createAssociatedWarehouse(pointOfSale: {
  _id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  save: () => Promise<void>;
  warehouseId?: string;
}) {
  try {
    const Warehouse = (await import('@/models/Warehouse')).default;
    const warehouse = await Warehouse.create({
      code: `BOD-${pointOfSale.code}`,
      name: `Bodega ${pointOfSale.name}`,
      type: 'pos',
      pointOfSaleId: pointOfSale._id,
      address: pointOfSale.address,
      city: pointOfSale.city,
      status: 'active',
    });

    pointOfSale.warehouseId = warehouse._id;
    await pointOfSale.save();
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error creating warehouse for POS:', error);
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.POINTS_OF_SALE,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body = await request.json();

    if (!body.code) {
      body.code = await generatePOSCode();
    }

    const pointOfSale = await PointOfSale.create(body);
    await createAssociatedWarehouse(pointOfSale);

    return NextResponse.json(pointOfSale, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: 'El código del punto de venta ya existe' },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : 'Error creating point of sale';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
