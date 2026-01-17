import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const { id } = await params;
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: category });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener la categoría' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const category = await Category.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: category });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar la categoría' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const { id } = await params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar la categoría' },
      { status: 500 }
    );
  }
}
