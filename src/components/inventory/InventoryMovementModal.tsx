'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Plus, Trash2, Search, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/Separator';
import { formatNumber } from '@/lib/utils';
import { MovementSearchSelect } from '@/components/finance/MovementSearchSelect';
import './InventoryMovementModal.scss';


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
  maxQuantity?: number;
}

interface InventoryMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId?: string;
  warehouseType?: string;
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
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [financialMovementId, setFinancialMovementId] = useState('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);


  // Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setType('');
      setSubType('');
      setTargetWarehouseId('');
      setInvoiceRef('');
      setObservations('');
      setFinancialMovementId('');
      setItems([]);

      setSearchTerm('');
      setSearchResults([]);
      fetchWarehouses();

      // Reset active warehouse states based on props
      if (warehouseId) setActiveWarehouseId(warehouseId);
      if (warehouseType) setActiveWarehouseType(warehouseType);
      if (!warehouseId) {
        setActiveWarehouseId('');
        setActiveWarehouseType('');
      }
    }
  }, [isOpen, warehouseId, warehouseType]);

  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(
    warehouseId || ''
  );
  const [activeWarehouseType, setActiveWarehouseType] = useState<string>(
    warehouseType || ''
  );

  const handleActiveWarehouseChange = (wid: string) => {
    const w = warehouses.find((w) => w._id === wid);
    if (w) {
      setActiveWarehouseId(wid);
      setActiveWarehouseType(w.type);
      // Reset type and items when warehouse changes
      setType('');
      setSubType('');
      setItems([]);
    }
  };

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
    setFinancialMovementId('');
    setItems([]);
  };


  const getSourceWarehouseId = () => {
    if (type === 'INGRESO') return null;
    if (type === 'REMISION' || type === 'DEVOLUCION' || type === 'LIQUIDACION')
      return activeWarehouseId;
    return activeWarehouseId;
  };

  const getDestWarehouseId = () => {
    if (type === 'INGRESO') return activeWarehouseId;
    if (type === 'REMISION') return targetWarehouseId;
    if (type === 'DEVOLUCION') {
      const editorial = warehouses.find((w) => w.type === 'editorial');
      return editorial?._id;
    }
    if (type === 'LIQUIDACION') return null;
    return null;
  };

  const searchBooks = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      let url = '';
      const sourceId = getSourceWarehouseId();

      if (type === 'INGRESO') {
        url = `/api/books?search=${encodeURIComponent(searchTerm)}&limit=10`;
      } else {
        url = `/api/inventory/warehouse/${sourceId}?search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (type === 'INGRESO') {
        if (data.success) setSearchResults(data.data as Book[]);
      } else {
        setSearchResults(data as InventoryItem[]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const addItem = (item: SearchResult) => {
    let bookId: string, title: string, maxQty: number | undefined;

    if ('quantity' in item && 'bookId' in item) {
      const invItem = item as InventoryItem;
      if (!invItem.bookId) return; // Skip if bookId is null
      bookId = invItem.bookId._id;
      title = invItem.bookId.title;
      maxQty = invItem.quantity;
    } else {
      const book = item as Book;
      bookId = book._id;
      title = book.title;
      maxQty = 999999;
    }

    if (items.find((i) => i.bookId === bookId)) return;
    setItems([...items, { bookId, title, quantity: 1, maxQuantity: maxQty }]);
  };

  const updateQuantity = (bookId: string, q: number) => {
    setItems(
      items.map((i) => (i.bookId === bookId ? { ...i, quantity: q } : i))
    );
  };

  const removeItem = (bookId: string) => {
    setItems(items.filter((i) => i.bookId !== bookId));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        type,
        subType: subType || undefined,
        fromWarehouseId: getSourceWarehouseId(),
        toWarehouseId: getDestWarehouseId(),
        items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        invoiceRef: invoiceRef || undefined,
        financialMovementId: financialMovementId || undefined,
        observations: observations || undefined,
      };


      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="inventory-movement-modal__step">
      {!warehouseId && (
        <div className="inventory-movement-modal__field">
          <Label>Bodega</Label>
          <Select
            value={activeWarehouseId}
            onValueChange={handleActiveWarehouseChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar bodega..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w._id} value={w._id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="inventory-movement-modal__field">
        <Label>Tipo de Movimiento</Label>
        <Select
          value={type}
          onValueChange={(v) => handleTypeChange(v as MovementType)}
          disabled={!activeWarehouseId}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !activeWarehouseId
                  ? 'Primero seleccione una bodega'
                  : 'Seleccionar...'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {(activeWarehouseType === 'editorial' ||
              activeWarehouseType === 'general') && (
                <>
                  <SelectItem value="INGRESO">
                    Ingreso (Compras / Ajuste)
                  </SelectItem>
                  <SelectItem value="REMISION">
                    Remisión (A Punto de Venta)
                  </SelectItem>
                </>
              )}
            <SelectItem value="LIQUIDACION">Liquidación (Venta)</SelectItem>
            {activeWarehouseType === 'pos' && (
              <SelectItem value="DEVOLUCION">
                Devolución (A Editorial)
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {type === 'INGRESO' && (
        <div className="inventory-movement-modal__field">
          <Label>Motivo de Ingreso</Label>
          <Select
            value={subType}
            onValueChange={(v) => setSubType(v as SubType)}
          >
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
        <div className="inventory-movement-modal__field">
          <Label>Referencia de Factura</Label>
          <Input
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
            placeholder="Ej: FAC-1234"
          />
        </div>
      )}

      {type === 'REMISION' && (
        <div className="inventory-movement-modal__field">
          <Label>Bodega de Destino (Punto de Venta)</Label>
          <Select
            value={targetWarehouseId}
            onValueChange={setTargetWarehouseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar POS..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses
                .filter((w) => w.type === 'pos')
                .map((w) => (
                  <SelectItem key={w._id} value={w._id}>
                    {w.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="inventory-movement-modal__field">
        <Label>Observaciones</Label>
        <Input
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Notas adicionales..."
        />
      </div>

      {(type === 'LIQUIDACION' || (type === 'INGRESO' && subType === 'PURCHASE')) && (
        <div className="inventory-movement-modal__field">
          <Label>Vincular Movimiento Financiero (Opcional)</Label>
          <MovementSearchSelect
            value={financialMovementId}
            onValueChange={setFinancialMovementId}
            type={type === 'LIQUIDACION' ? 'INCOME' : 'EXPENSE'}
            placeholder={
              type === 'LIQUIDACION'
                ? 'Buscar pago/ingreso...'
                : 'Buscar factura/egreso...'
            }
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Permite relacionar este movimiento de inventario con su registro contable.
          </p>
        </div>
      )}


      <div className="inventory-movement-modal__footer inventory-movement-modal__footer--end">
        <Button
          disabled={
            !type ||
            (type === 'INGRESO' && !subType) ||
            (type === 'REMISION' && !targetWarehouseId)
          }
          onClick={() => setStep(2)}
        >
          Siguiente{' '}
          <ArrowRight className="inventory-movement-modal__arrow-icon" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="inventory-movement-modal__step">
      <div className="inventory-movement-modal__search-container">
        <div className="inventory-movement-modal__search">
          <Search className="inventory-movement-modal__search-icon" />
          <Input
            placeholder={
              type === 'INGRESO'
                ? 'Buscar en catálogo...'
                : 'Buscar en inventario...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="inventory-movement-modal__search-input"
            onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
          />
        </div>
        <Button onClick={searchBooks} variant="secondary" disabled={searching}>
          {searching ? (
            <Loader2 className="inventory-movement-modal__spinner" />
          ) : (
            'Buscar'
          )}
        </Button>
      </div>

      <div className="inventory-movement-modal__results">
        {searchResults.length === 0 && (
          <p className="inventory-movement-modal__empty">Sin resultados</p>
        )}
        {searchResults.map((item, index) => {
          let bookId: string, title: string, quantity: number | undefined;

          if ('bookId' in item) {
            const invItem = item as InventoryItem;
            if (!invItem.bookId) return null; // Skip if bookId is null
            bookId = invItem.bookId._id;
            title = invItem.bookId.title;
            quantity = invItem.quantity;
          } else {
            const book = item as Book;
            bookId = book._id;
            title = book.title;
          }

          if (!bookId) return null; // Double safety
          const isAdded = items.some((i) => i.bookId === bookId);

          return (
            <div key={bookId || index} className="inventory-movement-modal__item">
              <div className="inventory-movement-modal__item-info">
                <span className="inventory-movement-modal__item-title">
                  {title}
                </span>
                {type !== 'INGRESO' && (
                  <span className="inventory-movement-modal__item-meta">
                    Stock: {formatNumber(quantity || 0)}
                  </span>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={isAdded}
                onClick={() => addItem(item)}
              >
                <Plus className="inventory-movement-modal__icon" />
              </Button>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="inventory-movement-modal__selected-section">
        <Label>Items Seleccionados ({formatNumber(items.length)})</Label>
        <div className="inventory-movement-modal__selected-list">
          {items.map((item) => (
            <div
              key={item.bookId}
              className="inventory-movement-modal__selected-item"
            >
              <p className="inventory-movement-modal__selected-item-title">
                {item.title}
              </p>
              <NumericInput
                className="inventory-movement-modal__selected-item-quantity"
                value={item.quantity}
                onValueChange={(val) => updateQuantity(item.bookId, val || 0)}
                allowDecimals={false}
              />
              <Button
                size="icon"
                variant="ghost"
                className="inventory-movement-modal__selected-item-remove"
                onClick={() => removeItem(item.bookId)}
              >
                <Trash2 className="inventory-movement-modal__icon" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="inventory-movement-modal__footer">
        <Button variant="outline" onClick={() => setStep(1)}>
          Atrás
        </Button>
        <Button disabled={items.length === 0 || loading} onClick={handleSubmit}>
          {loading && (
            <Loader2 className="inventory-movement-modal__spinner inventory-movement-modal__spinner--mr" />
          )}
          Confirmar Movimiento
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="inventory-movement-modal__dialog">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Configure los detalles del movimiento'
              : 'Seleccione los libros y cantidades'}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
