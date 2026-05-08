import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CostCenter from '@/models/CostCenter';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

// GET /api/costcenters/[id] - Obtener un centro de costo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();

    const costCenter = await CostCenter.findById(id);

    if (!costCenter) {
      return NextResponse.json(
        { success: false, error: 'Centro de costo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: costCenter,
    });
  } catch (error) {
    console.error('Get Cost Center Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el centro de costo' },
      { status: 500 }
    );
  }
}

// PUT /api/costcenters/[id] - Actualizar campos (nombre, descripción, estado) de un centro de costo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();

    const updateData: {
      name?: string;
      description?: string;
      isActive?: boolean;
    } = {};

    // Validar y actualizar nombre si se proporciona
    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        return NextResponse.json(
          { success: false, error: 'El nombre debe tener al menos 2 caracteres' },
          { status: 400 }
        );
      }

      // Verificar si ya existe otro centro de costo con el mismo nombre
      const existingName = await CostCenter.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });

      if (existingName) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro centro de costo con este nombre' },
          { status: 409 }
        );
      }

      updateData.name = trimmedName;
    }

    // Actualizar descripción si se proporciona
    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }

    // Actualizar estado de activación si se proporciona
    if (body.isActive !== undefined) {
      updateData.isActive = !!body.isActive;
    }

    const costCenter = await CostCenter.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!costCenter) {
      return NextResponse.json(
        { success: false, error: 'Centro de costo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: costCenter,
      message: 'Centro de costo actualizado exitosamente',
    });
  } catch (error) {
    console.error('Update Cost Center Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el centro de costo' },
      { status: 500 }
    );
  }
}

// DELETE /api/costcenters/[id] - Borrado lógico (soft-delete) de un centro de costo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();

    // Borrado lógico marcando isActive = false para preservar registros históricos en facturas y movimientos
    const costCenter = await CostCenter.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!costCenter) {
      return NextResponse.json(
        { success: false, error: 'Centro de costo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Centro de costo desactivado (eliminado lógicamente) exitosamente',
    });
  } catch (error) {
    console.error('Delete Cost Center Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el centro de costo' },
      { status: 500 }
    );
  }
}
