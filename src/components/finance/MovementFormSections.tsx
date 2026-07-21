'use client';

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
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
import { toNumber, gtZero, multiply, divide } from '@/lib/math';

interface SectionProps {
  formData: Partial<CreateMovementDTO>;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CreateMovementDTO>>>;
}

export function AmountCurrencySection({
  formData,
  handleSelectChange,
  setFormData,
}: SectionProps) {
  return (
    <div className="movement-form__section">
      <h2 className="movement-form__section-title">
        Detalles de la Transacción
      </h2>
      <div className="movement-form__grid movement-form__grid--3">
        <div className="movement-form__field-group">
          <Label htmlFor="amount">Monto</Label>
          <NumericInput
            id="amount"
            name="amount"
            placeholder="0.00"
            value={formData.amount}
            onValueChange={(val) =>
              setFormData((prev) => {
                const amount = val;
                const rate = prev.exchangeRate;
                const cop = prev.amountInCOP;

                let nextCOP = prev.amountInCOP;
                let nextRate = prev.exchangeRate;

                if (gtZero(rate)) {
                  nextCOP = multiply(amount, rate);
                } else if (gtZero(cop) && gtZero(amount)) {
                  nextRate = divide(cop, amount);
                }

                return {
                  ...prev,
                  amount: val,
                  amountInCOP: nextCOP,
                  exchangeRate: nextRate,
                };
              })
            }
          />
        </div>

        <div className="movement-form__field-group">
          <Label htmlFor="currency">Moneda</Label>
          <Select
            value={formData.currency || 'COP'}
            onValueChange={(val) => handleSelectChange('currency', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="JPY">Yen Japonés (JPY)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="movement-form__field-group">
          {formData.currency !== 'COP' && (
            <>
              <Label htmlFor="exchangeRate">Tasa de Cambio (TRM)</Label>
              <NumericInput
                id="exchangeRate"
                name="exchangeRate"
                value={formData.exchangeRate}
                onValueChange={(val) => {
                  setFormData((prev) => {
                    const rate = val;
                    const amount = prev.amount;
                    const cop = prev.amountInCOP;

                    let nextCOP = prev.amountInCOP;
                    let nextAmount = prev.amount;

                    if (gtZero(amount)) {
                      nextCOP = multiply(amount, rate);
                    } else if (gtZero(cop) && gtZero(rate)) {
                      nextAmount = divide(cop, rate);
                    }

                    return {
                      ...prev,
                      exchangeRate: val,
                      amountInCOP: nextCOP,
                      amount: nextAmount,
                    };
                  });
                }}
                placeholder="Ej: 4 000"
              />
            </>
          )}
        </div>
      </div>

      {formData.currency !== 'COP' && (
        <div className="movement-form__grid movement-form__grid--3 mt-4">
          <div className="movement-form__field-group">
            <Label htmlFor="amountInCOP">Equivalente en COP</Label>
            <NumericInput
              id="amountInCOP"
              name="amountInCOP"
              placeholder="0.00"
              value={formData.amountInCOP}
              onValueChange={(val) => {
                setFormData((prev) => {
                  const cop = val;
                  const amount = prev.amount;
                  const rate = prev.exchangeRate;

                  let nextAmount = prev.amount;
                  let nextRate = prev.exchangeRate;

                  if (gtZero(amount)) {
                    nextRate = divide(cop, amount);
                  } else if (gtZero(rate)) {
                    nextAmount = divide(cop, rate);
                  }

                  return {
                    ...prev,
                    amountInCOP: val,
                    exchangeRate: nextRate,
                    amount: nextAmount,
                  };
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function GeneralInfoSection({ formData, handleChange, handleSelectChange }: SectionProps) {
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
  handleAllocationChange: (index: number, field: 'costCenter' | 'amount', value: string) => void;
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
