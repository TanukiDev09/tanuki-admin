import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { verifyToken } from '@/lib/jwt';
import { getAuthCookie } from '@/lib/auth-cookies';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * Extrae el userId del JWT token en la request
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  try {
    // Extraer token de cookie o header
    let token = await getAuthCookie();

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    // Verificar y decodificar token
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    return payload.userId;
  } catch (error) {
    console.error('Error extracting userId from request:', error);
    return null;
  }
}

/**
 * Middleware para verificar permisos en API routes
 * @param request NextRequest
 * @param module Módulo a verificar
 * @param action Acción CRUD requerida
 * @returns NextResponse con error 401/403 o null si tiene permiso
 */
export async function requirePermission(
  request: NextRequest,
  module: ModuleName,
  action: PermissionAction
): Promise<NextResponse | null> {
  try {
    await dbConnect();

    // 1. Verificar autenticación
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado. Por favor inicia sesión.',
        },
        { status: 401 }
      );
    }

    // 2. Verificar si es admin (admins tienen acceso total)
    const user = await User.findById(userId);
    if (user?.role === 'admin') {
      return null; // Admin bypass
    }

    // 3. Verificar permiso específico
    const hasPermission = await checkPermission(userId, module, action);

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: `No tienes permiso para ${getActionLabel(action)} en ${getModuleLabel(module)}.`,
        },
        { status: 403 }
      );
    }

    // Si tiene permiso, retornar null (continuar con la request)
    return null;
  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar permisos',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper para obtener el label de una acción
 */
function getActionLabel(action: PermissionAction): string {
  const labels = {
    [PermissionAction.CREATE]: 'crear',
    [PermissionAction.READ]: 'leer',
    [PermissionAction.UPDATE]: 'actualizar',
    [PermissionAction.DELETE]: 'eliminar',
  };
  return labels[action] || action;
}

/**
 * Helper para obtener el label de un módulo
 */
function getModuleLabel(module: ModuleName): string {
  const labels = {
    [ModuleName.BOOKS]: 'libros',
    [ModuleName.CREATORS]: 'creadores',
    [ModuleName.COLLECTIONS]: 'colecciones',
    [ModuleName.WAREHOUSES]: 'bodegas',
    [ModuleName.INVENTORY]: 'inventario',
    [ModuleName.POINTS_OF_SALE]: 'puntos de venta',
    [ModuleName.FINANCE]: 'finanzas',
    [ModuleName.CATEGORIES]: 'categorías',
    [ModuleName.AGREEMENTS]: 'contratos',
    [ModuleName.USERS]: 'usuarios',
    [ModuleName.COST_CENTERS]: 'centros de costo',
    [ModuleName.PERMISSIONS]: 'permisos',
    [ModuleName.INVOICES]: 'facturas',
  };
  return labels[module] || module;
}

/**
 * Verificar si el usuario es admin
 * Los admins tienen acceso total sin verificar permisos
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(request);
  if (!userId) return false;

  // TODO: Implementar verificación de rol
  // const user = await User.findById(userId);
  // return user?.role === 'admin';

  return false;
}
