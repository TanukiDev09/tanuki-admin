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
import { RoyaltyComputation } from '@/types/royalty';
import { FAVOR_META, roleLabel } from '../statusMeta';
import './NewRoyaltyStatement.scss';

interface CreatorOption {
  _id: string;
  name: string;
}

type PreviewData = RoyaltyComputation & {
  creatorName: string;
  advanceSource: 'movements' | 'carryover' | 'none';
};

export default function NewRoyaltyStatement() {
  const router = useRouter();
  const { toast } = useToast();

  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [creatorId, setCreatorId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/royalties/creators');
        if (!res.ok) throw new Error();
        setCreators(await res.json());
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los creadores',
          variant: 'destructive',
        });
      }
    })();
  }, [toast]);

  const runPreview = useCallback(async () => {
    if (!creatorId || !periodStart || !periodEnd) {
      setPreview(null);
      return;
    }
    try {
      setLoadingPreview(true);
      const params = new URLSearchParams({ creatorId, periodStart, periodEnd });
      const res = await fetch(`/api/royalties/preview?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al calcular');
      setPreview(json.data);
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
  }, [creatorId, periodStart, periodEnd, toast]);

  useEffect(() => {
    const t = setTimeout(runPreview, 350);
    return () => clearTimeout(t);
  }, [runPreview]);

  const handleGenerate = async () => {
    if (!creatorId || !periodStart || !periodEnd) {
      toast({
        title: 'Faltan datos',
        description: 'Selecciona un creador y el período (desde/hasta).',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/royalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, periodStart, periodEnd }),
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

  const advanceNote = (p: PreviewData) =>
    p.advanceSource === 'movements'
      ? `Detectado en ${p.advanceBreakdown.length} movimiento(s) financiero(s).`
      : p.advanceSource === 'carryover'
        ? 'Ya aplicado en una liquidación anterior (incluido en el saldo anterior).'
        : 'Sin pagos al creador detectados en movimientos.';

  return (
    <div className="new-royalty">
      <Card className="new-royalty__form">
        <CardHeader>
          <CardTitle as="h2">Parámetros</CardTitle>
        </CardHeader>
        <CardContent className="new-royalty__grid">
          <div className="new-royalty__field new-royalty__field--full">
            <Label>Creador</Label>
            <Select value={creatorId} onValueChange={setCreatorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un creador" />
              </SelectTrigger>
              <SelectContent>
                {creators.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
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
              Selecciona un creador y un período para ver el cálculo.
            </p>
          ) : (
            <>
              <div className="new-royalty__summary">
                <div>
                  <span className="new-royalty__summary-label">Obras</span>
                  <strong>{preview.books.length}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">Ejemplares</span>
                  <strong>{preview.totalCopies}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">
                    Saldo anterior
                  </span>
                  <strong>{formatCurrency(preview.previousBalance)}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">
                    Regalías generadas
                  </span>
                  <strong>{formatCurrency(preview.totalRoyalties)}</strong>
                </div>
                <div>
                  <span className="new-royalty__summary-label">Anticipo</span>
                  <strong>{formatCurrency(preview.advancePayment)}</strong>
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

              <p className="new-royalty__hint">{advanceNote(preview)}</p>

              {preview.advanceBreakdown.length > 0 && (
                <div className="new-royalty__advances">
                  <h4 className="new-royalty__advances-title">
                    Anticipo detectado en movimientos financieros
                  </h4>
                  <ul className="new-royalty__advances-list">
                    {preview.advanceBreakdown.map((a) => (
                      <li key={a.movementId}>
                        <span>{format(new Date(a.date), 'dd/MM/yyyy')}</span>
                        <span>
                          {a.bookTitle ? `${a.bookTitle} · ` : ''}
                          {a.beneficiary || a.description}
                        </span>
                        <span>{formatCurrency(a.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.books.length === 0 ? (
                <p className="new-royalty__empty">
                  El creador no tuvo ventas en papel en el período seleccionado.
                </p>
              ) : (
                preview.books.map((b) => (
                  <div key={b.agreement} className="new-royalty__book">
                    <h4 className="new-royalty__book-title">
                      {b.bookTitle}{' '}
                      <span className="new-royalty__book-meta">
                        {roleLabel(b.role)} · {b.royaltyPercentage}% ·{' '}
                        {b.totalCopies} ej. · {formatCurrency(b.totalRoyalties)}
                      </span>
                    </h4>
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
                          {b.lines.map((l) => (
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
                  </div>
                ))
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
