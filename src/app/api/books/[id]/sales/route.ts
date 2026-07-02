import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { subMonths, startOfMonth, format } from 'date-fns';
import mongoose from 'mongoose';

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

    const bookObjectId = new mongoose.Types.ObjectId(id);
    const now = new Date();

    // Find the oldest invoice for this book to determine the start date
    const oldestInvoice = await Invoice.findOne(
      {
        status: { $ne: 'Cancelled' },
        'items.bookId': bookObjectId,
      },
      { date: 1 }
    )
      .sort({ date: 1 })
      .lean();

    const startDate = oldestInvoice
      ? startOfMonth(oldestInvoice.date)
      : startOfMonth(now);

    // 1. Total lifetime sales
    const totalSalesAgg = await Invoice.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' },
          'items.bookId': bookObjectId,
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.bookId': bookObjectId } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
    ]);

    const totalSold =
      totalSalesAgg.length > 0 ? totalSalesAgg[0].totalQuantity : 0;
    const totalRevenue =
      totalSalesAgg.length > 0 ? totalSalesAgg[0].totalRevenue : 0;

    // 2. Historical sales (last 12 months)
    const historyAgg = await Invoice.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' },
          'items.bookId': bookObjectId,
          date: { $gte: startDate },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.bookId': bookObjectId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 3. Format history data for the chart (fill gaps with 0)
    const history = [];
    let current = new Date(startDate);
    const end = startOfMonth(now);

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;

      const match = historyAgg.find(
        (h) => h._id.year === year && h._id.month === month
      );

      history.push({
        month: format(current, 'MMM yy'),
        fullMonth: format(current, 'yyyy-MM'),
        quantity: match ? match.quantity : 0,
        revenue: match ? match.revenue : 0,
      });

      current = subMonths(current, -1); // Move to next month
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSold,
        totalRevenue,
        history,
      },
    });
  } catch (error) {
    console.error('Error fetching book sales stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas de venta' },
      { status: 500 }
    );
  }
}
