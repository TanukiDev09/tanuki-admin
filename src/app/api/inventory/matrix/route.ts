import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import Warehouse from '@/models/Warehouse';
import InventoryItem from '@/models/InventoryItem';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 1. Get all warehouses for columns
    const warehouses = await Warehouse.find({})
      .select('name code type')
      .sort({ name: 1 });

    // 2. Build query for books
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    // 3. Pagination for books
    const skip = (page - 1) * limit;
    const totalBooks = await Book.countDocuments(query);
    const books = await Book.find(query)
      .select('title isbn price coverImage')
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 4. Get inventory for these books
    const bookIds = books.map((b) => b._id);
    const inventoryItems = await InventoryItem.find({
      bookId: { $in: bookIds },
    }).lean();

    // 5. Transform data for matrix
    const matrixData = books.map((book) => {
      const bookInventory = inventoryItems.filter(
        (item) => item.bookId.toString() === book._id.toString()
      );

      const stockByWarehouse: Record<string, number> = {};
      let totalStock = 0;

      warehouses.forEach((w) => {
        const item = bookInventory.find(
          (i) => i.warehouseId.toString() === w._id.toString()
        );
        const qty = item ? item.quantity : 0;
        stockByWarehouse[w._id.toString()] = qty;
        totalStock += qty;
      });

      return {
        _id: book._id,
        title: book.title,
        isbn: book.isbn,
        price: book.price,
        coverImage: book.coverImage,
        totalStock,
        stockByWarehouse,
      };
    });

    return NextResponse.json({
      success: true,
      warehouses,
      data: matrixData,
      pagination: {
        total: totalBooks,
        page,
        limit,
        pages: Math.ceil(totalBooks / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory matrix:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener matriz de inventario' },
      { status: 500 }
    );
  }
}
