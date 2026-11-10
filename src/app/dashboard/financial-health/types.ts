import type { Movement } from '@/types/movement';
import type { CashMonth } from '@/lib/finance/cashBalance';

export interface FinancialHealthData {
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  monthly: Array<{ month: string; income: number; expenses: number }>;
  daily?: Array<{
    month: string;
    day: string;
    date: string;
    income: number;
    expenses: number;
  }>;
  categories?: Array<{ name: string; value: number; color?: string }>;
  categoriesIncome?: Array<{ name: string; value: number; color?: string }>;
  categoriesExpense?: Array<{ name: string; value: number; color?: string }>;
  costCenters?: Array<{ name: string; value: number }>;
  costCentersIncome?: Array<{ name: string; value: number }>;
  costCentersExpense?: Array<{ name: string; value: number }>;
  movements?: Movement[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  health: {
    runway: number;
    burnRate: {
      gross: number;
      net: number;
    };
    profitMargin: number;
    avgMonthlyIncome: number;
    avgMonthlyExpense: number;
    healthScore?: number;
    runwayProjection?: Array<{ month: string; balance: number }>;
  };
  balances?: {
    previousMonth: number;
    currentMonth: number;
    note?: string;
  };
  /** Saldo de caja real (todas las cuentas) a partir de los cierres documentados. */
  cash?: {
    year: number;
    months: CashMonth[];
    current: number | null;
    previousYearClosing: number | null;
  } | null;
}
