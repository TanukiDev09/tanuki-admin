'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type {
  BookChannelSummary,
  BookPointOfSaleStat,
} from '@/lib/finance/salesChannels';
import './BookPointsOfSale.scss';

type PointOfSaleRow = BookPointOfSaleStat & { stock: number | null };
type Summary = BookChannelSummary & { stockInPointsOfSale: number };

interface BookPointsOfSaleData {
  summary: Summary;
  pointsOfSale: PointOfSaleRow[];
}

interface BookPointsOfSaleProps {
  bookId: string;
}

const VISIBLE_ROWS = 5;

const formatPct = (value: number): string =>
  `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value)}%`;

const formatDate = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

interface ChannelBarProps {
  label: string;
  posPct: number;
  posText: string;
  directText: string;
}

function ChannelBar({ label, posPct, posText, directText }: ChannelBarProps) {
  const directPct = 100 - posPct;
  return (
    <div className="book-pos__channel">
      <div className="book-pos__channel-head">
        <span className="book-pos__channel-label">{label}</span>
        <span className="book-pos__channel-pct">
          {formatPct(posPct)} en puntos de venta
        </span>
      </div>
      <div
        className="book-pos__bar"
        role="img"
        aria-label={`${label}: ${formatPct(posPct)} puntos de venta, ${formatPct(directPct)} venta directa`}
      >
        <div
          className="book-pos__bar-segment book-pos__bar-segment--pos"
          style={{ width: `${posPct}%` }}
        />
      </div>
      <div className="book-pos__channel-legend">
        <span>
          <i className="book-pos__dot book-pos__dot--pos" aria-hidden="true" />
          Puntos de venta · {posText}
        </span>
        <span>
          <i className="book-pos__dot" aria-hidden="true" />
          Venta directa · {directText}
        </span>
      </div>
    </div>
  );
}

export default function BookPointsOfSale({ bookId }: BookPointsOfSaleProps) {
  const [data, setData] = useState<BookPointsOfSaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/books/${bookId}/points-of-sale`, {
        cache: 'no-store',
      });
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Error fetching book points of sale:', error);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="book-pos book-pos--loading">
        Cargando puntos de venta...
      </div>
    );
  }

  if (!data) return null;

  const { summary, pointsOfSale } = data;
  const visible = showAll ? pointsOfSale : pointsOfSale.slice(0, VISIBLE_ROWS);
  const hidden = pointsOfSale.length - visible.length;

  return (
    <section className="book-pos">
      <header className="book-pos__header">
        <h2 className="book-pos__title">Puntos de venta</h2>
        <p className="book-pos__subtitle">
          Cómo se reparten las ventas de este libro entre puntos de venta y
          venta directa.
        </p>
      </header>

      {summary.totalUnits === 0 ? (
        <p className="book-pos__empty">
          Este libro aún no registra ventas en facturas.
        </p>
      ) : (
        <>
          <div className="book-pos__panel">
            <ChannelBar
              label="Ejemplares"
              posPct={summary.posUnitsPct}
              posText={formatNumber(summary.posUnits)}
              directText={formatNumber(summary.directUnits)}
            />
            <ChannelBar
              label="Facturación"
              posPct={summary.posRevenuePct}
              posText={formatCurrency(summary.posRevenue)}
              directText={formatCurrency(summary.directRevenue)}
            />
          </div>

          <dl className="book-pos__stats">
            <div className="book-pos__stat">
              <dt className="book-pos__stat-label">Puntos con ventas</dt>
              <dd className="book-pos__stat-value">
                {formatNumber(summary.pointsOfSaleWithSales)}
              </dd>
            </div>
            <div className="book-pos__stat">
              <dt className="book-pos__stat-label">Promedio por punto</dt>
              <dd className="book-pos__stat-value">
                {formatNumber(Math.round(summary.avgUnitsPerPointOfSale))}
                <span className="book-pos__stat-unit">ejemplares</span>
              </dd>
            </div>
            <div className="book-pos__stat">
              <dt className="book-pos__stat-label">En consignación</dt>
              <dd className="book-pos__stat-value">
                {formatNumber(summary.stockInPointsOfSale)}
                <span className="book-pos__stat-unit">ejemplares</span>
              </dd>
            </div>
          </dl>

          {pointsOfSale.length > 0 && (
            <div className="book-pos__panel">
              <h3 className="book-pos__panel-title">
                Participación por punto de venta
              </h3>
              <ol className="book-pos__list">
                {visible.map((pos) => (
                  <li key={pos.id} className="book-pos__row">
                    <div className="book-pos__row-head">
                      <Link
                        href={`/dashboard/points-of-sale/${pos.id}`}
                        className="book-pos__row-name"
                      >
                        {pos.name}
                      </Link>
                      <span className="book-pos__row-value">
                        {formatNumber(pos.units)} ejemplares ·{' '}
                        <strong>{formatPct(pos.unitsShare)}</strong>
                      </span>
                    </div>
                    <div className="book-pos__bar book-pos__bar--thin">
                      <div
                        className="book-pos__bar-segment book-pos__bar-segment--pos"
                        style={{ width: `${Math.min(pos.unitsShare, 100)}%` }}
                      />
                    </div>
                    <p className="book-pos__row-meta">
                      {[
                        pos.city,
                        `Facturado ${formatCurrency(pos.revenue)}`,
                        pos.stock !== null
                          ? `En stock ${formatNumber(pos.stock)}`
                          : null,
                        `Última venta ${formatDate(pos.lastSaleDate)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ol>
              {pointsOfSale.length > VISIBLE_ROWS && (
                <button
                  type="button"
                  className="book-pos__toggle"
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll ? 'Ver menos' : `Ver los ${hidden} restantes`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
