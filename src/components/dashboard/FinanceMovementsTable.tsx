'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Movement } from '@/types/movement';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toNumber } from '@/lib/math';
import './FinanceMovementsTable.scss';

interface FinanceMovementsTableProps {
  movements: Movement[];
  pagination?: {
    page: number;
    totalPages: number;
    hasPrevPage: boolean; // Computed or passed
    hasNextPage: boolean; // Computed or passed
  };
  onPageChange?: (page: number) => void;
}

export function FinanceMovementsTable({
  movements,
  pagination,
  onPageChange,
}: FinanceMovementsTableProps) {
  if (!movements || movements.length === 0) {
    return (
      <div className="finance-movements-table__empty">
        No hay movimientos registrados en este periodo.
      </div>
    );
  }

  return (
    <div className="finance-movements-table-wrapper">
      <div className="finance-movements-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Centro Costo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m, index) => (
              <TableRow key={m._id || index}>
                <TableCell className="whitespace-nowrap">
                  {new Date(m.date).toLocaleDateString('es-CO', {
                    timeZone: 'UTC',
                  })}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/movements/${m._id}`}
                    className="hover:underline text-primary"
                  >
                    {m.description}
                  </Link>
                </TableCell>
                <TableCell>
                  {m.category ? (
                    typeof m.category === 'string' ? (
                      <Badge variant="outline">{m.category}</Badge>
                    ) : (
                      <Badge
                        style={{
                          backgroundColor: m.category.color || '#64748b',
                          color: '#fff',
                          borderColor: 'transparent',
                        }}
                      >
                        {m.category.name}
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline">Sin categoría</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {m.costCenter || 'N/A'}
                  </span>
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${m.type === 'INCOME' ? 'text-success' : 'text-danger'}`}
                >
                  <div className="flex flex-col items-end">
                    <span>
                      {m.type === 'INCOME' ? '+' : '-'}{' '}
                      {formatCurrency(toNumber(m.amountInCOP || m.amount || 0), 'COP')}
                    </span>
                    {m.currency && m.currency !== 'COP' && (
                      <span className="text-[10px] opacity-70">
                        {" ("}{formatCurrency(toNumber(m.amount || 0), m.currency).trim()}{")"}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="finance-movements-table__pagination">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <span className="finance-movements-table__page-info">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
