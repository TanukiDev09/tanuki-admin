'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Receipt,
  Plus,
  TrendingDown,
  TrendingUp,
  Search,
  ChevronRight,
  Calendar,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IDebt } from '@/types/debt';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ManualDebtModal } from '@/components/finance/ManualDebtModal';

import './entity-debts-page.scss';

export default function EntityDebtsPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts', 'entity', entityId],
    queryFn: async () => {
      const res = await fetch(`/api/debts?entityId=${entityId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const entityData = useMemo(() => {
    return {
      name:
        debts?.data?.[0]?.entityName ||
        debts?.data?.[0]?.entityId?.name ||
        'Cargando...',
      type: debts?.data?.[0]?.entityType || 'Entidad',
    };
  }, [debts]);

  const summary = useMemo(() => {
    return (
      debts?.data?.reduce(
        (acc: { cobrar: number; pagar: number }, debt: IDebt) => {
          const amount = Number(debt.remainingBalance);
          if (debt.type === 'Cuenta por Cobrar') acc.cobrar += amount;
          else acc.pagar += amount;
          return acc;
        },
        { cobrar: 0, pagar: 0 }
      ) || { cobrar: 0, pagar: 0 }
    );
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return debts?.data?.filter(
      (debt: IDebt) =>
        debt.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.source.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [debts, searchTerm]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      Pagado: { label: 'Liquidado', class: 'status-badge--success' },
      'Pagado Parcial': {
        label: 'Pago Parcial',
        class: 'status-badge--warning',
      },
      Vencido: { label: 'Vencido', class: 'status-badge--danger' },
      Pendiente: { label: 'Pendiente', class: 'status-badge--info' },
    };

    const config = statusMap[status] || statusMap['Pendiente'];
    return (
      <Badge variant="outline" className={cn('status-badge', config.class)}>
        {config.label}
      </Badge>
    );
  };

  const netBalance = summary.cobrar - summary.pagar;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="entity-debts">
      <div className="entity-debts__container">
        {/* Modern Nav-Header */}
        <header className="entity-header">
          <div className="entity-header__breadcrumb">
            <button
              onClick={() => router.push('/dashboard/debts')}
              className="entity-header__back"
            >
              <ArrowLeft className="entity-header__back-icon" />
              <span>Volver a Deudas</span>
            </button>
          </div>

          <div className="entity-header__main">
            <div className="entity-header__info">
              <div className="entity-header__icon">
                <Building2 className="entity-header__icon-svg" />
              </div>
              <div className="entity-header__text">
                <div className="entity-header__type-wrapper">
                  <Badge variant="outline" className="entity-header__type">
                    {entityData.type}
                  </Badge>
                </div>
                <h1 className="entity-header__name">{entityData.name}</h1>
              </div>
            </div>

            <div className="entity-header__actions">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="entity-header__btn-primary"
              >
                <Plus className="entity-header__btn-icon" />
                Registrar Obligación
              </Button>
            </div>
          </div>
        </header>

        {/* Financial Highlights */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="entity-stats"
        >
          <motion.div variants={itemVariants}>
            <Card className="stat-card stat-card--income">
              <CardContent className="stat-card__content">
                <div className="stat-card__header">
                  <div className="stat-card__icon-box">
                    <TrendingUp className="stat-card__icon" />
                  </div>
                  <span className="stat-card__label">Activos (Por Cobrar)</span>
                </div>
                <div className="stat-card__value">
                  {formatCurrency(summary.cobrar, 'COP')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="stat-card stat-card--expense">
              <CardContent className="stat-card__content">
                <div className="stat-card__header">
                  <div className="stat-card__icon-box">
                    <TrendingDown className="stat-card__icon" />
                  </div>
                  <span className="stat-card__label">Pasivos (Por Pagar)</span>
                </div>
                <div className="stat-card__value">
                  {formatCurrency(summary.pagar, 'COP')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card
              className={cn(
                'stat-card stat-card--balance',
                netBalance >= 0 ? 'stat-card--positive' : 'stat-card--negative'
              )}
            >
              <CardContent className="stat-card__content">
                <div className="stat-card__header">
                  <div className="stat-card__icon-box">
                    <Receipt className="stat-card__icon" />
                  </div>
                  <span className="stat-card__label">Saldo Consolidado</span>
                </div>
                <div className="stat-card__value">
                  {formatCurrency(Math.abs(netBalance), 'COP')}
                </div>
                <div className="stat-card__indicator">
                  {netBalance >= 0
                    ? 'A favor de la empresa'
                    : 'Pendiente de pago'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* History / Transactions */}
        <div className="entity-history">
          <div className="entity-history__filters">
            <div className="entity-history__search">
              <Search className="entity-history__search-icon" />
              <Input
                placeholder="Filtrar por concepto o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="entity-history__search-input"
              />
            </div>
          </div>

          <div className="history-list">
            <div className="history-list__header">
              <div className="history-list__column">DOCUMENTO</div>
              <div className="history-list__column history-list__column--hide-mobile">
                FECHA
              </div>
              <div className="history-list__column history-list__column--right">
                BALANCE PENDIENTE
              </div>
              <div className="history-list__column history-list__column--action" />
            </div>

            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="history-list__loading">
                  <div className="history-list__spinner" />
                  <p>Escaneando registros contables...</p>
                </div>
              ) : filteredDebts?.length > 0 ? (
                filteredDebts.map((debt: IDebt) => (
                  <motion.div
                    key={debt._id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="history-row"
                    onClick={() => router.push(`/dashboard/debts/${debt._id}`)}
                  >
                    <div className="history-row__main">
                      <div
                        className={cn(
                          'history-row__type-indicator',
                          debt.type === 'Cuenta por Cobrar'
                            ? 'history-row__type-indicator--cobrar'
                            : 'history-row__type-indicator--pagar'
                        )}
                      >
                        {debt.type === 'Cuenta por Cobrar' ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )}
                      </div>
                      <div className="history-row__info">
                        <div className="history-row__title-group">
                          <span className="history-row__title">
                            {debt.notes || 'Sin concepto'}
                          </span>
                          {getStatusBadge(debt.status)}
                        </div>
                        <div className="history-row__meta">
                          <span>
                            {debt.source.type}: {debt.source.reference}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="history-row__date history-row__date--hide-mobile">
                      <Calendar className="history-row__date-icon" />
                      {new Date(debt.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>

                    <div className="history-row__price">
                      {formatCurrency(Number(debt.remainingBalance), 'COP')}
                    </div>

                    <div className="history-row__action">
                      <ChevronRight className="history-row__action-icon" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="history-list__empty">
                  <Search className="history-list__empty-icon" />
                  <p>No se encontraron registros activos</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ManualDebtModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        entityId={entityId}
        entityType={entityData.type}
        entityName={entityData.name}
      />
    </div>
  );
}
