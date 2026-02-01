'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
// import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { POSSelect } from '@/components/admin/POSSelect/POSSelect';
import { CreatorSelect } from '@/components/creators/CreatorSelect';
import { ExternalEntitySelect } from './ExternalEntitySelect';
import { NumericInput } from '@/components/ui/Input/NumericInput';

const debtSchema = z.object({
  type: z.enum(['Cuenta por Cobrar', 'Cuenta por Pagar']),
  entityType: z.enum(['PointOfSale', 'Creator', 'ExternalEntity']),
  entityId: z.string().min(1, 'La entidad es requerida'),
  entityName: z.string().optional(),
  totalAmount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  dueDate: z.string().optional(),
  notes: z.string().min(1, 'Indique un concepto para la deuda'),
  sourceType: z.string(),
  sourceReference: z.string().optional(),
  currency: z.string(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

interface ManualDebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'Cuenta por Cobrar' | 'Cuenta por Pagar';
  entityId?: string;
  entityType?: 'PointOfSale' | 'Creator' | 'ExternalEntity';
  entityName?: string;
  defaultNotes?: string;
  defaultAmount?: number;
  defaultCurrency?: string;
  onSuccess?: (debtId: string, amount: number) => void;
  editingDebtId?: string;
}

export function ManualDebtModal({
  open,
  onOpenChange,
  defaultType = 'Cuenta por Cobrar',
  entityId,
  entityType,
  entityName,
  defaultAmount,
  defaultNotes,
  defaultCurrency = 'COP',
  onSuccess,
  editingDebtId,
}: ManualDebtModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      type: defaultType,
      entityType: entityType || 'PointOfSale',
      entityId: entityId || '',
      entityName: entityName || '',
      totalAmount: defaultAmount || 0,
      dueDate: new Date().toISOString().split('T')[0],
      notes: defaultNotes || '',
      sourceType: 'Manual',
      sourceReference: '',
      currency: defaultCurrency,
    },
  });

  // Reset form when modal opens or when default props change
  useEffect(() => {
    if (open) {
      if (!editingDebtId) {
        // Create mode: Reset to defaults
        form.reset({
          type: defaultType,
          entityType: entityType || 'PointOfSale',
          entityId: entityId || '',
          entityName: entityName || '',
          totalAmount: defaultAmount || 0,
          dueDate: new Date().toISOString().split('T')[0],
          notes: defaultNotes || '',
          sourceType: 'Manual',
          sourceReference: '',
          currency: defaultCurrency,
        });
      } else {
        // Edit mode: We assume values are already set via defaults props
        // If we wanted to fetch inside modal we could, but passing defaults is easier for now
        // So we basically respect the passed defaults which should come from the parent
        form.reset({
          type: defaultType,
          entityType: entityType || 'PointOfSale',
          entityId: entityId || '',
          entityName: entityName || '',
          totalAmount: defaultAmount || 0,
          dueDate: new Date().toISOString().split('T')[0],
          notes: defaultNotes || '',
          sourceType: 'Manual',
          sourceReference: '',
          currency: defaultCurrency,
        });
      }
    }
  }, [
    open,
    defaultType,
    entityId,
    entityType,
    entityName,
    defaultAmount,
    defaultNotes,
    defaultCurrency,
    form,
    editingDebtId,
  ]);

  const onSubmit = async (data: DebtFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        remainingBalance: data.totalAmount, // Note: Logic for edit might need check if we want to reset balance? API handles it.
        source: {
          type: data.sourceType,
          reference: data.sourceReference,
        },
      };

      let res;
      if (editingDebtId) {
        res = await fetch(`/api/debts/${editingDebtId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            paidAmount: 0,
            status: 'Pendiente',
          }),
        });
      }

      if (!res.ok) throw new Error('Error al guardar deuda');

      toast({
        title: 'Éxito',
        description: editingDebtId
          ? 'Deuda actualizada'
          : 'Deuda registrada correctamente',
      });
      const createdDebt = await res.json();
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt', editingDebtId] });
      onOpenChange(false);
      form.reset();
      if (onSuccess && createdDebt.data) {
        onSuccess(
          createdDebt.data._id,
          Number(createdDebt.data.remainingBalance)
        );
      }
    } catch (error) {
      console.error('Error saving debt:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la deuda',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingDebtId ? 'Editar Deuda' : 'Registrar Nueva Deuda Manual'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-6 pt-2 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo de Deuda
                </Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(val) =>
                    form.setValue(
                      'type',
                      val as 'Cuenta por Cobrar' | 'Cuenta por Pagar'
                    )
                  }
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cuenta por Cobrar">
                      Por Cobrar (Ingreso)
                    </SelectItem>
                    <SelectItem value="Cuenta por Pagar">
                      Por Pagar (Egreso)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vencimiento
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    className="bg-muted/30"
                    {...form.register('dueDate')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-foreground">
                  Acreedor / Deudor
                </Label>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Selecciona el origen/destino
                </span>
              </div>

              <Tabs
                value={form.watch('entityType')}
                onValueChange={(val) => {
                  form.setValue(
                    'entityType',
                    val as 'PointOfSale' | 'Creator' | 'ExternalEntity'
                  );
                  form.setValue('entityId', '');
                  form.setValue('entityName', '');
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                  <TabsTrigger
                    value="PointOfSale"
                    className="rounded-md px-2 py-1.5 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Punto Venta
                  </TabsTrigger>
                  <TabsTrigger
                    value="Creator"
                    className="rounded-md px-2 py-1.5 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Creador
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExternalEntity"
                    className="rounded-md px-3 py-1.5 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Externo
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-2">
                {form.watch('entityType') === 'PointOfSale' && (
                  <POSSelect
                    value={form.watch('entityId')}
                    onValueChange={(val, name) => {
                      form.setValue('entityId', val);
                      if (name) form.setValue('entityName', name);
                    }}
                    placeholder="Seleccionar punto de venta..."
                  />
                )}

                {form.watch('entityType') === 'Creator' && (
                  <CreatorSelect
                    value={
                      form.watch('entityId') ? [form.watch('entityId')] : []
                    }
                    onChange={(val, names) => {
                      form.setValue('entityId', val[0] || '');
                      if (names?.[0]) form.setValue('entityName', names[0]);
                    }}
                    max={1}
                    placeholder="Buscar creador..."
                  />
                )}

                {form.watch('entityType') === 'ExternalEntity' && (
                  <ExternalEntitySelect
                    value={form.watch('entityId')}
                    onValueChange={(val, name) => {
                      form.setValue('entityId', val);
                      if (name) form.setValue('entityName', name);
                    }}
                    placeholder="Buscar banco, socio, tercero..."
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Moneda
                </Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(val) => form.setValue('currency', val)}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1 space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monto
                </Label>
                <NumericInput
                  value={form.watch('totalAmount')}
                  onValueChange={(val) =>
                    form.setValue('totalAmount', val || 0)
                  }
                  className="text-lg font-bold text-primary"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Concepto / Nota
                </Label>
                <Input
                  {...form.register('notes')}
                  placeholder="Ej: Préstamo..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Origen
                </Label>
                <Input
                  value="Manual"
                  disabled
                  className="h-8 bg-muted/20 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Ref. Documento
                </Label>
                <Input
                  {...form.register('sourceReference')}
                  placeholder="Opcional"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Deuda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
