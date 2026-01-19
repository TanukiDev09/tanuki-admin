import Permission from '@/models/Permission';
import {
  ModuleName,
  PermissionAction,
  PermissionMatrix,
  ALL_MODULES,
  ALL_ACTIONS,
} from '@/types/permission';
import { UserRole } from '@/types/user';

/**
 * Verifica si un usuario tiene un permiso específico
 * @param userId ID del usuario
 * @param module Módulo a verificar
 * @param action Acción CRUD a verificar
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export async function checkPermission(
  userId: string,
  module: ModuleName,
  action: PermissionAction
): Promise<boolean> {
  try {
    const permission = await Permission.findOne({ userId, module });
    return permission ? permission.actions.includes(action) : false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Obtiene todos los permisos de un usuario en formato matriz
 * @param userId ID del usuario
 * @returns Matriz de permisos (módulo -> acciones)
 */
export async function getUserPermissions(
  userId: string
): Promise<PermissionMatrix> {
  try {
    const permissions = await Permission.find({ userId });

    const matrix: PermissionMatrix = {};
    permissions.forEach((perm) => {
      matrix[perm.module as ModuleName] = perm.actions;
    });

    return matrix;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {};
  }
}

/**
 * Verifica si un usuario tiene algún permiso en un módulo
 * @param userId ID del usuario
 * @param module Módulo a verificar
 * @returns true si el usuario tiene al menos un permiso en el módulo
 */
export async function hasAnyPermission(
  userId: string,
  module: ModuleName
): Promise<boolean> {
  try {
    const permission = await Permission.findOne({ userId, module });
    return permission ? permission.actions.length > 0 : false;
  } catch (error) {
    console.error('Error checking module permission:', error);
    return false;
  }
}

/**
 * Obtiene los permisos por defecto según el rol del usuario
 * @param role Rol del usuario
 * @returns Matriz de permisos por defecto
 */
export function getDefaultPermissions(role: UserRole): PermissionMatrix {
  const matrix: PermissionMatrix = {};

  if (role === UserRole.ADMIN) {
    // Admin tiene todos los permisos en todos los módulos
    ALL_MODULES.forEach((module) => {
      matrix[module] = [...ALL_ACTIONS];
    });
  } else if (role === UserRole.USER) {
    // User tiene permisos limitados
    ALL_MODULES.forEach((module) => {
      if (module === ModuleName.USERS) {
        // Sin acceso a gestión de usuarios
        return;
      }

      if (module === ModuleName.FINANCE) {
        // Solo lectura en finanzas
        matrix[module] = [PermissionAction.READ];
      } else {
        // CRUD completo en otros módulos
        matrix[module] = [...ALL_ACTIONS];
      }
    });
  } else if (role === UserRole.VIEWER) {
    // Viewer solo tiene permisos de lectura
    ALL_MODULES.forEach((module) => {
      if (module === ModuleName.USERS || module === ModuleName.FINANCE) {
        // Sin acceso a usuarios ni finanzas
        return;
      }
      matrix[module] = [PermissionAction.READ];
    });
  }

  return matrix;
}

/**
 * Crea los permisos por defecto para un usuario según su rol
 * @param userId ID del usuario
 * @param role Rol del usuario
 */
export async function createDefaultPermissions(
  userId: string,
  role: UserRole
): Promise<void> {
  try {
    console.log(`[Permissions] Ensuring default permissions for user ${userId} with role ${role}`);
    const defaultPermissions = getDefaultPermissions(role);

    const permissionDocs = Object.entries(defaultPermissions).map(
      ([module, actions]) => ({
        userId,
        module: module as ModuleName,
        actions,
      })
    );

    if (permissionDocs.length > 0) {
      console.log(`[Permissions] Inserting ${permissionDocs.length} permissions...`);
      // Usar insertMany con ordered: false para continuar si hay duplicados
      await Permission.insertMany(permissionDocs, { ordered: false });
      console.log('[Permissions] Insert completed');
    }
  } catch (error) {
    // Ignorar errores de duplicados (E11000)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      console.log('[Permissions] Duplicated permissions found, ignoring (this is normal)');
    } else {
      console.error('[Permissions] Error creating default permissions:', error);
      throw error;
    }
  }
}

/**
 * Actualiza todos los permisos de un usuario
 * @param userId ID del usuario
 * @param permissions Matriz de permisos a establecer
 */
export async function updateUserPermissions(
  userId: string,
  permissions: PermissionMatrix
): Promise<void> {
  try {
    // Eliminar permisos existentes
    await Permission.deleteMany({ userId });

    // Crear nuevos permisos
    const permissionDocs = Object.entries(permissions)
      .filter(([, actions]) => actions && actions.length > 0)
      .map(([module, actions]) => ({
        userId,
        module: module as ModuleName,
        actions,
      }));

    if (permissionDocs.length > 0) {
      await Permission.insertMany(permissionDocs);
    }
  } catch (error) {
    console.error('Error updating user permissions:', error);
    throw error;
  }
}
