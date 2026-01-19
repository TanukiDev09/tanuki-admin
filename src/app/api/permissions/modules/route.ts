import { NextResponse } from 'next/server';
import {
  ALL_MODULES,
  MODULE_METADATA,
  ModuleMetadata,
  ModuleName,
} from '@/types/permission';
import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { PermissionAction } from '@/types/permission';

// GET /api/permissions/modules - Listar módulos disponibles
export async function GET(request: NextRequest) {
  // Only users who can read users (admins/managers) should see technical module details
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    const modules: ModuleMetadata[] = ALL_MODULES.map((module) => ({
      name: module as ModuleName,
      label: MODULE_METADATA[module as ModuleName].label,
      description: MODULE_METADATA[module as ModuleName].description,
    }));

    return NextResponse.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los módulos',
      },
      { status: 500 }
    );
  }
}
