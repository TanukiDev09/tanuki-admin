import mongoose, { Schema } from 'mongoose';
import { IDebt } from '@/types/debt';

const DebtSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['Cuenta por Cobrar', 'Cuenta por Pagar'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['Creator', 'PointOfSale', 'ExternalEntity'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType',
    },
    entityName: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    paidAmount: {
      type: Schema.Types.Decimal128,
      default: 0,
    },
    remainingBalance: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pendiente', 'Pagado Parcial', 'Pagado', 'Vencido'],
      default: 'Pendiente',
      index: true,
    },
    source: {
      type: { type: String, required: true },
      id: { type: Schema.Types.ObjectId },
      reference: { type: String },
    },
    notes: {
      type: String,
    },
    currency: {
      type: String,
      default: 'COP',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DebtSchema.index({ entityId: 1, type: 1 });
DebtSchema.index({ dueDate: 1 });
DebtSchema.index({ 'source.id': 1 });

export default mongoose.models.Debt ||
  mongoose.model<IDebt>('Debt', DebtSchema, 'debts');
