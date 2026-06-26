'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { RoyaltyComputation, IAdvanceBreakdownLine } from '@/types/royalty';
import { FAVOR_META } from '../statusMeta';
import './NewRoyaltyStatement.scss';

interface AgreementOption {
  _id: string;
  role: string;
  royaltyPercentage: number;
  book?: { _id: string; title: string };
  creator?: { _id: string; name: string };
}

type PreviewData = RoyaltyComputation & {
  bookTitle: string;
  creatorName: string;
  defaultPreviousBalance: number;
  defaultAdvancePayment: number;
  advanceBreakdown: IAdvanceBreakdownLine[];
  advanceSource: 'movements' | 'carryover' | 'none';
};

const roleLabel = (role: string) =>
  role === 'author'
    ? 'Autor'
    : role === 'illustrator'
      ? 'Ilustrador'
      : 'Traductor';

export default function NewRoyaltyStatement() {
  const router = useRouter();
  const { toast } = useToast();

  const [agreements, setAgreements] = useState<AgreementOption[]>([]);
  const [agreementId, setAgreementId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [previousBalance, setPreviousBalance] = useState<string>('');
  const [advancePayment, setAdvancePayment] = useState<string>('');
  const [touchedOverrides, setTouchedOverrides] = useState(false);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar contratos
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agreements');
        if (!res.ok) throw new Error();
        setAgreements(await res.json());
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los contratos',
          variant: 'destructive',
        });
      }
    })();
  }, [toast]);

  const runPreview = useCallback(async () => {
    if (!agreementId || !periodStart || !periodEnd) {
      setPreview(null);
      return;
    }
    try {
      setLoadingPreview(true);
      const params = new URLSearchParams({
        agreementId,
        periodStart,
        periodEnd,
      });
      if (touchedOverrides) {
        if (previousBalance !== '') params.set('previousBalance', previousBalance);
        if (advancePayment !== '') params.set('advancePayment', advancePayment);
      }
      const res = await fetch(`/api/royalties/preview?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al calcular');
      setPreview(json.data);
      // Prefill overrides con los defaults sugeridos (solo si el usuario no los tocó)
      if (!touchedOverrides) {
        setPreviousBalance(String(json.data.defaultPreviousBalance ?? 0));
        setAdvancePayment(String(json.data.defaultAdvancePayment ?? 0));
      }
    } catch (err) {
      setPreview(null);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al calcular',
        variant: 'destructive',
      });
    } finally {
      setLoadingPreview(false);
    }
  }, [
    agreementId,
    periodStart,
    periodEnd,
    previousBalance,
    advancePayment,
    touchedOverrides,
    toast,
  ]);

  // Recalcular cuando cambian contrato/fechas/overrides
  useEffect(() => {
    const t = setTimeout(runPreview, 350);
    return () => clearTimeout(t);
  }, [runPreview]);

  const handleGenerate = async () => {
    if (!agreementId || !periodStart || !periodEnd) {
      toast({
        title: 'Faltan datos',
        description: 'Selecciona un contrato y el período (desde/hasta).',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/royalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId,
          periodStart,
          periodEnd,
          previousBalance: touchedOverrides ? Number(previousBalance) : undefined,
          advancePayment: touchedOverrides ? Number(advancePayment) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al generar');
      toast({ title: 'Liquidación generada', description: 'Borrador creado.' });
      router.push(`/dashboard/royalties/${json.data._id}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al generar',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onOverrideChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTouchedOverrides(true);
      setter(e.target.value);
    };

  return (
    <div className="new-royalty">
      <Card className="new-royalty__form">
        <CardHeader>
          <CardTitle as="h2">Parámetros</CardTitle>
        </CardHeader>
        <CardContent className="new-royalty__grid">
          <div className="new-royalty__field new-royalty__field--full">
            <Label>Contrato (libro · autor)</Label>
            <Select value={agreementId} onValueChange={setAgreementId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un contrato" />
              </SelectTrigger>
              <SelectContent>
                {agreements.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.book?.title || 'Libro'} · {a.creator?.name || 'Autor'} (
                    {roleLabel(a.role)}, {a.royaltyPercentage}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="new-royalty__field">
            <Label>Desde</Label>
            <Input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div className="new-royalty__field">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>

          <div className="new-royalty__field">
            <Label>Saldo de periodos anteriores</Label>
            <Input
              type="number"
              value={previousBalance}
              onChange={onOverrideChange(setPreviousBalance)}
              placeholder="0"
            />
          </div>
          <div className="new-royalty__field">
            <Label>Anticipo</Label>
            <Input
              type="number"
              value={advancePayment}
              onChange={onOverrideChange(setAdvancePayment)}
              placeholder="0"
            />
            {preview && !touchedOverrides && (
              <span className="new-royalty__hint">
                {preview.advanceSource === 'movements'
                  ? `Detectado automáticamente en ${preview.advanceBreakdown.length} movimiento(s) financiero(s).`
                  : preview.advanceSource === 'carryover'
                    ? 'Ya aplicado en una liquidación anterior (ver saldo anterior).'
                    : 'No se hallaron pagos al creador para este libro en los movimientos.'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="new-royalty__preview">
        <CardHeader className="new-royalty__preview-header">
          <CardTitle as="h2">Previsualización</CardTitle>
          {loadingPreview && (
            <Loader2 className="new-royalty__spinner" aria-label="Calculando" />
          )}
        </CardHeader>
        <CardContent>
          {!preview ? (
            <p className="new-royalty__empty">
              Selecciona un contrato y un período para ver el cálculo.
            </p>
          ) : (
            <>
              <div className="new-royalty__summary">
                <div>
                  <span className="new-royalty__summary-label">Ejemplares</span>
                  <strong>{preview.totalCopies}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">Facturas</span>
                  <strong>{preview.lines.length}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">
                    Regalías generadas
                  </span>
                  <strong>{formatCurrency(preview.totalRoyalties)}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">
                    Total a liquidar
                  </span>
                  <strong>{formatCurrency(preview.netSettlement)}</strong>
                </div>
                <div>
                  <Badge variant={FAVOR_META[preview.balanceInFavorOf].variant}>
                    {FAVOR_META[preview.balanceInFavorOf].label}
                  </Badge>
                </div>
              </div>

              {preview.advanceBreakdown.length > 0 && (
                <div className="new-royalty__advances">
                  <h4 className="new-royalty__advances-title">
                    Anticipo detectado en movimientos financieros
                  </h4>
                  <ul className="new-royalty__advances-list">
                    {preview.advanceBreakdown.map((a) => (
                      <li key={a.movementId}>
                        <span>{format(new Date(a.date), 'dd/MM/yyyy')}</span>
                        <span>{a.beneficiary || a.description}</span>
                        <span>{formatCurrency(a.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.lines.length === 0 ? (
                <p className="new-royalty__empty">
                  No hay ventas en papel para este libro en el período
                  seleccionado.
                </p>
              ) : (
                <div className="new-royalty__table-wrap">
                  <table className="new-royalty__table">
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
                      {preview.lines.map((l) => (
                        <tr key={l.invoiceId}>
                          <td>{l.invoiceNumber}</td>
                          <td>{l.quantity}</td>
                          <td>{formatCurrency(l.pvp)}</td>
                          <td>{format(new Date(l.date), 'dd/MM/yyyy')}</td>
                          <td>{formatCurrency(l.totalInvoiced)}</td>
                          <td>{formatCurrency(l.totalRoyalty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="new-royalty__actions">
                <Button
                  onClick={handleGenerate}
                  disabled={submitting || loadingPreview}
                >
                  {submitting ? 'Generando…' : 'Generar liquidación (borrador)'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
