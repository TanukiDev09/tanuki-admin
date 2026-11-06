'use client';

import Link from 'next/link';
import {
  BookOpen,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatCurrency } from '@/lib/utils';
import type { CostCenterRow } from '@/lib/costCenters/listing';
import type { CostCenter } from '@/types/cost-center';
import './CostCenterCard.scss';

interface CostCenterCardProps {
  costCenter: CostCenterRow;
  canUpdate?: boolean;
  canDelete?: boolean;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (id: string) => void;
}

const formatPct = (value: number) => `${value.toFixed(1)}%`;

interface StatProps {
  label: string;
  value: string;
  tone?: 'success' | 'danger';
}

function Stat({ label, value, tone }: StatProps) {
  return (
    <div className="cc-card__stat">
      <dt className="cc-card__stat-label">{label}</dt>
      <dd
        className={`cc-card__stat-value ${tone ? `cc-card__stat-value--${tone}` : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function CostCenterCard({
  costCenter: cc,
  canUpdate = false,
  canDelete = false,
  onEdit,
  onDelete,
}: CostCenterCardProps) {
  const positive = cc.balance >= 0;
  const ResultIcon = positive ? TrendingUp : TrendingDown;
  const showBookTitle = cc.bookTitle && cc.bookTitle !== cc.name;

  return (
    <article className="cc-card">
      <header className="cc-card__header">
        <div className="cc-card__badges">
          <span className="cc-card__code">{cc.code}</span>
          {cc.isBook && (
            <span className="cc-card__book-badge">
              <BookOpen size={12} aria-hidden="true" />
              Libro
            </span>
          )}
        </div>
        <h3 className="cc-card__name">
          <Link
            href={`/dashboard/cost-centers/${cc._id}`}
            className="cc-card__link"
          >
            {cc.name}
          </Link>
        </h3>
        {showBookTitle && <p className="cc-card__subtitle">{cc.bookTitle}</p>}
      </header>

      <div className="cc-card__result">
        <span className="cc-card__stat-label">Resultado</span>
        <span
          className={`cc-card__result-value cc-card__stat-value--${positive ? 'success' : 'danger'}`}
        >
          <ResultIcon size={20} aria-hidden="true" />
          {formatCurrency(cc.balance)}
        </span>
        <div
          className="cc-card__spark"
          role="img"
          aria-label="Resultado de los últimos 6 meses"
        >
          <Sparkline
            data={cc.history}
            color={positive ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
            height={36}
          />
        </div>
      </div>

      <dl className="cc-card__stats">
        <Stat
          label="Ingresos"
          value={formatCurrency(cc.income)}
          tone="success"
        />
        <Stat
          label="Egresos"
          value={formatCurrency(cc.expense)}
          tone="danger"
        />
        <Stat label="% de ingresos" value={formatPct(cc.incomeShare)} />
        <Stat label="% de egresos" value={formatPct(cc.expenseShare)} />
        {cc.isBook && (
          <Stat
            label="Ejemplares vendidos"
            value={cc.units.toLocaleString('es-CO')}
          />
        )}
      </dl>

      {(canUpdate || canDelete) && (
        <footer className="cc-card__actions">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(cc)}
              title="Editar"
              aria-label={`Editar ${cc.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(cc._id)}
              title="Eliminar"
              aria-label={`Eliminar ${cc.name}`}
              className="cc-card__delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </footer>
      )}
    </article>
  );
}
