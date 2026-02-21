'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Search,
  Plus,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IDebt } from '@/types/debt';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { ManualDebtModal } from '@/components/finance/ManualDebtModal';
import { Badge } from '@/components/ui/Badge';

import './debts-page.scss';

interface GroupedDebt {
  _id: string;
  entityName: string;
  entityType: string;
  totalDebt: number;
  debtCount: number;
  debts: IDebt[];
}

export default function DebtsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cobrar' | 'pagar'>(
    'all'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: groupedDebts, isLoading } = useQuery({
    queryKey: ['debts', 'grouped', typeFilter],
    queryFn: async () => {
      let url = '/api/debts?grouped=true';
      if (typeFilter === 'cobrar') url += '&type=Cuenta por Cobrar';
      if (typeFilter === 'pagar') url += '&type=Cuenta por Pagar';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch debts');
      return res.json();
    },
  });

  const filteredGroups = useMemo(() => {
    return groupedDebts?.data?.filter((group: GroupedDebt) => {
      const matchesSearch = group.entityName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const isNotLiquidated = Math.abs(group.totalDebt) > 0.01;
      return matchesSearch && isNotLiquidated;
    });
  }, [groupedDebts, searchTerm]);

  const totals = useMemo(() => {
    const data = groupedDebts?.data || [];
    let cobrar = 0;
    let pagar = 0;

    data.forEach((group: GroupedDebt) => {
      group.debts.forEach((d: IDebt) => {
        const amount = Number(d.remainingBalance);
        if (d.type === 'Cuenta por Cobrar') cobrar += amount;
        else if (d.type === 'Cuenta por Pagar') pagar += amount;
      });
    });

    return { cobrar, pagar, net: cobrar - pagar };
  }, [groupedDebts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="debts-page">
      <div className="debts-page__container">
        {/* Modern Header */}
        <header className="debts-header">
          <div className="debts-header__content">
            <h1 className="debts-header__title">Deudas y Obligaciones</h1>
            <p className="debts-header__description">
              Control exhaustivo de sus activos y pasivos financieros.
            </p>
          </div>

          <div className="debts-header__actions">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/movements/crear')}
              className="debts-header__btn debts-header__btn--secondary"
            >
              <Plus className="debts-header__btn-icon" />
              Desde Movimiento
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="debts-header__btn debts-header__btn--primary"
            >
              <Wallet className="debts-header__btn-icon" />
              Nueva Deuda
            </Button>
          </div>
        </header>

        {/* Global Summary */}
        <section className="debts-summary">
          <div className="debts-summary__main">
            <div className="debts-summary__label">BALANCE NETO CONSOLIDADO</div>
            <div
              className={cn(
                'debts-summary__value',
                totals.net >= 0
                  ? 'debts-summary__value--positive'
                  : 'debts-summary__value--negative'
              )}
            >
              {formatCurrency(totals.net, 'COP')}
            </div>
            <div className="debts-summary__indicator">
              {totals.net >= 0 ? (
                <TrendingUp className="debts-summary__indicator-icon debts-summary__indicator-icon--positive" />
              ) : (
                <TrendingDown className="debts-summary__indicator-icon debts-summary__indicator-icon--negative" />
              )}
              <span>
                {totals.net >= 0 ? 'Superávit Financiero' : 'Déficit de Caja'}
              </span>
            </div>
          </div>

          <div className="debts-summary__details">
            <div className="debts-summary__stat debts-summary__stat--cobrar">
              <div className="debts-summary__stat-icon">
                <ArrowUpRight strokeWidth={3} />
              </div>
              <div>
                <span className="debts-summary__stat-label">Por Cobrar</span>
                <p className="debts-summary__stat-amount">
                  {formatCurrency(totals.cobrar, 'COP')}
                </p>
              </div>
            </div>

            <div className="debts-summary__stat debts-summary__stat--pagar">
              <div className="debts-summary__stat-icon">
                <ArrowDownRight strokeWidth={3} />
              </div>
              <div>
                <span className="debts-summary__stat-label">Por Pagar</span>
                <p className="debts-summary__stat-amount">
                  {formatCurrency(totals.pagar, 'COP')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters/Search */}
        <div className="debts-toolbar">
          <div className="debts-toolbar__search">
            <Search className="debts-toolbar__search-icon" />
            <Input
              placeholder="Buscar por nombre de entidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="debts-toolbar__input"
            />
          </div>

          <div className="debts-toolbar__filters">
            {(['all', 'cobrar', 'pagar'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTypeFilter(filter)}
                className={cn(
                  'debts-toolbar__filter-btn',
                  typeFilter === filter && 'debts-toolbar__filter-btn--active'
                )}
              >
                {filter === 'all'
                  ? 'Todos'
                  : filter === 'cobrar'
                    ? 'Por Cobrar'
                    : 'Por Pagar'}
              </button>
            ))}
            <div className="debts-toolbar__divider" />
            <Button variant="ghost" size="icon" className="debts-toolbar__action-btn">
              <Filter className="debts-toolbar__action-icon" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="debts-loader">
            <div className="debts-loader__spinner" />
            <p>Sincronizando flujos de deuda...</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="debts-grid"
          >
            <AnimatePresence mode="popLayout">
              {filteredGroups?.map((group: GroupedDebt) => {
                const isPositive = group.totalDebt >= 0;
                const absBalance = Math.abs(group.totalDebt);

                return (
                  <motion.div
                    key={group._id}
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/dashboard/debts/entity/${group._id}`}
                      className={cn(
                        'debt-card',
                        isPositive ? 'debt-card--cobrar' : 'debt-card--pagar'
                      )}
                    >
                      <Card className="debt-card__inner">
                        <CardContent className="debt-card__content">
                          <div className="debt-card__header">
                            <div
                              className={cn(
                                'debt-card__indicator',
                                isPositive
                                  ? 'debt-card__indicator--cobrar'
                                  : 'debt-card__indicator--pagar'
                              )}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="debt-card__indicator-icon" />
                              ) : (
                                <ArrowDownRight className="debt-card__indicator-icon" />
                              )}
                            </div>
                            <div className="debt-card__info">
                              <h3 className="debt-card__name">
                                {group.entityName}
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'debt-card__type-badge',
                                  isPositive ? 'debt-card__type-badge--cobrar' : 'debt-card__type-badge--pagar'
                                )}
                              >
                                {isPositive ? 'Por Cobrar' : 'Por Pagar'}
                              </Badge>
                            </div>
                          </div>

                          <div className="debt-card__body">
                            <div className="debt-card__balance">
                              <span className="debt-card__balance-label">
                                SALDO NETO
                              </span>
                              <div
                                className={cn(
                                  'debt-card__balance-value',
                                  isPositive
                                    ? 'debt-card__balance-value--positive'
                                    : 'debt-card__balance-value--negative'
                                )}
                              >
                                {isPositive ? '+' : '-'}
                                {formatCurrency(absBalance, 'COP')}
                              </div>
                            </div>
                          </div>

                          <div className="debt-card__footer">
                            <div className="debt-card__meta">
                              <LayoutGrid className="debt-card__meta-icon" />
                              <span>
                                {group.debtCount}{' '}
                                {group.debtCount === 1
                                  ? 'obligación'
                                  : 'obligaciones'}
                              </span>
                            </div>
                            <div className="debt-card__action">
                              <ChevronRight className="debt-card__action-icon" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && filteredGroups?.length === 0 && (
          <div className="debts-empty">
            <div className="debts-empty__visual">
              <Search className="debts-empty__icon" />
            </div>
            <h2 className="debts-empty__title">No se encontraron deudas</h2>
            <p className="debts-empty__text">
              {searchTerm
                ? `No hay resultados para "${searchTerm}"`
                : 'Todas las deudas han sido liquidadas.'}
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm('')}
                className="debts-empty__clear-btn"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}
      </div>

      <ManualDebtModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
