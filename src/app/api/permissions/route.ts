import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Permission from '@/models/Permission';
import { BulkUpdatePermissionsDTO } from '@/types/permission';
import mongoose from 'mongoose';

// GET /api/permissions - Listar todos los permisos (admin only)
export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Construir query
    const query = userId ? { userId } : {};

    const permissions = await Permission.find(query)
      .populate('userId', 'name email role')
      .sort({ userId: 1, module: 1 });

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los permisos',
      },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Crear/actualizar permisos masivamente (admin only)
export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const body: BulkUpdatePermissionsDTO = await request.json();
    const { userId, permissions } = body;

    // Validar datos requeridos
    if (!userId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos. Se requiere userId y permissions (array)',
        },
        { status: 400 }
      );
    }

    // Validar que userId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de usuario inválido',
        },
        { status: 400 }
      );
    }

    // Usar bulkWrite para upsert eficiente
    const operations = permissions
      .filter((perm) => perm.actions && perm.actions.length > 0)
      .map((perm) => ({
        updateOne: {
          filter: { userId, module: perm.module },
          update: { $set: { actions: perm.actions } },
          upsert: true,
        },
      }));

    if (operations.length > 0) {
      await Permission.bulkWrite(operations);
    }

    // Obtener permisos actualizados
    const updatedPermissions = await Permission.find({ userId }).sort({
      module: 1,
    });

    return NextResponse.json({
      success: true,
      data: updatedPermissions,
      message: 'Permisos actualizados exitosamente',
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar los permisos',
      },
      { status: 500 }
    );
  }
}
