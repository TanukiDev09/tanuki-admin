'use client';

import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Input } from '@/components/ui/Input';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { BookSelect } from '@/components/finance/BookSelect';
import { Trash2, Plus, Book, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { add, multiply, toNumber, compare, subtract, isMatchedFinancial } from '@/lib/math';
import { cn } from '@/lib/utils';

interface MovementItem {
  type: 'libro' | 'servicio' | 'otro';
  description: string;
  quantity: number | string;
  unitValue: number | string;
  catalogPrice?: number | string;
  discount?: number | string;
  total: number | string;
  costCenter: string;
  bookId?: string;
}

interface MovementItemsTableProps {
  items: MovementItem[];
  currency: string;
  targetAmount?: number | string;
  onItemChange: (index: number, field: keyof MovementItem, value: string | number | undefined | null) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export function MovementItemsTable({
  items,
  currency,
  targetAmount,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: MovementItemsTableProps) {
  const sumItems = items.reduce((sum, item) => add(sum, item.total || '0'), '0');
  const target = targetAmount || '0';
  const isMatched = isMatchedFinancial(sumItems, target);
  const difference = subtract(target, sumItems);

  return (
    <div className="movement-form__items-list">
      {items.map((item, idx) => (
        <div key={idx} className="movement-form__item-card">
          <div className="movement-form__item-card-header">
            <div className="movement-form__item-type-toggle">
              <button
                type="button"
                onClick={() => onItemChange(idx, 'type', 'libro')}
                className={cn(
                  'movement-form__item-type-btn',
                  item.type === 'libro' && 'movement-form__item-type-btn--active'
                )}
                title="Libro"
              >
                <Book size={18} />
              </button>
              <button
                type="button"
                onClick={() => onItemChange(idx, 'type', 'servicio')}
                className={cn(
                  'movement-form__item-type-btn',
                  item.type === 'servicio' && 'movement-form__item-type-btn--active'
                )}
                title="Servicio"
              >
                <Settings size={18} />
              </button>
            </div>

            <div className="movement-form__item-main-info">
              {item.type === 'libro' ? (
                <BookSelect
                  value={item.bookId}
                  onSelect={(book) => {
                    onItemChange(idx, 'bookId', book._id);
                    onItemChange(idx, 'description', book.title);
                    onItemChange(idx, 'catalogPrice', book.price);
                    onItemChange(idx, 'discount', 0);
                    onItemChange(idx, 'unitValue', book.price);
                    onItemChange(idx, 'costCenter', book.costCenter || '');

                    const qty = item.quantity || 1;
                    onItemChange(idx, 'total', multiply(qty, book.price));
                  }}
                />
              ) : (
                <Input
                  value={item.description}
                  onChange={(e) => onItemChange(idx, 'description', e.target.value)}
                  placeholder="Descripción del item..."
                  className="movement-form__description-input"
                />
              )}
            </div>

            <button
              type="button"
              className="movement-form__remove-item"
              onClick={() => onRemoveItem(idx)}
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="movement-form__item-card-grid">
            <div className="movement-form__field-group">
              <label>Centro de Costo</label>
              <CostCenterSelect
                value={item.costCenter}
                onValueChange={(val) => onItemChange(idx, 'costCenter', val)}
                hideLabel
              />
            </div>

            <div className="movement-form__field-group">
              <label>Cant.</label>
              <NumericInput
                value={item.quantity}
                onValueChange={(val) => {
                  const qty = val || 0;
                  onItemChange(idx, 'quantity', qty);
                  onItemChange(idx, 'total', multiply(qty, item.unitValue || 0));
                }}
                className="text-right"
              />
            </div>

            <div className="movement-form__field-group">
              <label>Precio Unitario (Neto)</label>
              <NumericInput
                value={item.unitValue}
                onValueChange={(val) => {
                  const unitPrice = val || 0;
                  onItemChange(idx, 'unitValue', unitPrice);
                  onItemChange(idx, 'total', multiply(item.quantity || 0, unitPrice));
                }}
                className="text-right font-semibold"
              />
            </div>

            <div className="movement-form__item-total-col">
              <span className="movement-form__item-total-label">Subtotal Neto</span>
              <span className="movement-form__item-total-value">
                {formatCurrency(toNumber(item.total), currency)}
              </span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="movement-form__add-item"
        onClick={onAddItem}
      >
        <Plus size={14} /> Agregar Item
      </button>

      <div className="movement-form__summary-bar">
        <div className="movement-form__summary-bar-content">
          <span className="movement-form__summary-bar-label">Total Items</span>
          <span className="movement-form__summary-bar-value">
            {formatCurrency(toNumber(sumItems), currency)}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2 items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Monto del Movimiento:</span>
            <span className="font-mono text-sm">
              {formatCurrency(toNumber(target), currency)}
            </span>
          </div>

          {isMatched ? (
            <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--success">
              ✓ Items coinciden con el total
            </span>
          ) : (
            <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--warning">
              {compare(difference, '0') > 0
                ? `Faltan ${formatCurrency(Math.abs(toNumber(difference)), currency)} en items`
                : `Sobran ${formatCurrency(Math.abs(toNumber(difference)), currency)} en items`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
