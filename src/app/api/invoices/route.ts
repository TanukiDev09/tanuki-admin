import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
// import { verifyAuth } from '@/lib/auth'; // Assuming auth is handled like this or similar
import { z } from 'zod';

const createInvoiceSchema = z.object({
  number: z.string().min(1, 'El número de factura es requerido'),
  date: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional(),
  customerName: z.string().min(1, 'El nombre del cliente es requerido'),
  customerTaxId: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().min(0),
        unitPrice: z.number().min(0),
        total: z.number(),
      })
    )
    .min(1, 'Debe haber al menos un ítem'),
  subtotal: z.number(),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number(),
  status: z
    .enum(['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled'])
    .default('Draft'),
  costCenters: z.array(z.string()).optional(), // Array of ObjectIds as strings
  movements: z.array(z.string()).optional(), // Array of ObjectIds
  inventoryMovement: z.string().optional(), // ObjectId
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Basic Auth Check (Improve based on actual permissions system)
    // const auth = await verifyAuth(req);
    // if (!auth.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { number: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerTaxId: { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('costCenters', 'name code')
      .populate('inventoryMovement', 'consecutive type');

    const total = await Invoice.countDocuments(query);

    return NextResponse.json({
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Auth Check
    // const auth = await verifyAuth(req);
    // if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Validation
    const validation = createInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check for duplicate number
    const existing = await Invoice.findOne({ number: data.number });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una factura con este número' },
        { status: 409 }
      );
    }

    const newInvoice = await Invoice.create(data);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Error al crear la factura' },
      { status: 500 }
    );
  }
}
