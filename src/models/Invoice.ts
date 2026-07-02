import mongoose, { Schema, Document } from 'mongoose';
import './CostCenter';
import './Movement';
import './InventoryMovement';

export interface IDianInvoiceData {
  invoiceAuthorization?: string;
  authorizationPeriod?: {
    start: Date;
    end: Date;
  };
  softwareProvider?: string;
  softwareId?: string;
  validationResponse?: {
    code: string;
    description: string;
    validatedAt: Date;
  };
}

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

  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled' | 'Unchecked';

  // Relations
  costCenters?: { code: string; amount: number }[];
  movements: mongoose.Types.ObjectId[]; // Associated Payments (Movements)
  inventoryMovement?: mongoose.Types.ObjectId; // Associated Settlement (Liquidacion)

  fileUrl?: string; // URL to PDF/Image
  notes?: string;

  // DIAN Electronic Invoice fields (optional, for imported XML invoices)
  dianData?: IDianInvoiceData; // Complete DIAN metadata
  cufe?: string; // Código Único de Factura Electrónica
  orderReference?: string; // Número de orden de compra
  newsletterSignup?: boolean; // Newsletter signup (natural person + order reference)
  currency?: string; // 'COP', 'USD', etc.
  exchangeRate?: number; // Conversion factor to COP
  amountInCOP?: number; // Total amount in COP for reporting

  customerDocumentType?: string; // Tipo de documento (CC, NIT, etc.)
  customerAddress?: string; // Dirección del cliente
  customerCity?: string; // Ciudad del cliente
  customerEmail?: string; // Email del cliente
  customerPhone?: string; // Teléfono del cliente

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
        discount: { type: Number, default: 0 },
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
      enum: ['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled', 'Unchecked'],
      default: 'Unchecked',
    },
    costCenters: [
      {
        _id: false,
        code: { type: String },
        amount: { type: Number },
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
    // DIAN Electronic Invoice fields
    dianData: {
      invoiceAuthorization: String,
      authorizationPeriod: {
        start: Date,
        end: Date,
      },
      softwareProvider: String,
      softwareId: String,
      validationResponse: {
        code: String,
        description: String,
        validatedAt: Date,
      },
    },
    cufe: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined, but unique if present
    },
    orderReference: String,
    newsletterSignup: {
      type: Boolean,
      default: false,
    },
    customerDocumentType: String,
    customerAddress: String,
    customerCity: String,
    customerEmail: String,
    customerPhone: String,
    currency: { type: String, default: 'COP' },
    exchangeRate: { type: Number, default: 1 },
    amountInCOP: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
InvoiceSchema.index({ date: -1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ 'costCenters.code': 1 });
InvoiceSchema.index({ inventoryMovement: 1 });
InvoiceSchema.index({ newsletterSignup: 1 }); // For newsletter queries

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>('Invoice', InvoiceSchema, 'invoices');
