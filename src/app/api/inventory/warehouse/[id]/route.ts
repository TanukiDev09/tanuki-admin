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

    const pipeline: mongoose.PipelineStage[] = [
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

    // Also fetch bundles to include them as virtual inventory if they have stock
    const bundleFilter: any = { isBundle: true, isActive: true };
    if (search) {
      bundleFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    const bundles = await Book.find(bundleFilter).lean();

    if (bundles.length > 0) {
      // Get all inventory for this warehouse to calculate bundle stock
      const warehouseInventory = await InventoryItem.find({
        warehouseId: new mongoose.Types.ObjectId(id),
      }).lean();

      const invMap = new Map();
      warehouseInventory.forEach((item) => {
        invMap.set(item.bookId.toString(), item.quantity);
      });

      const bundleItems = bundles
        .map((bundle) => {
          const volumeIds = (bundle.bundleBooks || []).map((v: any) =>
            v.toString()
          );
          if (volumeIds.length === 0) return null;

          let minStock = Infinity;
          for (const vId of volumeIds) {
            const stock = invMap.get(vId) || 0;
            if (stock < minStock) minStock = stock;
          }

          // In inventory search, we typically only show items with stock > 0
          // or if specific search is performed
          if (minStock <= 0 && !search) return null;

          return {
            _id: `virtual-${bundle._id}`, // Mark as virtual but keep compatible structure
            warehouseId: id,
            bookId: bundle,
            quantity: minStock,
            isVirtual: true,
          };
        })
        .filter(Boolean);

      // Combine and sort
      const combined = [...items, ...bundleItems];
      combined.sort((a, b) => {
        const titleA = a.bookId.title || '';
        const titleB = b.bookId.title || '';
        return titleA.localeCompare(titleB);
      });

      return NextResponse.json(combined);
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    return NextResponse.json(
      { error: 'Error fetching warehouse inventory' },
      { status: 500 }
    );
  }
}
