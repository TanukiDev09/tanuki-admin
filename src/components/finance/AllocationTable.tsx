'use client';

import { NumericInput } from '@/components/ui/Input/NumericInput';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { add, subtract, compare, toNumber } from '@/lib/math';

interface Allocation {
  costCenter: string;
  amount: number | string;
}

interface AllocationTableProps {
  allocations: Allocation[];
  totalAmount: number | string;
  currency: string;
  onAllocationChange: (index: number, field: 'costCenter' | 'amount', value: string) => void;
  onAddAllocation: () => void;
  onRemoveAllocation: (index: number) => void;
  error?: string | null;
}

export function AllocationTable({
  allocations,
  totalAmount,
  currency,
  onAllocationChange,
  onAddAllocation,
  onRemoveAllocation,
  error,
}: AllocationTableProps) {
  const sumAllocations = allocations.reduce(
    (sum, a) => add(sum, a.amount || '0'),
    '0'
  );

  const isMatched = compare(sumAllocations, totalAmount || '0') === 0;
  const difference = subtract(totalAmount || '0', sumAllocations);

  return (
    <div className="movement-form__allocation-container">
      <table className="movement-form__allocation-table">
        <thead>
          <tr>
            <th className="cost-center-col">Centro de Costo</th>
            <th className="amount-col">Monto</th>
            <th className="action-col"></th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((alloc, idx) => (
            <tr key={idx}>
              <td>
                <CostCenterSelect
                  value={alloc.costCenter}
                  onValueChange={(val) =>
                    onAllocationChange(idx, 'costCenter', val)
                  }
                />
              </td>
              <td>
                <NumericInput
                  value={alloc.amount}
                  onValueChange={(val) =>
                    onAllocationChange(idx, 'amount', val?.toString() || '0')
                  }
                  placeholder="0.00"
                />
              </td>
              <td>
                <button
                  type="button"
                  className="movement-form__remove-allocation"
                  onClick={() => onRemoveAllocation(idx)}
                  title="Eliminar asignación"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        className="movement-form__add-allocation"
        onClick={onAddAllocation}
      >
        <Plus size={14} /> Agregar Asignación
      </button>

      <div className="movement-form__allocation-summary">
        <div className="movement-form__allocation-summary-label">
          Total:{' '}
          <span className="font-semibold">
            {formatCurrency(toNumber(totalAmount || 0), currency)}
          </span>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex gap-2 items-center">
            <span>Asignado:</span>
            <span
              className={`movement-form__allocation-summary-total ${isMatched
                ? 'movement-form__allocation-summary-total--match'
                : 'movement-form__allocation-summary-total--error'
                }`}
            >
              {formatCurrency(toNumber(sumAllocations), currency)}
            </span>
          </div>

          {error ? (
            <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--warning">
              {error}
            </span>
          ) : isMatched ? (
            <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--success">
              ✓ Distribuido
            </span>
          ) : (
            <span className="movement-form__allocation-summary-status movement-form__allocation-summary-status--warning">
              {formatCurrency(Math.abs(toNumber(difference)), currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
