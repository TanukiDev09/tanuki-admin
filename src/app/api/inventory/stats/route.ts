import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import Book from '@/models/Book';

export async function GET() {
  try {
    await dbConnect();

    // 1. Get total active Global Stock and Total active books with stock
    const stockAggregation = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$bookId',
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $group: {
          _id: null,
          booksWithStockCount: {
            $sum: { $cond: [{ $gt: ['$totalQuantity', 0] }, 1, 0] },
          },
          totalGlobalUnits: { $sum: '$totalQuantity' },
          // Count books that have records but sum is < 10 (and > 0)
          lowStockObservedCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$totalQuantity', 0] },
                    { $lt: ['$totalQuantity', 10] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const aggResult = stockAggregation[0] || {
      booksWithStockCount: 0,
      totalGlobalUnits: 0,
      lowStockObservedCount: 0,
    };

    // 2. Get Total Books defined in the catalog
    const totalBooksCount = await Book.countDocuments({ isActive: true });

    // 3. Derived Stats
    // Out of Stock = Total Active Books - Books that have > 0 stock
    // (This assumes that if a book has no inventory records, it is out of stock)
    const outOfStockCount = Math.max(
      0,
      totalBooksCount - aggResult.booksWithStockCount
    );

    // Low Stock = Books with low stock (observed) + Books with NO stock (technically 0 is low)
    // Actually, usually "Low Stock" implies "It's running out but not empty".
    // "Sin Stock" implies empty.
    // If the card says "Stock Bajo", user expects "Running out".
    // So let's keep lowStockCount as "Books with 1..9 units".
    const lowStockCount = aggResult.lowStockObservedCount;

    // 4. Calculate Total Value
    const valuationStats = await InventoryItem.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$book.price'] } },
        },
      },
    ]);

    const totalValue = valuationStats[0]?.totalValue || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUnits: aggResult.totalGlobalUnits,
        totalValue: totalValue,
        lowStockCount: lowStockCount,
        outOfStockCount: outOfStockCount,
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
