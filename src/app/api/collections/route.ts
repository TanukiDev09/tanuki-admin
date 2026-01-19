import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Collection from '@/models/Collection';

// GET /api/collections - Listar colecciones activas
export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COLLECTIONS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const collections = await Collection.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

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

// POST /api/collections - Crear colección
export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COLLECTIONS,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const body = await request.json();

    // Validar campos requeridos
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await Collection.findOne({
      name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Esta colección ya existe' },
        { status: 409 }
      );
    }

    const collection = await Collection.create({
      name: body.name.trim(),
      description: body.description?.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        data: collection,
        message: 'Colección creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear colección:', error);

    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Esta colección ya existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear colección' },
      { status: 500 }
    );
  }
}
