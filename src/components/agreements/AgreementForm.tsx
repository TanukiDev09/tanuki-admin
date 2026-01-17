'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CreateAgreementDTO, AgreementResponse } from '@/types/agreement';
import { CreatorSelect } from '@/components/creators/CreatorSelect';
import { FileText, Loader2, Upload, Info } from 'lucide-react';

interface AgreementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  agreementToEdit?: AgreementResponse | null;
  preselectedCreator?: string;
  onSuccess: () => void;
}

export function AgreementForm({
  open,
  onOpenChange,
  bookId,
  agreementToEdit,
  preselectedCreator,
  onSuccess,
}: AgreementFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateAgreementDTO>({
    defaultValues: {
      book: bookId,
      creator: '',
      role: 'author',
      royaltyPercentage: 0,
      advancePayment: 0,
      status: 'draft',
      signedContractUrl: '',
      isPublicDomain: false,
      validFrom: undefined,
      validUntil: undefined,
    },
  });

  useEffect(() => {
    if (agreementToEdit) {
      form.reset({
        book: typeof agreementToEdit.book === 'object' ? String((agreementToEdit.book as { _id: unknown })._id) : agreementToEdit.book,
        creator: typeof agreementToEdit.creator === 'object' ? String((agreementToEdit.creator as { _id: unknown })._id) : agreementToEdit.creator,
        role: agreementToEdit.role,
        royaltyPercentage: agreementToEdit.royaltyPercentage,
        advancePayment: agreementToEdit.advancePayment || 0,
        status: agreementToEdit.status,
        signedContractUrl: agreementToEdit.signedContractUrl || '',
        isPublicDomain: agreementToEdit.isPublicDomain || false,
        // Dates need to be handled if they exist
        validFrom: agreementToEdit.validFrom ? new Date(agreementToEdit.validFrom) : undefined,
        validUntil: agreementToEdit.validUntil ? new Date(agreementToEdit.validUntil) : undefined,
      });
    } else {
      // ... existing else block ...
      form.reset({
        book: bookId,
        creator: preselectedCreator || '',
        role: 'author',
        royaltyPercentage: 0,
        advancePayment: 0,
        status: 'draft',
        signedContractUrl: '',
        isPublicDomain: false,
      });
    }
  }, [agreementToEdit, bookId, form, open, preselectedCreator]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos PDF',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/contract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      form.setValue('signedContractUrl', data.filename);
      toast({
        title: 'Éxito',
        description: 'Contrato subido correctamente',
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      toast({
        title: 'Error',
        description: error.message || 'Error al subir el archivo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: CreateAgreementDTO) => {
    try {
      setIsLoading(true);
      const url = agreementToEdit
        ? `/api/agreements/${agreementToEdit._id}`
        : '/api/agreements';
      const method = agreementToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Error al guardar el contrato');
      }

      toast({
        title: 'Éxito',
        description: `Contrato ${agreementToEdit ? 'actualizado' : 'creado'} correctamente`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al guardar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {agreementToEdit ? 'Editar Contrato' : 'Nuevo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creator"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Creador</FormLabel>
                    <FormControl>
                      <CreatorSelect
                        value={field.value ? [field.value] : []}
                        onChange={(val) => field.onChange(val[0] || '')}
                        max={1}
                        placeholder="Seleccionar creador..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="author">Autor</SelectItem>
                        <SelectItem value="illustrator">Ilustrador</SelectItem>
                        <SelectItem value="translator">Traductor</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="terminated">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublicDomain"
                render={({ field: publicDomainField }) => (
                  <FormField
                    control={form.control}
                    name="royaltyPercentage"
                    render={({ field: royaltyField }) => {
                      // Logic to determine current type
                      const isPublicDomain = publicDomainField.value === true;
                      // Handle potential undefined with default 0 check or safe access
                      const royaltyVal = royaltyField.value ?? 0;
                      const isRoyalty = !isPublicDomain && royaltyVal > 0;
                      const isCashPayment = !isPublicDomain && royaltyVal === 0;

                      return (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-base">Tipo de Acuerdo</FormLabel>
                          <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="type-royalty"
                                name="paymentType"
                                checked={isRoyalty}
                                onChange={() => {
                                  form.setValue('isPublicDomain', false);
                                  form.setValue('royaltyPercentage', 5); // Default
                                }}
                                className="accent-primary h-4 w-4"
                              />
                              <label htmlFor="type-royalty" className="text-sm font-medium leading-none cursor-pointer">
                                Regalías (Standard)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="type-cash"
                                name="paymentType"
                                checked={isCashPayment}
                                onChange={() => {
                                  form.setValue('isPublicDomain', false);
                                  form.setValue('royaltyPercentage', 0);
                                }}
                                className="accent-primary h-4 w-4"
                              />
                              <label htmlFor="type-cash" className="text-sm font-medium leading-none cursor-pointer">
                                Pago de Contado (Sin Regalías)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="type-public"
                                name="paymentType"
                                checked={isPublicDomain}
                                onChange={() => {
                                  form.setValue('isPublicDomain', true);
                                  form.setValue('royaltyPercentage', 0);
                                  form.setValue('advancePayment', 0);
                                }}
                                className="accent-primary h-4 w-4"
                              />
                              <label htmlFor="type-public" className="text-sm font-medium leading-none cursor-pointer">
                                Dominio Público (Sin Pagos)
                              </label>
                            </div>
                          </div>

                          {/* Fields based on selection */}
                          <div className="grid grid-cols-2 gap-4">
                            {isRoyalty && (
                              <FormItem>
                                <FormLabel>% Royalties</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="100"
                                    {...royaltyField}
                                    onChange={e => royaltyField.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}

                            {!isPublicDomain && (
                              <FormField
                                control={form.control}
                                name="advancePayment"
                                render={({ field: advanceField }) => (
                                  <FormItem className={isCashPayment ? "col-span-2" : ""}>
                                    <FormLabel>{isCashPayment ? 'Monto del Pago ($)' : 'Adelanto ($)'}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        {...advanceField}
                                        onChange={e => advanceField.onChange(parseFloat(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {isPublicDomain && (
                              <div className="col-span-2 bg-blue-50 text-blue-800 p-3 rounded-md text-sm border border-blue-100">
                                <div className="flex items-start gap-2">
                                  <Info className="h-5 w-5 mt-0.5 shrink-0" />
                                  <span>Los acuerdos de <strong>Dominio Público</strong> no generan obligaciones de pago. Se utilizan para acreditar la autoría sin compensación económica.</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="signedContractUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato Firmado (PDF)</FormLabel>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      id="contract-upload"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => document.getElementById('contract-upload')?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Subir PDF
                    </Button>
                    {field.value && (
                      <div className="flex items-center text-sm text-green-600">
                        <FileText className="h-4 w-4 mr-1" />
                        Archivo subido
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
