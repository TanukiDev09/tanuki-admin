'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, ChevronRight, Search, Settings2, EyeOff, LayoutTemplate } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Separator } from '@/components/ui/Separator';
import './InventoryMatrixTable.scss';

interface Warehouse {
  _id: string;
  name: string;
  code: string;
  type: string;
}

interface MatrixData {
  _id: string;
  title: string;
  isbn: string;
  coverImage?: string;
  totalStock: number;
  stockByWarehouse: Record<string, number>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function InventoryMatrixTable() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MatrixData[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // View Options States
  const [showZeroValues, setShowZeroValues] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [hiddenWarehouses, setHiddenWarehouses] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '20'); // Fixed limit for matrix view
        if (search) params.append('search', search);

        const res = await fetch(`/api/inventory/matrix?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          setWarehouses(json.warehouses);
          setData(json.data);
          setPagination(json.pagination);
        }
      } catch (error) {
        console.error('Error fetching inventory matrix:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  const toggleWarehouseVisibility = (warehouseId: string) => {
    setHiddenWarehouses(prev =>
      prev.includes(warehouseId)
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const visibleWarehouses = warehouses.filter(w => !hiddenWarehouses.includes(w._id));

  return (
    <div className="inventory-matrix">
      <div className="inventory-matrix__header">
        <div className="inventory-matrix__title-group">
          <h2 className="inventory-matrix__title">Matriz de Inventario</h2>
          <p className="inventory-matrix__subtitle">
            {pagination?.total || 0} libros encontrados
          </p>
        </div>

        <div className="inventory-matrix__controls">
          <div className="inventory-matrix__search-wrapper">
            <Search className="inventory-matrix__search-icon" />
            <Input
              placeholder="Buscar por libro o ISBN..."
              value={search}
              onChange={handleSearch}
              className="inventory-matrix__search-input"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Opciones de vista">
                <Settings2 className="inventory-matrix__icon" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="inventory-matrix__popover-content" align="end">
              <div className="inventory-matrix__popover">
                <div className="inventory-matrix__popover-section">
                  <h4 className="inventory-matrix__popover-title">
                    <LayoutTemplate className="inventory-matrix__icon" /> Visualización
                  </h4>
                  <div className="inventory-matrix__popover-item">
                    <Checkbox
                      id="compact-mode"
                      checked={compactMode}
                      onCheckedChange={(checked) => setCompactMode(!!checked)}
                    />
                    <Label htmlFor="compact-mode" className="inventory-matrix__popover-label">Modo compacto</Label>
                  </div>
                  <div className="inventory-matrix__popover-item">
                    <Checkbox
                      id="show-zeros"
                      checked={showZeroValues}
                      onCheckedChange={(checked) => setShowZeroValues(!!checked)}
                    />
                    <Label htmlFor="show-zeros" className="inventory-matrix__popover-label">Mostrar valores cero</Label>
                  </div>
                </div>

                <Separator />

                <div className="inventory-matrix__popover-section">
                  <h4 className="inventory-matrix__popover-title">
                    <EyeOff className="inventory-matrix__icon" /> Columnas (Bodegas)
                  </h4>
                  <div className="inventory-matrix__popover-grid">
                    {warehouses.map(w => (
                      <div key={w._id} className="inventory-matrix__popover-item">
                        <Checkbox
                          id={`w-${w._id}`}
                          checked={!hiddenWarehouses.includes(w._id)}
                          onCheckedChange={() => toggleWarehouseVisibility(w._id)}
                        />
                        <Label
                          htmlFor={`w-${w._id}`}
                          className="inventory-matrix__popover-label"
                          title={w.name}
                        >
                          {w.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="inventory-matrix__table-wrapper">
        <div className="inventory-matrix__scroll-container">
          <Table className="inventory-matrix__table">
            <TableHeader>
              <TableRow>
                <TableHead className={`inventory-matrix__head-book ${compactMode ? 'inventory-matrix__head-book--compact' : 'inventory-matrix__head-book--default'}`}>
                  Libro
                </TableHead>
                <TableHead className="inventory-matrix__head-total">
                  Total
                </TableHead>
                {visibleWarehouses.map((w) => (
                  <TableHead key={w._id} className="inventory-matrix__head-warehouse">
                    <div className="inventory-matrix__head-warehouse-content">
                      <span className="inventory-matrix__head-warehouse-name" title={w.name}>
                        {w.name}
                      </span>
                      <span className="inventory-matrix__head-warehouse-code">
                        {w.code}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={2 + visibleWarehouses.length}
                    className="inventory-matrix__loading"
                  >
                    <div className="inventory-matrix__spinner" />
                    <span>Cargando inventario...</span>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2 + visibleWarehouses.length}
                    className="inventory-matrix__empty"
                  >
                    No se encontraron libros que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={row._id}
                    className={`inventory-matrix__row ${compactMode ? 'inventory-matrix__row--compact' : 'inventory-matrix__row--default'} ${index % 2 === 0 ? 'inventory-matrix__row--even' : 'inventory-matrix__row--odd'}`}
                  >
                    <TableCell className={`inventory-matrix__cell-book`}>
                      <Link
                        href={`/dashboard/catalog/${row._id}`}
                        className={`inventory-matrix__book-link ${compactMode ? 'inventory-matrix__book-link--compact' : 'inventory-matrix__book-link--default'}`}
                      >
                        <div className={`inventory-matrix__cover ${compactMode ? 'inventory-matrix__cover--compact' : 'inventory-matrix__cover--default'}`}>
                          {row.coverImage ? (
                            <Image
                              src={`/uploads/covers/${row.coverImage}`}
                              alt={row.title}
                              fill
                              sizes="(max-width: 768px) 100px, 30px"
                              className="inventory-matrix__cover-image"
                            />
                          ) : (
                            <div className="inventory-matrix__cover-placeholder">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="inventory-matrix__book-info">
                          <span className="inventory-matrix__book-title" title={row.title}>
                            {row.title}
                          </span>
                          <span className="inventory-matrix__book-isbn">
                            {row.isbn || 'S/N'}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="inventory-matrix__cell-total">
                      <div className={`inventory-matrix__total-badge ${row.totalStock > 0 ? 'inventory-matrix__total-badge--has-stock' : 'inventory-matrix__total-badge--no-stock'}`}>
                        {row.totalStock}
                      </div>
                    </TableCell>
                    {visibleWarehouses.map((w) => {
                      const qty = row.stockByWarehouse[w._id] || 0;
                      return (
                        <TableCell key={w._id} className="inventory-matrix__cell-warehouse">
                          <div className={`inventory-matrix__warehouse-qty ${qty === 0 ? 'inventory-matrix__warehouse-qty--empty' : 'inventory-matrix__warehouse-qty--active'}`}>
                            {qty === 0 && !showZeroValues ? (
                              <span className="inventory-matrix__warehouse-qty-dot" />
                            ) : (
                              qty
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="inventory-matrix__footer">
          <p className="inventory-matrix__pagination-info">
            Mostrando {((page - 1) * pagination.limit) + 1} a {Math.min(page * pagination.limit, pagination.total)} de {pagination.total} registros
          </p>
          <div className="inventory-matrix__pagination-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inventory-matrix__icon-btn"
            >
              <ChevronLeft className="inventory-matrix__icon" />
            </Button>
            <div className="inventory-matrix__page-indicator">
              <span className="inventory-matrix__current-page">
                {pagination.page}
              </span>
              <span className="inventory-matrix__total-pages">/ {pagination.pages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages || loading}
              className="inventory-matrix__icon-btn"
            >
              <ChevronRight className="inventory-matrix__icon" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
