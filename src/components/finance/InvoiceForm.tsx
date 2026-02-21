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
import { Trash2, Plus, Save, Book, Settings, FileText, User, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { cn, formatCurrency } from '@/lib/utils';
import { BookResponse } from '@/types/book';
import DocumentUploader from './DocumentUploader';
import './invoice-form.scss';

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

    // Auto-assign cost center if the book has one
    if (book.costCenter) {
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
                <Label className="invoice-form__label">Número de Factura</Label>
                <Input {...form.register('number')} placeholder="FAC-000" disabled={isEditing} />
                {form.formState.errors.number && <p className="invoice-form__error">{form.formState.errors.number.message}</p>}
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Fecha Emisión</Label>
                <Input type="date" {...form.register('date')} />
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Fecha Vencimiento</Label>
                <Input type="date" {...form.register('dueDate')} />
              </div>
            </div>

            <div className="invoice-form__grid invoice-form__grid--3col">
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Moneda</Label>
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
                <Label className="invoice-form__label">Tasa de Cambio (→ COP)</Label>
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
                <Label className="invoice-form__label">Total en COP</Label>
                <div className="invoice-form__amount-display">
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
            <div className="invoice-form__grid invoice-form__grid--3col">
              <div className="invoice-form__field invoice-form__field--2col">
                <Label className="invoice-form__label">Razón Social / Nombre</Label>
                <Input {...form.register('customerName')} placeholder="Nombre completo" />
                {form.formState.errors.customerName && <p className="invoice-form__error">{form.formState.errors.customerName.message}</p>}
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Identificación</Label>
                <div className="invoice-form__doc-type-group">
                  <div className="invoice-form__doctype-select">
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
                  <Input {...form.register('customerTaxId')} placeholder="Documento" />
                </div>
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Correo Electrónico</Label>
                <Input {...form.register('customerEmail')} type="email" placeholder="email@ejemplo.com" />
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Teléfono</Label>
                <Input {...form.register('customerPhone')} placeholder="300 000 0000" />
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Ciudad</Label>
                <Input {...form.register('customerCity')} placeholder="Bogotá, D.C." />
              </div>
              <div className="invoice-form__field invoice-form__field--3col">
                <Label className="invoice-form__label">Dirección</Label>
                <Input {...form.register('customerAddress')} placeholder="Calle 123 # 45-67" />
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
              <button type="button" onClick={() => append({ type: 'servicio', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0, costCenter: '' })} className="invoice-form__add-item-btn">
                <Plus /> Agregar Item
              </button>
            </header>
            <div className="invoice-form__items-list">
              {fields.map((field, index) => {
                const itemType = form.watch(`items.${index}.type`);
                return (
                  <div key={field.id} className="invoice-form__item-row">
                    {/* Line 1: Type icon, Description/Select, Trash */}
                    <div className="invoice-form__item-main">
                      <div className="invoice-form__item-type">
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
                      </div>

                      <div className="invoice-form__item-desc">
                        {itemType === 'libro' ? (
                          <Controller
                            control={form.control}
                            name={`items.${index}.bookId` as const}
                            render={({ field: bField }) => (
                              <BookSelect value={bField.value} onSelect={(b) => handleBookSelect(index, b)} />
                            )}
                          />
                        ) : (
                          <Input
                            {...form.register(`items.${index}.description` as const)}
                            placeholder="Descripción del servicio o producto..."
                            className="bg-transparent border-none shadow-none focus:ring-0 p-0 h-auto font-medium"
                          />
                        )}
                      </div>

                      <button type="button" onClick={() => remove(index)} className="invoice-form__item-remove">
                        <Trash2 />
                      </button>
                    </div>

                    {/* Line 2: Cost Center and Financials */}
                    <div className="invoice-form__item-details">
                      <div className="invoice-form__item-detail invoice-form__item-detail--cc">
                        <Label className="invoice-form__item-detail-label">C. Costo</Label>
                        <Controller
                          control={form.control}
                          name={`items.${index}.costCenter` as const}
                          render={({ field: ccField }) => (
                            <CostCenterSelect value={ccField.value} onValueChange={ccField.onChange} hideLabel allowCreation={false} />
                          )}
                        />
                      </div>

                      <div className="invoice-form__item-detail invoice-form__item-detail--qty">
                        <Label className="invoice-form__item-detail-label">Cantidad</Label>
                        <Controller
                          control={form.control}
                          name={`items.${index}.quantity` as const}
                          render={({ field: qField }) => (
                            <NumericInput
                              value={qField.value}
                              onValueChange={(v) => handleItemChange(index, 'quantity', Number(v))}
                              className="invoice-form__input--right"
                            />
                          )}
                        />
                      </div>

                      <div className="invoice-form__item-detail invoice-form__item-detail--price">
                        <Label className="invoice-form__item-detail-label">Precio Unitario</Label>
                        <Controller
                          control={form.control}
                          name={`items.${index}.unitPrice` as const}
                          render={({ field: pField }) => (
                            <NumericInput
                              value={pField.value}
                              onValueChange={(v) => handleItemChange(index, 'unitPrice', Number(v))}
                              className="invoice-form__input--right invoice-form__input--bold"
                            />
                          )}
                        />
                      </div>

                      <div className="invoice-form__item-detail invoice-form__item-detail--disc">
                        <Label className="invoice-form__item-detail-label">Descuento</Label>
                        <Controller
                          control={form.control}
                          name={`items.${index}.discount` as const}
                          render={({ field: dField }) => (
                            <NumericInput
                              value={dField.value}
                              onValueChange={(v) => handleItemChange(index, 'discount', Number(v))}
                              className="invoice-form__input--right invoice-form__input--danger"
                            />
                          )}
                        />
                      </div>

                      <div className="invoice-form__item-detail invoice-form__item-detail--total">
                        <Label className="invoice-form__item-detail-label">Subtotal</Label>
                        <div className="invoice-form__item-row-total">
                          {formatCurrency(watchItems[index]?.total || 0, form.watch('currency'))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {fields.length === 0 && (
                <div className="invoice-form__empty-state">No has agregado conceptos a esta factura.</div>
              )}
            </div>
          </div>

          {/* Links & Metadata Card */}
          <div className="invoice-form__card">
            <header className="invoice-form__header">
              <Settings className="invoice-form__header-icon" />
              <h2 className="invoice-form__header-title">Vínculos y Metadatos</h2>
            </header>
            <div className="invoice-form__links-metadata">
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Liq. de Inventario</Label>
                <Controller control={form.control} name="inventoryMovement" render={({ field }) => (
                  <InventorySettlementSelect value={field.value} onValueChange={field.onChange} />
                )} />
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">Ref. de Orden</Label>
                <Input {...form.register('orderReference')} placeholder="N° Pedido Interno" />
              </div>
              <div className="invoice-form__field">
                <Label className="invoice-form__label">CUFE (DIAN)</Label>
                <Input {...form.register('cufe')} placeholder="UUID de la factura..." />
              </div>
              <div className="invoice-form__links-metadata-uploader">
                <Controller control={form.control} name="fileUrl" render={({ field }) => (
                  <DocumentUploader value={field.value} onChange={field.onChange} onRemove={() => field.onChange('')} />
                )} />
              </div>
            </div>
          </div>

          <div className="invoice-form__card">
            <header className="invoice-form__header">
              <FileText className="invoice-form__header-icon" />
              <h2 className="invoice-form__header-title">Observaciones Internas</h2>
            </header>
            <div className="p-4">
              <Textarea {...form.register('notes')} placeholder="Escribe aquí notas adicionales para administración..." className="min-h-[80px] text-sm" />
            </div>
          </div>
        </main >

        <aside className="invoice-form__sidebar">
          <div className="invoice-form__summary-card">
            <h3 className="invoice-form__summary-title">Liquidación Final</h3>
            <div className="invoice-form__summary-content">
              <div className="summary-row">
                <span>Total Líneas</span>
                <span className="summary-row__value">{formatCurrency(form.watch('subtotal'), form.watch('currency'))}</span>
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
                <div className="summary-row--total-content">
                  <span className="label">Gran Total ({form.watch('currency')})</span>
                  <span className="value">{formatCurrency(form.watch('total'), form.watch('currency'))}</span>
                  {form.watch('currency') !== 'COP' && (
                    <span className="summary-equivalent">
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
            <div className="invoice-form__dian-panel">
              <div className="invoice-form__dian-header">
                <ShieldCheck className="invoice-form__dian-icon" />
                <span className="invoice-form__dian-title">Firma Electrónica DIAN</span>
              </div>
              <div className="invoice-form__dian-content">
                <div className="invoice-form__dian-field">
                  <span className="invoice-form__dian-label">ID Autorización</span>
                  <code className="invoice-form__dian-value">{form.watch('dianData.invoiceAuthorization')}</code>
                </div>
                <div className="invoice-form__dian-field">
                  <span className="invoice-form__dian-label">Estado Validación</span>
                  <p className="invoice-form__dian-text">
                    <span className="invoice-form__dian-code">[{form.watch('dianData.validationResponse.code')}]</span> {form.watch('dianData.validationResponse.description')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div >
    </form >
  );
}
