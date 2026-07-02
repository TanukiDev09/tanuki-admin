import { Document } from 'mongoose';

export interface IRoyaltyStatementLine {
  invoiceId: string;
  invoiceNumber: string;
  quantity: number;
  pvp: number;
  date: Date;
  totalInvoiced: number;
  totalRoyalty: number;
}

export interface IRoyaltyStatementBook {
  agreement: string;
  book: string;
  bookTitle: string;
  role: 'author' | 'translator' | 'illustrator';
  royaltyPercentage: number;
  lines: IRoyaltyStatementLine[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
}

export type RoyaltyStatementStatus = 'draft' | 'approved' | 'paid';

export interface IRoyaltyStatement extends Document {
  creator: string;
  creatorName: string;
  periodStart: Date;
  periodEnd: Date;
  books: IRoyaltyStatementBook[];
  previousBalance: number;
  advancePayment: number;
  advanceBreakdown: { description: string; amount: number }[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
  netSettlement: number;
  carryoverToNext: number;
  balanceInFavorOf: 'author' | 'editorial';
  status: RoyaltyStatementStatus;
  paidAmount: number;
  currency: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoyaltyStatementDTO {
  creator: string;
  periodStart: string;
  periodEnd: string;
}

export type UpdateRoyaltyStatementDTO = Partial<{
  status: RoyaltyStatementStatus;
  paidAmount: number;
  notes: string;
}>;
