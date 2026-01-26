import mongoose, { Schema, Document } from 'mongoose';
import './CostCenter';
import './Movement';
import './InventoryMovement';

export interface IInvoiceItem {
  type: 'libro' | 'servicio';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  bookId?: mongoose.Types.ObjectId;
  costCenter: string; // The code of the cost center
}

export interface IInvoice extends Document {
  number: string;
  date: Date;
  dueDate: Date;
  customerName: string;
  customerTaxId?: string; // NIT or CC

  items: IInvoiceItem[];

  subtotal: number;
  tax: number; // IVA or other taxes
  discount: number;
  total: number;

  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled';

  // Relations
  costCenters?: mongoose.Types.ObjectId[]; // Deprecated in favor of per-item CC, but keeping for compatibility if needed
  movements: mongoose.Types.ObjectId[]; // Associated Payments (Movements)
  inventoryMovement?: mongoose.Types.ObjectId; // Associated Settlement (Liquidacion)

  fileUrl?: string; // URL to PDF/Image
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    number: {
      type: String,
      required: [true, 'El número de factura es requerido'],
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'La fecha de emisión es requerida'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    customerName: {
      type: String,
      required: [true, 'El nombre del cliente es requerido'],
      trim: true,
    },
    customerTaxId: {
      type: String,
      trim: true,
    },
    items: [
      {
        _id: false,
        type: {
          type: String,
          enum: ['libro', 'servicio'],
          default: 'servicio',
        },
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true },
        bookId: { type: Schema.Types.ObjectId, ref: 'Book' },
        costCenter: { type: String, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled'],
      default: 'Draft',
    },
    costCenters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CostCenter',
      },
    ],
    movements: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Movement',
      },
    ],
    inventoryMovement: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryMovement',
    },
    fileUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InvoiceSchema.index({ number: 1 }, { unique: true });
InvoiceSchema.index({ date: -1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ costCenters: 1 });
InvoiceSchema.index({ inventoryMovement: 1 });

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>('Invoice', InvoiceSchema, 'invoices');
