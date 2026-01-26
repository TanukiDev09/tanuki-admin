import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
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
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo debe ser un PDF o una imagen (JPG, PNG, WEBP)',
        },
        { status: 400 }
      );
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo no debe superar los 10MB' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;

    // Subir a Vercel Blob
    const blob = await put(`invoices/${filename}`, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      filename: blob.url, // Devolvemos la URL completa
      message: 'Documento subido exitosamente',
    });
  } catch (error) {
    console.error('Error al subir documento de factura:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir el documento' },
      { status: 500 }
    );
  }
}
