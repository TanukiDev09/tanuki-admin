'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

const entitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  taxId: z.string().optional(),
  type: z.enum(['Socio', 'Banco', 'Persona Natural', 'Proveedor', 'Otro']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type EntityFormValues = z.infer<typeof entitySchema>;

interface ExternalEntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (entity: { _id: string; name: string }) => void;
}

export function ExternalEntityModal({
  open,
  onOpenChange,
  onSuccess
}: ExternalEntityModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      type: 'Persona Natural',
      name: '',
      taxId: '',
    },
  });

  const onSubmit = async (data: EntityFormValues) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        taxId: data.taxId,
        type: data.type,
        contactInfo: {
          email: data.email,
          phone: data.phone,
          address: data.address
        }
      };

      const res = await fetch('/api/external-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al crear entidad');

      const result = await res.json();

      toast({ title: 'Éxito', description: 'Entidad creada correctamente' });
      queryClient.invalidateQueries({ queryKey: ['external-entities'] });

      if (onSuccess) onSuccess(result.data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la entidad externa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Entidad Externa</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre / Razón Social</Label>
            <Input id="name" {...form.register('name')} placeholder="Nombre completo" />
            {form.formState.errors.name && <p className="text-xs text-rose-500">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Tercero</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(val: 'Socio' | 'Banco' | 'Persona Natural' | 'Proveedor' | 'Otro') => form.setValue('type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Persona Natural">Persona Natural</SelectItem>
                  <SelectItem value="Socio">Socio / Accionista</SelectItem>
                  <SelectItem value="Banco">Banco / Entidad Fin.</SelectItem>
                  <SelectItem value="Proveedor">Proveedor</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">NIT / Documento</Label>
              <Input id="taxId" {...form.register('taxId')} placeholder="C.C. o NIT" />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold text-slate-700">Información de Contacto</h4>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input {...form.register('email')} type="email" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input {...form.register('phone')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dirección</Label>
              <Input {...form.register('address')} />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Tercero'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
