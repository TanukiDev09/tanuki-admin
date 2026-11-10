export interface CostCenter {
  _id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Centro de costo con las estadísticas de /api/costcenters/stats. */
export interface CostCenterStats extends CostCenter {
  income: number;
  expense: number;
  balance: number;
  /** Resultado de los últimos 6 meses. */
  history: number[];
  /** true si algún libro usa este centro de costo. */
  isBook: boolean;
  /** Título del primer libro vinculado, si lo hay. */
  bookTitle?: string;
  /** Ejemplares vendidos (ítems tipo libro de facturas no anuladas). */
  units: number;
}
