'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import {
  getReprintStatus,
  type BookOperations,
  type ReprintStatus,
} from '@/lib/inventory/bookOperations';
import { formatNumber } from '@/lib/utils';
import { formatMonths, formatTurns } from './opsFormat';
import './BookVolumes.scss';

export interface BundleVolume {
  _id: string;
  title: string;
  isbn?: string;
}

interface BookVolumesProps {
  volumes: BundleVolume[];
}

interface VolumeOps {
  volume: BundleVolume;
  operations: BookOperations | null;
}

/** Tiempo de reimpresión de referencia para la señal de cada volumen. */
const LEAD_TIME_MONTHS = 3;

type BadgeVariant = 'destructive' | 'warning' | 'success' | 'secondary';

const SIGNAL: Record<ReprintStatus, { label: string; variant: BadgeVariant }> =
  {
    now: { label: 'Reimprimir ya', variant: 'destructive' },
    plan: { label: 'Planear', variant: 'warning' },
    ok: { label: 'Sin urgencia', variant: 'success' },
    'no-demand': { label: 'Sin señal', variant: 'secondary' },
  };

async function fetchVolume(volume: BundleVolume): Promise<VolumeOps> {
  try {
    const res = await fetch(`/api/books/${volume._id}/operations`, {
      cache: 'no-store',
    });
    const result = await res.json();
    return {
      volume,
      operations: result.success ? result.data.operations : null,
    };
  } catch (error) {
    console.error('Error fetching volume operations:', error);
    return { volume, operations: null };
  }
}

export default function BookVolumes({ volumes }: BookVolumesProps) {
  const [rows, setRows] = useState<VolumeOps[] | null>(null);
  const volumeKey = volumes.map((v) => v._id).join(',');

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    Promise.all(volumes.map(fetchVolume)).then((result) => {
      if (!cancelled) setRows(result);
    });
    return () => {
      cancelled = true;
    };
    // `volumeKey` identifica el conjunto de volúmenes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeKey]);

  const stocks = (rows ?? [])
    .map((row) => row.operations?.stock.total)
    .filter((stock): stock is number => stock !== undefined);
  const minStock = stocks.length > 0 ? Math.min(...stocks) : null;

  return (
    <section className="book-volumes">
      <header className="book-volumes__header">
        <h2 className="book-volumes__title">Volúmenes de la obra</h2>
        <p className="book-volumes__subtitle">
          El stock de la obra completa lo limita su volumen con menos
          ejemplares. La señal de reimpresión usa un tiempo de{' '}
          {formatMonths(LEAD_TIME_MONTHS)}.
        </p>
      </header>

      {rows === null ? (
        <p className="book-volumes__message">Cargando volúmenes...</p>
      ) : (
        <ul className="book-volumes__list">
          {rows.map(({ volume, operations }) => {
            const limits =
              minStock !== null && operations?.stock.total === minStock;
            const signal = operations
              ? SIGNAL[
                  getReprintStatus(operations.coverage.own, LEAD_TIME_MONTHS)
                ]
              : null;
            return (
              <li key={volume._id} className="book-volumes__row">
                <div className="book-volumes__name">
                  <Link
                    href={`/dashboard/catalog/${volume._id}`}
                    className="book-volumes__link"
                  >
                    {volume.title}
                  </Link>
                  {limits && (
                    <span className="book-volumes__limit">Limita la obra</span>
                  )}
                </div>
                {operations ? (
                  <dl className="book-volumes__stats">
                    <div>
                      <dt>Stock</dt>
                      <dd>{formatNumber(operations.stock.total)}</dd>
                    </div>
                    <div>
                      <dt>Cobertura propia</dt>
                      <dd>{formatMonths(operations.coverage.own)}</dd>
                    </div>
                    <div>
                      <dt>Rotación</dt>
                      <dd>{formatTurns(operations.rotation.turns)}</dd>
                    </div>
                    <div>
                      <dt>Señal</dt>
                      <dd>
                        {signal && (
                          <Badge variant={signal.variant}>{signal.label}</Badge>
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <span className="book-volumes__unavailable">
                    Sin datos de inventario
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
