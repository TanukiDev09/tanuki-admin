import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from './Category';
import './Category'; // Force registration

export interface IMovement extends Document {
  date: Date;
  fiscalYear: number;
  amount: mongoose.Types.Decimal128; // Stored as Decimal128
  currency: string;
  exchangeRate: number;
  amountInCOP: number;
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
}

const MovementSchema: Schema = new Schema({
  date: { type: Date, required: true },
  fiscalYear: { type: Number, required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, required: true },
  exchangeRate: { type: Number, default: 1 },
  amountInCOP: { type: Number, default: 0 },
  type: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  costCenter: { type: String, required: true },
  beneficiary: { type: String, required: true },
  paymentChannel: { type: String, required: true },
  invoiceRef: { type: String },
  description: { type: String, required: true },
  notes: { type: String },
  unit: { type: String },
  quantity: { type: Schema.Types.Decimal128 },
  unitValue: { type: Schema.Types.Decimal128 },
});

export default mongoose.models.Movement ||
  mongoose.model<IMovement>('Movement', MovementSchema, 'movements');
