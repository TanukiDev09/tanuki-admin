import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getUserIdFromRequest } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import { getUserPermissions, updateUserPermissions } from '@/lib/permissions';
import { PermissionMatrix, ModulePermission } from '@/types/permission';
import mongoose from 'mongoose';
import User from '@/models/User';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/permissions/user/[id] - Obtener permisos de un usuario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    // Verificar autenticación
    const currentUserId = await getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Si no es el mismo usuario, verificar permiso de lectura de usuarios
    if (currentUserId !== id) {
      const permissionError = await requirePermission(
        request,
        ModuleName.USERS,
        PermissionAction.READ
      );
      if (permissionError) return permissionError;
    }

    // Obtener permisos
    let permissions: PermissionMatrix = await getUserPermissions(id);

    // Si no tiene permisos registrados, crear los por defecto según su rol
    if (Object.keys(permissions).length === 0) {
      const user = await User.findById(id);
      if (user) {
        const { createDefaultPermissions, getUserPermissions } =
          await import('@/lib/permissions');
        await createDefaultPermissions(id, user.role);
        permissions = await getUserPermissions(id);
      }
    }

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los permisos del usuario',
      },
      { status: 500 }
    );
  }
}

// PUT /api/permissions/user/[id] - Actualizar permisos de un usuario (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de usuario inválido',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { permissions }: { permissions: ModulePermission[] } = body;

    // Validar datos
    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos. Se requiere permissions (array)',
        },
        { status: 400 }
      );
    }

    // Convertir array a matriz
    const permissionMatrix: PermissionMatrix = {};
    permissions.forEach((perm) => {
      if (perm.actions && perm.actions.length > 0) {
        permissionMatrix[perm.module] = perm.actions;
      }
    });

    // Actualizar permisos
    await updateUserPermissions(id, permissionMatrix);

    // Obtener permisos actualizados
    const updatedPermissions = await getUserPermissions(id);

    return NextResponse.json({
      success: true,
      data: updatedPermissions,
      message: 'Permisos actualizados exitosamente',
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar los permisos del usuario',
      },
      { status: 500 }
    );
  }
}
