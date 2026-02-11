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
import CostCenterSelect from '@/components/admin/CostCenterSelect/CostCenterSelect';
import { BookSelect } from '@/components/finance/BookSelect';
import InventorySettlementSelect from '@/components/finance/InventorySettlementSelect';
import { Trash2, Plus, Save, Book, Settings, FileText, User, ShoppingBag, Info, ShieldCheck, ArrowLeft } from 'lucide-react';
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
        discount: z.number(),
        total: z.number(),
        bookId: z.string().optional(),
        costCenter: z.string().min(1, 'Centro de costo requerido'),
      })
    )
    .min(1, 'Debe agregar al menos un ítem'),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Partial', 'Cancelled', 'Unchecked']),
  costCenters: z.array(z.string()).optional(),
  inventoryMovement: z.string().optional(),
  notes: z.string().optional(),
  subtotal: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
  fileUrl: z.string().optional(),
  currency: z.string().optional().default('COP'),
  exchangeRate: z.number().optional(),
  amountInCOP: z.number().optional(),
  // DIAN fields
  cufe: z.string().optional(),
  orderReference: z.string().optional(),
  newsletterSignup: z.boolean().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerDocumentType: z.string().optional(),
  dianData: z.object({
    invoiceAuthorization: z.string().optional(),
    authorizationPeriod: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    softwareProvider: z.string().optional(),
    softwareId: z.string().optional(),
    validationResponse: z.object({
      code: z.string().optional(),
      description: z.string().optional(),
      validatedAt: z.string().optional(),
    }).optional(),
  }).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormValues> & { _id?: string };
  isEditing?: boolean;
  onSuccess?: (data: unknown) => void;
  onCancel?: () => void;
}

