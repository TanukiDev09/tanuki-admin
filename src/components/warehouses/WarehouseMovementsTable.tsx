'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { 
  Eye, 
  FileText, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { generateMovementPDF } from '@/lib/inventory/pdfGenerator';
import { EditorialSettings } from '@/types/settings';
import { formatNumber, formatCurrency } from '@/lib/utils';
import './WarehouseMovementsTable.scss';

interface BookItem {
  bookId: {
    _id: string;
    title: string;
    isbn: string;
    price: number;
  };
  quantity: number;
}

interface ApiMovement {
  _id: string;
  type: string;
  consecutive?: number;
  date: string;
  fromWarehouseId?: {
    _id: string;
    name: string;
    type: string;
    city?: string;
  };
  toWarehouseId?: {
    _id: string;
    name: string;
    type: string;
    city?: string;
  };
  items: BookItem[];
  createdBy?: { name: string };
  observations?: string;
  financialMovementId?: string | { _id: string };
  subType?: string;
  invoiceRef?: string;
}

interface ProcessedMovement extends ApiMovement {
  totalAmount: number;
  totalQuantity: number;
  flowType: 'entrada' | 'salida';
}

interface WarehouseMovementsTableProps {
  warehouseId: string;
}

export function WarehouseMovementsTable({ warehouseId }: WarehouseMovementsTableProps) {
  const router = useRouter();
  const [movements, setMovements] = useState<ProcessedMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorialSettings, setEditorialSettings] = useState<EditorialSettings | undefined>(undefined);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/movements?warehouseId=${warehouseId}&limit=100`);
      if (res.ok) {
        const result = await res.json();
        const rawMovements: ApiMovement[] = result.data || [];

        // Pre-process movements for sorting and custom display
        const processed: ProcessedMovement[] = rawMovements.map((mov) => {
          const totalAmount = mov.items.reduce(
            (acc, item) => acc + (item.bookId?.price || 0) * item.quantity,
            0
          );
          const totalQuantity = mov.items.reduce((acc, item) => acc + item.quantity, 0);
          
          // Determine flow relative to current warehouse
          const flowType = mov.fromWarehouseId?._id === warehouseId ? 'salida' : 'entrada';

          return {
            ...mov,
            totalAmount,
            totalQuantity,
            flowType,
          };
        });

        setMovements(processed);
      }
    } catch (error) {
      console.error('Error fetching warehouse movements:', error);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings/editorial');
        if (res.ok) {
          const result = await res.json();
          setEditorialSettings(result.data);
        }
      } catch (error) {
        console.error('Error fetching editorial settings for PDF:', error);
      }
    };

    fetchMovements();
    fetchSettings();
  }, [fetchMovements]);

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'INGRESO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REMISION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEVOLUCION':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'LIQUIDACION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const canGeneratePDF = (type: string) => {
    return type === 'REMISION' || type === 'DEVOLUCION';
  };

  const columns: Column<ProcessedMovement>[] = [
    {
      header: 'Fecha',
      accessorKey: 'date',
      sortable: true,
      className: 'warehouse-movements-table__col-date',
      cell: (mov) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">
            {format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: es })}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'type',
      sortable: true,
      className: 'warehouse-movements-table__col-type',
      cell: (mov) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant="outline" className={`${getMovementColor(mov.type)} font-semibold`}>
            {mov.type}
          </Badge>
          {mov.consecutive && (
            <span className="text-[10px] font-mono text-slate-400">
              #{mov.consecutive}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Flujo / Ruta',
      accessorKey: 'flowType',
      sortable: true,
      className: 'warehouse-movements-table__col-flow',
      cell: (mov) => (
        <div className="flex items-center gap-2.5">
          {mov.flowType === 'entrada' ? (
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {mov.flowType === 'entrada' ? 'Entrada' : 'Salida'}
            </span>
            <span className="text-sm font-medium text-slate-700 max-w-[200px] truncate">
              {mov.flowType === 'entrada' 
                ? (mov.fromWarehouseId?.name || 'Proveedor Externo') 
                : (mov.toWarehouseId?.name || 'Cliente Externo')
              }
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Libros',
      accessorKey: 'items',
      className: 'warehouse-movements-table__col-books',
      cell: (mov) => {
        const displayLimit = 2;
        const totalItems = mov.items.length;
        const displayItems = mov.items.slice(0, displayLimit);
        const extraCount = totalItems - displayLimit;

        return (
          <div className="flex flex-col gap-1 max-w-[250px]">
            {displayItems.map((item, idx) => (
              <div key={idx} className="text-xs text-slate-600 truncate">
                <span className="font-semibold text-slate-700">{formatNumber(item.quantity)}</span> x {item.bookId?.title || 'Libro desconocido'}
              </div>
            ))}
            {extraCount > 0 && (
              <span className="text-[10px] text-primary font-semibold">
                +{extraCount} libro{extraCount > 1 ? 's' : ''} más
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Unidades',
      accessorKey: 'totalQuantity',
      sortable: true,
      className: 'warehouse-movements-table__col-units text-right',
      cell: (mov) => (
        <Badge variant="outline" className="font-mono font-medium text-slate-700">
          {formatNumber(mov.totalQuantity)}
        </Badge>
      ),
    },
    {
      header: 'Facturación / Valor',
      accessorKey: 'totalAmount',
      sortable: true,
      className: 'warehouse-movements-table__col-billing text-right',
      cell: (mov) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-semibold text-slate-800 text-sm font-mono tabular-nums">
            {formatCurrency(mov.totalAmount)}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Valor Ref.
          </span>
        </div>
      ),
    },
    {
      header: 'Ref. Factura',
      accessorKey: 'invoiceRef',
      sortable: true,
      className: 'warehouse-movements-table__col-invoice',
      cell: (mov) => (
        mov.invoiceRef ? (
          <Badge variant="secondary" className="font-mono text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase">
            {mov.invoiceRef}
          </Badge>
        ) : (
          <span className="text-xs text-slate-400 italic">Sin Ref.</span>
        )
      ),
    },
    {
      header: 'Acciones',
      accessorKey: '_id',
      className: 'warehouse-movements-table__col-actions text-center',
      cell: (mov) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/inventory/${mov._id}`)}
            title="Ver Detalles"
            className="w-8 h-8 rounded-full hover:bg-slate-100"
          >
            <Eye className="w-4 h-4 text-slate-500" />
          </Button>

          {canGeneratePDF(mov.type) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (mov.fromWarehouseId && mov.toWarehouseId) {
                  generateMovementPDF(
                    mov as Parameters<typeof generateMovementPDF>[0],
                    editorialSettings
                  );
                }
              }}
              title="Descargar PDF"
              className="w-8 h-8 rounded-full hover:bg-slate-100"
            >
              <FileText className="w-4 h-4 text-slate-500" />
            </Button>
          )}

          {mov.financialMovementId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const finId =
                  typeof mov.financialMovementId === 'object'
                    ? mov.financialMovementId?._id
                    : mov.financialMovementId;
                if (finId) window.open(`/dashboard/movements/${finId}`, '_blank');
              }}
              title="Ver Movimiento Financiero"
              className="w-8 h-8 rounded-full hover:bg-primary/5 hover:text-primary"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card className="warehouse-movements-table mt-8 border-slate-200 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Cargando historial de movimientos...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="warehouse-movements-table mt-8 border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Historial de Movimientos de Inventario
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Registro de todos los ingresos, remisiones, devoluciones o liquidaciones asociados a esta bodega. Haz clic en las cabeceras para ordenar.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <DataTable
            data={movements}
            columns={columns}
            emptyMessage="No se encontraron movimientos registrados con esta bodega."
          />
        </div>
      </CardContent>
    </Card>
  );
}
