'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Eye, TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { CostCenter } from '@/types/cost-center';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Sparkline } from '@/components/ui/Sparkline';
import { useDataTable } from '@/hooks/useDataTable';
import './CostCentersTable.scss';

interface CostCenterStats extends CostCenter {
  income: number;
  expense: number;
  balance: number;
  history: number[];
}

interface CostCentersTableProps {
  costCenters: CostCenterStats[];
  loading: boolean;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (id: string) => void;
}

export default function CostCentersTable({
  costCenters,
  loading,
  onEdit,
  onDelete,
}: CostCentersTableProps) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.UPDATE
  );
  const canDelete = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.DELETE
  );

  const { data: sortedCostCenters, sortConfig, toggleSort } = useDataTable(costCenters);

  const renderSortableHeader = (label: string, key: string, className?: string) => {
    const isSorted = sortConfig.key === key;
    const direction = isSorted ? sortConfig.direction : null;
    const isRightAligned = className?.includes('text-right');

    return (
      <TableHead
        className={`table__head--sortable group ${isSorted ? 'table__head--active' : ''} ${className || ''}`}
        onClick={() => toggleSort(key)}
      >
        <div className={`table__head-content ${isRightAligned ? 'justify-end' : ''}`}>
          {label}
          <span
            className={`table__head-sort-icon ${isSorted ? 'table__head-sort-icon--active' : ''}`}
          >
            {direction === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : direction === 'desc' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronsUpDown className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </TableHead>
    );
  };

  if (loading) {
    return (
      <div className="cost-centers-table__loading">
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-md w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (costCenters.length === 0) {
    return (
      <div className="cost-centers-table__empty">
        No hay centros de costo registrados.
      </div>
    );
  }

  return (
    <div className="cost-centers-table">
      <Table>
        <TableHeader>
          <TableRow>
            {renderSortableHeader('Código', 'code')}
            {renderSortableHeader('Nombre', 'name')}
            {renderSortableHeader('Ingresos', 'income', 'text-right')}
            {renderSortableHeader('Egresos', 'expense', 'text-right')}
            {renderSortableHeader('Resultado', 'balance', 'text-right')}
            <TableHead className="w-[120px]">Tendencia</TableHead>
            <TableHead className="cost-centers-table__actions-head">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCostCenters.map((cc) => (
            <TableRow key={cc._id}>
              <TableCell className="p-0">
                <Link
                  href={`/dashboard/cost-centers/${cc._id}`}
                  className="block px-4 py-4 font-mono text-xs font-semibold uppercase text-muted-foreground hover:text-primary transition-colors"
                >
                  {cc.code}
                </Link>
              </TableCell>
              <TableCell className="cost-centers-table__name p-0">
                <Link
                  href={`/dashboard/cost-centers/${cc._id}`}
                  className="block px-4 py-4 hover:text-primary transition-colors font-medium"
                >
                  {cc.name}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="text-success font-semibold px-2 py-1 rounded-md bg-success/5">
                  {formatCurrency(cc.income)}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="text-danger font-semibold px-2 py-1 rounded-md bg-danger/5">
                  {formatCurrency(cc.expense)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5 tabular-nums">
                  <span
                    className={
                      cc.balance >= 0
                        ? 'text-success font-bold'
                        : 'text-danger font-bold'
                    }
                  >
                    {formatCurrency(cc.balance)}
                  </span>
                  {cc.balance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="h-8 w-full min-w-[100px] flex items-center">
                  <Sparkline
                    data={cc.history}
                    color={
                      cc.balance >= 0
                        ? 'hsl(142, 76%, 36%)'
                        : 'hsl(0, 72%, 51%)'
                    }
                    height={24}
                  />
                </div>
              </TableCell>
              <TableCell className="cost-centers-table__actions-cell">
                <div className="cost-centers-table__actions flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.push(`/dashboard/cost-centers/${cc._id}`)
                    }
                    title="Ver Detalle"
                    className="h-8 w-8 hover:bg-muted"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(cc)}
                      title="Editar"
                      className="h-8 w-8 hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(cc._id)}
                      className="h-8 w-8 text-danger/70 hover:bg-danger/10 hover:text-danger"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
