'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UsersTable } from '@/components/admin/UsersTable';
import { Button } from '@/components/ui/Button';
import CreateUserModal from '@/components/admin/CreateUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import { UserResponse } from '@/types/user';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import '../dashboard.scss';

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canRead = hasPermission(ModuleName.USERS, PermissionAction.READ);
  const canCreate = hasPermission(ModuleName.USERS, PermissionAction.CREATE);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verificar si el usuario tiene permiso de lectura
  if (user && !canRead) {
    router.push('/dashboard');
    return null;
  }

  const handleEdit = (user: UserResponse) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
      } else {
        alert('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'suspender' : 'activar';
    if (!confirm(`¿Estás seguro de que deseas ${action} este usuario?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
      } else {
        alert(`Error al ${action} usuario`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al ${action} usuario`);
    }
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <div className="dashboard-page">
        <div className="dashboard-page__container">
          {/* Header */}
          <div className="dashboard-page__header">
            <div className="dashboard-page__title-group">
              <h1 className="dashboard-page__title">Gestión de Usuarios</h1>
              <p className="dashboard-page__subtitle">
                Administra los usuarios del sistema
              </p>
            </div>
            {canCreate && (
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="dashboard-page__action-btn"
              >
                <UserPlus className="dashboard-page__icon" />
                <span className="dashboard-page__text-hidden-sm">
                  Crear Usuario
                </span>
              </Button>
            )}
          </div>

          {/* Table */}
          <UsersTable
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />
      <EditUserModal
        isOpen={editModalOpen}
        user={selectedUser}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleSuccess}
      />
    </>
  );
}
