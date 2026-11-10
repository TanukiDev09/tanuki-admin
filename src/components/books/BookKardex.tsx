'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type { RecentMovement } from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import './BookKardex.scss';

interface BookKardexProps {
  bookId: string;
  movements: RecentMovement[];
}

type BadgeVariant = 'success' | 'info' | 'warning' | 'secondary';

const TYPES: Record<string, { label: string; variant: BadgeVariant }> = {
  INGRESO: { label: 'Ingreso', variant: 'success' },
  REMISION: { label: 'Remisión', variant: 'info' },
  DEVOLUCION: { label: 'Devolución', variant: 'warning' },
  LIQUIDACION: { label: 'Liquidación', variant: 'secondary' },
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const route = (movement: RecentMovement): string =>
  [movement.from, movement.to].filter(Boolean).join(' → ') || '—';

export default function BookKardex({ bookId, movements }: BookKardexProps) {
  return (
    <section className="book-kardex">
      <header className="book-kardex__header">
        <div className="book-kardex__heading">
          <h2 className="book-kardex__title">Movimientos recientes</h2>
          <p className="book-kardex__subtitle">
            Últimos ingresos, remisiones, devoluciones y liquidaciones del
            libro.
          </p>
        </div>
        <Link
          href={`/dashboard/inventory/movements?bookId=${bookId}`}
          className="book-kardex__all"
        >
          Ver todos los movimientos
        </Link>
      </header>

      {movements.length === 0 ? (
        <p className="book-kardex__empty">
          Este libro aún no tiene movimientos de inventario.
        </p>
      ) : (
        <ul className="book-kardex__list">
          {movements.map((movement) => {
            const type = TYPES[movement.type] ?? {
              label: movement.type,
              variant: 'secondary' as const,
            };
            return (
              <li key={movement.id} className="book-kardex__row">
                <span className="book-kardex__date">
                  {formatDate(movement.date)}
                </span>
                <Badge variant={type.variant}>{type.label}</Badge>
                <span className="book-kardex__route">{route(movement)}</span>
                <span className="book-kardex__quantity">
                  {formatNumber(movement.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
