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

const RoyaltyBookSectionSchema = new Schema(
  {
    agreement: { type: Schema.Types.ObjectId, ref: 'Agreement' },
    book: { type: Schema.Types.ObjectId, ref: 'Book' },
    bookTitle: { type: String, required: true },
    role: { type: String },
    royaltyPercentage: { type: Number, required: true },
    lines: { type: [RoyaltyLineSchema], default: [] },
    totalCopies: { type: Number, default: 0 },
    totalInvoiced: { type: Number, default: 0 },
    totalRoyalties: { type: Number, default: 0 },
  },
  { _id: false }
);

const AdvanceBreakdownSchema = new Schema(
  {
    movementId: { type: Schema.Types.ObjectId, ref: 'Movement' },
    date: { type: Date },
    description: { type: String },
    beneficiary: { type: String },
    amount: { type: Number },
    bookTitle: { type: String },
  },
  { _id: false }
);

const RoyaltyStatementSchema: Schema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
      index: true,
    },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String },
    creatorIdentification: { type: String },

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    books: { type: [RoyaltyBookSectionSchema], default: [] },

    previousBalance: { type: Schema.Types.Decimal128, default: 0 },
    advancePayment: { type: Schema.Types.Decimal128, default: 0 },
    advanceBreakdown: { type: [AdvanceBreakdownSchema], default: [] },

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

RoyaltyStatementSchema.index({ creator: 1, periodEnd: -1 });
RoyaltyStatementSchema.index({ creator: 1, status: 1 });

export default mongoose.models.RoyaltyStatement ||
  mongoose.model<IRoyaltyStatement>(
    'RoyaltyStatement',
    RoyaltyStatementSchema,
    'royalty_statements'
  );
