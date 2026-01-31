'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Search,
  Plus,
  Users,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
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

export default function DebtsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cobrar' | 'pagar'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  interface GroupedDebt {
    _id: string;
    entityName: string;
    entityType: string;
    totalDebt: number;
    debtCount: number;
    debts: IDebt[];
  }

  const { data: groupedDebts, isLoading } = useQuery({
    queryKey: ['debts', 'grouped', typeFilter],
    queryFn: async () => {
      let url = '/api/debts?grouped=true';
      if (typeFilter === 'cobrar') url += '&type=Cuenta por Cobrar';
      if (typeFilter === 'pagar') url += '&type=Cuenta por Pagar';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch debts');
      return res.json();
    }
  });

  const filteredGroups = groupedDebts?.data?.filter((group: GroupedDebt) =>
    group.entityName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCobrar = groupedDebts?.data
    ?.reduce((acc: number, g: GroupedDebt) => acc + g.debts
      .filter((d: IDebt) => d.type === 'Cuenta por Cobrar')
      .reduce((sum: number, d: IDebt) => sum + Number(d.remainingBalance), 0), 0) || 0;

  const totalPagar = groupedDebts?.data
    ?.reduce((acc: number, g: GroupedDebt) => acc + g.debts
      .filter((d: IDebt) => d.type === 'Cuenta por Pagar')
      .reduce((sum: number, d: IDebt) => sum + Number(d.remainingBalance), 0), 0) || 0;

  const netBalance = totalCobrar - totalPagar;

  return (
    <div className="debts-page">
      <div className="debts-page__container">

        {/* Modern Header */}
        <div className="debts-page__header">
          <div className="debts-page__header-info">
            <h1 className="debts-page__title">
              Deudas
            </h1>
            <p className="debts-page__subtitle">
              <LayoutGrid className="w-4 h-4" />
              Gestión centralizada de activos y pasivos
            </p>
          </div>

          <div className="debts-page__header-actions">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/movements/crear')}
              className="debts-page__btn debts-page__btn--outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Desde Movimiento
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="debts-page__btn debts-page__btn--primary"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Nueva Deuda
            </Button>
          </div>
        </div>

        {/* Unified Summary Header */}
        <section className="debts-page__summary">
          <div className="debts-page__summary-content">
            <div className="debts-page__summary-main">
              <Badge className="debts-page__summary-badge">
                BALANCE NETO
              </Badge>
              <div className="debts-page__summary-balance">
                <p className={cn(
                  "debts-page__summary-amount",
                  netBalance >= 0 ? "debts-page__summary-amount--positive" : "debts-page__summary-amount--negative"
                )}>
                  {formatCurrency(netBalance, 'COP')}
                </p>
                <p className="debts-page__summary-note">
                  Diferencia consolidada entre cuentas por cobrar y pagar
                </p>
              </div>
            </div>

            <div className="debts-page__summary-stats">
              <div className="debts-page__stat-item">
                <p className="debts-page__stat-label">Por Cobrar</p>
                <p className="debts-page__stat-value debts-page__stat-value--positive">{formatCurrency(totalCobrar, 'COP')}</p>
              </div>
              <div className="debts-page__stat-item">
                <p className="debts-page__stat-label">Por Pagar</p>
                <p className="debts-page__stat-value debts-page__stat-value--negative">{formatCurrency(totalPagar, 'COP')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Controls */}
        <div className="debts-page__controls">
          <div className="debts-page__search">
            <Search className="debts-page__search-icon" />
            <Input
              placeholder="Buscar entidad..."
              aria-label="Buscar entidad"
              className="debts-page__search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="debts-page__filters">
            {(['all', 'cobrar', 'pagar'] as const).map((filter) => (
              <Button
                key={filter}
                variant={typeFilter === filter ? 'default' : 'ghost'}
                onClick={() => setTypeFilter(filter)}
                className={cn(
                  "debts-page__filter-btn",
                  typeFilter === filter ? "debts-page__filter-btn--active" : "debts-page__filter-btn--ghost"
                )}
              >
                {filter === 'all' ? 'Ver Todos' : filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Dynamic Content */}
        {isLoading ? (
          <div className="debts-page__loading">
            <div className="debts-page__spinner">
              <div className="debts-page__spinner-track" />
              <div className="debts-page__spinner-thumb" />
            </div>
            <p className="debts-page__loading-text">Consultando Registros...</p>
          </div>
        ) : filteredGroups?.length > 0 ? (
          <div className="debts-page__grid">
            {filteredGroups.map((group: GroupedDebt) => (
              <Link
                key={group._id}
                href={`/dashboard/debts/entity/${group._id}`}
                className="group relative"
              >
                <Card className="debts-page__entity-card">
                  <CardContent className="debts-page__entity-content">
                    <div className="debts-page__entity-header">
                      <div className={cn(
                        "debts-page__entity-icon",
                        group.entityType === 'Proveedor'
                          ? "debts-page__entity-icon--supplier"
                          : "debts-page__entity-icon--customer"
                      )}>
                        <Users className="w-8 h-8" />
                      </div>
                      <div className="debts-page__entity-info">
                        <h2 className="debts-page__entity-name">
                          {group.entityName || 'Entidad'}
                        </h2>
                        <Badge variant="outline" className="debts-page__entity-badge">
                          {group.entityType}
                        </Badge>
                      </div>
                    </div>

                    <div className="debts-page__entity-footer">
                      <div className="debts-page__entity-balance">
                        <p className="debts-page__entity-balance-label">Saldo Neto</p>
                        <p className={cn(
                          "debts-page__entity-balance-value",
                          group.totalDebt >= 0 ? "debts-page__entity-balance-value--positive" : "debts-page__entity-balance-value--negative"
                        )}>
                          {formatCurrency(Math.abs(group.totalDebt), 'COP')}
                        </p>
                      </div>

                      <div className="debts-page__entity-meta">
                        <span className="debts-page__entity-count">
                          {group.debtCount} {group.debtCount === 1 ? 'Obligación' : 'Obligaciones'}
                        </span>
                        <div className="debts-page__entity-link">
                          DETALLES
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="debts-page__empty">
            <div className="debts-page__empty-icon">
              <Search className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="debts-page__empty-title">Sin coincidencias</h3>
              <p className="debts-page__empty-desc">
                {searchTerm
                  ? `No encontramos nada para "${searchTerm}"`
                  : 'Empieza registrando una nueva deuda para visualizar aquí.'}
              </p>
            </div>
          </div>
        )}

        {/* Mobile FAB Integration */}
        <div className="debts-page__fab">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="debts-page__fab-btn"
          >
            <Plus className="debts-page__fab-icon" />
          </Button>
        </div>
      </div>

      <ManualDebtModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