export default function InvoiceForm({
  initialData,
  isEditing = false,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const normalizeDocType = (val: string | undefined): string => {
    if (!val) return '13';
    const upperVal = val.toString().toUpperCase();
    if (upperVal === '1' || upperVal === 'CC') return '13';
    if (upperVal === '3' || upperVal === '4' || upperVal === 'NIT') return '31';
    if (upperVal === '2' || upperVal === 'CE') return '22';
    if (upperVal === 'PASAPORTE') return '41';
    return val;
  };

  const defaultValues: InvoiceFormValues = {
    number: initialData?.number || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    customerName: initialData?.customerName || '',
    customerTaxId: initialData?.customerTaxId || '',
    items: initialData?.items?.map((item) => ({
      type: item.type || 'servicio',
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      discount: item.discount || 0,
      total: item.total || 0,
      bookId: item.bookId || undefined,
      costCenter: item.costCenter || '',
    })) || [
        {
          type: 'servicio',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          total: 0,
          costCenter: '',
        },
      ],
    status: initialData?.status || 'Unchecked',
    costCenters: initialData?.costCenters || [],
    inventoryMovement: initialData?.inventoryMovement || '',
    notes: initialData?.notes || '',
    subtotal: initialData?.subtotal || 0,
    tax: initialData?.tax || 0,
    discount: initialData?.discount || 0,
    total: initialData?.total || 0,
    fileUrl: initialData?.fileUrl || '',
    currency: initialData?.currency || 'COP',
    exchangeRate: initialData?.exchangeRate || 1,
    amountInCOP: initialData?.amountInCOP || initialData?.total || 0,
    cufe: initialData?.cufe || '',
    orderReference: initialData?.orderReference || '',
    newsletterSignup: initialData?.newsletterSignup || false,
    customerEmail: initialData?.customerEmail || '',
    customerPhone: initialData?.customerPhone || '',
    customerAddress: initialData?.customerAddress || '',
    customerCity: initialData?.customerCity || '',
    customerDocumentType: normalizeDocType(initialData?.customerDocumentType),
    dianData: {
      invoiceAuthorization: initialData?.dianData?.invoiceAuthorization || '',
      authorizationPeriod: {
        start: initialData?.dianData?.authorizationPeriod?.start || '',
        end: initialData?.dianData?.authorizationPeriod?.end || '',
      },
      softwareProvider: initialData?.dianData?.softwareProvider || '',
      softwareId: initialData?.dianData?.softwareId || '',
      validationResponse: {
        code: initialData?.dianData?.validationResponse?.code || '',
        description: initialData?.dianData?.validationResponse?.description || '',
        validatedAt: initialData?.dianData?.validationResponse?.validatedAt || '',
      },
    },
  };

  const form = useForm<InvoiceFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  const watchDocDiscount = form.watch('discount');
  const watchTax = form.watch('tax');
  const watchTotal = form.watch('total');
  const watchExchangeRate = form.watch('exchangeRate');

  useEffect(() => {
    const subtotal = watchItems?.reduce((acc, item) => acc + (item?.total || 0), 0) || 0;
    const total = subtotal - (watchDocDiscount || 0) + (watchTax || 0);

    form.setValue('subtotal', subtotal);
    form.setValue('total', total);
  }, [watchItems, watchDocDiscount, watchTax, form]);

  useEffect(() => {
    const amountInCOP = (watchTotal || 0) * (watchExchangeRate || 1);
    form.setValue('amountInCOP', amountInCOP);
  }, [watchTotal, watchExchangeRate, form]);

  const handleItemChange = (index: number, field: 'quantity' | 'unitPrice' | 'discount', value: number) => {
    const currentItem = form.getValues(`items.${index}`);
    const quantity = field === 'quantity' ? value : currentItem.quantity;
    const unitPrice = field === 'unitPrice' ? value : currentItem.unitPrice;
    const discount = field === 'discount' ? value : currentItem.discount;

    form.setValue(`items.${index}.${field}`, value);
    form.setValue(`items.${index}.total`, (quantity * unitPrice) - discount);
  };

  const handleBookSelect = (index: number, book: BookResponse) => {
    form.setValue(`items.${index}.bookId`, book._id);

    // Only update description if it's currently empty or generic
    const currentDesc = form.getValues(`items.${index}.description`);
    if (!currentDesc || currentDesc.trim() === '' || currentDesc === 'Unknown') {
      form.setValue(`items.${index}.description`, book.title);
    }

    // Only update cost center if it's not set
    const currentCC = form.getValues(`items.${index}.costCenter`);
    if (!currentCC && book.costCenter) {
      form.setValue(`items.${index}.costCenter`, book.costCenter);
    }

    // CRITICAL: Never overwrite unitPrice, discount or total from catalog prices for Invoices.
    // The XML or the previous value is the single source of truth.
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);
    try {
      const url = isEditing && initialData?._id ? `/api/invoices/${initialData._id}` : '/api/invoices';
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

      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push('/dashboard/invoices');
        router.refresh();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="invoice-form">
      <div className="invoice-form__container">
        <main className="invoice-form__main">
          {/* General Information Card */}
          <div className="invoice-form__card">
            <header className="invoice-form__header">
              <FileText className="invoice-form__header-icon" />
              <h2 className="invoice-form__header-title">Información de Factura</h2>
            </header>
            <div className="invoice-form__grid invoice-form__grid--3col">
              <div className="invoice-form__field">
                <Label>Número de Factura</Label>
                <Input {...form.register('number')} placeholder="FAC-000" disabled={isEditing} />
                {form.formState.errors.number && <p className="invoice-form__error">{form.formState.errors.number.message}</p>}
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

            <div className="invoice-form__grid invoice-form__grid--3col border-t pt-6 mt-6">
              <div className="invoice-form__field">
                <Label>Moneda</Label>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
                        <SelectItem value="USD">USD (Dólar Americano)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (Libra Esterlina)</SelectItem>
                        <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="invoice-form__field">
                <Label>Tasa de Cambio (→ COP)</Label>
                <Controller
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <NumericInput
                      value={field.value}
                      onValueChange={(v) => field.onChange(Number(v))}
                      placeholder="1.0"
                    />
                  )}
                />
              </div>
              <div className="invoice-form__field">
                <Label>Total en COP (Calculado)</Label>
                <div className="h-[48px] flex items-center px-4 bg-muted/30 rounded-md font-mono font-bold text-primary border border-dashed border-primary/20">
                  {formatCurrency(form.watch('amountInCOP') || 0, 'COP')}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Card */}
          <div className="invoice-form__card">
            <header className="invoice-form__header">
              <User className="invoice-form__header-icon" />
              <h2 className="invoice-form__header-title">Detalles del Cliente</h2>
            </header>
            <div className="invoice-form__grid">
              <div className="invoice-form__field">
                <Label>Razón Social / Nombre</Label>
                <Input {...form.register('customerName')} placeholder="Nombre completo" />
                {form.formState.errors.customerName && <p className="invoice-form__error">{form.formState.errors.customerName.message}</p>}
              </div>
              <div className="invoice-form__field">
                <Label>Identificación</Label>
                <div className="flex gap-2">
                  <div className="w-28 flex-shrink-0">
                    <Controller
                      control={form.control}
                      name="customerDocumentType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="13">Cédula</SelectItem>
                            <SelectItem value="31">NIT</SelectItem>
                            <SelectItem value="22">C. Extranjería</SelectItem>
                            <SelectItem value="41">Pasaporte</SelectItem>
                            <SelectItem value="11">R. Civil</SelectItem>
                            <SelectItem value="12">T. Identidad</SelectItem>
                            <SelectItem value="PEP">PEP</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Input {...form.register('customerTaxId')} placeholder="Documento" className="flex-1" />
                </div>
              </div>
              <div className="invoice-form__field">
                <Label>Correo Electrónico</Label>
                <Input {...form.register('customerEmail')} type="email" placeholder="email@ejemplo.com" />
              </div>
              <div className="invoice-form__field">
                <Label>Teléfono</Label>
                <Input {...form.register('customerPhone')} placeholder="300 000 0000" />
              </div>
              <div className="invoice-form__field">
                <Label>Dirección</Label>
                <Input {...form.register('customerAddress')} placeholder="Calle 123 # 45-67" />
              </div>
              <div className="invoice-form__field">
                <Label>Ciudad</Label>
                <Input {...form.register('customerCity')} placeholder="Bogotá, D.C." />
              </div>
            </div>
            <div className="invoice-form__newsletter">
              <label>
                <input type="checkbox" {...form.register('newsletterSignup')} />
                <span>Aceptar envío de newsletter y comunicaciones</span>
              </label>
            </div>
          </div>

          {/* Items Card */}
          <div className="invoice-form__card">
            <header className="invoice-form__header">
              <ShoppingBag className="invoice-form__header-icon" />
              <h2 className="invoice-form__header-title">Conceptos y Productos</h2>
              <div className="ml-auto">
                <Button type="button" variant="ghost" size="sm" onClick={() => append({ type: 'servicio', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0, costCenter: '' })} className="hover:bg-primary/10 text-primary">
                  <Plus className="w-4 h-4 mr-2" /> Agregar Item
                </Button>
              </div>
            </header>
            <div className="invoice-form__items-wrapper">
              <table className="invoice-form__table">
                <thead>
                  <tr>
                    <th className="w-20">Tipo</th>
                    <th>Descripción</th>
                    <th className="w-40">C. Costo</th>
                    <th className="w-24 text-right">Cant.</th>
                    <th className="w-32 text-right">Precio</th>
                    <th className="w-28 text-right">Desc.</th>
                    <th className="w-36 text-right">Total</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const itemType = form.watch(`items.${index}.type`);
                    return (
                      <tr key={field.id}>
                        <td data-label="Tipo">
                          <Controller
                            control={form.control}
                            name={`items.${index}.type` as const}
                            render={({ field: typeField }) => (
                              <div className="invoice-form__type-toggle">
                                <button
                                  type="button"
                                  onClick={() => typeField.onChange('libro')}
                                  className={cn('invoice-form__type-toggle-btn', typeField.value === 'libro' && 'invoice-form__type-toggle-btn--active')}
                                >
                                  <Book />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => typeField.onChange('servicio')}
                                  className={cn('invoice-form__type-toggle-btn', typeField.value === 'servicio' && 'invoice-form__type-toggle-btn--active')}
                                >
                                  <Settings />
                                </button>
                              </div>
                            )}
                          />
                        </td>
                        <td data-label="Descripción">
                          {itemType === 'libro' ? (
                            <Controller control={form.control} name={`items.${index}.bookId` as const} render={({ field: bField }) => (
                              <BookSelect value={bField.value} onSelect={(b) => handleBookSelect(index, b)} />
                            )} />
                          ) : (
                            <Input {...form.register(`items.${index}.description` as const)} placeholder="Referencia..." />
                          )}
                        </td>
                        <td data-label="C. Costo">
                          <Controller control={form.control} name={`items.${index}.costCenter` as const} render={({ field: ccField }) => (
                            <CostCenterSelect value={ccField.value} onValueChange={ccField.onChange} hideLabel allowCreation={false} />
                          )} />
                        </td>
                        <td data-label="Cant.">
                          <Controller control={form.control} name={`items.${index}.quantity` as const} render={({ field: qField }) => (
                            <NumericInput value={qField.value} onValueChange={(v) => handleItemChange(index, 'quantity', Number(v))} className="text-right" />
                          )} />
                        </td>
                        <td data-label="Precio">
                          <Controller control={form.control} name={`items.${index}.unitPrice` as const} render={({ field: pField }) => (
                            <NumericInput value={pField.value} onValueChange={(v) => handleItemChange(index, 'unitPrice', Number(v))} className="text-right font-medium" />
                          )} />
                        </td>
                        <td data-label="Desc.">
                          <Controller control={form.control} name={`items.${index}.discount` as const} render={({ field: dField }) => (
                            <NumericInput value={dField.value} onValueChange={(v) => handleItemChange(index, 'discount', Number(v))} className="text-right text-destructive font-semibold" />
                          )} />
                        </td>
                        <td data-label="Subtotal" className="text-right font-bold text-primary">
                          {formatCurrency(watchItems[index]?.total || 0, form.watch('currency'))}
                        </td>
                        <td>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {fields.length === 0 && <div className="p-12 text-center text-muted-foreground font-medium bg-muted/5">No has agregado conceptos a esta factura.</div>}
            </div>
          </div>

          {/* Bottom Sections Row */}
          <div className="invoice-form__cards-row">
            <div className="invoice-form__card">
              <header className="invoice-form__header">
                <Info className="invoice-form__header-icon" />
                <h2 className="invoice-form__header-title">Vínculos</h2>
              </header>
              <div className="invoice-form__grid">
                <div className="invoice-form__field">
                  <Label>Liq. de Inventario</Label>
                  <Controller control={form.control} name="inventoryMovement" render={({ field }) => (
                    <InventorySettlementSelect value={field.value} onValueChange={field.onChange} />
                  )} />
                </div>
                <div className="invoice-form__field">
                  {/* The DocumentUploader already has its own internal label */}
                  <Controller control={form.control} name="fileUrl" render={({ field }) => (
                    <DocumentUploader value={field.value} onChange={field.onChange} onRemove={() => field.onChange('')} />
                  )} />
                </div>
              </div>
            </div>
            <div className="invoice-form__card">
              <header className="invoice-form__header">
                <Settings className="invoice-form__header-icon" />
                <h2 className="invoice-form__header-title">Metadatos</h2>
              </header>
              <div className="invoice-form__grid">
                <div className="invoice-form__field">
                  <Label>Ref. de Orden</Label>
                  <Input {...form.register('orderReference')} placeholder="N° Pedido Interno" />
                </div>
                <div className="invoice-form__field">
                  <Label>CUFE (DIAN)</Label>
                  <Input {...form.register('cufe')} placeholder="UUID de la factura electrónica" className="font-mono text-[10px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-form__card">
            <header className="invoice-form__header">
              <FileText className="invoice-form__header-icon" />
              <h2 className="invoice-form__header-title">Observaciones Internas</h2>
            </header>
            <div className="p-6">
              <Textarea {...form.register('notes')} placeholder="Escribe aquí notas adicionales para administración..." className="min-h-[120px]" />
            </div>
          </div>
        </main>

        <aside className="invoice-form__sidebar">
          <div className="invoice-form__summary-card">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 opacity-70">Liquidación Final</h3>
            <div className="space-y-4">
              <div className="summary-row">
                <span>Total Líneas</span>
                <span className="font-bold">{formatCurrency(form.watch('subtotal'), form.watch('currency'))}</span>
              </div>
              <div className="summary-row">
                <span>Descuento Global</span>
                <div className="summary-input">
                  <Controller control={form.control} name="discount" render={({ field }) => (
                    <NumericInput value={field.value} onValueChange={field.onChange} />
                  )} />
                </div>
              </div>
              <div className="summary-row">
                <span>Impuestos Aplicados</span>
                <div className="summary-input">
                  <Controller control={form.control} name="tax" render={({ field }) => (
                    <NumericInput value={field.value} onValueChange={field.onChange} />
                  )} />
                </div>
              </div>

              <div className="summary-row summary-row--total">
                <div className="flex flex-col">
                  <span className="label">Gran Total ({form.watch('currency')})</span>
                  <span className="value">{formatCurrency(form.watch('total'), form.watch('currency'))}</span>
                  {form.watch('currency') !== 'COP' && (
                    <span className="text-[10px] mt-2 opacity-60 font-mono">
                      ≈ {formatCurrency(form.watch('amountInCOP') || 0, 'COP')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-form__actions-container">
            <div className="invoice-form__status-selector">
              <label>Estado de Gestión</label>
              <Controller control={form.control} name="status" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-none bg-transparent shadow-none px-0 h-auto font-bold text-primary">
                    <SelectValue placeholder="Borrador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Borrador</SelectItem>
                    <SelectItem value="Unchecked">Sin comprobar</SelectItem>
                    <SelectItem value="Sent">Enviada</SelectItem>
                    <SelectItem value="Paid">Pagada</SelectItem>
                    <SelectItem value="Partial">Parcial</SelectItem>
                    <SelectItem value="Cancelled">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            <button type="submit" disabled={loading} className="invoice-form__submit-btn">
              {loading ? 'Sincronizando...' : <><Save /> {isEditing ? 'Actualizar Factura' : 'Guardar Factura'}</>}
            </button>

            <Button type="button" variant="ghost" onClick={() => (onCancel ? onCancel() : router.back())} className="w-full text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar y Volver
            </Button>
          </div>

          {/* DIAN Metadata Panel Overlay */}
          {(form.watch('dianData.invoiceAuthorization') || form.watch('cufe')) && (
            <div className="mt-8 p-6 rounded-3xl border-2 border-primary/10 bg-primary/[0.02]">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Firma Electrónica DIAN</span>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">ID Autorización</span>
                  <code className="text-[10px] bg-white p-2 rounded-lg border border-primary/10 truncate font-mono">{form.watch('dianData.invoiceAuthorization')}</code>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Estado Validación</span>
                  <p className="text-[10px] bg-white p-2 rounded-lg border border-primary/10 leading-relaxed italic">
                    <span className="font-bold text-primary">[{form.watch('dianData.validationResponse.code')}]</span> {form.watch('dianData.validationResponse.description')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </form>
  );
}
