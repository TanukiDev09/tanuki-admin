import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import * as mongoose from 'mongoose';
import Movement, { IMovement } from '@/models/Movement';

export const dynamic = 'force-dynamic';

interface MovementDoc {
  _id: { toString: () => string };
  amount: { toString: () => string };
  type: string;
  unit?: string;
  quantity?: { toString: () => string };
  unitValue?: { toString: () => string };
  [key: string]: unknown;
}

type MovementQuery = {
  [key: string]:
    | string
    | number
    | boolean
    | Date
    | RegExp
    | MovementQuery
    | MovementQuery[]
    | { [key: string]: unknown }
    | null
    | undefined;
};

const handleUndefined = (field: string, conditions: MovementQuery[]) => {
  const baseOr: MovementQuery[] = [
    { [field]: null },
    { [field]: { $exists: false } },
  ];

  if (
    field === 'paymentChannel' ||
    field === 'costCenter' ||
    field === 'unit'
  ) {
    baseOr.push({ [field]: '' } as MovementQuery);
  }

  if (field === 'costCenter') {
    baseOr.push(
      { 'allocations.costCenter': null } as MovementQuery,
      {
        'allocations.costCenter': { $exists: false },
      } as MovementQuery
    );
  }

  conditions.push({ $or: baseOr });
};

const applyBaseFilters = (
  searchParams: URLSearchParams,
  conditions: MovementQuery[]
) => {
  const category = searchParams.get('category');
  const paymentChannel = searchParams.get('paymentChannel');
  const costCenter = searchParams.get('costCenter');
  const unit = searchParams.get('unit');

  if (category === '__UNDEFINED__') handleUndefined('category', conditions);
  else if (category) conditions.push({ category } as MovementQuery);

  if (paymentChannel === '__UNDEFINED__')
    handleUndefined('paymentChannel', conditions);
  else if (paymentChannel) conditions.push({ paymentChannel } as MovementQuery);

  if (costCenter === '__UNDEFINED__') {
    handleUndefined('costCenter', conditions);
  } else if (costCenter) {
    conditions.push({
      $or: [{ 'allocations.costCenter': costCenter }, { costCenter }],
    } as MovementQuery);
  }

  if (unit === '__UNDEFINED__') handleUndefined('unit', conditions);
  else if (unit) conditions.push({ unit } as MovementQuery);
};

const applyNumericFilters = (
  searchParams: URLSearchParams,
  conditions: MovementQuery[]
) => {
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const minQuantity = searchParams.get('minQuantity');
  const maxQuantity = searchParams.get('maxQuantity');

  if (minAmount || maxAmount) {
    const amountQuery: Record<string, number> = {};
    if (minAmount) amountQuery.$gte = parseFloat(minAmount);
    if (maxAmount) amountQuery.$lte = parseFloat(maxAmount);
    conditions.push({ amount: amountQuery } as MovementQuery);
  }

  if (minQuantity === '__UNDEFINED__' || maxQuantity === '__UNDEFINED__') {
    handleUndefined('quantity', conditions);
  } else if (minQuantity || maxQuantity) {
    const quantityQuery: Record<string, number> = {};
    if (minQuantity) quantityQuery.$gte = parseFloat(minQuantity);
    if (maxQuantity) quantityQuery.$lte = parseFloat(maxQuantity);
    conditions.push({
      quantity: quantityQuery,
    } as MovementQuery);
  }
};

const applyOtherFilters = (
  searchParams: URLSearchParams,
  conditions: MovementQuery[]
) => {
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (type) {
    const typeMap: Record<string, string[]> = {
      INCOME: ['INCOME', 'Ingreso'],
      EXPENSE: ['EXPENSE', 'Egreso'],
    };
    conditions.push({
      type: typeMap[type] ? { $in: typeMap[type] } : type,
    } as MovementQuery);
  }

  if (startDate || endDate) {
    const dateQuery: Record<string, Date> = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      dateQuery.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    conditions.push({ date: dateQuery } as MovementQuery);
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    conditions.push({
      $or: [
        { description: searchRegex },
        { beneficiary: searchRegex },
        { notes: searchRegex },
      ],
    } as MovementQuery);
  }
};

function buildQuery(searchParams: URLSearchParams): MovementQuery {
  const andConditions: MovementQuery[] = [];

  applyBaseFilters(searchParams, andConditions);
  applyNumericFilters(searchParams, andConditions);
  applyOtherFilters(searchParams, andConditions);

  return andConditions.length > 0 ? { $and: andConditions } : {};
}

