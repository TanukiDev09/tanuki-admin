'use client';

import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  KIND_OPTIONS,
  SORT_OPTIONS,
  type KindFilter,
  type SortDir,
  type SortKey,
} from '@/lib/costCenters/listing';
import './CostCenterToolbar.scss';

interface CostCenterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  kind: KindFilter;
  onKindChange: (value: KindFilter) => void;
  /** Cantidad de centros por tipo, para mostrarla en cada filtro. */
  counts: Record<KindFilter, number>;
  sortKey: SortKey;
  onSortKeyChange: (value: SortKey) => void;
  sortDir: SortDir;
  onSortDirChange: (value: SortDir) => void;
}

export default function CostCenterToolbar({
  search,
  onSearchChange,
  kind,
  onKindChange,
  counts,
  sortKey,
  onSortKeyChange,
  sortDir,
  onSortDirChange,
}: CostCenterToolbarProps) {
  const ascending = sortDir === 'asc';
  const DirIcon = ascending ? ArrowUp : ArrowDown;

  return (
    <div className="cc-toolbar">
      <div className="cc-toolbar__search">
        <Search className="cc-toolbar__search-icon" aria-hidden="true" />
        <Input
          placeholder="Buscar por código, nombre o libro..."
          aria-label="Buscar centros de costo"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="cc-toolbar__search-input"
        />
      </div>

      <div
        className="cc-toolbar__group"
        role="group"
        aria-label="Tipo de centro"
      >
        {KIND_OPTIONS.map((option) => {
          const active = option.key === kind;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => onKindChange(option.key)}
              className={`cc-toolbar__chip ${active ? 'cc-toolbar__chip--active' : ''}`}
            >
              {option.label}
              <span className="cc-toolbar__chip-count">
                {counts[option.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="cc-toolbar__sort">
        <span className="cc-toolbar__sort-label" id="cc-sort-label">
          Ordenar por
        </span>
        <Select
          value={sortKey}
          onValueChange={(value) => onSortKeyChange(value as SortKey)}
        >
          <SelectTrigger
            className="cc-toolbar__sort-select"
            aria-labelledby="cc-sort-label"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onSortDirChange(ascending ? 'desc' : 'asc')}
          aria-label={
            ascending
              ? 'Orden ascendente, cambiar a descendente'
              : 'Orden descendente, cambiar a ascendente'
          }
          title={ascending ? 'Ascendente' : 'Descendente'}
        >
          <DirIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
