import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verificar permiso de lectura
  const permissionError = await requirePermission(
    request,
    ModuleName.BOOKS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    // Get unique collection names that are not null or empty
    const collections = await Book.distinct('collectionName', {
      collectionName: { $ne: null, $exists: true, $regex: /.+/ },
    });

    // Sort alphabetically
    collections.sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener colecciones' },
      { status: 500 }
    );
  }
}
