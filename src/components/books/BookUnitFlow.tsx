'use client';

import type { BookOperations } from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import { formatPercent } from './opsFormat';
import './BookUnitFlow.scss';

interface BookUnitFlowProps {
  operations: BookOperations;
}

interface Segment {
  key: string;
  label: string;
  units: number;
}

function buildSegments(flow: BookOperations['flow']): Segment[] {
  const segments: Segment[] = [
    {
      key: 'sold-direct',
      label: 'Vendido en venta directa',
      units: flow.soldDirect,
    },
    {
      key: 'sold-pos',
      label: 'Vendido en librerías',
      units: flow.soldPointsOfSale,
    },
    { key: 'own', label: 'En bodega propia', units: flow.onHandOwn },
    { key: 'pos', label: 'En librerías', units: flow.onHandPointsOfSale },
  ];
  return segments;
}

export default function BookUnitFlow({ operations }: BookUnitFlowProps) {
  const { flow } = operations;
  const segments = buildSegments(flow);
  const accounted = segments.reduce((sum, s) => sum + s.units, 0);

  return (
    <section className="book-flow">
      <header className="book-flow__header">
        <h2 className="book-flow__title">Ciclo de vida de los ejemplares</h2>
        <p className="book-flow__subtitle">
          De los {formatNumber(flow.received)} ejemplares ingresados, cuántos se
          vendieron y dónde está el resto.
        </p>
      </header>

      {accounted === 0 ? (
        <p className="book-flow__empty">
          Este libro aún no tiene ingresos, ventas ni stock registrados.
        </p>
      ) : (
        <>
          <div
            className="book-flow__bar"
            role="img"
            aria-label={`Ciclo de vida: ${segments
              .map((s) => `${s.label} ${formatNumber(s.units)}`)
              .join(', ')}`}
          >
            {segments.map((segment) => (
              <div
                key={segment.key}
                className={`book-flow__segment book-flow__segment--${segment.key}`}
                style={{ width: `${(segment.units / accounted) * 100}%` }}
              />
            ))}
          </div>

          <ul className="book-flow__legend">
            {segments.map((segment) => (
              <li key={segment.key} className="book-flow__legend-item">
                <i
                  className={`book-flow__dot book-flow__segment--${segment.key}`}
                  aria-hidden="true"
                />
                <span className="book-flow__legend-label">{segment.label}</span>
                <span className="book-flow__legend-value">
                  {formatNumber(segment.units)}
                  <span className="book-flow__legend-pct">
                    {formatPercent((segment.units / accounted) * 100)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
