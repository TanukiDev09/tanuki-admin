import type {
  InventorySummary,
  Receivables,
  Royalties,
  SalesPace,
} from '@/lib/finance/costCenterInsights';

/** Respuesta de /api/costcenters/[id]/insights. */
export interface CostCenterInsightsData {
  hasBooks: boolean;
  pace: SalesPace;
  inventory: InventorySummary;
  receivables: Receivables;
  royalties: Royalties;
}
