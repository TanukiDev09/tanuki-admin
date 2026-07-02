'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';
import { useDataTable, SortDirection } from '@/hooks/useDataTable';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey: string;
  sortable?: boolean;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  initialSort?: { key: string; direction: SortDirection };
  className?: string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

function getNestedValue(
  obj: Record<string, unknown> | null | undefined,
  path: string
) {
  if (!obj || !path) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce((prev: any, curr) => prev && prev[curr], obj);
}

export function DataTable<T>({
  data,
  columns,
  initialSort,
  className,
  onRowClick,
  emptyMessage = 'No se encontraron resultados.',
  loading = false,
}: DataTableProps<T>) {
  const {
    data: sortedData,
    sortConfig,
    toggleSort,
  } = useDataTable(data, initialSort);

  return (
    <DataTableContainer className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const isSorted = sortConfig.key === column.accessorKey;
              const direction = isSorted ? sortConfig.direction : null;

              return (
                <TableHead
                  key={column.accessorKey}
                  className={`${column.sortable ? 'table__head--sortable' : ''} ${
                    isSorted ? 'table__head--active' : ''
                  } ${column.headerClassName || ''}`}
                  onClick={() =>
                    column.sortable && toggleSort(column.accessorKey)
                  }
                >
                  <div className="table__head-content">
                    {column.header}
                    {column.sortable && (
                      <span
                        className={`table__head-sort-icon ${
                          isSorted ? 'table__head-sort-icon--active' : ''
                        }`}
                      >
                        {direction === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : direction === 'desc' ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-12 text-slate-400"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Cargando datos...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-12 text-slate-400 italic"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item, rowIndex) => (
              <TableRow
                key={rowIndex}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.accessorKey}
                    className={column.className}
                  >
                    {column.cell
                      ? column.cell(item)
                      : String(
                          getNestedValue(
                            item as unknown as Record<string, unknown>,
                            column.accessorKey
                          ) ?? ''
                        )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

// Wrapper to ensure table styling applies correctly
function DataTableContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`data-table-container ${className || ''}`}>{children}</div>
  );
}
