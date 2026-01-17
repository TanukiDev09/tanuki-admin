import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const bookId = searchParams.get('bookId');
    const minQuantity = searchParams.get('minQuantity');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    if (bookId) {
      query.bookId = bookId;
    }

    if (minQuantity) {
      query.quantity = { $gte: parseInt(minQuantity) };
    }

    let items = await InventoryItem.find(query)
      .populate('warehouseId', 'name code type')
      .populate('bookId', 'title isbn price')
      .sort({ warehouseId: 1, bookId: 1 });

    // Filter by search term if provided
    if (search) {
      items = items.filter((item) => {
        const book = item.bookId;
        if (!book) return false;
        const searchLower = search.toLowerCase();
        return (
          book.title?.toLowerCase().includes(searchLower) ||
          book.isbn?.toLowerCase().includes(searchLower)
        );
      });
    }

    const response = NextResponse.json(items);

    // Evitar cacheo para asegurar datos frescos
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error fetching inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { warehouseId, bookId, quantity } = body;

    if (!warehouseId || !bookId) {
      return NextResponse.json(
        { error: 'warehouseId y bookId son requeridos' },
        { status: 400 }
      );
    }

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'La cantidad no puede ser negativa' },
        { status: 400 }
      );
    }

    // Try to find existing item
    let item = await InventoryItem.findOne({ warehouseId, bookId });

    if (item) {
      // Update existing
      item.quantity = quantity;
      item.lastUpdated = new Date();
      if (body.minStock !== undefined) item.minStock = body.minStock;
      if (body.maxStock !== undefined) item.maxStock = body.maxStock;
      await item.save();
    } else {
      // Create new
      item = await InventoryItem.create(body);
    }

    const populatedItem = await InventoryItem.findById(item._id)
      .populate('warehouseId', 'name code')
      .populate('bookId', 'title isbn price');

    return NextResponse.json(populatedItem, { status: item ? 200 : 201 });
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error('Error creating/updating inventory');
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
