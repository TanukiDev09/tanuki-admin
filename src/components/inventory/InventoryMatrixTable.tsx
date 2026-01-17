'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, Settings2, EyeOff, LayoutTemplate } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

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

  useEffect(() => {
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Matriz de Inventario</h2>
          <p className="text-sm text-muted-foreground">
            {pagination?.total || 0} libros encontrados
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por libro o ISBN..."
              value={search}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Opciones de vista">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4" /> Visualización
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compact-mode"
                      checked={compactMode}
                      onCheckedChange={(checked) => setCompactMode(!!checked)}
                    />
                    <Label htmlFor="compact-mode">Modo compacto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-zeros"
                      checked={showZeroValues}
                      onCheckedChange={(checked) => setShowZeroValues(!!checked)}
                    />
                    <Label htmlFor="show-zeros">Mostrar valores cero</Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium leading-none flex items-center gap-2">
                    <EyeOff className="h-4 w-4" /> Columnas (Bodegas)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pt-2">
                    {warehouses.map(w => (
                      <div key={w._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`w-${w._id}`}
                          checked={!hiddenWarehouses.includes(w._id)}
                          onCheckedChange={() => toggleWarehouseVisibility(w._id)}
                        />
                        <Label
                          htmlFor={`w-${w._id}`}
                          className="text-xs truncate"
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

      <div className="rounded-md border relative shadow-sm overflow-hidden bg-background">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={cn(
                  "sticky left-0 z-20 bg-background border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                  compactMode ? "w-[250px] min-w-[250px]" : "w-[300px] min-w-[300px]"
                )}>
                  Libro
                </TableHead>
                <TableHead className="w-[80px] text-center bg-muted/40 font-semibold text-foreground">
                  Total
                </TableHead>
                {visibleWarehouses.map((w) => (
                  <TableHead key={w._id} className="min-w-[100px] text-center whitespace-nowrap px-2">
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <span className="font-medium text-xs truncate max-w-[120px]" title={w.name}>
                        {w.name}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm font-normal text-muted-foreground border-muted-foreground/30">
                        {w.code}
                      </Badge>
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
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Cargando inventario...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2 + visibleWarehouses.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No se encontraron libros que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={row._id}
                    className={cn(
                      "group transition-colors",
                      compactMode ? "h-11" : "h-16",
                      index % 2 === 0 ? "bg-background" : "bg-muted/5"
                    )}
                  >
                    <TableCell className={cn(
                      "sticky left-0 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] font-medium p-0",
                      "bg-background group-hover:bg-muted/50",
                      compactMode ? "w-[250px] min-w-[250px]" : "w-[300px] min-w-[300px]"
                    )}>
                      <Link
                        href={`/dashboard/catalog/${row._id}`}
                        className={cn("flex items-center gap-3 px-4 h-full w-full hover:bg-muted/50 transition-colors", compactMode ? "py-1" : "py-2")}
                      >
                        {row.coverImage ? (
                          <div className={cn(
                            "shrink-0 relative overflow-hidden rounded bg-muted border border-border/50",
                            compactMode ? "h-8 w-5" : "h-10 w-7"
                          )}>
                            <img
                              src={`/uploads/covers/${row.coverImage}`}
                              alt={row.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            "shrink-0 bg-muted/50 rounded flex items-center justify-center text-[8px] text-muted-foreground border border-border/50",
                            compactMode ? "h-8 w-5" : "h-10 w-7"
                          )}>
                            N/A
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors" title={row.title}>
                            {row.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            {row.isbn || 'S/N'}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-bold bg-muted/10 p-2">
                      <div className={cn(
                        "inline-flex items-center justify-center rounded min-w-[2rem] px-2 py-0.5 text-xs",
                        row.totalStock > 0
                          ? "bg-primary/10 text-primary font-bold"
                          : "bg-destructive/10 text-destructive font-medium"
                      )}>
                        {row.totalStock}
                      </div>
                    </TableCell>
                    {visibleWarehouses.map((w) => {
                      const qty = row.stockByWarehouse[w._id] || 0;
                      return (
                        <TableCell key={w._id} className="text-center p-0">
                          <div className={cn(
                            "h-full w-full flex items-center justify-center text-sm",
                            qty === 0 ? "text-muted-foreground/20" : "font-medium text-foreground/80"
                          )}>
                            {qty === 0 && !showZeroValues ? (
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
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
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Mostrando {((page - 1) * pagination.limit) + 1} a {Math.min(page * pagination.limit, pagination.total)} de {pagination.total} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm font-medium mx-2">
              <span className="bg-background border rounded px-2 py-1 min-w-[2rem] text-center">
                {pagination.page}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">
                {pagination.pages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
