'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import type { TopPointOfSale } from '@/lib/finance/salesChannels';
import './TopPointsOfSale.scss';

interface TopPointsOfSaleProps {
  items: TopPointOfSale[];
  title?: string;
}

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

export function TopPointsOfSale({
  items,
  title = 'Top 5 Puntos de Venta',
}: TopPointsOfSaleProps) {
  return (
    <Card className="top-pos">
      <CardHeader className="top-pos__header">
        <CardTitle className="top-pos__title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="top-pos__content">
        {items.length === 0 ? (
          <p className="top-pos__empty">
            Aún no hay ventas a puntos de venta en este centro de costo.
          </p>
        ) : (
          <ol className="top-pos__list">
            {items.map((pos, index) => (
              <li key={pos.id} className="top-pos__item">
                <span className="top-pos__rank">{index + 1}</span>
                <div className="top-pos__info">
                  <Link
                    href={`/dashboard/points-of-sale/${pos.id}`}
                    className="top-pos__name"
                  >
                    {pos.name}
                  </Link>
                  <span className="top-pos__meta">
                    {[pos.code, pos.city].filter(Boolean).join(' · ')}
                    {` · Última venta: ${formatDate(pos.lastSaleDate)}`}
                  </span>
                </div>
                <dl className="top-pos__stats">
                  <div>
                    <dt>Ingresos</dt>
                    <dd>{formatCurrency(pos.revenue)}</dd>
                  </div>
                  <div>
                    <dt>Ejemplares</dt>
                    <dd>{pos.units}</dd>
                  </div>
                  <div>
                    <dt>Facturas</dt>
                    <dd>{pos.invoices}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
