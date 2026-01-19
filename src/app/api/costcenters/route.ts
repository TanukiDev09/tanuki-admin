import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import CostCenter from '@/models/CostCenter';

// GET /api/costcenters - Listar centros de costo activos
export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const costCenters = await CostCenter.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: costCenters,
    });
  } catch (error) {
    console.error('Error al obtener centros de costo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener centros de costo' },
      { status: 500 }
    );
  }
}

// POST /api/costcenters - Crear centro de costo
export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const body = await request.json();

    // Validar campos requeridos
    if (!body.code || body.code.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El código es requerido' },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe el código
    const existingCode = await CostCenter.findOne({
      code: body.code.trim().toUpperCase(),
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'Este código ya existe' },
        { status: 409 }
      );
    }

    // Verificar si ya existe el nombre
    const existingName = await CostCenter.findOne({
      name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
    });

    if (existingName) {
      return NextResponse.json(
        { success: false, error: 'Este nombre ya existe' },
        { status: 409 }
      );
    }

    const costCenter = await CostCenter.create({
      code: body.code.trim().toUpperCase(),
      name: body.name.trim(),
      description: body.description?.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        data: costCenter,
        message: 'Centro de costo creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear centro de costo:', error);

    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Este centro de costo ya existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear centro de costo' },
      { status: 500 }
    );
  }
}
