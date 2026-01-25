'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { IPointOfSale } from '@/models/PointOfSale';
import { Plus, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './PointOfSaleForm.scss';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  // code removed: auto-generated
  identificationType: z.enum(['NIT', 'CC', 'CE', 'TI', 'PP']).optional(),
  identificationNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phones: z.array(z.string()).default([]),
  emails: z
    .array(z.string().email('Email inválido').or(z.literal('')))
    .default([]),
  managers: z.array(z.string()).default([]),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        email: z.string().email('Email inválido').or(z.literal('')).optional(),
        phone: z.string().optional(),
        position: z.string().optional(),
      })
    )
    .default([]),
  status: z.enum(['active', 'inactive']),
  type: z.enum(['physical', 'online', 'event']),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface PointOfSaleFormProps {
  initialData?: Omit<
    Partial<IPointOfSale>,
    'warehouseId' | 'createdAt' | 'updatedAt' | '_id'
  > & {
    _id?: string;
    warehouseId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  onSuccess?: () => void;
  readOnly?: boolean;
}

const normalizeArrayData = (
  data: Record<string, unknown> | undefined,
  fieldName: string,
  legacyField: string
): string[] => {
  const list = data?.[fieldName];
  if (Array.isArray(list) && list.length > 0) {
    return list.map((item) => String(item));
  }
  const legacyVal = data?.[legacyField];
  if (legacyVal && typeof legacyVal === 'string') {
    return [legacyVal];
  }
  return [];
};

export function PointOfSaleForm({
  initialData,
  onSuccess,
  readOnly: propReadOnly,
}: PointOfSaleFormProps) {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.POINTS_OF_SALE,
    PermissionAction.UPDATE
  );
  const readOnly = propReadOnly ?? !canUpdate;

  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Normalize initial data for arrays if they come as strings (migration safety)
  // or empty arrays
  const defaultPhones = normalizeArrayData(initialData, 'phones', 'phone');
  const defaultEmails = normalizeArrayData(initialData, 'emails', 'email');
  const defaultManagers = normalizeArrayData(
    initialData,
    'managers',
    'manager'
  );

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      identificationType:
        (initialData?.identificationType as FormValues['identificationType']) ||
        undefined,
      identificationNumber: initialData?.identificationNumber || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      phones: defaultPhones,
      emails: defaultEmails,
      managers: defaultManagers,
      contacts: (initialData?.contacts as FormValues['contacts']) || [],
      status: (initialData?.status as 'active' | 'inactive') || 'active',
      type:
        (initialData?.type as 'physical' | 'online' | 'event') || 'physical',
      discountPercentage: initialData?.discountPercentage || 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      const phones = normalizeArrayData(initialData, 'phones', 'phone');
      const emails = normalizeArrayData(initialData, 'emails', 'email');
      const managers = normalizeArrayData(initialData, 'managers', 'manager');

      form.reset({
        name: initialData.name || '',
        identificationType:
          (initialData.identificationType as FormValues['identificationType']) ||
          undefined,
        identificationNumber: initialData.identificationNumber || '',
        address: initialData.address || '',
        city: initialData.city || '',
        phones: phones,
        emails: emails,
        managers: managers,
        contacts: (initialData.contacts as FormValues['contacts']) || [],
        status: (initialData.status as 'active' | 'inactive') || 'active',
        type:
          (initialData.type as 'physical' | 'online' | 'event') || 'physical',
        discountPercentage: initialData.discountPercentage || 0,
      });
    }
  }, [initialData, form]);

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control: form.control,
    name: 'phones',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control: form.control,
    name: 'emails',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const {
    fields: managerFields,
    append: appendManager,
    remove: removeManager,
  } = useFieldArray({
    control: form.control,
    name: 'managers',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Clean up empty array items
      const cleanData = {
        ...data,
        phones: data.phones.filter((p) => p.trim() !== ''),
        emails: data.emails.filter((e) => e.trim() !== ''),
        managers: data.managers.filter((m) => m.trim() !== ''),
        contacts: data.contacts.filter((c) => c.name.trim() !== ''),
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

  // ... (imports remain)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pos-form">
        {/* Basic Info */}
        <div className="pos-form__grid">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tienda Principal"
                    {...field}
                    disabled={loading || readOnly}
                  />
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
                  disabled={loading || readOnly}
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
                  <Input
                    placeholder="900123456"
                    {...field}
                    disabled={loading || readOnly}
                  />
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
                  disabled={loading || readOnly}
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
                  disabled={loading || readOnly}
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
                  <Input
                    placeholder="Av. Siempre Viva 123"
                    {...field}
                    disabled={loading || readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porcentaje de Descuento (%)</FormLabel>
                <FormControl>
                  <NumericInput
                    id="discountPercentage"
                    placeholder="0"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading || readOnly}
                  />
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
                  <Input
                    placeholder="Bogotá"
                    {...field}
                    disabled={loading || readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Arrays Section */}
        <div className="pos-form__arrays-grid">
          {/* Phones */}
          {/* Phones */}
          <div className="pos-form__array-column">
            <FormLabel className="pos-form__array-header">
              Teléfonos
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPhone('')}
                >
                  <Plus className="pos-form__icon-sm pos-form__icon--mr" />{' '}
                  Agregar
                </Button>
              )}
            </FormLabel>
            {phoneFields.map((field, index) => (
              <div key={field.id} className="pos-form__array-row">
                <FormField
                  control={form.control}
                  name={`phones.${index}`}
                  render={({ field }) => (
                    <FormItem className="pos-form__array-input-wrapper">
                      <FormControl>
                        <Input
                          placeholder="Teléfono"
                          {...field}
                          disabled={loading || readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="pos-form__remove-btn"
                    onClick={() => removePhone(index)}
                    disabled={phoneFields.length === 1 && index === 0}
                  >
                    <Trash2 className="pos-form__icon-md" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Emails */}
          <div className="pos-form__array-column">
            <FormLabel className="pos-form__array-header">
              Correos
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendEmail('')}
                >
                  <Plus className="pos-form__icon-sm pos-form__icon--mr" />{' '}
                  Agregar
                </Button>
              )}
            </FormLabel>
            {emailFields.map((field, index) => (
              <div key={field.id} className="pos-form__array-row">
                <FormField
                  control={form.control}
                  name={`emails.${index}`}
                  render={({ field }) => (
                    <FormItem className="pos-form__array-input-wrapper">
                      <FormControl>
                        <Input
                          placeholder="Email"
                          {...field}
                          disabled={loading || readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="pos-form__remove-btn"
                    onClick={() => removeEmail(index)}
                    disabled={emailFields.length === 1 && index === 0}
                  >
                    <Trash2 className="pos-form__icon-md" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Managers */}
          <div className="pos-form__array-column">
            <FormLabel className="pos-form__array-header">
              Encargados
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendManager('')}
                >
                  <Plus className="pos-form__icon-sm pos-form__icon--mr" />{' '}
                  Agregar
                </Button>
              )}
            </FormLabel>
            {managerFields.map((field, index) => (
              <div key={field.id} className="pos-form__array-row">
                <FormField
                  control={form.control}
                  name={`managers.${index}`}
                  render={({ field }) => (
                    <FormItem className="pos-form__array-input-wrapper">
                      <FormControl>
                        <Input
                          placeholder="Nombre"
                          {...field}
                          disabled={loading || readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="pos-form__remove-btn"
                    onClick={() => removeManager(index)}
                    disabled={managerFields.length === 1 && index === 0}
                  >
                    <Trash2 className="pos-form__icon-md" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pos-form__actions">
          {!readOnly && (
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
            </Button>
          )}
        </div>
      </form >
    </Form >
  );
}
