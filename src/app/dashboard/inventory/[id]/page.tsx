'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatNumber, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Printer,
  ArrowRight,
  MapPin,
  Calendar,
  Truck,
  Info,
  Loader2,
  User,
  Building2,
  Package
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { generateMovementPDF } from '@/lib/inventory/pdfGenerator';
import { EditorialSettings } from '@/types/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Movement {
  _id: string;
  type: string;
  consecutive?: number;
  date: string;
  subType?: string;
  invoiceRef?: string;
  fromWarehouseId?: {
    name: string;
    type: string;
    address?: string;
    city?: string;
    pointOfSaleId?: {
      name?: string;
      identificationType?: string;
      identificationNumber?: string;
      address?: string;
      city?: string;
      discountPercentage?: number;
    };
  };
  toWarehouseId?: {
    name: string;
    type: string;
    address?: string;
    city?: string;
    pointOfSaleId?: {
      name?: string;
      identificationType?: string;
      identificationNumber?: string;
      address?: string;
      city?: string;
      discountPercentage?: number;
    };
  };
  items: {
    bookId: {
      title: string;
      isbn: string;
      price: number;
    };
    quantity: number;
  }[];
  createdBy?: { name: string };
  observations?: string;
}

export default function InventoryMovementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorialSettings, setEditorialSettings] = useState<EditorialSettings | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movRes, settingsRes] = await Promise.all([
          fetch(`/api/inventory/movements/${id}`),
          fetch('/api/admin/settings/editorial'),
        ]);

        if (movRes.ok) {
          const data = await movRes.json();
          setMovement(data.data);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setEditorialSettings(settingsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handlePrint = () => {
    if (movement && movement.fromWarehouseId && movement.toWarehouseId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generateMovementPDF(movement as any, editorialSettings);
    }
  };

  const canGeneratePDF = (type: string) => {
    return type === 'REMISION' || type === 'DEVOLUCION';
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'INGRESO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REMISION': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEVOLUCION': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'LIQUIDACION': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="bg-muted p-4 rounded-full">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Movimiento no encontrado</h2>
        <Button onClick={() => router.back()}>Volver al Inventario</Button>
      </div>
    );
  }

  const totalQuantity = movement.items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = movement.items.reduce((acc, item) => acc + ((item.bookId?.price || 0) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50/40 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

        {/* Header - Compact & Clean */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 text-slate-500 hover:text-slate-800 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {movement.type === 'REMISION' && movement.consecutive ? `Remisión #${movement.consecutive}` : 'Detalle de Movimiento'}
                </h1>
                <Badge variant="outline" className={`${getMovementColor(movement.type)}`}>
                  {movement.type}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {format(new Date(movement.date), "dd MMM yyyy, HH:mm", { locale: es })}</span>
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {movement.createdBy?.name || 'Sistema'}</span>
              </div>
            </div>
          </div>
          {canGeneratePDF(movement.type) && (
            <Button onClick={handlePrint} variant="default" className="shadow-sm">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN (2/3) - Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Route Section - Redesigned Horizontal Flow */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-medium text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Ruta Logística
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                  {/* Origin */}
                  <div className="flex-1 w-full md:w-auto p-4 rounded-lg border border-slate-100 bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Origen</span>
                    {movement.fromWarehouseId ? (
                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100">
                          <Building2 className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{movement.fromWarehouseId.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{movement.fromWarehouseId.type}</p>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">
                            {movement.fromWarehouseId.city || 'Sin ciudad'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-slate-400 italic text-sm p-2">Proveedor Externo</div>
                    )}
                  </div>

                  {/* Flow Indicator */}
                  <div className="flex items-center justify-center text-slate-300 px-2">
                    <ArrowRight className="h-6 w-6 hidden md:block" />
                    <ArrowRight className="h-6 w-6 rotate-90 md:rotate-0 block md:hidden" />
                  </div>

                  {/* Destination */}
                  <div className="flex-1 w-full md:w-auto p-4 rounded-lg border border-slate-100 bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Destino</span>
                    {movement.toWarehouseId ? (
                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100">
                          <MapPin className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{movement.toWarehouseId.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{movement.toWarehouseId.type}</p>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">
                            {movement.toWarehouseId.city || 'Sin ciudad'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-slate-400 italic text-sm p-2">Cliente Externo</div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Items Table - Clean Design */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-white pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-800">Items ({formatNumber(totalQuantity)})</CardTitle>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                  {formatCurrency(totalAmount)} Valor Ref.
                </Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/40 hover:bg-slate-50/40">
                      <TableHead className="w-[45%] text-xs font-semibold text-slate-500">Libro</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">ISBN</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500">Precio</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500">Cant.</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movement.items.map((item, idx) => (
                      <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/30">
                        <TableCell className="font-medium text-slate-700">
                          {item.bookId?.title || 'Desconocido'}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs font-mono">
                          {item.bookId?.isbn || '-'}
                        </TableCell>
                        <TableCell className="text-right text-slate-500 text-sm tabular-nums">
                          {formatCurrency(item.bookId?.price || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-xs font-medium text-slate-700">
                            {formatNumber(item.quantity)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-600 font-medium text-sm tabular-nums">
                          {formatCurrency((item.bookId?.price || 0) * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN (1/3) - Metadata & Status */}
          <div className="space-y-6">

            {/* General Info Card */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" /> Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 text-sm">
                  <div className="p-4 flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-medium">ID Interno</span>
                    <span className="font-mono text-xs text-slate-600 select-all">{movement._id}</span>
                  </div>

                  {movement.subType && (
                    <div className="p-4 flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Subtipo de Movimiento</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal text-slate-700 bg-slate-100">
                          {movement.subType}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {movement.invoiceRef && (
                    <div className="p-4 flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Referencia / Factura</span>
                      <p className="font-medium text-slate-700">{movement.invoiceRef}</p>
                    </div>
                  )}

                  {movement.consecutive && (
                    <div className="p-4 flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Consecutivo</span>
                      <p className="font-mono font-medium text-slate-700">#{movement.consecutive}</p>
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-medium">Estado</span>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md w-fit">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <span className="font-medium text-xs">Completado</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observations Card */}
            {movement.observations && (
              <Card className="border-amber-100 bg-amber-50/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-amber-900/70 uppercase tracking-widest">Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-900/80 leading-relaxed italic">
                    &quot;{movement.observations}&quot;
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
