import mongoose, { Schema } from 'mongoose';
import './Agreement';
import './Book';
import './Creator';
import './Debt';
import { IRoyaltyStatement } from '@/types/royalty';

const RoyaltyLineSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceNumber: { type: String, required: true },
    quantity: { type: Number, required: true },
    pvp: { type: Number, required: true },
    date: { type: Date, required: true },
    totalInvoiced: { type: Number, required: true },
    totalRoyalty: { type: Number, required: true },
  },
  { _id: false }
);

const RoyaltyStatementSchema: Schema = new Schema(
  {
    agreement: {
      type: Schema.Types.ObjectId,
      ref: 'Agreement',
      required: true,
      index: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
      index: true,
    },

    // Snapshot denormalizado
    bookTitle: { type: String, required: true },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String },

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    royaltyPercentage: { type: Number, required: true },
    advancePayment: { type: Schema.Types.Decimal128, default: 0 },
    previousBalance: { type: Schema.Types.Decimal128, default: 0 },

    // Movimientos financieros detectados como anticipo (auditoría/transparencia)
    advanceBreakdown: {
      type: [
        {
          _id: false,
          movementId: { type: Schema.Types.ObjectId, ref: 'Movement' },
          date: { type: Date },
          description: { type: String },
          beneficiary: { type: String },
          amount: { type: Number },
        },
      ],
      default: [],
    },

    lines: { type: [RoyaltyLineSchema], default: [] },

    totalCopies: { type: Number, default: 0 },
    totalInvoiced: { type: Schema.Types.Decimal128, default: 0 },
    totalRoyalties: { type: Schema.Types.Decimal128, default: 0 },
    netSettlement: { type: Schema.Types.Decimal128, default: 0 },
    carryoverToNext: { type: Schema.Types.Decimal128, default: 0 },
    balanceInFavorOf: {
      type: String,
      enum: ['author', 'publisher', 'none'],
      default: 'none',
    },

    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
      index: true,
    },
    debtId: { type: Schema.Types.ObjectId, ref: 'Debt' },
    paidAmount: { type: Schema.Types.Decimal128, default: 0 },

    notes: { type: String },
    currency: { type: String, default: 'COP' },

    generatedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

RoyaltyStatementSchema.index({ agreement: 1, periodEnd: -1 });
RoyaltyStatementSchema.index({ creator: 1, status: 1 });

export default mongoose.models.RoyaltyStatement ||
  mongoose.model<IRoyaltyStatement>(
    'RoyaltyStatement',
    RoyaltyStatementSchema,
    'royalty_statements'
  );
