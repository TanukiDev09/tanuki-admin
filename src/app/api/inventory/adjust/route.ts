import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import '@/models/Warehouse';
import '@/models/Book';

export async function PUT(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body = await request.json();
    const { warehouseId, bookId, adjustment, reason } = body;

    if (!warehouseId || !bookId || adjustment === undefined) {
      return NextResponse.json(
        { error: 'warehouseId, bookId y adjustment son requeridos' },
        { status: 400 }
      );
    }

    let item = await InventoryItem.findOne({ warehouseId, bookId });
    let currentQuantity = 0;

    if (item) {
      currentQuantity = item.quantity;
    } else {
      // Create it if it doesn't exist
      item = new InventoryItem({
        warehouseId,
        bookId,
        quantity: 0,
      });
    }

    const newQuantity = currentQuantity + adjustment;

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'La cantidad resultante no puede ser negativa' },
        { status: 400 }
      );
    }

    item.quantity = newQuantity;
    item.lastUpdated = new Date();
    await item.save();

    const updatedItem = await InventoryItem.findById(item._id)
      .populate('warehouseId', 'name code')
      .populate('bookId', 'title isbn price');

    return NextResponse.json({
      item: updatedItem,
      adjustment,
      reason: reason || null,
    });
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error('Error adjusting inventory');
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
