import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import InventoryItem from '@/models/InventoryItem';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { buildBookPointsOfSaleStats } from '@/lib/finance/salesChannels';

// GET /api/books/[id]/points-of-sale
// Ventas del libro por canal (puntos de venta vs. venta directa) y la
// participación de cada punto de venta, con su stock actual en consignación.
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

    const [rows, pointsOfSale] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, 'items.bookId': bookId } },
        { $unwind: '$items' },
        { $match: { 'items.bookId': bookId } },
        {
          $project: {
            _id: 0,
            customerName: 1,
            customerTaxId: 1,
            date: 1,
            quantity: { $toDouble: { $ifNull: ['$items.quantity', 0] } },
            total: {
              $multiply: [
                { $toDouble: { $ifNull: ['$items.total', 0] } },
                { $toDouble: { $ifNull: ['$exchangeRate', 1] } },
              ],
            },
          },
        },
      ]),
      // Incluye inactivos: las ventas históricas a un punto de venta cerrado
      // siguen siendo ventas por ese canal.
      PointOfSale.find()
        .select('name code city identificationNumber warehouseId')
        .lean(),
    ]);

    const { summary, pointsOfSale: ranking } = buildBookPointsOfSaleStats(
      rows,
      pointsOfSale
    );

    // Stock actual del libro en la bodega de cada punto de venta.
    const warehouseByPos = new Map(
      pointsOfSale
        .filter((pos) => pos.warehouseId)
        .map((pos) => [String(pos._id), String(pos.warehouseId)])
    );
    const inventory = await InventoryItem.find({
      bookId,
      warehouseId: { $in: [...warehouseByPos.values()] },
    })
      .select('warehouseId quantity')
      .lean();
    const stockByWarehouse = new Map(
      inventory.map((item) => [String(item.warehouseId), item.quantity])
    );

    const data = ranking.map((pos) => {
      const warehouseId = warehouseByPos.get(pos.id);
      return {
        ...pos,
        stock: warehouseId ? (stockByWarehouse.get(warehouseId) ?? 0) : null,
      };
    });
    // Total en consignación en todos los puntos de venta, incluso los que
    // todavía no registran ventas del libro.
    const stockInPointsOfSale = inventory.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: { ...summary, stockInPointsOfSale },
        pointsOfSale: data,
      },
    });
  } catch (error) {
    console.error('Error fetching book points of sale stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener ventas por punto de venta' },
      { status: 500 }
    );
  }
}
