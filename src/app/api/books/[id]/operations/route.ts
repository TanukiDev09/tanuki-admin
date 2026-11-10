import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import Invoice from '@/models/Invoice';
import InventoryItem from '@/models/InventoryItem';
import InventoryMovement from '@/models/InventoryMovement';
import PointOfSale from '@/models/PointOfSale';
import Warehouse from '@/models/Warehouse';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  computeBookOperations,
  type RecentMovement,
} from '@/lib/inventory/bookOperations';

import { getBookUnitCost } from '@/lib/inventory/unitCostQuery';

const RECENT_MOVEMENTS = 15;

// GET /api/books/[id]/operations
// Cobertura, rotación y señal de reimpresión del libro, separando la bodega
// propia (venta directa + remisiones) de las librerías (consignación).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.BOOKS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de libro inválido' },
        { status: 400 }
      );
    }
    const bookId = new mongoose.Types.ObjectId(id);

    const book = await Book.findById(bookId)
      .select('isBundle price costCenter')
      .lean();
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    // Una obra completa no tiene inventario propio: su stock se calcula de
    // sus volúmenes y los movimientos se registran por volumen.
    if (book.isBundle) {
      return NextResponse.json({
        success: true,
        data: { isBundle: true, operations: null },
      });
    }

    const [sales, pointsOfSale, warehouses, stock, movements, recent] =
      await Promise.all([
        Invoice.aggregate([
          { $match: { status: { $ne: 'Cancelled' }, 'items.bookId': bookId } },
          { $unwind: '$items' },
          { $match: { 'items.bookId': bookId } },
          {
            $project: {
              _id: 0,
              date: 1,
              customerName: 1,
              customerTaxId: 1,
              quantity: { $toDouble: { $ifNull: ['$items.quantity', 0] } },
            },
          },
        ]),
        PointOfSale.find()
          .select('name code city identificationNumber warehouseId')
          .lean(),
        Warehouse.find().select('type').lean(),
        InventoryItem.find({ bookId }).select('warehouseId quantity').lean(),
        InventoryMovement.aggregate([
          { $match: { 'items.bookId': bookId } },
          { $unwind: '$items' },
          { $match: { 'items.bookId': bookId } },
          {
            $project: {
              _id: 0,
              type: 1,
              date: 1,
              fromWarehouseId: 1,
              toWarehouseId: 1,
              quantity: { $toDouble: { $ifNull: ['$items.quantity', 0] } },
            },
          },
        ]),
        // Kardex corto: últimos movimientos del libro, con nombre de bodegas.
        InventoryMovement.find({ 'items.bookId': bookId })
          .sort({ date: -1 })
          .limit(RECENT_MOVEMENTS)
          .select('type consecutive date items fromWarehouseId toWarehouseId')
          .populate('fromWarehouseId toWarehouseId', 'name')
          .lean(),
      ]);

    const recentMovements: RecentMovement[] = recent.map((mv) => ({
      id: String(mv._id),
      type: mv.type,
      consecutive: mv.consecutive,
      date: new Date(mv.date).toISOString(),
      quantity:
        mv.items.find(
          (item: { bookId: mongoose.Types.ObjectId }) =>
            String(item.bookId) === id
        )?.quantity ?? 0,
      from: mv.fromWarehouseId?.name,
      to: mv.toWarehouseId?.name,
    }));

    // Bodega de punto de venta: por tipo, o enlazada desde el punto de venta.
    const posWarehouseIds = new Set<string>();
    for (const warehouse of warehouses) {
      if (warehouse.type === 'pos') posWarehouseIds.add(String(warehouse._id));
    }
    for (const pos of pointsOfSale) {
      if (pos.warehouseId) posWarehouseIds.add(String(pos.warehouseId));
    }

    const operations = computeBookOperations({
      sales,
      pointsOfSale: pointsOfSale.map((pos) => ({
        _id: pos._id,
        name: pos.name,
        code: pos.code,
        city: pos.city,
        identificationNumber: pos.identificationNumber,
        warehouseId: pos.warehouseId ? String(pos.warehouseId) : undefined,
      })),
      stock: stock.map((item) => ({
        warehouseId: String(item.warehouseId),
        quantity: item.quantity,
      })),
      movements: movements.map((mv) => ({
        type: mv.type,
        date: mv.date,
        fromWarehouseId: mv.fromWarehouseId
          ? String(mv.fromWarehouseId)
          : undefined,
        toWarehouseId: mv.toWarehouseId ? String(mv.toWarehouseId) : undefined,
        quantity: mv.quantity,
      })),
      posWarehouseIds: [...posWarehouseIds],
    });

    const unitCost = await getBookUnitCost(
      bookId,
      book.price,
      typeof book.costCenter === 'string' ? book.costCenter : undefined
    );

    const response = NextResponse.json({
      success: true,
      data: { isBundle: false, operations, recentMovements, unitCost },
    });
    response.headers.set('Cache-Control', 'private, no-cache, no-store');
    return response;
  } catch (error) {
    console.error('Error fetching book operations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener operaciones del libro' },
      { status: 500 }
    );
  }
}
