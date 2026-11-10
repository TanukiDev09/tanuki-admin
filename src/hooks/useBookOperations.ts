import { useState, useEffect } from 'react';
import type {
  BookOperations,
  RecentMovement,
} from '@/lib/inventory/bookOperations';
import type { UnitCostEstimate } from '@/lib/inventory/unitCost';

interface BookOperationsState {
  loading: boolean;
  error: boolean;
  /** Las obras completas no tienen inventario propio (se calcula por volumen). */
  isBundle: boolean;
  operations: BookOperations | null;
  recentMovements: RecentMovement[];
  /** Costo unitario estimado (última compra a la imprenta). */
  unitCost: UnitCostEstimate | null;
}

const INITIAL_STATE: BookOperationsState = {
  loading: true,
  error: false,
  isBundle: false,
  operations: null,
  recentMovements: [],
  unitCost: null,
};

/**
 * Cobertura, rotación y señal de reimpresión de un libro
 * (`/api/books/[id]/operations`).
 */
export function useBookOperations(bookId: string): BookOperationsState {
  const [state, setState] = useState<BookOperationsState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState(INITIAL_STATE);
      try {
        const res = await fetch(`/api/books/${bookId}/operations`, {
          cache: 'no-store',
        });
        const result = await res.json();
        if (cancelled) return;
        if (result.success) {
          setState({
            loading: false,
            error: false,
            isBundle: Boolean(result.data.isBundle),
            operations: result.data.operations,
            recentMovements: result.data.recentMovements ?? [],
            unitCost: result.data.unitCost ?? null,
          });
        } else {
          setState({ ...INITIAL_STATE, loading: false, error: true });
        }
      } catch (error) {
        console.error('Error fetching book operations:', error);
        if (!cancelled) {
          setState({ ...INITIAL_STATE, loading: false, error: true });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  return state;
}
