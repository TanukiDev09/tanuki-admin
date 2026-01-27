import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import Book from '@/models/Book';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    // 1. Unified aggregation for active books stats
    const statsAggregation = await Book.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: 'bookId',
          as: 'inventory',
        },
      },
      {
        $addFields: {
          totalStock: { $sum: '$inventory.quantity' },
        },
      },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$totalStock' },
          totalValue: { $sum: { $multiply: ['$totalStock', '$price'] } },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$totalStock', 0] },
                    { $lt: ['$totalStock', 10] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$totalStock', 0] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = statsAggregation[0] || {
      totalUnits: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    // 2. Units Breakdown (Editorial vs Others) - Also restricted to active books
    const breakdownAggregation = await InventoryItem.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      { $match: { 'book.isActive': true } },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouseId',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: '$warehouse' },
      {
        $group: {
          _id: null,
          editorialUnits: {
            $sum: {
              $cond: [
                { $eq: ['$warehouse.type', 'editorial'] },
                '$quantity',
                0,
              ],
            },
          },
          otherUnits: {
            $sum: {
              $cond: [
                { $ne: ['$warehouse.type', 'editorial'] },
                '$quantity',
                0,
              ],
            },
          },
        },
      },
    ]);

    const breakdown = breakdownAggregation[0] || {
      editorialUnits: 0,
      otherUnits: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        totalUnits: stats.totalUnits,
        totalValue: stats.totalValue,
        lowStockCount: stats.lowStockCount,
        outOfStockCount: stats.outOfStockCount,
        editorialUnits: breakdown.editorialUnits,
        otherUnits: breakdown.otherUnits,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas de inventario' },
      { status: 500 }
    );
  }
}
