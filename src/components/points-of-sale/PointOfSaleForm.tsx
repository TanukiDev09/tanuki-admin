'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { IPointOfSale } from '@/models/PointOfSale';
import { Plus, Trash2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  // code removed: auto-generated
  identificationType: z.enum(['NIT', 'CC', 'CE', 'TI', 'PP']).optional(),
  identificationNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phones: z.array(z.string()).optional(),
  emails: z.array(z.string().email('Email inválido').or(z.literal(''))).optional(),
  managers: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']),
  type: z.enum(['physical', 'online', 'event']),
});

type FormValues = z.infer<typeof formSchema>;

interface PointOfSaleFormProps {
  initialData?: Partial<IPointOfSale> & { _id?: string };
  onSuccess?: () => void;
}

const normalizeArrayData = (data: Record<string, unknown> | undefined, fieldName: string, legacyField: string): string[] => {
  const list = data?.[fieldName];
  if (Array.isArray(list) && list.length > 0) {
    return list.map(item => String(item));
  }
  const legacyVal = data?.[legacyField];
  if (legacyVal && typeof legacyVal === 'string') {
    return [legacyVal];
  }
  return [];
};

export function PointOfSaleForm({ initialData, onSuccess }: PointOfSaleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Normalize initial data for arrays if they come as strings (migration safety)
  // or empty arrays
  const defaultPhones = normalizeArrayData(initialData, 'phones', 'phone');
  const defaultEmails = normalizeArrayData(initialData, 'emails', 'email');
  const defaultManagers = normalizeArrayData(initialData, 'managers', 'manager');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      identificationType: (initialData?.identificationType as FormValues['identificationType']) || undefined,
      identificationNumber: initialData?.identificationNumber || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      phones: defaultPhones,
      emails: defaultEmails,
      managers: defaultManagers,
      status: (initialData?.status as 'active' | 'inactive') || 'active',
      type: (initialData?.type as 'physical' | 'online' | 'event') || 'physical',
    },
  });

  useEffect(() => {
    if (initialData) {
      const phones = normalizeArrayData(initialData, 'phones', 'phone');
      const emails = normalizeArrayData(initialData, 'emails', 'email');
      const managers = normalizeArrayData(initialData, 'managers', 'manager');

      form.reset({
        name: initialData.name || '',
        identificationType: (initialData.identificationType as FormValues['identificationType']) || undefined,
        identificationNumber: initialData.identificationNumber || '',
        address: initialData.address || '',
        city: initialData.city || '',
        phones: phones,
        emails: emails,
        managers: managers,
        status: (initialData.status as 'active' | 'inactive') || 'active',
        type: (initialData.type as 'physical' | 'online' | 'event') || 'physical',
      });
    }
  }, [initialData, form]);

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    // @ts-expect-error - Hook form type inference issue with nested arrays in zod
    name: "phones",
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    // @ts-expect-error - Hook form type inference issue with nested arrays in zod
    name: "emails",
  });

  const { fields: managerFields, append: appendManager, remove: removeManager } = useFieldArray({
    control: form.control,
    // @ts-expect-error - Hook form type inference issue with nested arrays in zod
    name: "managers",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Clean up empty array items
      const cleanData = {
        ...data,
        phones: data.phones?.filter(p => p.trim() !== '') || [],
        emails: data.emails?.filter(e => e.trim() !== '') || [],
        managers: data.managers?.filter(m => m.trim() !== '') || [],
      };

      const url = initialData?._id
        ? `/api/points-of-sale/${initialData._id}`
        : '/api/points-of-sale';
      const method = initialData?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      toast({
        title: 'Éxito',
        description: `Punto de venta ${initialData?._id ? 'actualizado' : 'creado'} correctamente`,
      });

      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Tienda Principal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Code field removed */}

          <FormField
            control={form.control}
            name="identificationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Identificación</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="PP">PP</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="identificationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Identificación</FormLabel>
                <FormControl>
                  <Input placeholder="900123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Siempre Viva 123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Bogotá" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Arrays Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

          {/* Phones */}
          <div className="space-y-2">
            <FormLabel className="flex justify-between items-center">
              Teléfonos
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPhone("")}
              >
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            </FormLabel>
            {phoneFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`phones.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => removePhone(index)}
                  disabled={phoneFields.length === 1 && index === 0} // Keep at least one or allow empty? Let's allow empty if user removes all
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Emails */}
          <div className="space-y-2">
            <FormLabel className="flex justify-between items-center">
              Correos
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendEmail("")}
              >
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            </FormLabel>
            {emailFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`emails.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => removeEmail(index)}
                  disabled={emailFields.length === 1 && index === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Managers */}
          <div className="space-y-2">
            <FormLabel className="flex justify-between items-center">
              Encargados
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendManager("")}
              >
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            </FormLabel>
            {managerFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`managers.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => removeManager(index)}
                  disabled={managerFields.length === 1 && index === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
