'use client';

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { CategorySelect } from '@/components/finance/CategorySelect';
import { DebtSelect } from '@/components/finance/DebtSelect';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { AllocationTable } from '@/components/finance/AllocationTable';
import { CreateMovementDTO } from '@/types/movement';
import { toNumber } from '@/lib/math';

interface SectionProps {
  formData: Partial<CreateMovementDTO>;
  handleChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: string, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CreateMovementDTO>>>;
}

export function GeneralInfoSection({
  formData,
  handleChange,
  handleSelectChange,
}: SectionProps) {
  return (
    <div className="movement-form__section">
      <h2 className="movement-form__section-title">Información General</h2>
      <div className="movement-form__grid movement-form__grid--2">
        <div className="movement-form__field-group">
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={formData.type}
            onValueChange={(val) => handleSelectChange('type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Ingreso</SelectItem>
              <SelectItem value="EXPENSE">Egreso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="movement-form__field-group">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date?.toString().split('T')[0]}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="movement-form__field-group">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          placeholder="Descripción breve del movimiento"
          value={formData.description || ''}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );
}

interface AllocationSectionProps extends SectionProps {
  useMultiCostCenter: boolean;
  setUseMultiCostCenter: (val: boolean) => void;
  handleAllocationChange: (
    index: number,
    field: 'costCenter' | 'amount',
    value: string
  ) => void;
  addAllocation: () => void;
  removeAllocation: (index: number) => void;
  allocationError: string | null;
}

export function AllocationSection({
  formData,
  handleSelectChange,
  setFormData,
  useMultiCostCenter,
  setUseMultiCostCenter,
  handleAllocationChange,
  addAllocation,
  removeAllocation,
  allocationError,
  alwaysIncludeId,
}: AllocationSectionProps & { alwaysIncludeId?: string }) {
  return (
    <>
      <div className="movement-form__field-group">
        <Label htmlFor="category">Categoría</Label>
        <CategorySelect
          value={formData.category}
          onValueChange={(val: string) => handleSelectChange('category', val)}
          type={formData.type as 'INCOME' | 'EXPENSE'}
        />
      </div>

      <div className="movement-form__field-group">
        <Label>Vincular a Deuda Pendiente (Opcional)</Label>
        <DebtSelect
          value={formData.debtId}
          alwaysIncludeId={alwaysIncludeId}
          onValueChange={(val, amount) => {
            setFormData((prev) => ({
              ...prev,
              debtId: val,
              amount:
                !prev.amount || toNumber(prev.amount) === 0
                  ? amount?.toString()
                  : prev.amount,
            }));
          }}
          type={
            formData.type === 'INCOME'
              ? 'Cuenta por Cobrar'
              : 'Cuenta por Pagar'
          }
          currentAmount={formData.amount}
          currentConcept={formData.description}
          currentCurrency={formData.currency}
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Si este movimiento es un pago de una deuda registrada, selecciónela
          aquí para actualizar su saldo.
        </p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="costCenter">Centro de Costo</Label>
        <div className="movement-form__toggle-group">
          <button
            type="button"
            onClick={() => setUseMultiCostCenter(false)}
            className={`movement-form__toggle-group-btn ${!useMultiCostCenter ? 'movement-form__toggle-group-btn--active' : ''}`}
          >
            Único
          </button>
          <button
            type="button"
            onClick={() => {
              setUseMultiCostCenter(true);
              if (!formData.allocations || formData.allocations.length === 0) {
                setFormData((prev) => ({
                  ...prev,
                  allocations: [
                    {
                      costCenter: prev.costCenter || '',
                      amount: prev.amount || 0,
                    },
                  ],
                }));
              }
            }}
            className={`movement-form__toggle-group-btn movement-form__toggle-group-btn--multiple ${useMultiCostCenter ? 'movement-form__toggle-group-btn--active' : ''}`}
          >
            Múltiple
          </button>
        </div>
      </div>

      {!useMultiCostCenter ? (
        <CostCenterSelect
          value={formData.costCenter}
          onValueChange={(val) => handleSelectChange('costCenter', val)}
        />
      ) : (
        <AllocationTable
          allocations={formData.allocations || []}
          totalAmount={formData.amount || '0'}
          currency={formData.currency || 'COP'}
          onAllocationChange={handleAllocationChange}
          onAddAllocation={addAllocation}
          onRemoveAllocation={removeAllocation}
          error={allocationError}
        />
      )}
    </>
  );
}
