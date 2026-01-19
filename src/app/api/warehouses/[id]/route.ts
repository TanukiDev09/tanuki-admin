import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import InventoryItem from '@/models/InventoryItem';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const permissionError = await requirePermission(
    request,
    ModuleName.WAREHOUSES,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const warehouse = await Warehouse.findById(id).populate(
      'pointOfSaleId',
      'name code'
    );

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Bodega no encontrada' },
        { status: 404 }
      );
    }

    // Get inventory count
    const inventoryCount = await InventoryItem.countDocuments({
      warehouseId: id,
    });

    const response = {
      ...warehouse.toObject(),
      inventoryCount,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: 'Error fetching warehouse' },
      { status: 500 }
    );
  }
}

async function updatePOSReferences(
  oldPosId: string | undefined,
  newPosId: string | undefined,
  warehouseId: string
) {
  if (oldPosId !== newPosId) {
    if (oldPosId) {
      await PointOfSale.findByIdAndUpdate(oldPosId, { warehouseId: null });
    }
    if (newPosId) {
      await PointOfSale.findByIdAndUpdate(newPosId, { warehouseId });
    }
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const permissionError = await requirePermission(
    request,
    ModuleName.WAREHOUSES,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Bodega no encontrada' },
        { status: 404 }
      );
    }

    const oldPosId = warehouse.pointOfSaleId?.toString();
    const newPosId = body.pointOfSaleId;

    if (newPosId && newPosId !== oldPosId) {
      const posExists = await PointOfSale.findById(newPosId);
      if (!posExists) {
        return NextResponse.json(
          { error: 'El punto de venta no existe' },
          { status: 400 }
        );
      }
    }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate('pointOfSaleId', 'name code');

    await updatePOSReferences(oldPosId, newPosId, id);

    return NextResponse.json(updatedWarehouse);
  } catch (err) {
    const error = err as { code?: number; message?: string };
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'El código de la bodega ya existe' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error updating warehouse' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const permissionError = await requirePermission(
    request,
    ModuleName.WAREHOUSES,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    // Check if warehouse has inventory
    const inventoryCount = await InventoryItem.countDocuments({
      warehouseId: id,
    });

    if (inventoryCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una bodega con inventario activo' },
        { status: 400 }
      );
    }

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Bodega no encontrada' },
        { status: 404 }
      );
    }

    // Remove reference from associated POS if any
    if (warehouse.pointOfSaleId) {
      await PointOfSale.findByIdAndUpdate(warehouse.pointOfSaleId, {
        warehouseId: null,
      });
    }

    await Warehouse.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Bodega eliminada correctamente' });
  } catch {
    return NextResponse.json(
      { error: 'Error deleting warehouse' },
      { status: 500 }
    );
  }
}
