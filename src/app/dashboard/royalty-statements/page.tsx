'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

interface RoyaltyStatementSummary {
  _id: string;
  creatorName: string;
  periodStart: string;
  periodEnd: string;
  totalCopies: number;
  totalRoyalties: string | number;
  netSettlement: string | number;
  status: 'draft' | 'approved' | 'paid';
  currency: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  approved: 'Aprobada',
  paid: 'Pagada',
};

const STATUS_VARIANT: Record<
  string,
  'secondary' | 'success' | 'outline'
> = {
  draft: 'secondary',
  approved: 'outline',
  paid: 'success',
};

function formatCOP(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
}

export default function RoyaltyStatementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [statements, setStatements] = useState<RoyaltyStatementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const { hasPermission } = usePermission();
  const canCreate = hasPermission(
    ModuleName.ROYALTY_STATEMENTS,
    PermissionAction.CREATE
  );

  const fetchStatements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/royalty-statements');
      if (!res.ok) throw new Error('Error al cargar liquidaciones');
      const data = await res.json();
      setStatements(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las liquidaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Liquidaciones de Regalías</h1>
          <p className="text-sm text-gray-500 mt-1">
            Estado de cuenta de regalías por creador y período.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => router.push('/dashboard/royalty-statements/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva liquidación
          </Button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse text-gray-400">Cargando...</div>
      ) : statements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No hay liquidaciones registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Creador</th>
                <th className="px-4 py-3 text-left">Período</th>
                <th className="px-4 py-3 text-right">Copias</th>
                <th className="px-4 py-3 text-right">Regalías</th>
                <th className="px-4 py-3 text-right">Liquidación neta</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statements.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.creatorName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.periodStart).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                    })}{' '}
                    —{' '}
                    {new Date(s.periodEnd).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">{s.totalCopies}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCOP(s.totalRoyalties)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCOP(s.netSettlement)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={STATUS_VARIANT[s.status] ?? 'outline'}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/royalty-statements/${s._id}`)
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
