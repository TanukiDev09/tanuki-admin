import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import Book from '@/models/Book';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
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
