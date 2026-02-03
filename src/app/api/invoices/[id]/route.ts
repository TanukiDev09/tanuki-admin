import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { z } from 'zod';
import { syncInvoiceToDebt } from '@/lib/debtSync';
import Debt from '@/models/Debt';

const updateInvoiceSchema = z.object({
  number: z.string().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  customerName: z.string().min(1).optional(),
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
    .min(1)
    .optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled']).optional(),
  costCenters: z.array(z.string()).optional(),
  movements: z.array(z.string()).optional(),
  inventoryMovement: z.string().optional().nullable(),
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const invoice = await Invoice.findById(id)
      .populate('costCenters', 'name code')
      .populate('movements')
      .populate('inventoryMovement');

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Error al obtener la factura' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const validation = updateInvoiceSchema.safeParse(body);
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

    // Check if updating number and if it conflicts
    if (data.number) {
      const existing = await Invoice.findOne({
        number: data.number,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe otra factura con este número' },
          { status: 409 }
        );
      }
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Sync to Debts
    await syncInvoiceToDebt(updatedInvoice);

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la factura' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedInvoice = await Invoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Remove associated Debt if exists
    await Debt.findOneAndDelete({ 'source.id': id });

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la factura' },
      { status: 500 }
    );
  }
}
