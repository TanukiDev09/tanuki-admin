'use client';

import { useState } from 'react';
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
  FileText,
} from 'lucide-react';
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

  const entityData = debts?.data?.[0]?.entityId;
  const entityName =
    debts?.data?.[0]?.entityName || entityData?.name || 'Cargando...';
  const entityType = debts?.data?.[0]?.entityType;

  const summary = debts?.data?.reduce(
    (acc: { cobrar: number; pagar: number }, debt: IDebt) => {
      const amount = Number(debt.remainingBalance);
      if (debt.type === 'Cuenta por Cobrar') acc.cobrar += amount;
      else acc.pagar += amount;
      return acc;
    },
    { cobrar: 0, pagar: 0 }
  ) || { cobrar: 0, pagar: 0 };

  const filteredDebts = debts?.data?.filter(
    (debt: IDebt) =>
      debt.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.source.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pagado':
        return (
          <Badge className="entity-debts__badge entity-debts__badge--success">
            Pagado
          </Badge>
        );
      case 'Pagado Parcial':
        return (
          <Badge className="entity-debts__badge entity-debts__badge--warning">
            Parcial
          </Badge>
        );
      case 'Vencido':
        return (
          <Badge className="entity-debts__badge entity-debts__badge--danger">
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge className="entity-debts__badge entity-debts__badge--muted">
            Pendiente
          </Badge>
        );
    }
  };

  const netBalance = summary.cobrar - summary.pagar;

  return (
    <div className="entity-debts">
      <div className="entity-debts__container">
        {/* Dynamic Header */}
        <div className="entity-debts__header">
          <div className="entity-debts__header-left">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="entity-debts__back-btn"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="entity-debts__divider" />
            <div className="entity-debts__entity-info">
              <Badge variant="outline" className="entity-debts__entity-type">
                {entityType || 'Entidad'}
              </Badge>
              <h1 className="entity-debts__entity-name">{entityName}</h1>
            </div>
          </div>

          <div className="entity-debts__header-action">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="entity-debts__btn-primary"
            >
              <Plus className="w-5 h-5" />
              Registrar Obligación
            </Button>
          </div>
        </div>

        {/* Detail Summary Cards */}
        <div className="entity-debts__summary">
          <Card className="entity-debts__card">
            <CardContent className="entity-debts__card-content">
              <div className="entity-debts__card-icon entity-debts__card-icon--active">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="entity-debts__card-info">
                <p className="entity-debts__card-label">Activos Totales</p>
                <p className="entity-debts__card-value">
                  {formatCurrency(summary.cobrar, 'COP')}
                </p>
                <p className="entity-debts__card-sub entity-debts__card-sub--active">
                  Cuentas por cobrar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="entity-debts__card">
            <CardContent className="entity-debts__card-content">
              <div className="entity-debts__card-icon entity-debts__card-icon--passive">
                <TrendingDown className="w-7 h-7" />
              </div>
              <div className="entity-debts__card-info">
                <p className="entity-debts__card-label">Pasivos Totales</p>
                <p className="entity-debts__card-value">
                  {formatCurrency(summary.pagar, 'COP')}
                </p>
                <p className="entity-debts__card-sub entity-debts__card-sub--passive">
                  Cuentas por pagar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="entity-debts__card entity-debts__card--balance">
            <CardContent className="entity-debts__card-content">
              <div className="entity-debts__card-icon entity-debts__card-icon--balance">
                <Receipt className="w-7 h-7" />
              </div>
              <div className="entity-debts__card-info">
                <p className="entity-debts__card-label">Saldo de la Entidad</p>
                <p
                  className={cn(
                    'entity-debts__card-value',
                    netBalance >= 0
                      ? 'entity-debts__card-value--positive'
                      : 'entity-debts__card-value--negative'
                  )}
                >
                  {formatCurrency(Math.abs(netBalance), 'COP')}
                </p>
                <p className="entity-debts__card-sub">
                  {netBalance >= 0
                    ? 'A favor de la empresa'
                    : 'Saldo pendiente de pago'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <div className="entity-debts__history">
          <div className="entity-debts__history-header">
            <h2 className="entity-debts__history-title">
              <FileText className="w-6 h-6" />
              Historial de Documentos
            </h2>
            <div className="entity-debts__history-search">
              <Search className="entity-debts__history-search-icon" />
              <Input
                placeholder="Buscar por concepto o referencia..."
                className="entity-debts__history-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="entity-debts__history-list">
            {isLoading ? (
              <div className="entity-debts__loading">
                <div className="entity-debts__spinner">
                  <div className="entity-debts__spinner-track" />
                  <div className="entity-debts__spinner-thumb" />
                </div>
                <p className="entity-debts__loading-text">
                  Cargando transacciones...
                </p>
              </div>
            ) : filteredDebts?.length > 0 ? (
              <>
                {filteredDebts.map((debt: IDebt) => (
                  <div
                    key={debt._id}
                    onClick={() => router.push(`/dashboard/debts/${debt._id}`)}
                    className="entity-debts__item"
                  >
                    <div className="entity-debts__item-left">
                      <div
                        className={cn(
                          'entity-debts__item-icon',
                          debt.type === 'Cuenta por Cobrar'
                            ? 'entity-debts__item-icon--income'
                            : 'entity-debts__item-icon--expense'
                        )}
                      >
                        {debt.type === 'Cuenta por Cobrar' ? (
                          <TrendingUp className="w-6 h-6" />
                        ) : (
                          <TrendingDown className="w-6 h-6" />
                        )}
                      </div>
                      <div className="entity-debts__item-info">
                        <div className="entity-debts__item-title-group">
                          <h3 className="entity-debts__item-title">
                            {debt.notes || 'Documento sin descripción'}
                          </h3>
                          {getStatusBadge(debt.status)}
                        </div>
                        <div className="entity-debts__item-meta">
                          <span className="entity-debts__item-meta-item">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(debt.createdAt).toLocaleDateString()}
                          </span>
                          <span className="entity-debts__item-meta-item">
                            <FileText className="w-3.5 h-3.5" />
                            {debt.source.type}: {debt.source.reference}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="entity-debts__item-right">
                      <div className="entity-debts__item-balance">
                        <p className="entity-debts__item-balance-label">
                          Saldo Pendiente
                        </p>
                        <p
                          className={cn(
                            'entity-debts__item-balance-value',
                            Number(debt.remainingBalance) > 0
                              ? 'entity-debts__item-balance-value--unpaid'
                              : 'entity-debts__item-balance-value--paid'
                          )}
                        >
                          {formatCurrency(Number(debt.remainingBalance), 'COP')}
                        </p>
                      </div>
                      <div className="entity-debts__item-chevron">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="entity-debts__empty">
                <div className="entity-debts__empty-icon">
                  <Search className="w-10 h-10" />
                </div>
                <div className="entity-debts__empty-info">
                  <h3 className="entity-debts__empty-title">Historial vacío</h3>
                  <p className="entity-debts__empty-desc">
                    No se encontraron documentos registrados para esta entidad.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ManualDebtModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        entityId={entityId}
        entityType={entityType}
        entityName={entityName}
      />
    </div>
  );
}
