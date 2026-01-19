'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/Input/NumericInput';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { CreateAgreementDTO, AgreementResponse, AgreementRole, AgreementStatus } from '@/types/agreement';
import { CreatorSelect } from '@/components/creators/CreatorSelect';
import { FileText, Loader2, Upload, Info } from 'lucide-react';
import './AgreementForm.scss';

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

  // Watch values for conditional rendering
  // TODO: This variable is currently unused. Consider removing or using it.
  // const paymentType = form.watch('isPublicDomain') ? 'public' : ((form.watch('royaltyPercentage') || 0) > 0 ? 'royalty' : 'cash');
  const contractUrl = form.watch('signedContractUrl');

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
        validFrom: agreementToEdit.validFrom ? new Date(agreementToEdit.validFrom) : undefined,
        validUntil: agreementToEdit.validUntil ? new Date(agreementToEdit.validUntil) : undefined,
      });
    } else {
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
      <DialogContent className="agreement-form">
        <DialogHeader>
          <DialogTitle>
            {agreementToEdit ? 'Editar Contrato' : 'Nuevo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="agreement-form__form">

          <div className="agreement-form__grid-2">
            <div className="agreement-form__field agreement-form__field--full">
              <Label>Creador</Label>
              <CreatorSelect
                value={form.watch('creator') ? [form.watch('creator')] : []}
                onChange={(val) => form.setValue('creator', val[0] || '')}
                max={1}
                placeholder="Seleccionar creador..."
              />
            </div>

            <div className="agreement-form__field">
              <Label>Rol</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(val) => form.setValue('role', val as AgreementRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">Autor</SelectItem>
                  <SelectItem value="illustrator">Ilustrador</SelectItem>
                  <SelectItem value="translator">Traductor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="agreement-form__field">
              <Label>Estado</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(val) => form.setValue('status', val as AgreementStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="terminated">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="agreement-form__section agreement-form__section--full">
              <Label className="agreement-form__section-label">Tipo de Acuerdo</Label>

              <div className="agreement-form__radio-group">
                <div className="agreement-form__radio-option">
                  <input
                    type="radio"
                    id="type-royalty"
                    name="paymentType"
                    checked={!form.watch('isPublicDomain') && (form.watch('royaltyPercentage') || 0) > 0}
                    onChange={() => {
                      form.setValue('isPublicDomain', false);
                      form.setValue('royaltyPercentage', 5);
                    }}
                    className="agreement-form__radio"
                  />
                  <label htmlFor="type-royalty" className="agreement-form__radio-label">
                    Regalías (Standard)
                  </label>
                </div>

                <div className="agreement-form__radio-option">
                  <input
                    type="radio"
                    id="type-cash"
                    name="paymentType"
                    checked={!form.watch('isPublicDomain') && form.watch('royaltyPercentage') === 0}
                    onChange={() => {
                      form.setValue('isPublicDomain', false);
                      form.setValue('royaltyPercentage', 0);
                    }}
                    className="agreement-form__radio"
                  />
                  <label htmlFor="type-cash" className="agreement-form__radio-label">
                    Pago de Contado (Sin Regalías)
                  </label>
                </div>

                <div className="agreement-form__radio-option">
                  <input
                    type="radio"
                    id="type-public"
                    name="paymentType"
                    checked={form.watch('isPublicDomain')}
                    onChange={() => {
                      form.setValue('isPublicDomain', true);
                      form.setValue('royaltyPercentage', 0);
                      form.setValue('advancePayment', 0);
                    }}
                    className="agreement-form__radio"
                  />
                  <label htmlFor="type-public" className="agreement-form__radio-label">
                    Dominio Público (Sin Pagos)
                  </label>
                </div>
              </div>
            </div>

            {/* Conditional Fields */}
            <div className="agreement-form__grid-2 agreement-form__field--full">
              {!form.watch('isPublicDomain') && (form.watch('royaltyPercentage') || 0) > 0 && (
                <div className="agreement-form__field">
                  <Label>% Royalties</Label>
                  <NumericInput
                    placeholder="0.00"
                    value={form.watch('royaltyPercentage')}
                    onValueChange={val => form.setValue('royaltyPercentage', val || 0)}
                  />
                </div>
              )}

              {!form.watch('isPublicDomain') && (
                <div className={`agreement-form__field ${form.watch('royaltyPercentage') === 0 ? "agreement-form__field--full" : ""}`}>
                  <Label>{form.watch('royaltyPercentage') === 0 ? 'Monto del Pago ($)' : 'Adelanto ($)'}</Label>
                  <NumericInput
                    placeholder="0.00"
                    value={form.watch('advancePayment')}
                    onValueChange={val => form.setValue('advancePayment', val || 0)}
                  />
                </div>
              )}

              {form.watch('isPublicDomain') && (
                <div className="agreement-form__info-box agreement-form__info-box--full">
                  <div className="agreement-form__info-content">
                    <Info className="agreement-form__info-icon" />
                    <span>Los acuerdos de <strong>Dominio Público</strong> no generan obligaciones de pago. Se utilizan para acreditar la autoría sin compensación económica.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="agreement-form__field">
            <Label>Contrato Firmado (PDF)</Label>
            <div className="agreement-form__file-upload">
              <Input
                type="file"
                accept=".pdf"
                className="agreement-form__file-input"
                id="contract-upload"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById('contract-upload')?.click()}
                className="agreement-form__btn-upload"
              >
                {isUploading ? (
                  <Loader2 className="agreement-form__icon agreement-form__icon--spin" />
                ) : (
                  <Upload className="agreement-form__icon" />
                )}
                Subir PDF
              </Button>
              {contractUrl && (
                <div className="agreement-form__file-success">
                  <FileText className="agreement-form__icon agreement-form__icon--left" />
                  Archivo subido
                </div>
              )}
            </div>
          </div>

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
      </DialogContent>
    </Dialog>
  );
}
