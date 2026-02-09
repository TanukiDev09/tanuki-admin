import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const item = await InventoryItem.findById(id);

    if (!item) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      );
    }

    // Optional: Only allow deletion if stock is 0?
    // The request doesn't specify this, but usually it's safer.
    // However, if the user wants to "remove a book from inventory", maybe they want to purge it.
    // Let's stick to simple deletion for now as requested.

    await InventoryItem.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Item eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el item de inventario' },
      { status: 500 }
    );
  }
}
