import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryMovement from '@/models/InventoryMovement';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const movement = await InventoryMovement.findById(id)
      .populate({
        path: 'fromWarehouseId',
        select: 'name type address city pointOfSaleId',
        populate: {
          path: 'pointOfSaleId',
          select:
            'name identificationType identificationNumber address city discountPercentage',
        },
      })
      .populate({
        path: 'toWarehouseId',
        select: 'name type address city pointOfSaleId',
        populate: {
          path: 'pointOfSaleId',
          select:
            'name identificationType identificationNumber address city discountPercentage',
        },
      })
      .populate('items.bookId', 'title isbn price')
      .populate('createdBy', 'name');

    if (!movement) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: movement });
  } catch (error) {
    console.error('Error fetching inventory movement:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el movimiento' },
      { status: 500 }
    );
  }
}
