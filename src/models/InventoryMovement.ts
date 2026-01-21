import mongoose, { Schema, Document } from 'mongoose';

export enum InventoryMovementType {
  INGRESO = 'INGRESO',
  REMISION = 'REMISION',
  DEVOLUCION = 'DEVOLUCION',
  LIQUIDACION = 'LIQUIDACION',
}

export enum InventoryMovementSubType {
  INITIAL = 'INITIAL', // Estado inicial
  UNEXPECTED = 'UNEXPECTED', // Ingreso inesperado
  PURCHASE = 'PURCHASE', // Compra de libros
}

export interface IInventoryMovementItem {
  bookId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IInventoryMovement extends Document {
  type: InventoryMovementType;
  subType?: InventoryMovementSubType;
  consecutive?: number;
  date: Date;
  fromWarehouseId?: mongoose.Types.ObjectId;
  toWarehouseId?: mongoose.Types.ObjectId;
  items: IInventoryMovementItem[];

  // Specific for Purchase
  financialMovementId?: mongoose.Types.ObjectId;
  invoiceFile?: string; // URL or path
  invoiceRef?: string;

  observations?: string;

  // Auditing
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(InventoryMovementType),
      required: true,
    },
    subType: {
      type: String,
      enum: Object.values(InventoryMovementSubType),
    },
    consecutive: {
      type: Number,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    fromWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    toWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    items: [
      {
        _id: false,
        bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],

    financialMovementId: {
      type: Schema.Types.ObjectId,
      ref: 'Movement',
    },
    invoiceFile: String,
    invoiceRef: String,

    observations: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
InventoryMovementSchema.index({ type: 1 });
InventoryMovementSchema.index({ date: -1 });
InventoryMovementSchema.index({ fromWarehouseId: 1 });
InventoryMovementSchema.index({ toWarehouseId: 1 });

export default mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovement>(
    'InventoryMovement',
    InventoryMovementSchema
  );
