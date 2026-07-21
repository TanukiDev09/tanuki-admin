'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

interface StatementLine {
  invoiceNumber: string;
  date: string;
  quantity: number;
  pvp: number;
  totalInvoiced: number;
  totalRoyalty: number;
}

interface StatementBook {
  bookTitle: string;
  role: string;
  royaltyPercentage: number;
  lines: StatementLine[];
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
}

interface RoyaltyStatementDetail {
  _id: string;
  creatorName: string;
  periodStart: string;
  periodEnd: string;
  books: StatementBook[];
  previousBalance: number;
  advancePayment: number;
  totalCopies: number;
  totalInvoiced: number;
  totalRoyalties: number;
  netSettlement: number;
  carryoverToNext: number;
  balanceInFavorOf: 'author' | 'editorial';
  status: 'draft' | 'approved' | 'paid';
  paidAmount: number;
  currency: string;
  generatedAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  author: 'Autor',
  translator: 'Traductor',
  illustrator: 'Ilustrador',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  approved: 'Aprobada',
  paid: 'Pagada',
};

const STATUS_VARIANT: Record<string, 'secondary' | 'success' | 'outline'> = {
  draft: 'secondary',
  approved: 'outline',
  paid: 'success',
};

function formatCOP(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
}

export default function RoyaltyStatementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [statement, setStatement] = useState<RoyaltyStatementDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.ROYALTY_STATEMENTS,
    PermissionAction.UPDATE
  );

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/royalty-statements/${id}`);
      if (!res.ok) throw new Error('Liquidación no encontrada');
      const data = await res.json();
      setStatement(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la liquidación',
        variant: 'destructive',
      });
      router.push('/dashboard/royalty-statements');
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/royalty-statements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      await fetchStatement();
      toast({ title: 'Estado actualizado correctamente' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse text-gray-400">Cargando...</div>
    );
  }

  if (!statement) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[statement.status] ?? 'outline'}>
            {STATUS_LABEL[statement.status] ?? statement.status}
          </Badge>
          {canUpdate && statement.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('approved')}
            >
              Aprobar
            </Button>
          )}
          {canUpdate && statement.status === 'approved' && (
            <Button size="sm" onClick={() => handleStatusChange('paid')}>
              Marcar como pagada
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">{statement.creatorName}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Período:{' '}
          {new Date(statement.periodStart).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
          })}{' '}
          —{' '}
          {new Date(statement.periodEnd).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Copias totales', value: statement.totalCopies.toString() },
          { label: 'Total facturado', value: formatCOP(statement.totalInvoiced) },
          { label: 'Total regalías', value: formatCOP(statement.totalRoyalties) },
          {
            label: 'Liquidación neta',
            value: formatCOP(statement.netSettlement),
            highlight: true,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-4 ${item.highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {item.label}
            </p>
            <p
              className={`text-xl font-bold mt-1 ${item.highlight ? 'text-blue-700' : ''}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Saldo anterior y arrastre */}
      {(statement.previousBalance !== 0 || statement.carryoverToNext !== 0) && (
        <div className="rounded-lg border border-gray-200 p-4 text-sm space-y-1">
          {statement.previousBalance !== 0 && (
            <p>
              <span className="text-gray-500">Saldo anterior:</span>{' '}
              <span className="font-medium">
                {formatCOP(statement.previousBalance)}
              </span>{' '}
              a favor del{' '}
              {statement.balanceInFavorOf === 'author' ? 'autor' : 'la editorial'}
            </p>
          )}
          {statement.advancePayment !== 0 && (
            <p>
              <span className="text-gray-500">Anticipo:</span>{' '}
              <span className="font-medium">
                {formatCOP(statement.advancePayment)}
              </span>
            </p>
          )}
          {statement.carryoverToNext !== 0 && (
            <p>
              <span className="text-gray-500">Saldo trasladado:</span>{' '}
              <span className="font-medium">
                {formatCOP(statement.carryoverToNext)}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Detalle por libro */}
      {statement.books.map((bookEntry, i) => (
        <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold">{bookEntry.bookTitle}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ROLE_LABEL[bookEntry.role] ?? bookEntry.role} ·{' '}
                {bookEntry.royaltyPercentage}% de regalía
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-500">{bookEntry.totalCopies} copias</p>
              <p className="font-medium">
                {formatCOP(bookEntry.totalRoyalties)}
              </p>
            </div>
          </div>

          {bookEntry.lines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-400 uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Factura</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">PVP</th>
                    <th className="px-4 py-2 text-right">Total facturado</th>
                    <th className="px-4 py-2 text-right">Regalía</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookEntry.lines.map((line, j) => (
                    <tr key={j} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{line.invoiceNumber}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(line.date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-2 text-right">{line.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        {formatCOP(line.pvp)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCOP(line.totalInvoiced)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCOP(line.totalRoyalty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
