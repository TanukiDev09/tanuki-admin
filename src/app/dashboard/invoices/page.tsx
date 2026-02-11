'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  FileUp,
  SortAsc,
  SortDesc,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import './invoices-list.scss';

interface Invoice {
  _id: string;
  number: string;
  date: string;
  customerName: string;
  total: number;
  status: string;
  currency?: string;
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MailListTab } from './MailListTab';
import { usePersistentFilters } from '@/hooks/usePersistentFilters';

interface InvoiceFilters {
  search: string;
  statusFilter: string;
  sortField: string;
  sortOrder: string;
  amountRange: [number, number];
  page: number;
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando facturación...</div>}>
      <InvoicesList />
    </Suspense>
  );
}

function InvoicesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, updateFilters } = usePersistentFilters<InvoiceFilters>({
    key: 'invoices-filters',
    initialFilters: {
      search: '',
      statusFilter: 'ALL',
      sortField: 'date',
      sortOrder: 'desc',
      amountRange: [0, 5000000],
      page: 1,
    },
  });

  const { search, statusFilter, sortField, sortOrder, amountRange, page } = filters;
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 10;

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'ALL')
        params.append('status', statusFilter);

      if (amountRange[0] > 0) params.append('minAmount', amountRange[0].toString());
      if (amountRange[1] < 5000000) params.append('maxAmount', amountRange[1].toString());

      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar facturas');
      const data = await res.json();
      setInvoices(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalResults(data.pagination?.total || 0);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, amountRange, sortField, sortOrder, page, limit, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta factura?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast({ title: 'Éxito', description: 'Factura eliminada correctamente' });
      fetchInvoices();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la factura',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<
      string,
      string
    > = {
      Draft: 'secondary',
      Sent: 'sent',
      Paid: 'success',
      Partial: 'warning',
      Cancelled: 'danger',
      Unchecked: 'outline',
    };
    const labels: Record<string, string> = {
      Draft: 'Borrador',
      Sent: 'Enviada',
      Paid: 'Pagada',
      Partial: 'Parcial',
      Cancelled: 'Anulada',
      Unchecked: 'Sin comprobar',
    };
    return (
      <span className={`invoice-badge invoice-badge--${map[status] || 'outline'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="invoices-list">
      <div className="invoices-list__container">
        <header className="invoices-list__header">
          <div className="invoices-list__title-group">
            <h1 className="invoices-list__title">Facturación</h1>
            <p className="invoices-list__subtitle">Control y seguimiento de facturas emitidas</p>
          </div>
          <div className="invoices-list__actions">
            <Button
              variant="outline"
              className="premium-button"
              onClick={() => router.push('/dashboard/invoices/upload-xml')}
            >
              <FileUp className="w-4 h-4 mr-2" /> Importar XML
            </Button>
            <Button
              className="premium-button premium-button--primary"
              onClick={() => router.push('/dashboard/invoices/crear')}
            >
              <Plus className="w-4 h-4 mr-2" /> Nueva Factura
            </Button>
          </div>
        </header>

        <Tabs defaultValue="list" className="invoices-list__tabs">
          <TabsList className="invoices-list__tabs-list">
            <TabsTrigger value="list">Facturas</TabsTrigger>
            <TabsTrigger value="mail-list">Lista de Correos</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <section className="invoices-list__filters-bar">
              <div className="invoices-list__search">
                <Search className="invoices-list__search-icon" />
                <Input
                  placeholder="Buscar por número, cliente..."
                  value={search}
                  onChange={(e) => {
                    updateFilters({ search: e.target.value, page: 1 });
                  }}
                  className="invoices-list__search-input"
                />
              </div>

              <div className="invoices-list__controls">
                <div className="invoices-list__control-item">
                  <Filter className="invoices-list__control-icon" />
                  <Select value={statusFilter} onValueChange={(val) => {
                    updateFilters({ statusFilter: val, page: 1 });
                  }}>
                    <SelectTrigger className="invoices-list__select-trigger">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos los estados</SelectItem>
                      <SelectItem value="Draft">Borrador</SelectItem>
                      <SelectItem value="Unchecked">Sin comprobar</SelectItem>
                      <SelectItem value="Sent">Enviada</SelectItem>
                      <SelectItem value="Paid">Pagada</SelectItem>
                      <SelectItem value="Partial">Parcial</SelectItem>
                      <SelectItem value="Cancelled">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="invoices-list__control-item invoices-list__control-item--slider">
                  <div className="invoices-list__slider-container">
                    <div className="invoices-list__slider-label">
                      Total hasta: <span>{formatCurrency(amountRange[1], 'COP')}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="50000"
                      value={amountRange[1]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateFilters({ amountRange: [amountRange[0], val], page: 1 });
                      }}
                      className="invoices-list__slider"
                    />
                  </div>
                </div>

                <div className="invoices-list__control-item">
                  {sortOrder === 'asc' ? <SortAsc className="invoices-list__control-icon" /> : <SortDesc className="invoices-list__control-icon" />}
                  <Select value={`${sortField}_${sortOrder}`} onValueChange={(val) => {
                    const [field, order] = val.split('_');
                    updateFilters({ sortField: field, sortOrder: order, page: 1 });
                  }}>
                    <SelectTrigger className="invoices-list__select-trigger">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Más recientes primero</SelectItem>
                      <SelectItem value="date_asc">Más antiguas primero</SelectItem>
                      <SelectItem value="number_desc">Número (Z-A)</SelectItem>
                      <SelectItem value="number_asc">Número (A-Z)</SelectItem>
                      <SelectItem value="total_desc">Total (Mayor a Menor)</SelectItem>
                      <SelectItem value="total_asc">Total (Menor a Mayor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="invoices-list__card invoices-list__spacer">
              <div className="invoices-list__table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Fecha Emisión</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            <TableCell colSpan={6}><div className="skeleton-line" /></TableCell>
                          </TableRow>
                        ))
                      ) : invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="invoices-list__empty-state">
                            <div className="empty-content">
                              <Search className="w-12 h-12 mb-2 opacity-20" />
                              <p>No se encontraron facturas</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => (
                          <motion.tr
                            key={invoice._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="invoices-list__row"
                          >
                            <TableCell className="font-bold">
                              <button
                                onClick={() => router.push(`/dashboard/invoices/${invoice._id}`)}
                                className="invoices-list__invoice-link"
                              >
                                {invoice.number}
                              </button>
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {new Date(invoice.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <div className="invoices-list__customer">
                                {invoice.customerName}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(invoice.total, invoice.currency || 'COP')}
                            </TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="invoices-list__row-actions">
                                <button
                                  onClick={() => router.push(`/dashboard/invoices/${invoice._id}`)}
                                  className="action-icon-btn action-icon-btn--view"
                                  title="Ver detalle"
                                >
                                  <Eye />
                                </button>
                                <button
                                  onClick={() => router.push(`/dashboard/invoices/${invoice._id}/editar`)}
                                  className="action-icon-btn action-icon-btn--edit"
                                  title="Editar"
                                >
                                  <Pencil />
                                </button>
                                <button
                                  onClick={() => handleDelete(invoice._id)}
                                  className="action-icon-btn action-icon-btn--delete"
                                  title="Eliminar"
                                >
                                  <Trash2 />
                                </button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              <footer className="invoices-list__pagination">
                <p className="invoices-list__pagination-summary">
                  Mostrando <span>{invoices.length}</span> de <span>{totalResults}</span> resultados
                </p>
                <div className="invoices-list__pagination-nav">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="pagination-btn"
                    onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <div className="pagination-pages">
                    Página <span>{page}</span> de {totalPages}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="pagination-btn"
                    onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                    disabled={page === totalPages}
                  >
                    Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </footer>
            </div>
          </TabsContent>

          <TabsContent value="mail-list">
            <MailListTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
