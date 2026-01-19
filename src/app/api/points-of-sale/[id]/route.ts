import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.POINTS_OF_SALE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();

    const pointOfSale = await PointOfSale.findById(id);

    if (!pointOfSale) {
      return NextResponse.json(
        { error: 'Punto de venta no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(pointOfSale);
  } catch (error) {
    console.error('Get POS Error:', error);
    return NextResponse.json(
      { error: 'Error fetching point of sale' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.POINTS_OF_SALE,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();

    const pointOfSale = await PointOfSale.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!pointOfSale) {
      return NextResponse.json(
        { error: 'Punto de venta no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(pointOfSale);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: 'El código del punto de venta ya existe' },
        { status: 400 }
      );
    }
    const msg =
      error instanceof Error ? error.message : 'Error updating point of sale';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.POINTS_OF_SALE,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();

    const pointOfSale = await PointOfSale.findByIdAndDelete(id);

    if (!pointOfSale) {
      return NextResponse.json(
        { error: 'Punto de venta no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Punto de venta eliminado' });
  } catch (error) {
    console.error('Delete POS Error:', error);
    return NextResponse.json(
      { error: 'Error deleting point of sale' },
      { status: 500 }
    );
  }
}
