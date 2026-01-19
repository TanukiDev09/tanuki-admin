import dbConnect from './mongodb';
import InventoryItem from '@/models/InventoryItem';
import mongoose from 'mongoose';
import { InventoryByWarehouse } from '@/types/book';

/**
 * Calculate total stock for a book across all warehouses
 * @param bookId - MongoDB ObjectId or string ID of the book
 * @returns Total quantity across all warehouse inventories
 */
export async function calculateTotalStock(
  bookId: string | mongoose.Types.ObjectId
): Promise<number> {
  await dbConnect();

  const result = await InventoryItem.aggregate([
    {
      $match: {
        bookId: new mongoose.Types.ObjectId(bookId.toString()),
      },
    },
    {
      $group: {
        _id: null,
        totalStock: { $sum: '$quantity' },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalStock : 0;
}

/**
 * Get detailed inventory breakdown by warehouse for a book
 * @param bookId - MongoDB ObjectId or string ID of the book
 * @returns Array of inventory details per warehouse
 */
export async function getInventoryByWarehouse(
  bookId: string | mongoose.Types.ObjectId
): Promise<InventoryByWarehouse[]> {
  await dbConnect();

  const inventoryItems = await InventoryItem.find({
    bookId: new mongoose.Types.ObjectId(bookId.toString()),
  })
    .populate('warehouseId')
    .lean();

  return (
    inventoryItems as unknown as {
      warehouseId: {
        _id: mongoose.Types.ObjectId;
        name: string;
        code: string;
        type: 'main' | 'secondary' | 'point_of_sale';
      };
      quantity: number;
      minStock?: number;
      maxStock?: number;
    }[]
  ).map((item) => ({
    warehouseId: item.warehouseId._id.toString(),
    warehouseName: item.warehouseId.name,
    warehouseCode: item.warehouseId.code,
    warehouseType: item.warehouseId.type,
    quantity: item.quantity,
    minStock: item.minStock,
    maxStock: item.maxStock,
  }));
}

/**
 * Get stock status for a book based on total quantity
 * @param totalStock - Total stock quantity
 * @param minThreshold - Minimum stock threshold (default: 10)
 * @returns Stock status: 'out', 'low', 'normal', 'high'
 */
export function getStockStatus(
  totalStock: number,
  minThreshold: number = 10
): 'out' | 'low' | 'normal' | 'high' {
  if (totalStock === 0) return 'out';
  if (totalStock < minThreshold) return 'low';
  if (totalStock < minThreshold * 5) return 'normal';
  return 'high';
}

/**
 * Get stock status with color coding
 * @param totalStock - Total stock quantity
 * @returns Object with status and corresponding color
 */
export function getStockStatusWithColor(totalStock: number): {
  status: string;
  color: string;
  bgColor: string;
} {
  const status = getStockStatus(totalStock);

  const statusMap = {
    out: { status: 'Sin Stock', color: 'text-red-600', bgColor: 'bg-red-50' },
    low: {
      status: 'Stock Bajo',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    normal: {
      status: 'Stock Normal',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    high: {
      status: 'Stock Alto',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  };

  return statusMap[status];
}
