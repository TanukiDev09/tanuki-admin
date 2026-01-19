import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.BOOKS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'La imagen no debe superar los 5MB' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;

    // Subir a Vercel Blob
    const blob = await put(`covers/${filename}`, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      filename: blob.url, // Devolvemos la URL completa
      message: 'Imagen subida exitosamente',
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}
