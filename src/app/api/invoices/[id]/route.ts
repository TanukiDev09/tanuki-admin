import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { z } from 'zod';

const updateInvoiceSchema = z.object({
  number: z.string().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  customerName: z.string().min(1).optional(),
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
    .min(1)
    .optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled']).optional(),
  costCenters: z.array(z.string()).optional(),
  movements: z.array(z.string()).optional(),
  inventoryMovement: z.string().optional(),
  notes: z.string().optional(),
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

    // Check if updating number and if it conflicts
    if (validation.data.number) {
      const existing = await Invoice.findOne({
        number: validation.data.number,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe otra factura con este número' },
          { status: 409 }
        );
      }
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      validation.data,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

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

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la factura' },
      { status: 500 }
    );
  }
}
