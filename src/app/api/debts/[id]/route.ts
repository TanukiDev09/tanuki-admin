import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Debt from '@/models/Debt';
import '@/models/Creator';
import '@/models/PointOfSale';
import '@/models/ExternalEntity';
import { toNumber, subtract } from '@/lib/math';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  await dbConnect();
  try {
    const debt = await Debt.findById(id).populate('entityId');
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const formatted = {
      ...debt.toObject(),
      _id: debt._id.toString(),
      totalAmount: toNumber(debt.totalAmount),
      paidAmount: toNumber(debt.paidAmount),
      remainingBalance: toNumber(debt.remainingBalance),
    };

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error('Fetch Debt Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debt' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  await dbConnect();
  try {
    const body = await request.json();
    const debt = await Debt.findById(id);
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    // If we are updating amount/paidAmount, recalculate remainingBalance
    if (body.totalAmount !== undefined || body.paidAmount !== undefined) {
      const total =
        body.totalAmount !== undefined ? body.totalAmount : debt.totalAmount;
      const paid =
        body.paidAmount !== undefined ? body.paidAmount : debt.paidAmount;
      body.remainingBalance = subtract(total, paid);

      // Auto-update status based on balance
      if (toNumber(body.remainingBalance) <= 0) {
        body.status = 'Pagado';
      } else if (toNumber(paid) > 0) {
        body.status = 'Pagado Parcial';
      } else {
        body.status = 'Pendiente';
      }
    }

    const updatedDebt = await Debt.findByIdAndUpdate(id, body, {
      new: true,
    });
    return NextResponse.json({ data: updatedDebt });
  } catch (error) {
    console.error('Update Debt Error:', error);
    return NextResponse.json(
      { error: 'Failed to update debt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  await dbConnect();
  try {
    const debt = await Debt.findById(id);
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    // Check if there are payments associated?
    // In this system, payments are Movements. We might want to prevent deletion if there are payments.
    if (toNumber(debt.paidAmount) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete debt with payments' },
        { status: 400 }
      );
    }

    await Debt.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Debt deleted' });
  } catch (error) {
    console.error('Delete Debt Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete debt' },
      { status: 500 }
    );
  }
}
