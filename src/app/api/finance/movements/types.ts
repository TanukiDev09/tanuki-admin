export interface Allocation {
  costCenter: string[];
  amount: { toString: () => string } | number;
}

export interface Item {
  type: 'libro' | 'servicio' | 'otro';
  description: string;
  quantity: { toString: () => string } | number;
  unitValue: { toString: () => string } | number;
  catalogPrice?: { toString: () => string } | number;
  discount?: { toString: () => string } | number;
  total: { toString: () => string } | number;
  costCenter: string[];
  bookId?: string | { toString: () => string };
}

export interface MovementDoc {
  _id: { toString: () => string };
  amount: { toString: () => string };
  amountInCOP?: { toString: () => string };
  exchangeRate?: { toString: () => string };
  type: string;
  unit?: string;
  quantity?: { toString: () => string };
  unitValue?: { toString: () => string };
  allocations?: Allocation[];
  items?: Item[];
  costCenter?: string[];
  [key: string]: unknown;
}

export interface FormattedMovement extends Omit<
  MovementDoc,
  'amount' | 'quantity' | 'unitValue' | '_id'
> {
  _id: string;
  amount: number;
  relevantAmount?: number;
  quantity?: number;
  unitValue?: number;
}

export interface CreateMovementBody {
  category?: string;
  costCenter?: string;
  beneficiary?: string;
  paymentChannel?: string;
  amount?: number | string;
  description?: string;
  type?: string;
  date?: string | Date;
  quantity?: number | string;
  fiscalYear?: number;
  currency?: string;
  exchangeRate?: number | string;
  issuerId?: string;
  issuerName?: string;
  receiverId?: string;
  receiverName?: string;
  notes?: string;
  salesChannel?: string;
  pointOfSale?: string;
  inventoryMovementId?: string;
  allocations?: {
    costCenter: string;
    amount: number | string;
  }[];
  [key: string]: unknown;
}

// costCenter fields are always arrays in the DB; this tolerates a stray
// legacy string value too.
export function ccArrayIncludes(
  cc: string | string[] | undefined,
  code: string
): boolean {
  if (!cc) return false;
  return Array.isArray(cc) ? cc.includes(code) : cc === code;
}

// costCenter is always stored as an array in the DB. The forms only ever
// select a single cost center per allocation/item, so wrap that single value
// here rather than pushing array-awareness into the UI.
export function toCostCenterArray(cc: unknown): string[] {
  if (Array.isArray(cc)) return cc;
  if (typeof cc === 'string' && cc) return [cc];
  return [];
}
