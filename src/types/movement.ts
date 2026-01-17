export type MovementType = 'INCOME' | 'EXPENSE';
export type MovementStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface Movement {
  _id: string;
  date: string; // ISO string
  fiscalYear: number;
  amount: number;
  currency: string;
  exchangeRate?: number;
  amountInCOP?: number;
  type: MovementType;
  category: string | { _id: string; name: string };
  costCenter: string;
  beneficiary: string;
  paymentChannel: string;
  invoiceRef?: string;
  description: string;
  notes?: string;
  unit?: string;
  quantity?: number;
  unitValue?: number;
  status: MovementStatus; // Added status as it was in page.tsx but not explicitly in model? Wait, model didn't have status.
}

export interface CreateMovementDTO extends Omit<Movement, '_id' | 'status'> {
  status?: MovementStatus;
}

export type UpdateMovementDTO = Partial<CreateMovementDTO>;
