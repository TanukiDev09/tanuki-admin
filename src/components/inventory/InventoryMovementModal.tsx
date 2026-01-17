'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Search, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type MovementType = 'INGRESO' | 'REMISION' | 'DEVOLUCION' | 'LIQUIDACION';
type SubType = 'INITIAL' | 'UNEXPECTED' | 'PURCHASE';

interface Warehouse {
  _id: string;
  name: string;
  type: 'editorial' | 'pos' | 'general';
}

interface Book {
  _id: string;
  title: string;
  isbn: string;
}

interface InventoryItem {
  bookId: {
    _id: string;
    title: string;
    isbn: string;
  };
  quantity: number;
}

type SearchResult = Book | InventoryItem;

interface SelectedItem {
  bookId: string;
  title: string;
  quantity: number;
  maxQuantity?: number; // For validation against source stock
}

interface InventoryMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string; // The ID of the warehouse page we are on
  warehouseType: string; // 'editorial' | 'pos' | 'general'
  onSuccess: () => void;
}

export function InventoryMovementModal({
  isOpen,
  onClose,
  warehouseId,
  warehouseType,
  onSuccess,
}: InventoryMovementModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [type, setType] = useState<MovementType | ''>('');
  const [subType, setSubType] = useState<SubType | ''>('');
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>(''); // For Remission/Return
  const [invoiceRef, setInvoiceRef] = useState('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);

  // Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setStep(1);
      setType('');
      setSubType('');
      setTargetWarehouseId('');
      setInvoiceRef('');
      setObservations('');
      setItems([]);
      setSearchTerm('');
      setSearchResults([]);
      fetchWarehouses();
    }
  }, [isOpen]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (res.ok) {
        setWarehouses(await res.json());
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleTypeChange = (value: MovementType) => {
    setType(value);
    setSubType('');
    setTargetWarehouseId('');
    setItems([]);

    // Logic for pre-selecting or restricting warehouses/subtypes could go here
    if (value === 'INGRESO' && warehouseType !== 'editorial' && warehouseType !== 'general') {
      // Should effectively be disabled in UI, but good to reset
    }
  };

  const getSourceWarehouseId = () => {
    if (type === 'INGRESO') return null; // External source
    if (type === 'REMISION') return warehouseId; // From here to POS
    if (type === 'DEVOLUCION') {
      if (warehouseType === 'pos') return warehouseId; // From here to Editorial
      // If we are Editorial receiving, source is remote POS (targetWarehouseId)
      // But let's assume user is ON the source page for simplicity usually.
      // Or if we are on Editorial page, maybe we want to pull from POS?
      // Let's implement: "Action is relative to WHERE THE GOODS ARE MOVING *FROM* usually".
      // BUT logic: "Registrar Movimiento" on Editorial page:
      // - Remission -> To POS.
      // - Inbound -> From External.
      // - Liquidation -> From Here.
      // - Return (Reception) -> Complex. Either go to POS page to ship it, or "Pull" it.
      // Let's sticking to "Push" model for now: Go to POS page to register Return.
      // EXCEPT: "Ingreso" is a "Pull" or "Receive"? No, default.
      return warehouseId;
    }
    if (type === 'LIQUIDACION') return warehouseId;
    return warehouseId;
  };

  const getDestWarehouseId = () => {
    if (type === 'INGRESO') return warehouseId;
    if (type === 'REMISION') return targetWarehouseId;
    if (type === 'DEVOLUCION') {
      // Find the editorial warehouse
      const editorial = warehouses.find(w => w.type === 'editorial');
      return editorial?._id;
    }
    if (type === 'LIQUIDACION') return null; // External
    return null;
  };

  const searchBooks = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      let url = '';
      const sourceId = getSourceWarehouseId();

      if (type === 'INGRESO') {
        // Search Global Catalog
        url = `/api/books?search=${encodeURIComponent(searchTerm)}&limit=10`;
      } else {
        // Search Source Inventory
        // If sourceId is current, use local inventory API
        // But for "Remission" source is this warehouse.
        url = `/api/inventory/warehouse/${sourceId}?search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (type === 'INGRESO') {
        // Format from /api/books response
        if (data.success) setSearchResults(data.data as Book[]);
      } else {
        // Format from /api/inventory/warehouse response (InventoryItem[])
        setSearchResults(data as InventoryItem[]);
      }

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const addItem = (item: SearchResult) => {
    // Normalize Item
    let bookId: string, title: string, maxQty: number | undefined;

    if ('quantity' in item && 'bookId' in item) {
      // InventoryItem
      const invItem = item as InventoryItem;
      bookId = invItem.bookId._id;
      title = invItem.bookId.title;
      maxQty = invItem.quantity;
    } else {
      // Book
      const book = item as Book;
      bookId = book._id;
      title = book.title;
      maxQty = 999999;
    }

    if (items.find(i => i.bookId === bookId)) return; // Already added

    setItems([...items, { bookId, title, quantity: 1, maxQuantity: maxQty }]);
  };

  const updateQuantity = (bookId: string, q: number) => {
    setItems(items.map(i => i.bookId === bookId ? { ...i, quantity: q } : i));
  };

  const removeItem = (bookId: string) => {
    setItems(items.filter(i => i.bookId !== bookId));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        type,
        subType: subType || undefined,
        fromWarehouseId: getSourceWarehouseId(),
        toWarehouseId: getDestWarehouseId(),
        items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
        invoiceRef: invoiceRef || undefined,
        observations: observations || undefined,
        // TODO: Handle financial movement linking if needed
      };

      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      toast({ title: 'Movimiento registrado con éxito' });
      onSuccess();
      onClose();
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Tipo de Movimiento</Label>
        <Select value={type} onValueChange={(v) => handleTypeChange(v as MovementType)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {(warehouseType === 'editorial' || warehouseType === 'general') && (
              <>
                <SelectItem value="INGRESO">Ingreso (Compras / Ajuste)</SelectItem>
                <SelectItem value="REMISION">Remisión (A Punto de Venta)</SelectItem>
              </>
            )}
            <SelectItem value="LIQUIDACION">Liquidación (Venta)</SelectItem>
            {warehouseType === 'pos' && (
              <SelectItem value="DEVOLUCION">Devolución (A Editorial)</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {type === 'INGRESO' && (
        <div className="space-y-2">
          <Label>Motivo de Ingreso</Label>
          <Select value={subType} onValueChange={(v) => setSubType(v as SubType)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar motivo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INITIAL">Estado Inicial</SelectItem>
              <SelectItem value="PURCHASE">Compra de Libros</SelectItem>
              <SelectItem value="UNEXPECTED">Ingreso Inesperado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {subType === 'PURCHASE' && (
        <div className="space-y-2">
          <Label>Referencia de Factura</Label>
          <Input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="Ej: FAC-1234" />
        </div>
      )}

      {type === 'REMISION' && (
        <div className="space-y-2">
          <Label>Bodega de Destino (Punto de Venta)</Label>
          <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar POS..." /></SelectTrigger>
            <SelectContent>
              {warehouses.filter(w => w.type === 'pos').map(w => (
                <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Observaciones</Label>
        <Input value={observations} onChange={e => setObservations(e.target.value)} placeholder="Notas adicionales..." />
      </div>

      <div className="flex justify-end pt-4">
        <Button
          disabled={!type || (type === 'INGRESO' && !subType) || (type === 'REMISION' && !targetWarehouseId)}
          onClick={() => setStep(2)}
        >
          Siguiente <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 py-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={type === 'INGRESO' ? "Buscar en catálogo..." : "Buscar en inventario..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8"
            onKeyDown={e => e.key === 'Enter' && searchBooks()}
          />
        </div>
        <Button onClick={searchBooks} variant="secondary" disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </Button>
      </div>

      {/* Search Results */}
      <div className="border rounded-md max-h-[150px] overflow-y-auto p-2 space-y-1">
        {searchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Sin resultados</p>}
        {searchResults.map((item) => {
          let bookId: string, title: string, quantity: number | undefined;

          if ('bookId' in item) {
            const invItem = item as InventoryItem;
            bookId = invItem.bookId._id;
            title = invItem.bookId.title;
            quantity = invItem.quantity;
          } else {
            const book = item as Book;
            bookId = book._id;
            title = book.title;
          }

          const isAdded = items.some(i => i.bookId === bookId);

          return (
            <div key={bookId} className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded">
              <span className="truncate flex-1 font-medium">
                {title}
              </span>
              <div className="flex items-center gap-2">
                {type !== 'INGRESO' && (
                  <span className="text-xs text-muted-foreground mr-2">
                    Stock: {quantity}
                  </span>
                )}
                <Button size="sm" variant="ghost" disabled={isAdded} onClick={() => addItem(item)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Selected Items */}
      <div className="space-y-2">
        <Label>Items Seleccionados ({items.length})</Label>
        <div className="max-h-[200px] overflow-y-auto space-y-2">
          {items.map(item => (
            <div key={item.bookId} className="flex items-center gap-3 border p-2 rounded bg-card">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
              </div>
              <Input
                type="number"
                className="w-20 h-8"
                value={item.quantity}
                min={1}
                max={item.maxQuantity}
                onChange={e => updateQuantity(item.bookId, parseInt(e.target.value) || 0)}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.bookId)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
        <Button disabled={items.length === 0 || loading} onClick={handleSubmit}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Confirmar Movimiento
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Configure los detalles del movimiento' : 'Seleccione los libros y cantidades'}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
