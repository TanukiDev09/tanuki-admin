import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import * as mongoose from 'mongoose';
import Movement from '@/models/Movement';
import InventoryMovement from '@/models/InventoryMovement';
import {
  add,
  multiply,
  divide,
  compare,
  toNumber,
  gtZero,
  subtract,
  DecimalValue,
} from '@/lib/math';
import Debt from '@/models/Debt';

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
      .populate({ path: 'debtId', select: 'source entityName type notes' })
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
      amount: toNumber(movement.amount),
      amountInCOP: movement.amountInCOP
        ? toNumber(movement.amountInCOP)
        : undefined,
      exchangeRate: movement.exchangeRate
        ? toNumber(movement.exchangeRate)
        : undefined,
      quantity: movement.quantity ? toNumber(movement.quantity) : undefined,
      unitValue: movement.unitValue ? toNumber(movement.unitValue) : undefined,
      allocations: (movement.allocations as Allocation[])?.map((a) => ({
        ...a,
        amount: a.amount ? toNumber(a.amount) : 0,
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
  amount?: number | string;
  currency?: string;
  exchangeRate?: number | string;
  quantity?: number | string;
  unitValue?: number | string;
  amountInCOP?: number | string;
}

interface Allocation {
  costCenter: string;
  amount: { toString: () => string } | number | string;
}

interface Item {
  type: 'libro' | 'servicio' | 'otro';
  description: string;
  quantity: { toString: () => string } | number;
  unitValue: { toString: () => string } | number;
  catalogPrice?: { toString: () => string } | number;
  discount?: { toString: () => string } | number;
  total: { toString: () => string } | number;
  costCenter: string;
  bookId?: string | { toString: () => string } | null;
}

interface MovementDoc {
  _id: { toString: () => string };
  amount: { toString: () => string } | number | string;
  type: string;
  unit?: string;
  quantity?: { toString: () => string } | number | string;
  unitValue?: { toString: () => string } | number | string;
  allocations?: Allocation[];
  items?: Item[];
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
): { exchangeRate: string; amountInCOP: string } => {
  const currency = (body.currency as string) || 'COP';
  const amount = body.amount || '0';
  const providedRate = body.exchangeRate || '0';

  const exchangeRate = currency === 'COP' ? '1' : providedRate.toString();

  let amountInCOP = '0';
  if (currency === 'COP') {
    amountInCOP = amount.toString();
  } else if (gtZero(exchangeRate)) {
    amountInCOP = multiply(amount, exchangeRate);
  }

  return { exchangeRate, amountInCOP };
};

const calculateUnitValue = (body: MovementBody) => {
  const quantity = body.quantity || '0';
  const amount = body.amount || '0';

  if (gtZero(quantity)) {
    body.unitValue = divide(amount, quantity);
  } else {
    body.unitValue = '0';
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
    amount: toNumber(movement.amount),
    amountInCOP: movement.amountInCOP
      ? toNumber(movement.amountInCOP as DecimalValue)
      : undefined,
    exchangeRate: movement.exchangeRate
      ? toNumber(movement.exchangeRate as DecimalValue)
      : undefined,
    unit: movement.unit as string | undefined,
    quantity: movement.quantity ? toNumber(movement.quantity) : undefined,
    unitValue: movement.unitValue ? toNumber(movement.unitValue) : undefined,
    allocations: obj.allocations?.map((a) => ({
      ...a,
      amount: a.amount ? toNumber(a.amount) : 0,
    })),
    items: (obj.items as Item[])?.map((item) => ({
      ...item,
      quantity: item.quantity ? toNumber(item.quantity) : 0,
      unitValue: item.unitValue ? toNumber(item.unitValue) : 0,
      total: item.total ? toNumber(item.total) : 0,
      catalogPrice: item.catalogPrice ? toNumber(item.catalogPrice) : undefined,
      discount: item.discount ? toNumber(item.discount) : 0,
    })),
    _id: movement._id.toString(),
  } as FormattedMovement;
}

function checkAllocations(
  allocations: { costCenter: string; amount: number | string }[],
  totalAmount: number | string
) {
  let sumAllocations = '0';
  for (const allocation of allocations) {
    if (!allocation.costCenter) {
      return {
        error: 'Cada detalle debe tener un centro de costo',
        status: 400,
      };
    }
    sumAllocations = add(sumAllocations, allocation.amount);
  }

  if (compare(totalAmount, sumAllocations) !== 0) {
    return {
      error: `La suma de los detalles (${sumAllocations}) debe ser igual al total del movimiento (${totalAmount})`,
      status: 400,
    };
  }
  return null;
}

// Helper to validate and normalize allocations for updates
// Helper to validate and normalize allocations for updates
function validateAndNormalizeAllocations(
  body: MovementBody,
  totalAmount: number | string
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

async function updateDebtBalance(
  debtId: string,
  amountChange: number | string,
  operation: 'add' | 'subtract'
) {
  const debt = await Debt.findById(debtId);
  if (!debt) return;

  const amount = toNumber(amountChange);
  const newPaidAmount =
    operation === 'add'
      ? add(debt.paidAmount, amount)
      : subtract(debt.paidAmount, amount);

  const newRemainingBalance = subtract(debt.totalAmount, newPaidAmount);

  debt.paidAmount = newPaidAmount;
  debt.remainingBalance = newRemainingBalance;

  const remainingNum = toNumber(newRemainingBalance);
  const paidNum = toNumber(newPaidAmount);
  const totalNum = toNumber(debt.totalAmount);

  if (remainingNum <= 0) {
    debt.status = 'Pagado';
  } else if (remainingNum >= totalNum) {
    debt.status = 'Pendiente';
  } else if (paidNum > 0) {
    debt.status = 'Pagado Parcial';
  } else {
    debt.status = 'Pendiente';
  }

  await debt.save();
}

async function syncInventoryLink(
  body: Record<string, unknown>,
  movementId: string
) {
  if (body.inventoryMovementId) {
    try {
      await InventoryMovement.findByIdAndUpdate(body.inventoryMovementId, {
        financialMovementId: movementId,
      });
    } catch (linkErr) {
      console.error('Error linking to inventory movement:', linkErr);
    }
  }
}

function normalizePUTBody(body: MovementBody) {
  const totalAmount = body.amount || '0';
  body.amount = totalAmount.toString();

  // Normalize type for database storage
  const normalizedType =
    body.type === 'INCOME' || body.type === 'Ingreso' ? 'Ingreso' : 'Egreso';
  body.type = normalizedType;

  // Set JSON Schema Validator required fields
  body.flowDirection = normalizedType === 'Ingreso' ? 'inflow' : 'outflow';
  body.movementType =
    normalizedType === 'Ingreso' ? 'factura_emitida' : 'factura_recibida';

  // Set default fiscal year if missing
  if (!body.fiscalYear && body.date) {
    body.fiscalYear = new Date(body.date as string).getFullYear();
  }

  // Ensure metadata exists for DB validator
  if (!body.metadata) {
    body.metadata = {
      source: 'manual',
      createdAt: new Date(),
    };
  }

  // Set issuer/receiver fields (often required by DB validator)
  if (!body.issuerId) {
    body.issuerId = (body.beneficiary as string) || null;
  }
  if (!body.issuerName) {
    body.issuerName = (body.beneficiary as string) || 'Persona no especificada';
  }
  if (!body.receiverId) {
    body.receiverId = 'Tanuki Admin';
  }
  if (!body.receiverName) {
    body.receiverName = 'Tanuki Admin Hub';
  }

  // Sanitize ObjectIDs - Convert empty strings to null to avoid casting errors
  const objectIdFields = [
    'category',
    'pointOfSale',
    'debtId',
    'inventoryMovementId',
  ];
  objectIdFields.forEach((field) => {
    if (body[field] === '' || body[field] === undefined) {
      body[field] = null;
    } else if (
      typeof body[field] === 'string' &&
      !mongoose.isValidObjectId(body[field])
    ) {
      // If it's an invalid ID (like a placeholder), null it to avoid CastError
      body[field] = null;
    }
  });

  // Normalize items if present
  if (body.items && Array.isArray(body.items)) {
    body.items = body.items.map((item: Item) => ({
      ...item,
      quantity: toNumber(item.quantity).toString(),
      unitValue: toNumber(item.unitValue).toString(),
      total: toNumber(item.total).toString(),
      catalogPrice: item.catalogPrice
        ? toNumber(item.catalogPrice).toString()
        : undefined,
      discount: toNumber(item.discount || 0).toString(),
      bookId:
        item.bookId && mongoose.isValidObjectId(item.bookId)
          ? item.bookId
          : null,
    }));
  }
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

    normalizePUTBody(body);
    const totalAmount = body.amount as string;

    const allocationError = validateAndNormalizeAllocations(body, totalAmount);
    if (allocationError) {
      return NextResponse.json(
        { error: allocationError.error },
        { status: allocationError.status }
      );
    }

    calculateFinancials(body);

    const oldMovement = await Movement.findById(params.id);
    if (!oldMovement) {
      return NextResponse.json(
        { error: 'Movement not found' },
        { status: 404 }
      );
    }

    // 1. Revert old debt if linked
    if (oldMovement.debtId) {
      await updateDebtBalance(
        oldMovement.debtId as string,
        oldMovement.amount,
        'subtract'
      );
    }

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

    // 2. Apply new debt if linked
    if (movement.debtId) {
      await updateDebtBalance(
        movement.debtId as string,
        movement.amount,
        'add'
      );
    }

    // 4.1 Update Inventory Movement link if provided/updated
    await syncInventoryLink(body, movement._id);

    return NextResponse.json({ data: formatMovement(movement) });
  } catch (err: unknown) {
    const error = err as {
      name?: string;
      errors?: Record<string, { message: string }>;
      message?: string;
    };
    console.error('Update Movement Error:', error);

    if (error.name === 'ValidationError' && error.errors) {
      // Create a readable summary of validation errors
      const details = Object.entries(error.errors)
        .map(([field, info]) => `${field}: ${info.message}`)
        .join(', ');

      return NextResponse.json(
        { error: `Validation Error: ${details}`, details: error.errors },
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

    // Sync Debt if linked
    if (movement.debtId) {
      await updateDebtBalance(
        movement.debtId as string,
        movement.amount,
        'subtract'
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
