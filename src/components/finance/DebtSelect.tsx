'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronsUpDown,
  Plus
} from 'lucide-react';
import { ManualDebtModal } from './ManualDebtModal';
import { IDebt } from '@/types/debt';
import { cn, formatCurrency } from '@/lib/utils';
import { toNumber } from '@/lib/math';
import { Button } from '@/components/ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/Command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';

interface DebtSelectProps {
  value?: string;
  onValueChange: (value: string, amount?: number) => void;
  entityId?: string; // Optional: filter by entity (POS, Creator, etc)
  type?: 'Cuenta por Cobrar' | 'Cuenta por Pagar';
  alwaysIncludeId?: string;
  currentAmount?: number | string;
  currentConcept?: string;
  currentCurrency?: string;
}

export function DebtSelect({
  value,
  onValueChange,
  entityId,
  type,
  alwaysIncludeId,
  currentAmount,
  currentConcept,
  currentCurrency
}: DebtSelectProps) {
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: debts } = useQuery({
    queryKey: ['debts', 'selectable', entityId, type, alwaysIncludeId],
    queryFn: async () => {
      let url = '/api/debts?status=Pendiente&status=Pagado Parcial';
      if (alwaysIncludeId) url += `&alwaysInclude=${alwaysIncludeId}`;
      if (entityId) url += `&entityId=${entityId}`;
      if (type) url += `&type=${type}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  const selectedDebt = useMemo(() =>
    debts?.data?.find((d: IDebt) => d._id === value),
    [debts, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] py-2 px-3 border-slate-200"
        >
          <div className="flex flex-col items-start text-left overflow-hidden">
            {selectedDebt ? (
              <>
                <span className="font-medium text-sm truncate max-w-[220px]">
                  {selectedDebt.notes || selectedDebt.source.reference}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Saldo: {formatCurrency(selectedDebt.remainingBalance, 'COP')}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Seleccionar deuda recibible/pagable...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por referencia o nota..." />
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <p>No se encontraron deudas pendientes.</p>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-primary"
                onClick={() => {
                  setOpen(false);
                  setShowCreateModal(true);
                }}
              >
                <Plus className="mr-1 h-3 w-3" /> Crear nueva deuda manual
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {debts?.data?.map((debt: IDebt) => (
              <CommandItem
                key={debt._id}
                value={`${debt.source.reference} ${debt.notes} ${debt.entityName}`}
                onSelect={() => {
                  onValueChange(debt._id, Number(debt.remainingBalance));
                  setOpen(false);
                }}
                className="flex flex-col items-start gap-1 py-3 border-b border-muted/50 last:border-0"
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-xs truncate">
                      {debt.source.type}: {debt.source.reference}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {debt.entityName}
                    </span>
                  </div>
                  <Badge variant="secondary" className={cn(
                    "text-[9px] h-4 px-1 uppercase tracking-tighter",
                    debt.type === 'Cuenta por Cobrar' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}>
                    {debt.type.split(' ').pop()}
                  </Badge>
                </div>
                {debt.notes && (
                  <div className="text-[11px] mt-0.5 italic text-slate-500 line-clamp-1">
                    {debt.notes}
                  </div>
                )}
                <div className="flex w-full justify-between items-center mt-1 pt-1">
                  <span className="text-[10px] text-muted-foreground">Saldo pendiente:</span>
                  <span className="font-bold text-sm text-primary">{formatCurrency(Number(debt.remainingBalance), 'COP')}</span>
                </div>
                {value === debt._id && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 cursor-pointer text-primary font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Crear nueva deuda...</span>
            </CommandItem>
          </CommandGroup>
        </Command>

        <ManualDebtModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          defaultType={type}
          entityId={entityId}
          defaultAmount={toNumber(currentAmount)}
          defaultNotes={currentConcept}
          defaultCurrency={currentCurrency}
          onSuccess={(id, amount) => {
            onValueChange(id, amount);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
