export type RoyaltyStatementStatus = 'draft' | 'approved' | 'paid';

/** Quién queda a favor tras la liquidación. */
export type BalanceFavor = 'author' | 'publisher' | 'none';

/** Una fila de la tabla de ventas en papel (snapshot por factura). */
export interface IRoyaltyLine {
  invoiceId: string;
  invoiceNumber: string;
  quantity: number;
  pvp: number;
  date: Date | string;
  totalInvoiced: number;
  totalRoyalty: number;
}

/** Un movimiento financiero detectado como anticipo al creador. */
export interface IAdvanceBreakdownLine {
  movementId: string;
  date: Date | string;
  description: string;
  beneficiary?: string;
  amount: number;
  /** Obra a la que corresponde el anticipo (la liquidación es por persona). */
  bookTitle?: string;
}

/** Sección de una obra dentro de la liquidación de un creador. */
export interface IRoyaltyBookSection {
  agreement: string | object;
  book: string | object;
  bookTitle: string;
  role: string;
  royaltyPercentage: number;
  lines: IRoyaltyLine[];
  totalCopies: number;
  totalInvoiced: number | string;
  totalRoyalties: number | string;
}

export interface IRoyaltyStatement {
  _id: string;

  // El creador (la persona) es el sujeto de la liquidación.
  creator: string | object;
  creatorName: string;
  creatorEmail?: string;
  creatorIdentification?: string;

  // Periodo (aplica a todas las obras)
  periodStart: Date | string;
  periodEnd: Date | string;

  // Obras del creador con ventas en el período (una sección por obra)
  books: IRoyaltyBookSection[];

  // Parámetros a nivel de la persona
  /** "Saldo de periodos anteriores" del creador. Negativo = a favor de la editorial. */
  previousBalance: number | string;
  /** Anticipo total del creador (suma de anticipos detectados por obra). */
  advancePayment: number | string;
  /** Desglose de los movimientos detectados como anticipo (por obra). */
  advanceBreakdown?: IAdvanceBreakdownLine[];

  // Totales agregados (por persona)
  totalCopies: number;
  totalInvoiced: number | string;
  totalRoyalties: number | string;
  /** previousBalance + totalRoyalties − advancePayment. */
  netSettlement: number | string;
  /** Arrastre a la próxima liquidación del creador. */
  carryoverToNext: number | string;
  balanceInFavorOf: BalanceFavor;

  // Ciclo de vida
  status: RoyaltyStatementStatus;
  debtId?: string | object;
  paidAmount: number | string;

  notes?: string;
  currency: string;

  generatedAt: Date | string;
  approvedAt?: Date | string;
  paidAt?: Date | string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Body para generar una liquidación (por creador).
 *
 * NO incluye saldo anterior ni anticipo: son cálculos del sistema (arrastre de
 * la liquidación previa y detección en movimientos). Permitir ajustarlos a mano
 * sería un encubrimiento contable.
 */
export interface CreateRoyaltyStatementDTO {
  creatorId: string;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

/** Sección de obra calculada (sin persistir). */
export interface RoyaltyBookComputation {
  agreement: string;
  book: string;
  bookTitle: string;
  role: string;
  royaltyPercentage: number;
  lines: IRoyaltyLine[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
}

/** Resultado del cálculo por creador (sin persistir), usado por el preview. */
export interface RoyaltyComputation {
  books: RoyaltyBookComputation[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
  previousBalance: number;
  advancePayment: number;
  advanceBreakdown: IAdvanceBreakdownLine[];
  netSettlement: number;
  carryoverToNext: number;
  balanceInFavorOf: BalanceFavor;
}
