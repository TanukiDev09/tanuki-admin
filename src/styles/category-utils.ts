import { WARM_COLORS, COLD_COLORS } from './category-colors';

/**
 * Returns a stable hash from a string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Returns a semantic color for a category based on its type and a key for stability.
 * If a custom color is provided and it's not the default slate, it returns it.
 * Otherwise, it returns a warm color for Expenses and a cold color for Income.
 */
export function getSemanticCategoryColor(
  type: string | 'INCOME' | 'EXPENSE' | 'Ingreso' | 'Egreso' | 'Ambos',
  customColor?: string,
  key?: string
): string {
  // Normalize type
  const isIncome = type === 'INCOME' || type === 'Ingreso';

  // If we have a custom color and it's not the default slate, use it
  if (customColor && customColor !== '#64748b' && customColor !== '') {
    return customColor;
  }

  // Fallback to semantic palette with stable hashing
  const index = key ? hashString(key) : 0;

  if (isIncome) {
    return COLD_COLORS[index % COLD_COLORS.length];
  } else {
    return WARM_COLORS[index % WARM_COLORS.length];
  }
}
