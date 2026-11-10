'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type {
  BookOperations,
  PointOfSaleStatus,
} from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import { formatMonths, formatPercent, formatTurns } from './opsFormat';
import './BookPosRotation.scss';

interface BookPosRotationProps {
  operations: BookOperations;
}

type BadgeVariant = 'outline' | 'secondary' | 'warning' | 'destructive';

const STATUS: Record<
  PointOfSaleStatus,
  { label: string; variant: BadgeVariant; hint: string }
> = {
  healthy: {
    label: 'Estable',
    variant: 'outline',
    hint: 'Cobertura entre 1 y 12 meses',
  },
  low: {
    label: 'Reponer',
    variant: 'warning',
    hint: 'Menos de 1 mes de cobertura',
  },
  stockout: {
    label: 'Agotado',
    variant: 'destructive',
    hint: 'Vende pero no tiene stock',
  },
  overstock: {
    label: 'Sobre-stock',
    variant: 'warning',
    hint: 'Más de 12 meses de cobertura',
  },
  dormant: {
    label: 'Dormido',
    variant: 'secondary',
    hint: 'Tiene stock y no vende hace 90 días',
  },
};

const COLUMNS: Array<{ label: string; title: string; numeric?: boolean }> = [
  { label: 'Punto de venta', title: '' },
  { label: 'Stock', title: 'Ejemplares en su bodega', numeric: true },
  {
    label: 'Vendidos 12m',
    title: 'Ejemplares vendidos en 12 meses',
    numeric: true,
  },
  {
    label: 'Rotación',
    title: 'Ventas de 12 meses ÷ stock actual',
    numeric: true,
  },
  {
    label: 'Cobertura',
    title: 'Meses que dura el stock al ritmo de los últimos 90 días',
    numeric: true,
  },
  {
    label: 'Vendido / remitido',
    title: 'Ejemplares vendidos sobre los remitidos',
    numeric: true,
  },
  {
    label: 'Devolución',
    title: 'Ejemplares devueltos sobre los remitidos',
    numeric: true,
  },
  { label: 'Estado', title: '' },
];

export default function BookPosRotation({ operations }: BookPosRotationProps) {
  const { pointsOfSale } = operations;

  return (
    <section className="book-pos-rotation">
      <header className="book-pos-rotation__header">
        <h2 className="book-pos-rotation__title">
          Rotación por punto de venta
        </h2>
        <p className="book-pos-rotation__subtitle">
          De mejor a peor rotación. Ayuda a decidir a quién reponer, a quién
          trasladarle stock y de dónde recogerlo.
        </p>
      </header>

      {pointsOfSale.length === 0 ? (
        <p className="book-pos-rotation__empty">
          Este libro no tiene stock ni ventas en puntos de venta.
        </p>
      ) : (
        <div className="book-pos-rotation__scroll">
          <table className="book-pos-rotation__table">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.label}
                    title={column.title || undefined}
                    className={
                      column.numeric ? 'book-pos-rotation__num' : undefined
                    }
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pointsOfSale.map((pos) => {
                const status = STATUS[pos.status];
                return (
                  <tr key={pos.id}>
                    <td>
                      <Link
                        href={`/dashboard/points-of-sale/${pos.id}`}
                        className="book-pos-rotation__name"
                      >
                        {pos.name}
                      </Link>
                      {pos.city && (
                        <span className="book-pos-rotation__city">
                          {pos.city}
                        </span>
                      )}
                    </td>
                    <td className="book-pos-rotation__num">
                      {formatNumber(pos.stock)}
                    </td>
                    <td className="book-pos-rotation__num">
                      {formatNumber(pos.sold365)}
                    </td>
                    <td className="book-pos-rotation__num">
                      {formatTurns(pos.rotation)}
                    </td>
                    <td className="book-pos-rotation__num">
                      {formatMonths(pos.coverageMonths)}
                    </td>
                    <td className="book-pos-rotation__num">
                      {formatPercent(pos.sellThroughPct)}
                    </td>
                    <td className="book-pos-rotation__num">
                      {formatPercent(pos.returnRatePct)}
                    </td>
                    <td>
                      <Badge variant={status.variant} title={status.hint}>
                        {status.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
