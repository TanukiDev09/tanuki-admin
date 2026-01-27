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

    const movement = await InventoryMovement.findById(id).session(session);
    if (!movement) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    // Reverse Inventory changes
    for (const item of movement.items) {
      const book = await Book.findById(item.bookId).session(session);
      if (!book) continue;

      const booksToUpdate = [];
      if (book.isBundle && book.bundleBooks && book.bundleBooks.length > 0) {
        for (const volumeId of book.bundleBooks) {
          booksToUpdate.push({ id: volumeId.toString(), qty: item.quantity });
        }
      } else {
        booksToUpdate.push({ id: item.bookId.toString(), qty: item.quantity });
      }

      for (const update of booksToUpdate) {
        // Reverse source warehouse (was decreased, now increase)
        if (movement.fromWarehouseId) {
          await InventoryItem.updateOne(
            { warehouseId: movement.fromWarehouseId, bookId: update.id },
            { $inc: { quantity: update.qty } },
            { session, upsert: true } // Use upsert in case record was deleted
          );
        }

        // Reverse destination warehouse (was increased, now decrease)
        if (movement.toWarehouseId) {
          // Check if we have enough stock to decrease
          const destItem = await InventoryItem.findOne({
            warehouseId: movement.toWarehouseId,
            bookId: update.id,
          }).session(session);

          if (!destItem || destItem.quantity < update.qty) {
            const bookName = book.isBundle
              ? `Tomos de ${book.title}`
              : book.title;
            await session.abortTransaction();
            return NextResponse.json(
              {
                success: false,
                error: `Stock insuficiente en destino para revertir el libro: ${bookName}`,
              },
              { status: 400 }
            );
          }

          await InventoryItem.updateOne(
            { warehouseId: movement.toWarehouseId, bookId: update.id },
            { $inc: { quantity: -update.qty } },
            { session }
          );
        }
      }
    }

    // Unlink financial movement instead of deleting it
    if (movement.financialMovementId) {
      await Movement.findByIdAndUpdate(
        movement.financialMovementId,
        {
          inventoryMovementId: null,
        },
        { session }
      );
    }

    // Delete the inventory movement
    await InventoryMovement.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      message: 'Movimiento eliminado y stock revertido',
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Error deleting inventory movement:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el movimiento' },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
