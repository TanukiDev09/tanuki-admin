'use client';

import Link from 'next/link';
import type { BookOperations } from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import './BookConsignment.scss';

interface BookConsignmentProps {
  operations: BookOperations;
}

const COLUMNS: Array<{ label: string; title?: string; numeric?: boolean }> = [
  { label: 'Punto de venta' },
  { label: 'Remitido', title: 'Ejemplares enviados al punto', numeric: true },
  {
    label: 'Devuelto',
    title: 'Ejemplares devueltos a la editorial',
    numeric: true,
  },
  {
    label: 'Liquidado',
    title: 'Ejemplares que el punto reportó como vendidos',
    numeric: true,
  },
  { label: 'Stock actual', title: 'Ejemplares en su bodega', numeric: true },
  { label: 'Última liquidación' },
];

const formatDate = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Nunca';

export default function BookConsignment({ operations }: BookConsignmentProps) {
  const rows = operations.pointsOfSale.filter(
    (pos) => pos.remitted > 0 || pos.liquidated > 0 || pos.stock > 0
  );

  return (
    <section className="book-consignment">
      <header className="book-consignment__header">
        <h2 className="book-consignment__title">Control de consignación</h2>
        <p className="book-consignment__subtitle">
          Lo remitido, devuelto y liquidado de cada punto, junto a su stock
          actual.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="book-consignment__empty">
          Este libro no tiene remisiones ni stock en puntos de venta.
        </p>
      ) : (
        <div className="book-consignment__scroll">
          <table className="book-consignment__table">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.label}
                    title={column.title}
                    className={
                      column.numeric ? 'book-consignment__num' : undefined
                    }
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((pos) => (
                <tr key={pos.id}>
                  <td>
                    <Link
                      href={`/dashboard/points-of-sale/${pos.id}`}
                      className="book-consignment__name"
                    >
                      {pos.name}
                    </Link>
                  </td>
                  <td className="book-consignment__num">
                    {formatNumber(pos.remitted)}
                  </td>
                  <td className="book-consignment__num">
                    {formatNumber(pos.returned)}
                  </td>
                  <td className="book-consignment__num">
                    {formatNumber(pos.liquidated)}
                  </td>
                  <td className="book-consignment__num">
                    {formatNumber(pos.stock)}
                  </td>
                  <td className="book-consignment__muted">
                    {formatDate(pos.lastLiquidationDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
