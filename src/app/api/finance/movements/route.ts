import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movement, { IMovement } from '@/models/Movement';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const query: any = {};

  if (category) {
    query.category = category;
  }

  if (type) {
    if (type === 'INCOME') query.type = { $in: ['INCOME', 'Ingreso'] };
    else if (type === 'EXPENSE') query.type = { $in: ['EXPENSE', 'Egreso'] };
    else query.type = type;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { description: searchRegex },
      // { category: searchRegex }, // Category is now Reference, cannot text search directly unless using aggregation
      { beneficiary: searchRegex },
      { notes: searchRegex },
    ];
  }

  try {
    const [movements, total] = await Promise.all([
      Movement.find(query)
        .sort({ date: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .populate({ path: 'category', select: 'name' })
        .lean(), // lean for better performance since reads
      Movement.countDocuments(query),
    ]);

    // Format for frontend (Decimal128 to number)
    interface MovementDoc {
      _id: { toString: () => string };
      amount: { toString: () => string };
      [key: string]: unknown;
    }
    const formattedMovements = movements.map((m: MovementDoc) => {
      let normalizedType = m.type;
      if (m.type === 'Ingreso') normalizedType = 'INCOME';
      else if (m.type === 'Egreso') normalizedType = 'EXPENSE';

      return {
        ...m,
        type: normalizedType,
        amount: parseFloat(m.amount.toString()),
        unit: m.unit,
        quantity: m.quantity ? parseFloat(m.quantity.toString()) : undefined,
        unitValue: m.unitValue ? parseFloat(m.unitValue.toString()) : undefined,
        _id: m._id.toString(),
      };
    });

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

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();

    // Validate required fields (basic validation, model will enforce stricter rules)
    if (!body.amount || !body.description || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate amountInCOP
    const exchangeRate =
      body.currency === 'COP' ? 1 : Number(body.exchangeRate || 0);
    const amountInCOP =
      body.currency === 'COP'
        ? body.amount
        : exchangeRate > 0
          ? body.amount * exchangeRate
          : 0;

    // Calculate unitValue if quantity is present
    let unitValue = 0;
    if (body.quantity && Number(body.quantity) !== 0) {
      unitValue = body.amount / Number(body.quantity);
    }

    body.exchangeRate = exchangeRate;
    body.amountInCOP = amountInCOP;
    body.unitValue = unitValue;

    const movement = await Movement.create(body);

    const populatedMovement = await movement.populate({
      path: 'category',
      select: 'name',
    });

    const formattedMovement = {
      ...populatedMovement.toObject(),
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

    return NextResponse.json({ data: formattedMovement }, { status: 201 });
  } catch (error) {
    console.error('Create Movement Error:', error);
    const details = JSON.stringify(error, Object.getOwnPropertyNames(error));

    return NextResponse.json(
      { error: 'Failed to create movement', details },
      { status: 500 }
    );
  }
}
