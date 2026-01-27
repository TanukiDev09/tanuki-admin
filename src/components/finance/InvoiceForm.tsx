'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent } from '@/components/ui/Card';
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { BookSelect } from '@/components/finance/BookSelect';
import InventorySettlementSelect from '@/components/finance/InventorySettlementSelect';
import { Trash2, Plus, Save, Book, Settings } from 'lucide-react';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { cn, formatCurrency } from '@/lib/utils';
import { BookResponse } from '@/types/book';
import DocumentUploader from './DocumentUploader';
import './InvoiceForm.scss';

const invoiceSchema = z.object({
  number: z.string().min(1, 'El número es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  dueDate: z.string().optional(),
  customerName: z.string().min(1, 'El cliente es requerido'),
  customerTaxId: z.string().optional(),
  items: z
    .array(
      z.object({
        type: z.enum(['libro', 'servicio']),
        description: z.string().min(1, 'Descripción requerida'),
        quantity: z.number().min(0, 'Cantidad inválida'),
        unitPrice: z.number().min(0, 'Precio inválido'),
        total: z.number(),
        bookId: z.string().optional(),
        costCenter: z.string().min(1, 'Centro de costo requerido'),
      })
    )
    .min(1, 'Debe agregar al menos un ítem'),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled']),
  costCenters: z.array(z.string()).optional(),
  inventoryMovement: z.string().optional(),
  notes: z.string().optional(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  fileUrl: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormValues> & { _id?: string };
  isEditing?: boolean;
}

export default function InvoiceForm({
  initialData,
  isEditing = false,
}: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      number: initialData?.number || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || '',
      customerName: initialData?.customerName || '',
      customerTaxId: initialData?.customerTaxId || '',
      items: initialData?.items || [
        {
          type: 'servicio',
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          costCenter: '',
        },
      ],
      status: initialData?.status || 'Draft',
      costCenters: initialData?.costCenters || [],
      inventoryMovement: initialData?.inventoryMovement || '',
      notes: initialData?.notes || '',
      subtotal: initialData?.subtotal || 0,
      tax: initialData?.tax || 0,
      total: initialData?.total || 0,
      fileUrl: initialData?.fileUrl || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = watchItems.reduce(
      (acc, item) => acc + (item.total || 0),
      0
    );
    const tax = 0; // Implement tax logic if needed, for now 0
    const total = subtotal + tax;

    form.setValue('subtotal', subtotal);
    form.setValue('tax', tax);
    form.setValue('total', total);
  }, [watchItems, form]);

  // Recalculate item total when quantity or price changes
  const handleItemChange = (
    index: number,
    field: 'quantity' | 'unitPrice',
    value: number
  ) => {
    const currentItem = form.getValues(`items.${index}`);
    const quantity = field === 'quantity' ? value : currentItem.quantity;
    const unitPrice = field === 'unitPrice' ? value : currentItem.unitPrice;

    form.setValue(`items.${index}.${field}`, value);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };

  const handleBookSelect = (index: number, book: BookResponse) => {
    form.setValue(`items.${index}.bookId`, book._id);
    form.setValue(`items.${index}.description`, book.title);
    form.setValue(`items.${index}.unitPrice`, book.price);
    form.setValue(`items.${index}.costCenter`, book.costCenter || '');

    // Trigger recalculation of total
    const quantity = form.getValues(`items.${index}.quantity`);
    form.setValue(`items.${index}.total`, quantity * book.price);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);
    try {
      const url =
        isEditing && initialData?._id
          ? `/api/invoices/${initialData._id}`
          : '/api/invoices';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      toast({
        title: 'Éxito',
        description: isEditing ? 'Factura actualizada' : 'Factura creada',
      });
      router.push('/dashboard/invoices');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="invoice-form">
      {/* General Information Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="invoice-form__grid-3">
            <div className="invoice-form__field">
              <Label>Número de Factura</Label>
              <Input
                {...form.register('number')}
                placeholder="FAC-001"
                disabled={isEditing}
              />
              {form.formState.errors.number && (
                <p className="invoice-form__error">
                  {form.formState.errors.number.message}
                </p>
              )}
            </div>

            <div className="invoice-form__field">
              <Label>Fecha Emisión</Label>
              <Input type="date" {...form.register('date')} />
            </div>

            <div className="invoice-form__field">
              <Label>Fecha Vencimiento</Label>
              <Input type="date" {...form.register('dueDate')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer & Classifications Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="invoice-form__grid-2">
            <div className="invoice-form__field">
              <Label>Cliente</Label>
              <Input
                {...form.register('customerName')}
                placeholder="Nombre del cliente"
              />
              {form.formState.errors.customerName && (
                <p className="invoice-form__error">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>

            <div className="invoice-form__field">
              <Label>NIT / CC</Label>
              <Input
                {...form.register('customerTaxId')}
                placeholder="Documento de identidad"
              />
            </div>
          </div>

          <div className="invoice-form__grid-2">
            <div className="invoice-form__field">
              <Label>Estado</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Borrador</SelectItem>
                      <SelectItem value="Sent">Enviada</SelectItem>
                      <SelectItem value="Paid">Pagada</SelectItem>
                      <SelectItem value="Partial">Parcial</SelectItem>
                      <SelectItem value="Cancelled">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="invoice-form__field">
              <Label>Liquidación Inventario (Opcional)</Label>
              <Controller
                control={form.control}
                name="inventoryMovement"
                render={({ field }) => (
                  <InventorySettlementSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <Controller
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <DocumentUploader
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <div className="p-6">
          <h3 className="invoice-form__section-title">Ítems de la Factura</h3>
          <div className="invoice-form__table-container">
            <table className="invoice-form__table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Tipo</th>
                  <th>Libro o Descripción</th>
                  <th style={{ width: '140px' }}>Centro de Costo</th>
                  <th style={{ width: '70px', textAlign: 'right' }}>Cant.</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>
                    Vr. Unitario
                  </th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const itemType = form.watch(`items.${index}.type`);
                  return (
                    <tr key={field.id}>
                      <td className="align-top pt-2">
                        <Controller
                          control={form.control}
                          name={`items.${index}.type` as const}
                          render={({ field: typeField }) => (
                            <div className="invoice-form__type-toggle">
                              <button
                                type="button"
                                onClick={() => typeField.onChange('libro')}
                                className={cn(
                                  'invoice-form__type-btn',
                                  typeField.value === 'libro' &&
                                    'invoice-form__type-btn--active'
                                )}
                                title="Libro"
                              >
                                <Book className="invoice-form__type-icon" />
                              </button>
                              <button
                                type="button"
                                onClick={() => typeField.onChange('servicio')}
                                className={cn(
                                  'invoice-form__type-btn',
                                  typeField.value === 'servicio' &&
                                    'invoice-form__type-btn--active'
                                )}
                                title="Servicio"
                              >
                                <Settings className="invoice-form__type-icon" />
                              </button>
                            </div>
                          )}
                        />
                      </td>
                      <td className="align-top">
                        {itemType === 'libro' ? (
                          <Controller
                            control={form.control}
                            name={`items.${index}.bookId` as const}
                            render={({ field: bookIdField }) => (
                              <BookSelect
                                value={bookIdField.value}
                                onSelect={(book) =>
                                  handleBookSelect(index, book)
                                }
                              />
                            )}
                          />
                        ) : (
                          <Input
                            {...form.register(
                              `items.${index}.description` as const
                            )}
                            className="invoice-form__table-input"
                            placeholder="Descripción del servicio..."
                          />
                        )}
                        {form.formState.errors.items?.[index]?.description && (
                          <p className="invoice-form__error invoice-form__error--xs px-2">
                            {
                              form.formState.errors.items[index]?.description
                                ?.message
                            }
                          </p>
                        )}
                      </td>
                      <td className="align-top">
                        <Controller
                          control={form.control}
                          name={`items.${index}.costCenter` as const}
                          render={({ field: ccField }) => (
                            <CostCenterSelect
                              value={ccField.value}
                              onValueChange={ccField.onChange}
                              hideLabel
                              allowCreation={false}
                            />
                          )}
                        />
                        {form.formState.errors.items?.[index]?.costCenter && (
                          <p className="invoice-form__error invoice-form__error--xs px-2">
                            {
                              form.formState.errors.items[index]?.costCenter
                                ?.message
                            }
                          </p>
                        )}
                      </td>
                      <td className="align-top">
                        <Controller
                          control={form.control}
                          name={`items.${index}.quantity` as const}
                          render={({ field: qField }) => (
                            <NumericInput
                              value={qField.value}
                              onValueChange={(val) =>
                                handleItemChange(index, 'quantity', Number(val))
                              }
                              className="invoice-form__table-input-right"
                            />
                          )}
                        />
                      </td>
                      <td className="align-top">
                        <Controller
                          control={form.control}
                          name={`items.${index}.unitPrice` as const}
                          render={({ field: pField }) => (
                            <NumericInput
                              value={pField.value}
                              onValueChange={(val) =>
                                handleItemChange(
                                  index,
                                  'unitPrice',
                                  Number(val)
                                )
                              }
                              className="invoice-form__table-input-right"
                            />
                          )}
                        />
                      </td>
                      <td className="align-top pt-2 text-right">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {formatCurrency(watchItems[index]?.total || 0, 'COP')}
                        </span>
                      </td>
                      <td className="align-top text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="invoice-form__remove-btn"
                        >
                          <Trash2 className="invoice-form__btn-icon" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="invoice-form__add-item">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  append({
                    type: 'servicio',
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    total: 0,
                    costCenter: '',
                  })
                }
              >
                <Plus className="invoice-form__btn-icon" /> Agregar Ítem
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer / Totals */}
      <div className="invoice-form__footer">
        <div className="invoice-form__notes">
          <Label>Notas Adicionales</Label>
          <Textarea
            {...form.register('notes')}
            placeholder="Observaciones, condiciones de pago, etc..."
          />
        </div>

        <div className="invoice-form__summary">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="invoice-form__summary-row">
                <span>Subtotal:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(form.watch('subtotal'), 'COP')}
                </span>
              </div>
              <div className="invoice-form__summary-row">
                <span>Impuestos (0%):</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(form.watch('tax'), 'COP')}
                </span>
              </div>

              <div className="invoice-form__summary-row invoice-form__summary-row--total">
                <span>Total:</span>
                <span>{formatCurrency(form.watch('total'), 'COP')}</span>
              </div>

              <div className="invoice-form__actions">
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />{' '}
                      {isEditing ? 'Actualizar Factura' : 'Guardar Factura'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
