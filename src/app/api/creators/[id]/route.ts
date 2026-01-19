import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Creator from '@/models/Creator';
import { UpdateCreatorDTO } from '@/types/creator';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, props: Props) {
  const permissionError = await requirePermission(
    request,
    ModuleName.CREATORS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al obtener creador';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: Props) {
  const permissionError = await requirePermission(
    request,
    ModuleName.CREATORS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al actualizar creador';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: Props) {
  const permissionError = await requirePermission(
    request,
    ModuleName.CREATORS,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al eliminar creador';
    return NextResponse.json({ message }, { status: 500 });
  }
}
