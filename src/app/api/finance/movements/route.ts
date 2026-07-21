import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import * as mongoose from 'mongoose';
import Movement from '@/models/Movement';
import { toNumber } from '@/lib/math';
import { MovementDoc } from './types';
import { buildQuery } from './queryBuilder';
import { formatMovements, formatSingleMovement } from './formatters';
import {
  validateAndSanitize,
  calculateFinancials,
  buildMovementDoc,
  linkInventoryMovement,
  updateDebtProgress,
} from './mutations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  await dbConnect();
  const { searchParams } = new URL(request.url);

  // Special case: Get distinct units
  if (searchParams.get('distinct') === 'unit') {
    try {
      const units = await Movement.distinct('unit', {
        unit: { $ne: '', $exists: true },
      });
      return NextResponse.json({ data: units.filter(Boolean) });
    } catch (error) {
      console.error('Distinct Units Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch distinct units' },
        { status: 500 }
      );
    }
  }

  // Special case: Get distinct payment channels
  if (searchParams.get('distinct') === 'paymentChannel') {
    try {
      const channels = await Movement.distinct('paymentChannel', {
        paymentChannel: { $ne: '', $exists: true },
      });
      return NextResponse.json({ data: channels.filter(Boolean) });
    } catch (error) {
      console.error('Distinct Payment Channels Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch distinct payment channels' },
        { status: 500 }
      );
    }
  }

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const sortParam = searchParams.get('sort') || 'newest';
  const sort: { [key: string]: mongoose.SortOrder } =
    sortParam === 'oldest' ? { date: 1 } : { date: -1 };

  try {
    const query = buildQuery(searchParams);

    const [movements, total] = await Promise.all([
      Movement.find(query)
        .sort(sort) // Dynamic sort
        .skip(skip)
        .limit(limit)
        .populate({ path: 'category', select: 'name' })
        .populate({ path: 'pointOfSale', select: 'name' })
        .lean<MovementDoc[]>(), // lean for better performance since reads
      Movement.countDocuments(query),
    ]);

    // Format for frontend (Decimal128 to number)
    const costCenter = searchParams.get('costCenter');
    const formattedMovements = formatMovements(
      movements,
      costCenter || undefined
    );

    const response = NextResponse.json({
      data: formattedMovements,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });

    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );

    return response;
  } catch (error) {
    console.error('Movements API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body = await request.json();

    // 1. Validation & Sanitization
    const validation = validateAndSanitize(body);
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }
    const { amount } = validation;

    // 2. Calculation
    const financials = calculateFinancials(body, amount);

    // 3. Document Construction
    const finalDoc = buildMovementDoc(body, financials, amount);

    // 4. DB Operations
    const movement = await Movement.create(finalDoc);

    // 4.1 Update Inventory Movement link if provided
    if (finalDoc.inventoryMovementId) {
      await linkInventoryMovement(
        finalDoc.inventoryMovementId as string,
        movement._id
      );
    }

    // 4.2 Update Debt if provided
    if (finalDoc.debtId) {
      await updateDebtProgress(
        finalDoc.debtId as string,
        toNumber(movement.amount)
      );
    }

    const populatedMovement = await movement.populate([
      { path: 'category', select: 'name' },
      { path: 'inventoryMovementId', select: 'type date' },
    ]);

    // 5. Formatting
    const formattedMovement = formatSingleMovement(populatedMovement);

    return NextResponse.json({ data: formattedMovement }, { status: 201 });
  } catch (err: unknown) {
    const error = err as {
      code?: number;
      errInfo?: unknown;
      message?: string;
      stack?: string;
    };
    console.error('Create Movement Error:', error);

    if (error.code === 121 && error.errInfo) {
      console.error(
        'Validation Error Info:',
        JSON.stringify(error.errInfo, null, 2)
      );
    }

    const details =
      error && typeof error === 'object'
        ? JSON.stringify(error, Object.getOwnPropertyNames(error))
        : String(error);

    return NextResponse.json(
      { error: 'Failed to create movement', details },
      { status: 500 }
    );
  }
}