function formatMovements(movements: MovementDoc[]) {
  return movements.map((m: MovementDoc) => {
    let normalizedType = m.type;
    if (m.type === 'Ingreso') normalizedType = 'INCOME';
    else if (m.type === 'Egreso') normalizedType = 'EXPENSE';

    return {
      ...m,
      type: normalizedType,
      amount: m.amount ? parseFloat(m.amount.toString()) : 0,
      unit: m.unit,
      quantity: m.quantity ? parseFloat(m.quantity.toString()) : undefined,
      unitValue: m.unitValue ? parseFloat(m.unitValue.toString()) : undefined,
      _id: m._id.toString(),
    };
  });
}

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
        .lean<MovementDoc[]>(), // lean for better performance since reads
      Movement.countDocuments(query),
    ]);

    // Format for frontend (Decimal128 to number)
    const formattedMovements = formatMovements(movements);

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

interface CreateMovementBody {
  category?: string;
  costCenter?: string;
  beneficiary?: string;
  paymentChannel?: string;
  amount?: number | string;
  description?: string;
  type?: string;
  date?: string | Date;
  quantity?: number | string;
  fiscalYear?: number;
  currency?: string;
  exchangeRate?: number | string;
  issuerId?: string;
  issuerName?: string;
  receiverId?: string;
  receiverName?: string;
  notes?: string;
  [key: string]: unknown;
}

// Helper to validate and sanitize input
function validateAndSanitize(body: CreateMovementBody) {
  // Sanitize strictly required fields
  if (!body.description || !body.type || !body.date) {
    return {
      error: 'Faltan campos obligatorios (Descripción, Tipo, Fecha)',
      status: 400,
    };
  }

  // Ensure amount is numeric if present, else 0
  const amount = body.amount ? Number(body.amount) : 0;
  if (isNaN(amount)) {
    return { error: 'El monto debe ser un número válido', status: 400 };
  }

  return { amount };
}

// Helper to calculate derived financial values
function calculateFinancials(body: CreateMovementBody, amount: number) {
  // Normalize type
  let type: string = body.type || 'Ingreso';
  if (type === 'INCOME') type = 'Ingreso';
  if (type === 'EXPENSE') type = 'Egreso';

  // Fiscal Year
  const fiscalYear =
    body.fiscalYear || new Date(body.date as string).getFullYear();

  // Exchange Rate & Amount in COP
  const exchangeRate =
    body.currency === 'COP' ? 1 : Number(body.exchangeRate || 1);
  const amountInCOP =
    body.currency === 'COP' ? amount : amount * exchangeRate || 0;

  // Unit Value
  let unitValue = 0;
  const quantity = body.quantity ? Number(body.quantity) : 0;
  if (quantity !== 0) {
    unitValue = amount / quantity;
  }

  return { type, fiscalYear, amountInCOP, unitValue, quantity };
}

// Helper to construct the final DB document
interface Financials {
  type: string;
  fiscalYear: number;
  amountInCOP: number;
  unitValue: number;
  quantity: number;
}

function buildMovementDoc(
  body: CreateMovementBody,
  financials: Financials,
  amount: number
) {
  const { type, fiscalYear, amountInCOP, unitValue, quantity } = financials;

  const flowDirection = type === 'Ingreso' ? 'inflow' : 'outflow';
  const movementType =
    type === 'Ingreso' ? 'factura_emitida' : 'factura_recibida';

  const allocations = [
    {
      costCenter: body.costCenter || '01T001',
      amount: amount,
    },
  ];

  const metadata = {
    source: 'manual',
    createdAt: new Date(),
  };

  return {
    ...body,
    amount, // Explicitly set numeric amount
    type, // Override with normalized type
    fiscalYear,
    quantity, // Use numeric quantity
    flowDirection,
    movementType,
    allocations,
    metadata,
    amountInCOP,
    unitValue,
    issuerId: body.issuerId || body.beneficiary || null,
    issuerName:
      body.issuerName || body.beneficiary || 'Persona no especificada',
    receiverId: body.receiverId || 'Tanuki Admin',
    receiverName: body.receiverName || 'Tanuki Admin Hub',
    paymentChannel: body.paymentChannel || 'otro',
    notes: body.notes || 'Sin notas adicionales',
    date: new Date(body.date as string),
  };
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
    const populatedMovement = await movement.populate({
      path: 'category',
      select: 'name',
    });

    // 5. Formatting
    const formattedMovement = {
      ...populatedMovement.toObject(),
      amount: movement.amount ? parseFloat(movement.amount.toString()) : 0,
      unit: movement.unit,
      quantity: movement.quantity
        ? parseFloat(movement.quantity.toString())
        : undefined,
      unitValue: movement.unitValue
        ? parseFloat(movement.unitValue.toString())
        : undefined,
      _id: movement._id.toString(),
    };

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
