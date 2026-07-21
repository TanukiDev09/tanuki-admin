export interface Allocation {
  costCenter: string | string[];
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
  costCenter: string | string[];
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
  costCenter?: string | string[];
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

// costCenter is always stored as an array in the DB, but a movement/item/
// allocation only ever belongs to that array's codes — most call sites just
// need to know if a given code is among them.
export function matchesCC(cc: string | string[] | undefined, code: string): boolean {
  if (!cc) return false;
  if (Array.isArray(cc)) return cc.includes(code);
  return cc === code;
}

// The UI only ever lets a user pick a single cost center per allocation/item
// row, so for display purposes we collapse the array down to its first code.
export function normalizeCC(cc: string | string[] | undefined): string {
  if (!cc) return '';
  if (Array.isArray(cc)) return cc[0] ?? '';
  return cc;
}
