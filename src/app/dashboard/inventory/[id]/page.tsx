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
  Package,
  Trash2,
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
import './inventory-detail.scss';

interface Movement {
  _id: string;
  type: string;
  consecutive?: number;
  date: string;
  subType?: string;
  invoiceRef?: string;
  fromWarehouseId?: {
    _id: string;
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
    _id: string;
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
  const [editorialSettings, setEditorialSettings] = useState<
    EditorialSettings | undefined
  >(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (
      !confirm(
        '¿Estás seguro de eliminar este movimiento? El stock se revertirá automáticamente.'
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/inventory/movements/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard/inventory');
      } else {
        alert(data.error || 'Error al eliminar el movimiento');
      }
    } catch (error) {
      console.error('Error deleting movement:', error);
      alert('Error en la conexión al eliminar el movimiento');
    } finally {
      setIsDeleting(false);
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

  const totalQuantity = movement.items.reduce(
    (acc, item) => acc + item.quantity,
    0
  );
  const totalAmount = movement.items.reduce(
    (acc, item) => acc + (item.bookId?.price || 0) * item.quantity,
    0
  );

  return (
    <div className="inventory-detail">
      <div className="inventory-detail__container">
        
        {/* Header - Compact, Refined & Clean */}
        <header className="inventory-detail__header">
          <div className="inventory-detail__header-left">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="inventory-detail__back-btn"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="inventory-detail__title-group">
              <div className="inventory-detail__title-row">
                <h1 className="inventory-detail__title">
                  {movement.type === 'REMISION' && movement.consecutive
                    ? `Remisión #${movement.consecutive}`
                    : 'Detalle de Movimiento'}
                </h1>
                <Badge
                  variant="outline"
                  className={`${getMovementColor(movement.type)} font-bold`}
                >
                  {movement.type}
                </Badge>
              </div>
              <div className="inventory-detail__meta">
                <span className="inventory-detail__meta-item">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(movement.date), 'dd MMM yyyy, HH:mm', {
                    locale: es,
                  })}
                </span>
                <span className="inventory-detail__meta-item">
                  <User className="h-3.5 w-3.5" />
                  {movement.createdBy?.name || 'Sistema'}
                </span>
              </div>
            </div>
          </div>
          <div className="inventory-detail__actions">
            {canGeneratePDF(movement.type) && (
              <Button
                onClick={handlePrint}
                variant="outline"
                className="shadow-sm"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            )}
            <Button
              variant="outline"
              className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 shadow-sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </div>
        </header>

        {/* Layout Split */}
        <div className="inventory-detail__grid">
          
          {/* Main Area: Logistics and Items Table */}
          <main className="inventory-detail__main">
            
            {/* Route Section - Interactive Flow Layout */}
            <Card className="inventory-detail__route-card">
              <CardHeader className="inventory-detail__route-header">
                <CardTitle className="inventory-detail__route-title">
                  <Truck className="h-4 w-4 text-primary" /> Ruta Logística
                </CardTitle>
              </CardHeader>
              <CardContent className="inventory-detail__route-content">
                <div className="inventory-detail__route-flow">
                  
                  {/* Origin Node */}
                  {movement.fromWarehouseId ? (
                    <div className="inventory-detail__route-node">
                      <span className="inventory-detail__route-label">Origen</span>
                      <div className="inventory-detail__route-info">
                        <div className="inventory-detail__route-icon-wrapper">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="inventory-detail__route-details">
                          <p className="inventory-detail__route-name">
                            {movement.fromWarehouseId.name}
                          </p>
                          <p className="inventory-detail__route-type">
                            {movement.fromWarehouseId.type}
                          </p>
                          <p className="inventory-detail__route-city">
                            {movement.fromWarehouseId.city || 'Sin ciudad'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inventory-detail__route-node-empty">
                      Proveedor Externo
                    </div>
                  )}

                  {/* Connecting Arrow */}
                  <div className="inventory-detail__route-arrow">
                    <ArrowRight className="h-6 w-6" />
                  </div>

                  {/* Destination Node */}
                  {movement.toWarehouseId ? (
                    <div className="inventory-detail__route-node">
                      <span className="inventory-detail__route-label">Destino</span>
                      <div className="inventory-detail__route-info">
                        <div className="inventory-detail__route-icon-wrapper">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="inventory-detail__route-details">
                          <p className="inventory-detail__route-name">
                            {movement.toWarehouseId.name}
                          </p>
                          <p className="inventory-detail__route-type">
                            {movement.toWarehouseId.type}
                          </p>
                          <p className="inventory-detail__route-city">
                            {movement.toWarehouseId.city || 'Sin ciudad'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inventory-detail__route-node-empty">
                      Cliente Externo
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* Items Table Card */}
            <Card className="inventory-detail__items-card">
              <CardHeader className="inventory-detail__items-header">
                <CardTitle className="inventory-detail__items-title">
                  Items ({formatNumber(totalQuantity)})
                </CardTitle>
                <div className="inventory-detail__items-badge">
                  {formatCurrency(totalAmount)} Valor Ref.
                </div>
              </CardHeader>
              <div className="inventory-detail__items-table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%] text-xs font-semibold text-slate-500">
                        Libro
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">
                        ISBN
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500">
                        Precio
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500">
                        Cant.
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movement.items.map((item, idx) => (
                      <TableRow key={idx}>
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
                          <Badge
                            variant="outline"
                            className="font-mono text-xs font-medium text-slate-700"
                          >
                            {formatNumber(item.quantity)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-600 font-medium text-sm tabular-nums">
                          {formatCurrency(
                            (item.bookId?.price || 0) * item.quantity
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </main>

          {/* Sidebar Area: General Information and Observations */}
          <aside className="inventory-detail__sidebar">
            
            {/* General Info Card */}
            <Card className="inventory-detail__info-card">
              <CardHeader className="inventory-detail__info-header">
                <CardTitle className="inventory-detail__info-title">
                  <Info className="h-4 w-4" /> Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="inventory-detail__info-content p-0">
                
                <div className="inventory-detail__info-item">
                  <span className="inventory-detail__info-label">ID Interno</span>
                  <span className="inventory-detail__info-value inventory-detail__info-value--mono">
                    {movement._id}
                  </span>
                </div>

                {movement.subType && (
                  <div className="inventory-detail__info-item">
                    <span className="inventory-detail__info-label">Subtipo de Movimiento</span>
                    <span className="inventory-detail__info-value">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                        {movement.subType}
                      </Badge>
                    </span>
                  </div>
                )}

                {movement.invoiceRef && (
                  <div className="inventory-detail__info-item">
                    <span className="inventory-detail__info-label">Referencia / Factura</span>
                    <span className="inventory-detail__info-value">
                      <Badge variant="outline" className="font-mono bg-slate-50 text-slate-700">
                        {movement.invoiceRef}
                      </Badge>
                    </span>
                  </div>
                )}

                {movement.consecutive && (
                  <div className="inventory-detail__info-item">
                    <span className="inventory-detail__info-label">Consecutivo</span>
                    <span className="inventory-detail__info-value font-mono font-semibold">
                      #{movement.consecutive}
                    </span>
                  </div>
                )}

                <div className="inventory-detail__info-item">
                  <span className="inventory-detail__info-label">Estado</span>
                  <div className="inventory-detail__status-indicator">
                    <div className="inventory-detail__status-dot" />
                    <span>Completado</span>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Observations Card */}
            {movement.observations && (
              <div className="inventory-detail__observations-card">
                <span className="inventory-detail__observations-title">Observaciones</span>
                <p className="inventory-detail__observations-text">
                  &quot;{movement.observations}&quot;
                </p>
              </div>
            )}

          </aside>

        </div>
      </div>
    </div>
  );
}
