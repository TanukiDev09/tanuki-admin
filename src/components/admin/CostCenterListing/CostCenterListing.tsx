'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import CostCenterCard from '@/components/admin/CostCenterCard';
import CostCenterToolbar from '@/components/admin/CostCenterToolbar/CostCenterToolbar';
import {
  filterCostCenters,
  sortCostCenters,
  withShares,
  type KindFilter,
  type SortDir,
  type SortKey,
} from '@/lib/costCenters/listing';
import type { CostCenter, CostCenterStats } from '@/types/cost-center';
import './CostCenterListing.scss';

interface CostCenterListingProps {
  costCenters: CostCenterStats[];
  loading: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (id: string) => void;
}

const SKELETON_COUNT = 6;

function foundLabel(count: number) {
  return count === 1 ? '1 centro encontrado' : `${count} centros encontrados`;
}

export default function CostCenterListing({
  costCenters,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: CostCenterListingProps) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // La participación se calcula sobre todos los centros, no sobre los filtrados.
  const rows = useMemo(() => withShares(costCenters), [costCenters]);

  const counts = useMemo(() => {
    const books = rows.filter((r) => r.isBook).length;
    return { all: rows.length, books, other: rows.length - books };
  }, [rows]);

  const visible = useMemo(
    () =>
      sortCostCenters(
        filterCostCenters(rows, { search, kind }),
        sortKey,
        sortDir
      ),
    [rows, search, kind, sortKey, sortDir]
  );

  const clearFilters = () => {
    setSearch('');
    setKind('all');
  };

  return (
    <section className="cc-listing" aria-labelledby="cc-listing-title">
      <div className="cc-listing__header">
        <div>
          <h2 id="cc-listing-title" className="cc-listing__title">
            Centros de Costo
          </h2>
          <p className="cc-listing__count" aria-live="polite">
            {loading ? 'Cargando…' : foundLabel(visible.length)}
          </p>
        </div>
      </div>

      <CostCenterToolbar
        search={search}
        onSearchChange={setSearch}
        kind={kind}
        onKindChange={setKind}
        counts={counts}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
      />

      {loading && (
        <div className="cc-listing__grid" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div key={i} className="cc-listing__skeleton" />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="cc-listing__empty">
          <p>
            {rows.length === 0
              ? 'No hay centros de costo registrados.'
              : 'Ningún centro coincide con los filtros.'}
          </p>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="cc-listing__grid">
          {visible.map((cc) => (
            <CostCenterCard
              key={cc._id}
              costCenter={cc}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
