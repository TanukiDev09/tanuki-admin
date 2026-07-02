'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { IRoyaltyStatement } from '@/types/royalty';
import { STATUS_META, FAVOR_META } from '../statusMeta';
import './RoyaltyStatementList.scss';

type StatementRow = IRoyaltyStatement;

export default function RoyaltyStatementList() {
  const router = useRouter();
  const { toast } = useToast();
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/royalties');
      if (!res.ok) throw new Error('Error al cargar liquidaciones');
      const json = await res.json();
      setStatements(json.data || []);
    } catch (err) {
      console.error(err);
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

  const columns: Column<StatementRow>[] = [
    {
      header: 'Creador',
      accessorKey: 'creatorName',
      sortable: true,
    },
    {
      header: 'Período',
      accessorKey: 'periodStart',
      cell: (s) =>
        `${format(new Date(s.periodStart), 'dd/MM/yyyy')} — ${format(
          new Date(s.periodEnd),
          'dd/MM/yyyy'
        )}`,
    },
    {
      header: 'Total a liquidar',
      accessorKey: 'netSettlement',
      sortable: true,
      className: 'royalty-list__amount',
      cell: (s) => formatCurrency(Number(s.netSettlement)),
    },
    {
      header: 'Saldo',
      accessorKey: 'balanceInFavorOf',
      cell: (s) => {
        const meta = FAVOR_META[s.balanceInFavorOf];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      sortable: true,
      cell: (s) => {
        const meta = STATUS_META[s.status];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      header: 'Acciones',
      accessorKey: '_id',
      className: 'royalty-list__actions',
      cell: (s) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/royalties/${s._id}`)}
        >
          <Eye className="royalty-list__action-icon" />
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="royalty-list">
      <DataTable
        data={statements}
        columns={columns}
        loading={loading}
        initialSort={{ key: 'createdAt', direction: 'desc' }}
        emptyMessage="Aún no hay liquidaciones. Crea la primera con “Nueva liquidación”."
      />
    </div>
  );
}
