import { useState, useEffect, useRef, useCallback } from 'react';

export interface PersistentFiltersOptions<T> {
  key: string;
  initialFilters: T;
}

export function usePersistentFilters<T>({
  key,
  initialFilters,
}: PersistentFiltersOptions<T>) {
  // Initialize state from sessionStorage synchronously to avoid cascading renders
  const [filters, setFilters] = useState<T>(() => {
    if (typeof window === 'undefined') return initialFilters;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initialFilters, ...parsed };
      } catch (e) {
        console.error(`Failed to parse saved filters for ${key}`, e);
      }
    }
    return initialFilters;
  });

  const hasInitializedRef = useRef(false);

  // Save to session storage on every filter change
  useEffect(() => {
    // Skip the very first render save to avoid unnecessary write,
    // although it would be harmless as we just loaded it.
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(filters));
  }, [key, filters]);

  const updateFilters = useCallback((updates: Partial<T>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    sessionStorage.removeItem(key);
  }, [key, initialFilters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasInitializedRef,
  };
}
