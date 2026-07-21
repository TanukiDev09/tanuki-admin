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
  relevantAmount?: number | string;
  type: MovementType;
  category: string | { _id: string; name: string; color?: string };
  // Note: the DB stores costCenter as string[] on every level (root,
  // allocations, items). This frontend type stays string because the forms
  // only support selecting a single cost center per row; API routes convert
  // to/from the array shape at the boundary (see toCostCenterArray in
  // src/app/api/finance/movements/route.ts and .../[id]/route.ts).
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
  debtId?: string;
  allocations?: {
    costCenter: string;
    amount: number | string;
  }[];
  items?: {
    type: 'libro' | 'servicio' | 'otro';
    description: string;
    quantity: number | string;
    unitValue: number | string;
    catalogPrice?: number | string;
    discount?: number | string;
    total: number | string;
    costCenter: string;
    bookId?: string;
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
