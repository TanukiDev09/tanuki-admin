export type MovementType = 'INCOME' | 'EXPENSE';
export type MovementStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface Movement {
  _id: string;
  date: string; // ISO string
  fiscalYear: number;
  amount: number | string;
  currency: string;
  exchangeRate?: number | string;
  amountInCOP?: number | string;
  type: MovementType;
  category: string | { _id: string; name: string; color?: string };
  costCenter: string;
  beneficiary: string;
  paymentChannel: string;
  invoiceRef?: string;
  description: string;
  notes?: string;
  unit?: string;
  quantity?: number | string;
  unitValue?: number | string;
  status: MovementStatus;
  salesChannel?: 'LIBRERIA' | 'FERIA' | 'DIRECTA' | 'OTRO';
  pointOfSale?: string | { _id: string; name: string };
  inventoryMovementId?: string;
  allocations?: {
    costCenter: string;
    amount: number | string;
  }[];
}

export interface CreateMovementDTO extends Omit<
  Movement,
  '_id' | 'status' | 'category' | 'pointOfSale' | 'inventoryMovementId'
> {
  category: string;
  pointOfSale?: string;
  status?: MovementStatus;
  inventoryMovementId?: string;
}

export type UpdateMovementDTO = Partial<CreateMovementDTO>;
