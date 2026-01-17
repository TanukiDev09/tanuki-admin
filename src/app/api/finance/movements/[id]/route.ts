import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movement from '@/models/Movement';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const params = await props.params;
  try {
    const movement = await Movement.findById(params.id).lean();

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
      amount: parseFloat(movement.amount.toString()),
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

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const params = await props.params;

  try {
    const rawBody = await request.json();
    const body = sanitizeBody(rawBody);

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

    const formattedMovement = {
      ...movement.toObject(),
      amount: parseFloat(movement.amount.toString()),
      unit: movement.unit,
      quantity: movement.quantity
        ? parseFloat(movement.quantity.toString())
        : undefined,
      unitValue: movement.unitValue
        ? parseFloat(movement.unitValue.toString())
        : undefined,
      _id: movement._id.toString(),
    };

    return NextResponse.json({ data: formattedMovement });
  } catch (error: unknown) {
    console.error('Update Movement Error:', error);

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name: string }).name === 'ValidationError'
    ) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: (error as { errors?: unknown }).errors,
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to update movement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
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
