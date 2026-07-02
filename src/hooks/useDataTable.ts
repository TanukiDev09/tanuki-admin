import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

function getNestedValue(
  obj: Record<string, unknown> | null | undefined,
  path: string
) {
  if (!obj || !path || typeof obj !== 'object') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce((prev: any, curr) => prev && prev[curr], obj);
}

function compareValues(
  aValue: unknown,
  bValue: unknown,
  direction: SortDirection
): number {
  if (aValue === bValue) return 0;
  if (aValue === null || aValue === undefined) return 1;
  if (bValue === null || bValue === undefined) return -1;

  // Number comparison
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  }

  // Date comparison
  if (aValue instanceof Date && bValue instanceof Date) {
    return direction === 'asc'
      ? aValue.getTime() - bValue.getTime()
      : bValue.getTime() - aValue.getTime();
  }

  // String comparison (default)
  const aStr = String(aValue).toLowerCase();
  const bStr = String(bValue).toLowerCase();

  return direction === 'asc'
    ? aStr.localeCompare(bStr, undefined, { numeric: true })
    : bStr.localeCompare(aStr, undefined, { numeric: true });
}

export function useDataTable<T>(data: T[], initialSort?: SortConfig) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    initialSort || { key: '', direction: null }
  );

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(
        a as Record<string, unknown>,
        sortConfig.key
      );
      const bValue = getNestedValue(
        b as Record<string, unknown>,
        sortConfig.key
      );
      return compareValues(aValue, bValue, sortConfig.direction);
    });
  }, [data, sortConfig]);

  const toggleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  return {
    data: sortedData,
    sortConfig,
    toggleSort,
  };
}
