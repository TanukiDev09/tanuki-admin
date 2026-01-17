'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserManagementTable from '@/components/admin/UserManagementTable';
import CreateUserModal from '@/components/admin/CreateUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import { UserResponse } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verificar si el usuario es admin
  if (user && user.role !== 'admin') {
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
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Gestión de Usuarios
              </h1>
              <p className="text-foreground-muted">
                Administra los usuarios del sistema
              </p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Crear Usuario</span>
            </button>
          </div>

          {/* Table */}
          <UserManagementTable
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      {/* Modals */}
      < CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)
        }
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
