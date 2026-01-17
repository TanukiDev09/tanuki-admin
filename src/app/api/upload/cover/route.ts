import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
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

    // Crear directorio si no existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadsDir, filename);

    // Guardar archivo
    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      filename,
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
