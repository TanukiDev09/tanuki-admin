/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from 'zod';

export const invoiceSchema = z.object({
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
  status: z.enum([
    'Draft',
    'Sent',
    'Paid',
    'Partial',
    'Cancelled',
    'Unchecked',
  ]),
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
  dianData: z
    .object({
      invoiceAuthorization: z.string().optional(),
      authorizationPeriod: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
      softwareProvider: z.string().optional(),
      softwareId: z.string().optional(),
      validationResponse: z
        .object({
          code: z.string().optional(),
          description: z.string().optional(),
          validatedAt: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const normalizeDocType = (val: string | undefined): string => {
  if (!val) return '13';
  const upperVal = val.toString().toUpperCase();
  if (upperVal === '1' || upperVal === 'CC') return '13';
  if (upperVal === '3' || upperVal === '4' || upperVal === 'NIT') return '31';
  if (upperVal === '2' || upperVal === 'CE') return '22';
  if (upperVal === 'PASAPORTE') return '41';
  return val;
};

export const getInvoiceDefaultValues = (
  initialData?: Partial<InvoiceFormValues> & { _id?: string }
): InvoiceFormValues => {
  return {
    number: initialData?.number || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    customerName: initialData?.customerName || '',
    customerTaxId: initialData?.customerTaxId || '',
    items: initialData?.items?.map((item: any) => ({
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
        description:
          initialData?.dianData?.validationResponse?.description || '',
        validatedAt:
          initialData?.dianData?.validationResponse?.validatedAt || '',
      },
    },
  };
};
