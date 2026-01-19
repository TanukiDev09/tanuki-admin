import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';

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

function buildQuery(searchParams: URLSearchParams) {
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const costCenter = searchParams.get('costCenter');

  const query: Record<string, unknown> = {};

  if (category) {
    query.category = category;
  }

  if (costCenter) {
    query.$or = [
      { 'allocations.costCenter': costCenter },
      { costCenter: costCenter }
    ];
  }

  if (type) {
    if (type === 'INCOME') query.type = { $in: ['INCOME', 'Ingreso'] };
    else if (type === 'EXPENSE') query.type = { $in: ['EXPENSE', 'Egreso'] };
    else query.type = type;
  }

  if (startDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    query.date = { ...((query.date as object) || {}), $gte: start };
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    query.date = { ...((query.date as object) || {}), $lte: end };
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { description: searchRegex },
      { beneficiary: searchRegex },
      { notes: searchRegex },
    ];
  }

  return query;
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
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const query = buildQuery(searchParams);

    const [movements, total] = await Promise.all([
      Movement.find(query)
        .sort({ date: -1 }) // Newest first
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
  let type = body.type;
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
    // Explicitly cast to any or specific error type to access properties
    // Explicitly cast to any or specific error type to access properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = err as any;
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
