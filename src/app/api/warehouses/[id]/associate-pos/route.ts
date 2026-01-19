import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

interface Params {
  params: Promise<{ id: string }>;
}

interface IWarehouseMethods {
  pointOfSaleId: string | null;
  save: () => Promise<void>;
}

async function associateWithPOS(
  warehouse: IWarehouseMethods,
  pointOfSaleId: string,
  warehouseId: string,
  oldPosId?: string
) {
  const pos = await PointOfSale.findById(pointOfSaleId);
  if (!pos) return false;

  warehouse.pointOfSaleId = pointOfSaleId;
  await warehouse.save();

  await PointOfSale.findByIdAndUpdate(pointOfSaleId, { warehouseId });

  if (oldPosId && oldPosId !== pointOfSaleId) {
    await PointOfSale.findByIdAndUpdate(oldPosId, { warehouseId: null });
  }
  return true;
}

async function disassociateFromPOS(
  warehouse: IWarehouseMethods,
  oldPosId?: string
) {
  warehouse.pointOfSaleId = null;
  await warehouse.save();

  if (oldPosId) {
    await PointOfSale.findByIdAndUpdate(oldPosId, { warehouseId: null });
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
    const { pointOfSaleId } = body;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Bodega no encontrada' },
        { status: 404 }
      );
    }

    const oldPosId = warehouse.pointOfSaleId?.toString();

    if (pointOfSaleId) {
      const success = await associateWithPOS(
        warehouse,
        pointOfSaleId,
        id,
        oldPosId
      );
      if (!success) {
        return NextResponse.json(
          { error: 'Punto de venta no encontrado' },
          { status: 404 }
        );
      }
    } else {
      await disassociateFromPOS(warehouse, oldPosId);
    }

    const updatedWarehouse = await Warehouse.findById(id).populate(
      'pointOfSaleId',
      'name code'
    );

    return NextResponse.json(updatedWarehouse);
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error('Error associating warehouse');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
