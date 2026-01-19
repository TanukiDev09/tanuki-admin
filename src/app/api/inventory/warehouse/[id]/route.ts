import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const items = await InventoryItem.find({ warehouseId: id })
      .populate('bookId', 'title isbn price coverImage')
      .sort({ 'bookId.title': 1 });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: 'Error fetching warehouse inventory' },
      { status: 500 }
    );
  }
}
