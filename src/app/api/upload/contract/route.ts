import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.AGREEMENTS,
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

    // Validar tipo de archivo (PDF)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un PDF' },
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

    // Crear directorio si no existe
    const uploadsDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'contracts'
    );
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^\w.-]/g, '-').toLowerCase(); // Sanitize
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadsDir, filename);

    // Guardar archivo
    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      message: 'Contrato subido exitosamente',
    });
  } catch (error) {
    console.error('Error al subir contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir el contrato' },
      { status: 500 }
    );
  }
}
