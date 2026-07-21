import mongoose, { Schema } from 'mongoose';
import { IRoyaltyStatement } from '@/types/royalty-statement';
import './Creator';
import './Agreement';

const RoyaltyStatementLineSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceNumber: { type: String },
    quantity: { type: Number },
    pvp: { type: Number },
    date: { type: Date },
    totalInvoiced: { type: Schema.Types.Decimal128 },
    totalRoyalty: { type: Schema.Types.Decimal128 },
  },
  { _id: false }
);

const RoyaltyStatementBookSchema = new Schema(
  {
    agreement: { type: Schema.Types.ObjectId, ref: 'Agreement' },
    book: { type: Schema.Types.ObjectId, ref: 'Book' },
    bookTitle: { type: String },
    role: { type: String, enum: ['author', 'translator', 'illustrator'] },
    royaltyPercentage: { type: Number },
    lines: [RoyaltyStatementLineSchema],
    totalCopies: { type: Number, default: 0 },
    totalInvoiced: { type: Schema.Types.Decimal128, default: 0 },
    totalRoyalties: { type: Schema.Types.Decimal128, default: 0 },
  },
  { _id: false }
);

const RoyaltyStatementSchema: Schema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
    },
    creatorName: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    books: [RoyaltyStatementBookSchema],
    previousBalance: { type: Schema.Types.Decimal128, default: 0 },
    advancePayment: { type: Schema.Types.Decimal128, default: 0 },
    advanceBreakdown: [
      {
        _id: false,
        description: { type: String },
        amount: { type: Schema.Types.Decimal128 },
      },
    ],
    totalCopies: { type: Number, default: 0 },
    totalInvoiced: { type: Schema.Types.Decimal128, default: 0 },
    totalRoyalties: { type: Schema.Types.Decimal128, default: 0 },
    netSettlement: { type: Schema.Types.Decimal128, default: 0 },
    carryoverToNext: { type: Schema.Types.Decimal128, default: 0 },
    balanceInFavorOf: {
      type: String,
      enum: ['author', 'editorial'],
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
    },
    paidAmount: { type: Schema.Types.Decimal128, default: 0 },
    currency: { type: String, default: 'COP' },
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

RoyaltyStatementSchema.index({ creator: 1 });
RoyaltyStatementSchema.index({ periodStart: 1, periodEnd: 1 });
RoyaltyStatementSchema.index({ status: 1 });

export default mongoose.models.RoyaltyStatement ||
  mongoose.model<IRoyaltyStatement>(
    'RoyaltyStatement',
    RoyaltyStatementSchema,
    'royalty_statements'
  );
