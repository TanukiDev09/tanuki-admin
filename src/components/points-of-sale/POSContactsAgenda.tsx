'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Mail,
  Phone,
  User as UserIcon,
  Trash2,
  Edit2,
} from 'lucide-react';
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
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import './POSContactsAgenda.scss';

interface POSContact {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
}

interface POSContactsAgendaProps {
  posId: string;
  initialContacts: POSContact[];
  readOnly?: boolean;
}

const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function POSContactsAgenda({
  posId,
  initialContacts,
  readOnly,
}: POSContactsAgendaProps) {
  const [contacts, setContacts] = useState<POSContact[]>(initialContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<{
    index: number;
    contact: POSContact;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
    },
  });

  const onOpenAdd = () => {
    setEditingContact(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      position: '',
    });
    setIsModalOpen(true);
  };

  const onOpenEdit = (contact: POSContact, index: number) => {
    setEditingContact({ index, contact });
    form.reset({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setLoading(true);

      const newContacts = [...contacts];
      if (editingContact !== null) {
        newContacts[editingContact.index] = {
          ...editingContact.contact,
          ...data,
        };
      } else {
        newContacts.push(data);
      }

      const response = await fetch(`/api/points-of-sale/${posId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts }),
      });

      if (!response.ok) throw new Error('Error al guardar contacto');

      const updatedPOS = await response.json();
      setContacts(updatedPOS.contacts);
      setIsModalOpen(false);

      toast({
        title: 'Éxito',
        description: `Contacto ${editingContact !== null ? 'actualizado' : 'agregado'} correctamente`,
      });

      router.refresh();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el contacto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (index: number) => {
    if (!confirm('¿Estás seguro de eliminar este contacto?')) return;

    try {
      setLoading(true);
      const newContacts = contacts.filter((_, i) => i !== index);

      const response = await fetch(`/api/points-of-sale/${posId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts }),
      });

      if (!response.ok) throw new Error('Error al eliminar contacto');

      const updatedPOS = await response.json();
      setContacts(updatedPOS.contacts);

      toast({
        title: 'Éxito',
        description: 'Contacto eliminado correctamente',
      });

      router.refresh();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el contacto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-agenda">
      <div className="pos-agenda__header">
        <h3 className="pos-agenda__title">Agenda de Contactos</h3>
        {!readOnly && (
          <Button onClick={onOpenAdd} className="pos-agenda__add-btn">
            <Plus className="pos-agenda__icon-sm pos-agenda__icon--mr" />{' '}
            Agregar Contacto
          </Button>
        )}
      </div>

      <div className="pos-agenda__list">
        {contacts.length === 0 ? (
          <div className="pos-agenda__empty">
            <UserIcon className="pos-agenda__empty-icon" />
            <p>No hay contactos registrados en este punto de venta.</p>
          </div>
        ) : (
          <div className="pos-agenda__grid">
            {contacts.map((contact, index) => (
              <div key={contact._id || index} className="pos-agenda__card">
                <div className="pos-agenda__card-header">
                  <div className="pos-agenda__card-info">
                    <h4 className="pos-agenda__contact-name">{contact.name}</h4>
                    {contact.position && (
                      <span className="pos-agenda__contact-position">
                        {contact.position}
                      </span>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="pos-agenda__card-actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenEdit(contact, index)}
                        className="pos-agenda__action-btn"
                      >
                        <Edit2 className="pos-agenda__icon-xs" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(index)}
                        className="pos-agenda__action-btn pos-agenda__action-btn--delete"
                      >
                        <Trash2 className="pos-agenda__icon-xs" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pos-agenda__card-body">
                  {contact.phone && (
                    <div className="pos-agenda__contact-item">
                      <Phone className="pos-agenda__item-icon" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="pos-agenda__contact-item">
                      <Mail className="pos-agenda__item-icon" />
                      <span className="pos-agenda__email-text">
                        {contact.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Editar Contacto' : 'Agregar Nuevo Contacto'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="pos-agenda__form"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="juan@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+57 300..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo / Función</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Administrador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pos-agenda__form-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Contacto'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
