'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/Toast';
import { EditorialSettings } from '@/types/settings';
import { Save, Building2 } from 'lucide-react';

export default function EditorialSettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<EditorialSettings>({
    name: '',
    nit: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings/editorial');
        if (res.ok) {
          const result = await res.json();
          setSettings(result.data);
        }
      } catch (error) {
        console.error('Error fetching editorial settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/settings/editorial', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: 'Datos de la editorial actualizados correctamente',
        });
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando configuración...</div>;
  }

  return (
    <div className="profile-page__info-card">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="text-primary w-5 h-5" />
        <h3 className="profile-page__card-title" style={{ margin: 0 }}>
          Datos de la Editorial
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre / Razón Social</Label>
            <Input
              id="name"
              name="name"
              value={settings.name}
              onChange={handleChange}
              placeholder="Ej: EDITORIAL TANUKI SAS"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nit">Identificación (NIT)</Label>
            <Input
              id="nit"
              name="nit"
              value={settings.nit}
              onChange={handleChange}
              placeholder="Ej: 901.624.469-6"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              value={settings.address}
              onChange={handleChange}
              placeholder="Ej: Calle 45 # 21 - 34"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              name="city"
              value={settings.city}
              onChange={handleChange}
              placeholder="Ej: Bogotá"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (Opcional)</Label>
            <Input
              id="phone"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
              placeholder="Ej: +57 300 000 0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email de Contacto (Opcional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleChange}
              placeholder="email@ejemplo.com"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={submitting} className="gap-2">
            <Save size={16} />
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
