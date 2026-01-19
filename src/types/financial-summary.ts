export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface DailyData {
  day: string;
  income: number;
  expenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface HealthMetrics {
  runway: number;
  burnRate: {
    gross: number;
    net: number;
  };
  profitMargin: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  healthScore: number;
  runwayProjection: Array<{
    month: string;
    balance: number;
  }>;
}

export interface FinancialTotals {
  income: number;
  expenses: number;
  balance: number;
}

export interface FinancialSummary {
  totals: FinancialTotals;
  currentMonth: FinancialTotals;
  monthly: MonthlyData[];
  daily: DailyData[];
  categories: CategoryData[];
  health: HealthMetrics;
  // Alias for backward compatibility
  metrics?: HealthMetrics;
}

export interface BookProfitability {
  id: string;
  title: string;
  income: number;
  expenses: number;
  profit: number;
}
