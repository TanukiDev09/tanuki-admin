'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Search, Mail, User, Fingerprint, BookOpen, Copy, Layout, FileText, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface MailListItem {
  email: string;
  customerName: string;
  customerTaxId?: string;
  lastSignupDate: string;
  booksPurchased?: string[];
}

export function MailListTab() {
  const [items, setItems] = useState<MailListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'text'>('table');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMailList = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/invoices/mail-list');
        if (!res.ok) throw new Error('Error al cargar lista de correos');
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la lista de correos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMailList();
  }, [toast]);

  const filteredItems = items.filter(
    (item) =>
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.customerTaxId?.toLowerCase().includes(search.toLowerCase()) ||
      (item.booksPurchased?.some((book) =>
        book.toLowerCase().includes(search.toLowerCase())
      ) ?? false)
  );

  const getCsvContent = () => {
    return filteredItems
      .map((item) => `${item.email}, ${item.customerName}`)
      .join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getCsvContent());
      setCopied(true);
      toast({
        title: 'Copiado',
        description: 'Lista copiada al portapapeles correctamente',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar al portapapeles',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mail-list-tab">
      <section className="invoices-list__filters-bar">
        <div className="invoices-list__search">
          <Search className="invoices-list__search-icon" />
          <Input
            placeholder="Buscar por email, nombre, documento o libro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="invoices-list__search-input"
          />
        </div>
      </section>

      <div className="invoices-list__spacer">
        <div className="invoices-list__view-header">
          <div className="invoices-list__view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              <Layout className="w-4 h-4 mr-1 inline" /> Tabla
            </button>
            <button
              className={viewMode === 'text' ? 'active' : ''}
              onClick={() => setViewMode('text')}
            >
              <FileText className="w-4 h-4 mr-1 inline" /> Texto Plano
            </button>
          </div>

          <button
            className="invoices-list__copy-btn"
            onClick={copyToClipboard}
            title={`Copiar ${filteredItems.length} correos`}
          >
            {copied ? <Check /> : <Copy />}
            <span>{copied ? '¡Copiado!' : `Copiar ${filteredItems.length} líneas`}</span>
          </button>
        </div>

        <div className="invoices-list__card">
          <AnimatePresence mode="wait">
            {viewMode === 'table' ? (
              <motion.div
                key="table-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="invoices-list__table-wrapper"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="invoices-list__header-cell">
                          <Mail /> Email
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="invoices-list__header-cell">
                          <User /> Cliente
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="invoices-list__header-cell">
                          <Fingerprint /> Documento
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="invoices-list__header-cell">
                          <BookOpen /> Libros Comprados
                        </div>
                      </TableHead>
                      <TableHead>Fecha suscripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell colSpan={5}>
                            <div className="skeleton-line" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="invoices-list__empty-state">
                          <div className="empty-content">
                            <Search className="w-12 h-12 mb-2 opacity-20" />
                            <p>No se encontraron correos</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item, idx) => (
                        <motion.tr
                          key={item.email}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="invoices-list__row"
                        >
                          <TableCell className="font-medium text-primary">
                            {item.email}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {item.customerName}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {item.customerTaxId || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="invoices-list__books-list">
                              {item.booksPurchased?.map((book, i) => (
                                <span key={i} className="invoices-list__book-badge">
                                  {book}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(item.lastSignupDate).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              <motion.div
                key="text-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <textarea
                  className="invoices-list__plain-text-area"
                  readOnly
                  value={getCsvContent()}
                  placeholder="La lista aparecerá aquí..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
