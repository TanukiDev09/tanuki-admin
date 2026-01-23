import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import * as mongoose from 'mongoose';
import Movement from '@/models/Movement';
import InventoryMovement from '@/models/InventoryMovement';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  await dbConnect();
  const params = await props.params;
  try {
    const movement = await Movement.findById(params.id)
      .populate({ path: 'category', select: 'name' })
      .populate({ path: 'pointOfSale', select: 'name' })
      .lean();

    if (!movement) {
      return NextResponse.json(
        { error: 'Movement not found' },
        { status: 404 }
      );
    }

    let normalizedType = movement.type;
    if (movement.type === 'Ingreso') normalizedType = 'INCOME';
    else if (movement.type === 'Egreso') normalizedType = 'EXPENSE';

    const formattedMovement = {
      ...movement,
      type: normalizedType,
      amount: movement.amount ? parseFloat(movement.amount.toString()) : 0,
      quantity: movement.quantity
        ? parseFloat(movement.quantity.toString())
        : undefined,
      unitValue: movement.unitValue
        ? parseFloat(movement.unitValue.toString())
        : undefined,
      allocations: (movement.allocations as Allocation[])?.map((a) => ({
        ...a,
        amount: a.amount ? parseFloat(a.amount.toString()) : 0,
      })),
      _id: movement._id.toString(),
    };

    return NextResponse.json({ data: formattedMovement });
  } catch (error) {
    console.error('Get Movement Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movement' },
      { status: 500 }
    );
  }
}

interface MovementBody {
  [key: string]: unknown;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  quantity?: number | string;
  unitValue?: number;
  amountInCOP?: number;
}

interface Allocation {
  costCenter: string;
  amount: { toString: () => string } | number;
}

interface MovementDoc {
  _id: { toString: () => string };
  amount: { toString: () => string };
  type: string;
  unit?: string;
  quantity?: { toString: () => string };
  unitValue?: { toString: () => string };
  allocations?: Allocation[];
  [key: string]: unknown;
}

interface FormattedMovement extends Omit<
  MovementDoc,
  'amount' | 'quantity' | 'unitValue' | '_id'
> {
  _id: string;
  amount: number;
  quantity?: number;
  unitValue?: number;
}

const sanitizeBody = (body: MovementBody): MovementBody => {
  const cleanBody = { ...body };
  delete cleanBody._id;
  delete cleanBody.__v;
  delete cleanBody.createdAt;
  delete cleanBody.updatedAt;
  return cleanBody;
};

const calculateCurrencyValues = (
  body: MovementBody
): { exchangeRate: number; amountInCOP: number } => {
  const currency = (body.currency as string) || 'COP';
  const amount = typeof body.amount === 'number' ? body.amount : 0;
  const providedRate = body.exchangeRate;

  const exchangeRate = currency === 'COP' ? 1 : Number(providedRate || 0);

  let amountInCOP = 0;
  if (currency === 'COP') {
    amountInCOP = amount;
  } else if (exchangeRate > 0) {
    amountInCOP = amount * exchangeRate;
  }

  return { exchangeRate, amountInCOP };
};

const calculateUnitValue = (body: MovementBody) => {
  const quantity = Number(body.quantity);
  const amount = Number(body.amount);

  if (body.quantity && quantity !== 0) {
    body.unitValue = amount / quantity;
  } else if (quantity === 0) {
    body.unitValue = 0;
  }
};

const calculateFinancials = (body: MovementBody) => {
  const hasFinancialData =
    body.amount !== undefined ||
    body.currency !== undefined ||
    body.exchangeRate !== undefined;

  if (hasFinancialData) {
    const { exchangeRate, amountInCOP } = calculateCurrencyValues(body);

    if (body.currency) body.exchangeRate = exchangeRate;
    body.amountInCOP = amountInCOP;
  }

  calculateUnitValue(body);
};

