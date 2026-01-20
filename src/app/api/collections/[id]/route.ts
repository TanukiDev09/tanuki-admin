import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Collection from '@/models/Collection';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COLLECTIONS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const collection = await Collection.findById(id).lean();

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Colección no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error('Error al obtener colección:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la colección' },
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
    ModuleName.COLLECTIONS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();

    // Validar nombre si se proporciona
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const collection = await Collection.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(body.name && { name: body.name.trim() }),
          ...(body.description !== undefined && {
            description: body.description.trim(),
          }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Colección no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: collection,
      message: 'Colección actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar colección:', error);

    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Esta colección ya existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar la colección' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COLLECTIONS,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    // En lugar de eliminar, marcamos como inactiva por seguridad si es necesario,
    // o eliminamos directamente. Aquí eliminaremos para seguir el estándar CRUD si no se especifica soft-delete.
    const collection = await Collection.findByIdAndDelete(id);

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Colección no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Colección eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar colección:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la colección' },
      { status: 500 }
    );
  }
}
