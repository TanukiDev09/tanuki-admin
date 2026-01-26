'use client';

import InvoiceForm from '@/components/finance/InvoiceForm';

export default function CreateInvoicePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-primary">
        Crear Nueva Factura
      </h1>
      <InvoiceForm />
    </div>
  );
}
