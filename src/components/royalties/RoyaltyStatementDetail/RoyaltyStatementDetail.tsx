'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Download,
  CheckCircle2,
  Undo2,
  Trash2,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { generateRoyaltyPDF } from '@/lib/royalties/pdfGenerator';
import { EditorialSettings } from '@/types/settings';
import { IRoyaltyLine, RoyaltyStatementStatus, BalanceFavor } from '@/types/royalty';
import { STATUS_META, FAVOR_META } from '../statusMeta';
import './RoyaltyStatementDetail.scss';

interface StatementDetail {
  _id: string;
  bookTitle: string;
  creatorName: string;
  creatorEmail?: string;
  creator?: { identification?: string };
  periodStart: string;
  periodEnd: string;
  royaltyPercentage: number;
  previousBalance: number;
  advancePayment: number;
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
  netSettlement: number;
  carryoverToNext: number;
  paidAmount: number;
  balanceInFavorOf: BalanceFavor;
  status: RoyaltyStatementStatus;
  notes?: string;
  generatedAt: string;
  approvedAt?: string;
  paidAt?: string;
  lines: IRoyaltyLine[];
}

export default function RoyaltyStatementDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [statement, setStatement] = useState<StatementDetail | null>(null);
  const [editorial, setEditorial] = useState<EditorialSettings | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/royalties/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setStatement(json.data);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al cargar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings/editorial');
        if (res.ok) setEditorial((await res.json()).data);
      } catch {
        /* opcional */
      }
    })();
  }, []);

  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    try {
      setBusy(true);
      const res = await fetch(`/api/royalties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setStatement(json.data);
      toast({ title: okMsg });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este borrador de liquidación?')) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/royalties/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error');
      }
      toast({ title: 'Liquidación eliminada' });
      router.push('/dashboard/royalties');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  const handlePay = async () => {
    await patch(
      { action: 'pay', amount: payAmount === '' ? undefined : Number(payAmount) },
      'Pago registrado'
    );
    setPayOpen(false);
    setPayAmount('');
  };

  const downloadPdf = () => {
    if (!statement) return;
    generateRoyaltyPDF(
      {
        ...statement,
        creatorIdentification: statement.creator?.identification,
      },
      editorial
    );
  };

  if (loading) return <p className="royalty-detail__loading">Cargando…</p>;
  if (!statement)
    return <p className="royalty-detail__loading">No encontrada.</p>;

  const s = statement;
  const statusMeta = STATUS_META[s.status];
  const favorMeta = FAVOR_META[s.balanceInFavorOf];
  const remaining = s.netSettlement - s.paidAmount;

  return (
    <div className="royalty-detail">
      {/* Barra de acciones */}
      <div className="royalty-detail__toolbar">
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        <div className="royalty-detail__toolbar-actions">
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="royalty-detail__icon" />
            Descargar PDF
          </Button>

          {s.status === 'draft' && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  patch({ action: 'regenerate' }, 'Liquidación recalculada')
                }
              >
                <RefreshCw className="royalty-detail__icon" />
                Recalcular
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  patch({ action: 'approve' }, 'Liquidación aprobada')
                }
              >
                <CheckCircle2 className="royalty-detail__icon" />
                Aprobar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={handleDelete}
              >
                <Trash2 className="royalty-detail__icon" />
                Eliminar
              </Button>
            </>
          )}

          {s.status === 'approved' && (
            <>
              {s.balanceInFavorOf === 'author' && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => setPayOpen((v) => !v)}
                >
                  <Wallet className="royalty-detail__icon" />
                  Registrar pago
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  patch({ action: 'revert' }, 'Aprobación revertida')
                }
              >
                <Undo2 className="royalty-detail__icon" />
                Revertir aprobación
              </Button>
            </>
          )}
        </div>
      </div>

      {payOpen && (
        <div className="royalty-detail__pay">
          <span>
            Saldo pendiente: <strong>{formatCurrency(remaining)}</strong>
          </span>
          <Input
            type="number"
            placeholder={`${remaining}`}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Button size="sm" disabled={busy} onClick={handlePay}>
            Confirmar pago
          </Button>
          <span className="royalty-detail__pay-hint">
            Déjalo vacío para pagar el total.
          </span>
        </div>
      )}

      {/* Documento */}
      <div className="royalty-detail__doc">
        <div className="royalty-detail__doc-head">
          <div>
            <h2 className="royalty-detail__doc-title">
              LIQUIDACIÓN DE REGALÍAS
            </h2>
            <p className="royalty-detail__editorial">
              {(editorial?.name || 'TANUKI SAS').toUpperCase()} · NIT{' '}
              {editorial?.nit || '901182452-4'}
            </p>
          </div>
        </div>

        <div className="royalty-detail__meta">
          <Row label="Liquidación a favor de" value={s.creatorName} />
          {s.creatorEmail && (
            <Row label="Correo electrónico" value={s.creatorEmail} />
          )}
          <Row label="Libro" value={s.bookTitle} />
          <Row
            label="Fecha"
            value={format(new Date(s.generatedAt), 'dd/MM/yyyy')}
          />
          <Row
            label="Período"
            value={`${format(new Date(s.periodStart), 'dd/MM/yyyy')} — ${format(
              new Date(s.periodEnd),
              'dd/MM/yyyy'
            )}`}
          />
          <Row
            label="Saldo de periodos anteriores"
            value={formatCurrency(s.previousBalance)}
          />
          <Row
            label="Porcentaje de regalías"
            value={`${s.royaltyPercentage}%`}
          />
        </div>

        <h3 className="royalty-detail__section-title">Ventas en papel</h3>
        <div className="royalty-detail__table-wrap">
          <table className="royalty-detail__table">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Ejemplares</th>
                <th>PVP</th>
                <th>Fecha</th>
                <th>Total facturado</th>
                <th>Total a liquidar</th>
              </tr>
            </thead>
            <tbody>
              {s.lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="royalty-detail__empty-cell">
                    Sin ventas en el período.
                  </td>
                </tr>
              ) : (
                s.lines.map((l) => (
                  <tr key={l.invoiceId}>
                    <td>{l.invoiceNumber}</td>
                    <td>{l.quantity}</td>
                    <td>{formatCurrency(l.pvp)}</td>
                    <td>{format(new Date(l.date), 'dd/MM/yyyy')}</td>
                    <td>{formatCurrency(l.totalInvoiced)}</td>
                    <td>{formatCurrency(l.totalRoyalty)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="royalty-detail__foot-label">TOTALES</td>
                <td>{s.totalCopies}</td>
                <td colSpan={3}></td>
                <td>{formatCurrency(s.totalRoyalties)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Resumen */}
        <div className="royalty-detail__summary">
          <SummaryRow
            label="Saldo de periodos anteriores"
            value={formatCurrency(s.previousBalance)}
          />
          <SummaryRow
            label="Regalías generadas"
            value={formatCurrency(s.totalRoyalties)}
          />
          <SummaryRow
            label="Anticipo"
            value={`- ${formatCurrency(s.advancePayment)}`}
          />
          <SummaryRow
            label="TOTAL A LIQUIDAR"
            value={formatCurrency(s.netSettlement)}
            strong
          />
          <div className="royalty-detail__favor">
            <Badge variant={favorMeta.variant}>{favorMeta.label}</Badge>
            {s.status !== 'draft' && s.balanceInFavorOf === 'author' && (
              <span className="royalty-detail__paid-info">
                Pagado: {formatCurrency(s.paidAmount)} · Pendiente:{' '}
                {formatCurrency(remaining)}
              </span>
            )}
          </div>
        </div>

        {/* Firma */}
        <div className="royalty-detail__signature">
          <p className="royalty-detail__sign-title">Recibido y aprobado:</p>
          <div className="royalty-detail__sign-line" />
          <p>Firma</p>
          <p>Nombre: {s.creatorName}</p>
          <p>Identificación: {s.creator?.identification || ''}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="royalty-detail__meta-row">
      <span className="royalty-detail__meta-label">{label}:</span>
      <span className="royalty-detail__meta-value">{value}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`royalty-detail__summary-row ${
        strong ? 'royalty-detail__summary-row--strong' : ''
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
