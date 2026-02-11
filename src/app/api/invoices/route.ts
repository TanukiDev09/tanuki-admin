import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
// import { verifyAuth } from '@/lib/auth'; // Assuming auth is handled like this or similar
import { z } from 'zod';
import { syncInvoiceToDebt } from '@/lib/debtSync';

const createInvoiceSchema = z.object({
  number: z.string().min(1, 'El número de factura es requerido'),
  date: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional(),
  customerName: z.string().min(1, 'El nombre del cliente es requerido'),
  customerTaxId: z.string().optional(),
  items: z
    .array(
      z.object({
        type: z.enum(['libro', 'servicio']).optional(),
        description: z.string().min(1),
        quantity: z.number().min(0),
        unitPrice: z.number().min(0),
        discount: z.number().default(0),
        total: z.number(),
        bookId: z.string().optional().nullable(),
        costCenter: z.string().min(1, 'Centro de costo requerido'),
      })
    )
    .min(1, 'Debe haber al menos un ítem'),
  subtotal: z.number(),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number(),
  status: z
    .enum(['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled', 'Unchecked'])
    .default('Unchecked'),
  costCenters: z.array(z.string()).optional(), // Array of ObjectIds as strings
  movements: z.array(z.string()).optional(), // Array of ObjectIds
  inventoryMovement: z.string().optional().nullable(), // ObjectId
  notes: z.string().optional(),
  // DIAN fields
  cufe: z.string().optional(),
  orderReference: z.string().optional(),
  newsletterSignup: z.boolean().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerDocumentType: z.string().optional(),
  currency: z.string().optional().default('COP'),
  exchangeRate: z.number().optional().default(1),
  amountInCOP: z.number().optional(),
  dianData: z
    .object({
      invoiceAuthorization: z.string().optional(),
      authorizationPeriod: z
        .object({
          start: z.string().or(z.date()).optional(),
          end: z.string().or(z.date()).optional(),
        })
        .optional(),
      softwareProvider: z.string().optional(),
      softwareId: z.string().optional(),
      validationResponse: z
        .object({
          code: z.string().optional(),
          description: z.string().optional(),
          validatedAt: z.string().or(z.date()).optional(),
        })
        .optional(),
    })
    .optional(),
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

    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    const query: Record<string, unknown> = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
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

    if (minAmount || maxAmount) {
      const amountQuery: Record<string, number> = {};
      if (minAmount) amountQuery.$gte = parseFloat(minAmount);
      if (maxAmount) amountQuery.$lte = parseFloat(maxAmount);
      query.total = amountQuery;
    }

    // Sorting
    const sortField = searchParams.get('sortField') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder as 1 | -1 };

    // Fallback sort to ensure consistent order
    if (sortField !== 'date') {
      sort.date = -1;
    }

    const invoices = await Invoice.find(query)
      .sort(sort)
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

    const data = { ...validation.data };

    // Sanitize optional ObjectId strings to avoid casting errors with empty strings
    if (data.inventoryMovement === '' || data.inventoryMovement === null) {
      data.inventoryMovement = undefined;
    }

    if (data.items) {
      data.items = data.items.map((item) => ({
        ...item,
        bookId:
          item.bookId === '' || item.bookId === null ? undefined : item.bookId,
      }));
    }

    // Calculate amountInCOP if not explicitly provided
    if (data.total && data.exchangeRate && !data.amountInCOP) {
      data.amountInCOP = data.total * data.exchangeRate;
    } else if (data.total && !data.amountInCOP) {
      data.amountInCOP = data.total; // Assumes COP if no rate
    }

    // Check for duplicate number
    const existing = await Invoice.findOne({ number: data.number });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una factura con este número' },
        { status: 409 }
      );
    }

    const newInvoice = await Invoice.create(data);

    // Sync to Debts
    await syncInvoiceToDebt(newInvoice);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Error al crear la factura' },
      { status: 500 }
    );
  }
}
