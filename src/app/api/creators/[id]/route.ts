import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Creator from '@/models/Creator';
import { UpdateCreatorDTO } from '@/types/creator';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, props: Props) {
  const params = await props.params;
  try {
    await dbConnect();
    const creator = await Creator.findById(params.id);

    if (!creator) {
      return NextResponse.json(
        { message: 'Creador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(creator);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al obtener creador' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, props: Props) {
  const params = await props.params;
  try {
    await dbConnect();
    const body: UpdateCreatorDTO = await request.json();

    const creator = await Creator.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!creator) {
      return NextResponse.json(
        { message: 'Creador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(creator);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al actualizar creador' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: Props) {
  const params = await props.params;
  try {
    await dbConnect();
    const creator = await Creator.findByIdAndDelete(params.id);

    if (!creator) {
      return NextResponse.json(
        { message: 'Creador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Creador eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al eliminar creador' },
      { status: 500 }
    );
  }
}
