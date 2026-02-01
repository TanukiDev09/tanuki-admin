'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Receipt,
  Calendar,
  DollarSign,
  User,
  History,
  ArrowRight,
  Info,
  ChevronRight,
  CreditCard,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ManualDebtModal } from '@/components/finance/ManualDebtModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

import './debt-detail.scss';

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const debtId = params.id as string;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: debtResponse, isLoading } = useQuery({
    queryKey: ['debt', debtId],
    queryFn: async () => {
      const res = await fetch(`/api/debts/${debtId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const { data: movementsResponse } = useQuery({
    queryKey: ['movements', 'debt', debtId],
    queryFn: async () => {
      const res = await fetch(`/api/finance/movements?debtId=${debtId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const debt = debtResponse?.data;
  const movements = movementsResponse?.data || [];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/debts/${debtId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar la deuda');
      }

      toast({
        title: 'Deuda eliminada',
        description: 'La obligación ha sido removida del sistema.',
      });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      router.push('/dashboard/debts');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al eliminar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <Zap className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-black tracking-widest uppercase text-[10px]">
            Sincronizando balances...
          </p>
        </div>
      </div>
    );

  if (!debt)
    return (
      <div className="p-20 text-center bg-slate-50 min-h-screen">
        <div className="bg-white p-12 rounded-[2rem] shadow-xl inline-flex flex-col items-center gap-4 max-w-md border border-slate-200">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mb-2">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Registro no encontrado
          </h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            Lo sentimos, no pudimos localizar la deuda solicitada.
          </p>
          <Button
            variant="default"
            onClick={() => router.push('/dashboard/debts')}
            className="mt-6 h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 transition-all shadow-xl font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al listado
          </Button>
        </div>
      </div>
    );

  const totalAmount = Number(debt.totalAmount || 0);
  const paidAmount = Number(debt.paidAmount || 0);
  const remainingBalance = Number(debt.remainingBalance || 0);
  const paidPercentage =
    totalAmount > 0
      ? Math.min(100, Math.max(0, (paidAmount / totalAmount) * 100))
      : 0;
  const isPaid = debt.status === 'Pagado';
  const isOverdue =
    !isPaid && debt.dueDate && new Date(debt.dueDate) < new Date();

  return (
    <div className="debt-detail">
      {/* Header Navigation */}
      <div className="debt-detail__header">
        <div className="debt-detail__header-container">
          <div className="debt-detail__header-info">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-900" />
            </Button>
            <div>
              <h1 className="debt-detail__header-title">
                {debt.notes || 'Detalle de Deuda'}
              </h1>
              <p className="debt-detail__header-subtitle">
                {debt.type} • ID: {debtId.slice(-6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPaid ? (
              <Badge className="bg-emerald-600 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-tight shadow-lg shadow-emerald-100">
                LIQUIDADO
              </Badge>
            ) : isOverdue ? (
              <Badge
                variant="destructive"
                className="bg-rose-600 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-tight shadow-lg shadow-rose-100"
              >
                VENCIDO
              </Badge>
            ) : (
              <Badge className="bg-amber-600 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-tight shadow-lg shadow-amber-100">
                PENDIENTE
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="debt-detail__container">
        {/* Main Column */}
        <div className="space-y-8">
          {/* Hero Balance Section */}
          <div className="debt-detail__hero">
            <div className="relative z-10">
              <div className="debt-detail__hero-label-badge">
                <Clock className="w-3 h-3" /> Estado de Cuenta
              </div>
              <p className="debt-detail__hero-balance-label">
                Saldo por Liquidar
              </p>
              <h2 className="debt-detail__hero-balance-value">
                {formatCurrency(remainingBalance, debt.currency || 'COP')}
              </h2>

              <div className="debt-detail__hero-stats">
                <div className="debt-detail__hero-stat-item">
                  <p className="debt-detail__hero-stat-label">Valor Original</p>
                  <p className="debt-detail__hero-stat-value">
                    {formatCurrency(totalAmount, debt.currency || 'COP')}
                  </p>
                </div>
                <div className="w-[1px] h-10 bg-slate-200 hidden sm:block" />
                <div className="debt-detail__hero-stat-item">
                  <p className="debt-detail__hero-stat-label">Total Pagado</p>
                  <p className="debt-detail__hero-stat-value debt-detail__hero-stat-value--positive">
                    {formatCurrency(paidAmount, debt.currency || 'COP')}
                  </p>
                </div>
              </div>

              <div className="debt-detail__hero-progress">
                <div className="debt-detail__hero-progress-header">
                  <span>Progreso de Pago</span>
                  <span>{paidPercentage.toFixed(1)}%</span>
                </div>
                <div className="debt-detail__hero-progress-bar-bg">
                  <div
                    className="debt-detail__hero-progress-bar-fill"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Details Grid */}
          <div className="debt-detail__info-grid">
            <div className="debt-detail__info-card">
              <div className="debt-detail__info-icon-wrapper debt-detail__info-icon-wrapper--indigo">
                <Receipt className="w-7 h-7" />
              </div>
              <div className="debt-detail__info-content">
                <div>
                  <h3 className="debt-detail__info-label">
                    Concepto del Documento
                  </h3>
                  <p className="debt-detail__info-value">
                    {debt.notes || 'Sin descripción'}
                  </p>
                </div>
                <div className="debt-detail__info-subgrid">
                  <div>
                    <p className="debt-detail__info-label">Tipo</p>
                    <p className="text-sm font-black text-slate-900">
                      {debt.type}
                    </p>
                  </div>
                  <div>
                    <p className="debt-detail__info-label">Referencia</p>
                    <p className="text-sm font-black text-slate-900 truncate">
                      {debt.source.reference}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="debt-detail__info-card">
              <div className="debt-detail__info-icon-wrapper debt-detail__info-icon-wrapper--amber">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="debt-detail__info-content">
                <div>
                  <h3 className="debt-detail__info-label">Fecha de Creación</h3>
                  <p className="debt-detail__info-value">
                    {new Date(debt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="debt-detail__info-subgrid">
                  <div>
                    <p className="debt-detail__info-label">Vencimiento</p>
                    <p
                      className={cn(
                        'text-sm font-black',
                        isOverdue ? 'text-rose-600' : 'text-slate-900'
                      )}
                    >
                      {debt.dueDate
                        ? new Date(debt.dueDate).toLocaleDateString()
                        : 'Indefinida'}
                    </p>
                  </div>
                  {isOverdue && (
                    <div className="flex items-end">
                      <Badge
                        variant="destructive"
                        className="h-6 text-[9px] rounded-lg px-2 font-black uppercase"
                      >
                        Urgente
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="debt-detail__timeline-header">
            <div className="debt-detail__timeline-icon-box">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h2 className="debt-detail__timeline-title">
                Historial de Transacciones
              </h2>
              <p className="debt-detail__timeline-subtitle">
                Cronología completa de abonos y débitos
              </p>
            </div>
          </div>

          {movements.length > 0 ? (
            <div className="debt-detail__timeline-container">
              {movements.map(
                (mov: {
                  _id: string;
                  type: string;
                  description?: string;
                  paymentChannel?: string;
                  date: Date | string;
                  amount: number;
                  currency?: string;
                }) => (
                  <div
                    key={mov._id}
                    className={cn(
                      'debt-detail__timeline-item',
                      mov.type === 'Ingreso'
                        ? 'debt-detail__timeline-item--income'
                        : 'debt-detail__timeline-item--expense'
                    )}
                    onClick={() =>
                      router.push(`/dashboard/movements/${mov._id}`)
                    }
                  >
                    <div className="debt-detail__movement-card">
                      <div className="debt-detail__movement-main">
                        <div
                          className={cn(
                            'debt-detail__movement-icon',
                            mov.type === 'Ingreso'
                              ? 'debt-detail__movement-icon--income'
                              : 'debt-detail__movement-icon--expense'
                          )}
                        >
                          {mov.type === 'Ingreso' ? (
                            <ArrowRight className="w-7 h-7" />
                          ) : (
                            <ArrowLeft className="w-7 h-7" />
                          )}
                        </div>
                        <div className="debt-detail__movement-info">
                          <div className="flex items-center gap-3">
                            <h5 className="debt-detail__movement-title">
                              {mov.description || 'Movimiento de pago'}
                            </h5>
                            <Badge className="bg-slate-100 text-slate-800 text-[9px] font-black px-2 py-0.5 rounded-lg border-none">
                              {mov.paymentChannel || 'EFECTIVO'}
                            </Badge>
                          </div>
                          <div className="debt-detail__movement-meta">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(mov.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={cn(
                            'debt-detail__movement-amount',
                            mov.type === 'Ingreso'
                              ? 'debt-detail__movement-amount--income'
                              : 'debt-detail__movement-amount--expense'
                          )}
                        >
                          {mov.type === 'Ingreso' ? '+' : '-'}
                          {formatCurrency(mov.amount, mov.currency || 'COP')}
                        </p>
                        <div className="debt-detail__movement-status">
                          Confirmado <div className="debt-detail__status-dot" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <History className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Sin historial de pagos
              </h3>
              <p className="text-slate-500 font-medium mt-2">
                Aún no se han detectado abonos vinculados a esta cuenta.
              </p>
              {!isPaid && (
                <Button
                  variant="default"
                  className="mt-8 rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold"
                  asChild
                >
                  <Link
                    href={`/dashboard/movements/crear?debtId=${debtId}&amount=${remainingBalance}`}
                  >
                    <Zap className="w-4 h-4 mr-2" /> Iniciar Plan de Pago{' '}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="debt-detail__sidebar">
          <div className="debt-detail__account-card">
            <div className="debt-detail__account-avatar">
              <User className="w-10 h-10" />
            </div>
            <h4 className="debt-detail__account-name">
              {debt.entityName || debt.entityId?.name || 'Consultar Entidad'}
            </h4>
            <Link
              href={`/dashboard/debts/entity/${debt.entityId?._id || debt.entityId}`}
              className="debt-detail__account-link"
            >
              Ver Perfil Completo <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <div className="debt-detail__sidebar-actions">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-indigo-100 transition-all duration-300 transform hover:-translate-y-1"
                asChild
              >
                <Link
                  href={`/dashboard/movements/crear?debtId=${debtId}&amount=${remainingBalance}&type=${debt.type === 'Cuenta por Cobrar' ? 'Ingreso' : 'Egreso'}`}
                >
                  <DollarSign className="w-5 h-5 mr-2" /> Registrar Pago{' '}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <div className="debt-detail__secondary-actions">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100 font-bold"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Borrar
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Recursos Relacionados
            </p>
            <div className="space-y-3">
              {debt.source.type === 'Invoice' && (
                <Button
                  variant="outline"
                  className="w-full justify-between h-14 rounded-2xl hover:bg-slate-50 border-slate-200 px-6 font-black text-slate-700"
                  asChild
                >
                  <Link href={`/dashboard/invoices/${debt.source.id}`}>
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-indigo-600" />
                      <span>Ver Factura</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-between h-14 rounded-2xl hover:bg-slate-50 border-slate-200 px-6 font-black text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <span>Imprimir Estado</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ManualDebtModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingDebtId={debtId}
        defaultAmount={totalAmount}
        defaultNotes={debt.notes}
        defaultType={debt.type}
        defaultCurrency={debt.currency}
        entityId={debt.entityId?._id || debt.entityId}
        entityType={debt.entityType}
        entityName={debt.entityName}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-white p-10 space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-4 text-rose-600 mb-2">
                <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    Confirmar Eliminación
                  </DialogTitle>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                    Acción Irreversible
                  </p>
                </div>
              </div>
              <DialogDescription className="text-slate-600 font-medium text-base leading-relaxed pt-4">
                ¿Estás completamente seguro de que deseas eliminar esta deuda?
                Esta operación retirará la obligación de los balances
                consolidados.
                {paidAmount > 0 && (
                  <div className="mt-4 p-5 bg-amber-50 text-amber-900 rounded-2xl text-sm font-bold border border-amber-100">
                    ADVERTENCIA: Esta deuda ya cuenta con pagos registrados.
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-col gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full h-14 rounded-2xl text-white bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 font-black"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="w-full h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
