import mongoose, { Schema, Document } from 'mongoose';

/**
 * Cierre mensual documentado de una cuenta (banco o billetera).
 * Fuente del saldo de caja real del panel (ver lib/finance/cashBalance.ts).
 */
export interface IReconciliation extends Document {
  account: string;
  period: string; // AAAA-MM
  openingBalance: number | null;
  totalInflows?: number | null;
  totalOutflows?: number | null;
  closingBalance: number | null;
  basis?: string | null; // extracto | reporte | calculado | derivado
  sourceFile?: string | null;
  matched?: boolean;
  reviewedAt?: Date | string | null;
  flowRange?: { low: number; high: number; note?: string } | null;
  notes?: string | null;
}

const ReconciliationSchema: Schema = new Schema(
  {
    account: { type: String, required: true, index: true },
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    openingBalance: { type: Number, default: null },
    totalInflows: { type: Number, default: null },
    totalOutflows: { type: Number, default: null },
    closingBalance: { type: Number, default: null },
    basis: { type: String, trim: true },
    sourceFile: { type: String, trim: true },
    matched: { type: Boolean },
    reviewedAt: { type: Schema.Types.Mixed },
    flowRange: { type: Schema.Types.Mixed, default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: false }
);

ReconciliationSchema.index({ account: 1, period: 1 }, { unique: true });

export default mongoose.models.Reconciliation ||
  mongoose.model<IReconciliation>(
    'Reconciliation',
    ReconciliationSchema,
    'reconciliations'
  );