function formatMovement(
  movement: mongoose.Document & MovementDoc
): FormattedMovement {
  const obj = movement.toObject
    ? (movement.toObject() as MovementDoc)
    : movement;
  return {
    ...obj,
    amount: movement.amount ? parseFloat(movement.amount.toString()) : 0,
    unit: movement.unit as string | undefined,
    quantity: movement.quantity
      ? parseFloat(movement.quantity.toString())
      : undefined,
    unitValue: movement.unitValue
      ? parseFloat(movement.unitValue.toString())
      : undefined,
    allocations: obj.allocations?.map((a) => ({
      ...a,
      amount: a.amount ? parseFloat(a.amount.toString()) : 0,
    })),
    _id: movement._id.toString(),
  } as FormattedMovement;
}

function checkAllocations(
  allocations: { costCenter: string; amount: number }[],
  totalAmount: number
) {
  let sumAllocations = 0;
  for (const allocation of allocations) {
    if (!allocation.costCenter) {
      return {
        error: 'Cada detalle debe tener un centro de costo',
        status: 400,
      };
    }
    const allocAmount = Number(allocation.amount);
    if (isNaN(allocAmount) || allocAmount < 0) {
      return {
        error: 'El monto del detalle debe ser un número válido',
        status: 400,
      };
    }
    sumAllocations += allocAmount;
  }

  if (Math.abs(totalAmount - sumAllocations) > 0.01) {
    return {
      error: `La suma de los detalles (${sumAllocations}) debe ser igual al total del movimiento (${totalAmount})`,
      status: 400,
    };
  }
  return null;
}

// Helper to validate and normalize allocations for updates
function validateAndNormalizeAllocations(
  body: MovementBody,
  totalAmount: number
) {
  if (
    body.allocations &&
    Array.isArray(body.allocations) &&
    body.allocations.length > 0
  ) {
    const error = checkAllocations(
      body.allocations as { costCenter: string; amount: number }[],
      totalAmount
    );
    if (error) return error;
  } else {
    // If allocations missing or empty, create a single one from top-level fields
    body.allocations = [
      {
        costCenter: (body.costCenter as string) || '01T001',
        amount: totalAmount,
      },
    ];
  }

  // Ensure costCenter is always the first allocation (redundancy for backwards compatibility)
  if (
    body.allocations &&
    Array.isArray(body.allocations) &&
    body.allocations.length > 0
  ) {
    body.costCenter = (
      body.allocations[0] as { costCenter: string }
    ).costCenter;
  }

  return null;
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  await dbConnect();
  const params = await props.params;

  try {
    const rawBody = await request.json();
    const body = sanitizeBody(rawBody);
    const totalAmount = Number(body.amount) || 0;
    body.amount = totalAmount;

    // Normalize type for database storage
    if (body.type === 'INCOME') body.type = 'Ingreso';
    else if (body.type === 'EXPENSE') body.type = 'Egreso';

    const allocationError = validateAndNormalizeAllocations(body, totalAmount);
    if (allocationError) {
      return NextResponse.json(
        { error: allocationError.error },
        { status: allocationError.status }
      );
    }

    calculateFinancials(body);

    const movement = await Movement.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!movement) {
      return NextResponse.json(
        { error: 'Movement not found' },
        { status: 404 }
      );
    }

    // 4.1 Update Inventory Movement link if provided/updated
    if (body.inventoryMovementId) {
      try {
        await InventoryMovement.findByIdAndUpdate(body.inventoryMovementId, {
          financialMovementId: movement._id,
        });
      } catch (linkErr) {
        console.error('Error linking to inventory movement (PUT):', linkErr);
      }
    }

    return NextResponse.json({ data: formatMovement(movement) });
  } catch (err: unknown) {
    const error = err as { name?: string; errors?: unknown; message?: string };
    console.error('Update Movement Error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error.message || 'Failed to update movement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  await dbConnect();
  const params = await props.params;
  try {
    const movement = await Movement.findByIdAndDelete(params.id);

    if (!movement) {
      return NextResponse.json(
        { error: 'Movement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Movement deleted successfully' });
  } catch (error) {
    console.error('Delete Movement Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete movement' },
      { status: 500 }
    );
  }
}
