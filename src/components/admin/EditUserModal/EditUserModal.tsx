'use client';

import { useState, useEffect } from 'react';
import { UserRole, UserResponse } from '@/types/user';
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
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import './EditUserModal.scss';

interface EditUserModalProps {
  isOpen: boolean;
  user: UserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as UserRole,
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const updateData: Partial<UserResponse> & { password?: string } = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // Solo incluir password si se especificó uno nuevo
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handeOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (!user && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handeOpenChange}>
      <DialogContent className="edit-user-modal">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="edit-user-modal__form">
          {error && <div className="edit-user-modal__error">{error}</div>}

          <div className="edit-user-modal__field">
            <Label htmlFor="edit-name">Nombre completo</Label>
            <Input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="edit-user-modal__field">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="edit-user-modal__field">
            <Label htmlFor="edit-role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as UserRole })
              }
            >
              <SelectTrigger
                id="edit-role"
                className="edit-user-modal__select-trigger"
              >
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer (solo lectura)</SelectItem>
                <SelectItem value="user">User (acceso estándar)</SelectItem>
                <SelectItem value="admin">Admin (acceso total)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="edit-user-modal__field">
            <Label htmlFor="edit-password">Nueva Contraseña</Label>
            <Input
              id="edit-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              minLength={6}
              placeholder="Dejar en blanco para no cambiar"
            />
            <p className="edit-user-modal__hint">
              Solo completar si deseas cambiar la contraseña
            </p>
          </div>

          <DialogFooter className="edit-user-modal__footer">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
