import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryMovement from '@/models/InventoryMovement';
import InventoryItem from '@/models/InventoryItem';
import Book from '@/models/Book';
import Movement from '@/models/Movement';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    const movement = await InventoryMovement.findById(id)
      .populate({
        path: 'fromWarehouseId',
        select: 'name type address city pointOfSaleId',
        populate: {
          path: 'pointOfSaleId',
          select:
            'name identificationType identificationNumber address city discountPercentage',
        },
      })
      .populate({
        path: 'toWarehouseId',
        select: 'name type address city pointOfSaleId',
        populate: {
          path: 'pointOfSaleId',
          select:
            'name identificationType identificationNumber address city discountPercentage',
        },
      })
      .populate('items.bookId', 'title isbn price')
      .populate('createdBy', 'name');

    if (!movement) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: movement });
  } catch (error) {
    console.error('Error fetching inventory movement:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el movimiento' },
      { status: 500 }
    );
  }
}

/**
 * Reverse stock in source warehouse
 */
async function reverseSourceStock(
  warehouseId: string,
  bookId: string,
  qty: number,
  session: mongoose.ClientSession
) {
  await InventoryItem.updateOne(
    { warehouseId, bookId },
    { $inc: { quantity: qty } },
    { session, upsert: true }
  );
}

/**
 * Reverse stock in destination warehouse
 */
async function reverseDestStock(
  warehouseId: string,
  bookId: string,
  qty: number,
  bookTitle: string,
  session: mongoose.ClientSession
) {
  const destItem = await InventoryItem.findOne({
    warehouseId,
    bookId,
  }).session(session);

  if (!destItem || destItem.quantity < qty) {
    throw new Error(
      `Stock insuficiente en destino para revertir el libro: ${bookTitle}`
    );
  }

  await InventoryItem.updateOne(
    { warehouseId, bookId },
    { $inc: { quantity: -qty } },
    { session }
  );
}

/**
 * Helper to reverse stock changes for a single item in a movement
 */
async function reverseStockForItem(
  item: { bookId: string | mongoose.Types.ObjectId; quantity: number },
  movement: { fromWarehouseId?: string; toWarehouseId?: string },
  session: mongoose.ClientSession
) {
  const book = await Book.findById(item.bookId).session(session);
  if (!book) return;

  const booksToUpdate: Array<{ id: string; qty: number }> = [];
  if (book.isBundle && book.bundleBooks && book.bundleBooks.length > 0) {
    for (const volumeId of book.bundleBooks) {
      booksToUpdate.push({ id: volumeId.toString(), qty: item.quantity });
    }
  } else {
    booksToUpdate.push({ id: item.bookId.toString(), qty: item.quantity });
  }

  const bookName = book.isBundle ? `Tomos de ${book.title}` : book.title;

  for (const update of booksToUpdate) {
    if (movement.fromWarehouseId) {
      await reverseSourceStock(
        movement.fromWarehouseId.toString(),
        update.id,
        update.qty,
        session
      );
    }

    if (movement.toWarehouseId) {
      await reverseDestStock(
        movement.toWarehouseId.toString(),
        update.id,
        update.qty,
        bookName,
        session
      );
    }
  }
}

/**
 * Helper to perform the deletion and reversal within a session
 */
async function performDelete(id: string, session: mongoose.ClientSession) {
  const movement = await InventoryMovement.findById(id).session(session);
  if (!movement) {
    return { success: false, error: 'Movimiento no encontrado', code: 404 };
  }

  // Reverse Inventory changes
  for (const item of movement.items) {
    await reverseStockForItem(item, movement, session);
  }

  // Unlink financial movement instead of deleting it
  if (movement.financialMovementId) {
    await Movement.findByIdAndUpdate(
      movement.financialMovementId,
      { inventoryMovementId: null },
      { session }
    );
  }

  // Delete the inventory movement
  await InventoryMovement.findByIdAndDelete(id, { session });
  return { success: true };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const { id } = await params;

    const result = await performDelete(id, session);
    if (!result.success) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.code || 400 }
      );
    }

    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      message: 'Movimiento eliminado y stock revertido',
    });
  } catch (error: unknown) {
    if (session.inTransaction()) await session.abortTransaction();
    const e = error as Error;
    console.error('Error deleting inventory movement:', e);
    return NextResponse.json(
      {
        success: false,
        error: e.message || 'Error al eliminar el movimiento',
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
