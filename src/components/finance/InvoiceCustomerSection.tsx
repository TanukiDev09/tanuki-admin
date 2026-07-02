'use client';

import { UseFormReturn, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { User } from 'lucide-react';
import { InvoiceFormValues } from './invoice-schema';

interface InvoiceCustomerSectionProps {
  form: UseFormReturn<InvoiceFormValues>;
}

export default function InvoiceCustomerSection({
  form,
}: InvoiceCustomerSectionProps) {
  return (
    <div className="invoice-form__card">
      <header className="invoice-form__header">
        <User className="invoice-form__header-icon" />
        <h2 className="invoice-form__header-title">Detalles del Cliente</h2>
      </header>
      <div className="invoice-form__grid invoice-form__grid--3col">
        <div className="invoice-form__field invoice-form__field--2col">
          <Label className="invoice-form__label">Razón Social / Nombre</Label>
          <Input
            {...form.register('customerName')}
            placeholder="Nombre completo"
          />
          {form.formState.errors.customerName && (
            <p className="invoice-form__error">
              {form.formState.errors.customerName.message}
            </p>
          )}
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
            <Input
              {...form.register('customerTaxId')}
              placeholder="Documento"
            />
          </div>
        </div>
        <div className="invoice-form__field">
          <Label className="invoice-form__label">Correo Electrónico</Label>
          <Input
            {...form.register('customerEmail')}
            type="email"
            placeholder="email@ejemplo.com"
          />
        </div>
        <div className="invoice-form__field">
          <Label className="invoice-form__label">Teléfono</Label>
          <Input
            {...form.register('customerPhone')}
            placeholder="300 000 0000"
          />
        </div>
        <div className="invoice-form__field">
          <Label className="invoice-form__label">Ciudad</Label>
          <Input
            {...form.register('customerCity')}
            placeholder="Bogotá, D.C."
          />
        </div>
        <div className="invoice-form__field invoice-form__field--3col">
          <Label className="invoice-form__label">Dirección</Label>
          <Input
            {...form.register('customerAddress')}
            placeholder="Calle 123 # 45-67"
          />
        </div>
      </div>
      <div className="invoice-form__newsletter">
        <label>
          <input type="checkbox" {...form.register('newsletterSignup')} />
          <span>Aceptar envío de newsletter y comunicaciones</span>
        </label>
      </div>
    </div>
  );
}
