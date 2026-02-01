export type DebtType = 'Cuenta por Cobrar' | 'Cuenta por Pagar';
export type DebtStatus = 'Pendiente' | 'Pagado Parcial' | 'Pagado' | 'Vencido';
export type DebtEntityType = 'Creator' | 'PointOfSale' | 'ExternalEntity';

export interface IDebt {
  _id: string;
  type: string;
  entityType: string;
  entityId: string | object;
  entityName?: string; // Cache for easier listing
  totalAmount: number | string;
  paidAmount: number | string;
  remainingBalance: number | string;
  dueDate?: Date;
  status: DebtStatus;
  source: {
    type: string; // 'Invoice', 'Cuenta de Cobro', 'Regalías', 'Préstamo', 'Otro'
    id?: string;
    reference?: string;
  };
  notes?: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDebtDTO {
  type: DebtType;
  entityType: DebtEntityType;
  entityId: string;
  entityName?: string;
  totalAmount: number | string;
  dueDate?: Date;
  source: {
    type: string;
    id?: string;
    reference?: string;
  };
  notes?: string;
  currency?: string;
}

export interface UpdateDebtDTO extends Partial<CreateDebtDTO> {
  paidAmount?: number | string;
  status?: DebtStatus;
}
