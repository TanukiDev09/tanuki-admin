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
}

export interface IRoyaltyStatement {
  _id: string;

  // Relaciones
  agreement: string | object;
  book: string | object;
  creator: string | object;

  // Datos denormalizados (snapshot, para que el documento histórico no cambie)
  bookTitle: string;
  creatorName: string;
  creatorEmail?: string;

  // Periodo
  periodStart: Date | string;
  periodEnd: Date | string;

  // Parámetros del cálculo (snapshot del contrato al generar)
  royaltyPercentage: number;
  advancePayment: number | string;
  /** Movimientos detectados como anticipo (origen del valor de advancePayment). */
  advanceBreakdown?: IAdvanceBreakdownLine[];
  /** "Saldo de periodos anteriores". Negativo = a favor de la editorial (anticipo no recuperado). */
  previousBalance: number | string;

  // Detalle
  lines: IRoyaltyLine[];

  // Totales
  totalCopies: number;
  totalInvoiced: number | string;
  totalRoyalties: number | string;
  /** previousBalance + totalRoyalties − advancePayment. */
  netSettlement: number | string;
  /** Lo que se arrastra a la próxima liquidación (negativo si queda a favor de la editorial; 0 si fue a deuda). */
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

/** Body para generar una liquidación. */
export interface CreateRoyaltyStatementDTO {
  agreementId: string;
  periodStart: string;
  periodEnd: string;
  /** Override opcional; si se omite se toma del arrastre de la liquidación previa. */
  previousBalance?: number;
  /** Override opcional; si se omite se usa el anticipo del contrato (o 0 si ya hubo una liquidación previa). */
  advancePayment?: number;
  notes?: string;
}

/** Resultado del cálculo (sin persistir), usado por el preview. */
export interface RoyaltyComputation {
  lines: IRoyaltyLine[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
  previousBalance: number;
  advancePayment: number;
  royaltyPercentage: number;
  netSettlement: number;
  carryoverToNext: number;
  balanceInFavorOf: BalanceFavor;
}
