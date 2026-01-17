import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PointOfSale from '@/models/PointOfSale';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error fetching point of sale' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'El código del punto de venta ya existe' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error updating point of sale' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error deleting point of sale' },
      { status: 500 }
    );
  }
}
