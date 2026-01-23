import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from './Category';
import './Category'; // Force registration

export interface IMovement extends Document {
  date: Date;
  fiscalYear: number;
  amount: mongoose.Types.Decimal128; // Stored as Decimal128
  currency: string;
  exchangeRate: mongoose.Types.Decimal128;
  amountInCOP: mongoose.Types.Decimal128;
  type: string; // 'Ingreso' or 'Egreso' (presumably)
  category: mongoose.Types.ObjectId | ICategory; // Populated Category or ObjectId string
  costCenter: string;
  beneficiary: string;
  paymentChannel: string;
  invoiceRef?: string;
  description: string;
  notes?: string;
  unit?: string;
  quantity?: mongoose.Types.Decimal128;
  unitValue?: mongoose.Types.Decimal128;
  salesChannel?: 'LIBRERIA' | 'FERIA' | 'DIRECTA' | 'OTRO';
  pointOfSale?: mongoose.Types.ObjectId | string;

  // Validation fields
  flowDirection: string;
  movementType: string;
  allocations: {
    costCenter: string;
    amount: number | mongoose.Types.Decimal128;
  }[];
  metadata: { source: string; createdAt: Date };
  issuerId?: string | null;
  issuerName?: string;
  receiverId?: string;
  receiverName?: string;
  inventoryMovementId?: mongoose.Types.ObjectId | string;
}

const MovementSchema: Schema = new Schema(
  {
    date: { type: Date, required: true },
    fiscalYear: { type: Number, required: true },
    amount: { type: Schema.Types.Decimal128 },
    currency: { type: String },
    exchangeRate: { type: Schema.Types.Decimal128, default: 1 },
    amountInCOP: { type: Schema.Types.Decimal128, default: 0 },
    type: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    costCenter: { type: String },
    beneficiary: { type: String },
    paymentChannel: { type: String },
    invoiceRef: { type: String },
    description: { type: String, required: true },
    notes: { type: String },
    unit: { type: String },
    quantity: { type: Schema.Types.Decimal128 },
    unitValue: { type: Schema.Types.Decimal128 },
    salesChannel: {
      type: String,
      enum: ['LIBRERIA', 'FERIA', 'DIRECTA', 'OTRO'],
    },
    pointOfSale: { type: Schema.Types.ObjectId, ref: 'PointOfSale' },

    // Fields required by the strict MongoDB JSON Schema Validator
    flowDirection: { type: String, enum: ['inflow', 'outflow'] },
    movementType: { type: String },
    allocations: [
      {
        _id: false, // Added _id: false here
        costCenter: { type: String },
        amount: { type: Schema.Types.Decimal128 },
      },
    ],
    metadata: {
      source: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
    inventoryMovementId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryMovement',
    },
  },
  {
    strict: false, // Allow other fields that might be required by the DB validator
  }
);

export default mongoose.models.Movement ||
  mongoose.model<IMovement>('Movement', MovementSchema, 'movements');
