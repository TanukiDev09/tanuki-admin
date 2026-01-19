'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { CreateCreatorDTO, CreatorResponse } from '@/types/creator';

import './CreatorForm.scss';

interface CreatorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorToEdit?: CreatorResponse | null;
  onSuccess: () => void;
}

export function CreatorForm({
  open,
  onOpenChange,
  creatorToEdit,
  onSuccess,
}: CreatorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateCreatorDTO>({
    defaultValues: {
      name: '',
      bio: '',
      nationality: '',
      website: '',
      photo: '',
    },
  });

  useEffect(() => {
    if (creatorToEdit) {
      form.reset({
        name: creatorToEdit.name,
        bio: creatorToEdit.bio || '',
        nationality: creatorToEdit.nationality || '',
        website: creatorToEdit.website || '',
        photo: creatorToEdit.photo || '',
      });
    } else {
      form.reset({
        name: '',
        bio: '',
        nationality: '',
        website: '',
        photo: '',
      });
    }
  }, [creatorToEdit, form, open]);

  const onSubmit = async (data: CreateCreatorDTO) => {
    try {
      setIsLoading(true);
      const url = creatorToEdit
        ? `/api/creators/${creatorToEdit._id}`
        : '/api/creators';
      const method = creatorToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el creador');
      }

      toast({
        title: 'Éxito',
        description: `Creador ${
          creatorToEdit ? 'actualizado' : 'creado'
        } correctamente`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar el creador',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="creator-form__dialog-content">
        <DialogHeader>
          <DialogTitle>
            {creatorToEdit ? 'Editar Creador' : 'Nuevo Creador'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="creator-form__form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del creador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Japonesa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve biografía..."
                      className="creator-form__textarea"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio Web</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
