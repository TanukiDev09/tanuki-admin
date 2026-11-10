import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CostCenter from '@/models/CostCenter';
import Invoice from '@/models/Invoice';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  buildSalesChannelSlices,
  buildTopPointsOfSale,
} from '@/lib/finance/salesChannels';

// GET /api/costcenters/[id]/sales-channels
// Ejemplares vendidos del centro de costo, divididos entre puntos de venta y
// venta directa, más el top 5 de puntos de venta por ingresos aportados.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.COST_CENTERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    await dbConnect();

    const costCenter = await CostCenter.findById(id).lean();
    if (!costCenter) {
      return NextResponse.json(
        { success: false, error: 'Centro de costo no encontrado' },
        { status: 404 }
      );
    }

    // Mismo criterio que getUnitsSoldFromInvoices (libros, no anuladas).
    const [rows, pointsOfSale] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        {
          $match: {
            'items.type': 'libro',
            'items.costCenter': costCenter.code,
          },
        },
        {
          $project: {
            _id: 0,
            customerName: 1,
            customerTaxId: 1,
            date: 1,
            quantity: { $ifNull: ['$items.quantity', 0] },
            total: {
              $multiply: [
                { $toDouble: { $ifNull: ['$items.total', 0] } },
                { $toDouble: { $ifNull: ['$exchangeRate', 1] } },
              ],
            },
          },
        },
      ]),
      PointOfSale.find({ status: 'active' })
        .select('name code city identificationNumber')
        .lean(),
    ]);

    const data = buildSalesChannelSlices(rows, pointsOfSale);
    const topPointsOfSale = buildTopPointsOfSale(rows, pointsOfSale, 5);

    return NextResponse.json({ success: true, data, topPointsOfSale });
  } catch (error) {
    console.error('Cost Center Sales Channels Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener ventas por canal' },
      { status: 500 }
    );
  }
}
