import { usePermissions } from '@/contexts/PermissionContext';
import { ModuleName, PermissionAction } from '@/types/permission';

/**
 * Hook para verificar un permiso específico
 * @param module Módulo a verificar
 * @param action Acción CRUD a verificar
 * @returns true si el usuario tiene el permiso
 */
export function usePermission(
  module: ModuleName,
  action: PermissionAction
): boolean;
export function usePermission(): {
  hasPermission: (module: ModuleName, action: PermissionAction) => boolean;
};
export function usePermission(module?: ModuleName, action?: PermissionAction) {
  const { hasPermission } = usePermissions();

  if (module && action) {
    return hasPermission(module, action);
  }

  return { hasPermission };
}

/**
 * Hook para obtener todos los permisos de un módulo
 * @param module Módulo a verificar
 * @returns Objeto con booleanos para cada acción CRUD
 */
export function useModulePermissions(module: ModuleName) {
  const { hasPermission } = usePermissions();

  return {
    canCreate: hasPermission(module, PermissionAction.CREATE),
    canRead: hasPermission(module, PermissionAction.READ),
    canUpdate: hasPermission(module, PermissionAction.UPDATE),
    canDelete: hasPermission(module, PermissionAction.DELETE),
  };
}

/**
 * Hook para verificar acceso general a un módulo
 * @param module Módulo a verificar
 * @returns true si el usuario tiene al menos un permiso en el módulo
 */
export function useHasAnyPermission(module: ModuleName): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(module);
}
