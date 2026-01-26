import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import mongoose from 'mongoose';
import '@/models/Book'; // Ensure Book model is registered

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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const pipeline: any[] = [
      { $match: { warehouseId: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'bookId',
        },
      },
      { $unwind: '$bookId' },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'bookId.title': { $regex: search, $options: 'i' } },
            { 'bookId.isbn': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { 'bookId.title': 1 } });

    const items = await InventoryItem.aggregate(pipeline);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    return NextResponse.json(
      { error: 'Error fetching warehouse inventory' },
      { status: 500 }
    );
  }
}
