'use client';

import { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { UserPermissionsSelect } from '@/components/admin/UserPermissionsSelect';
import { PermissionMatrixComponent } from '@/components/admin/PermissionMatrix';
import { UserResponse } from '@/types/user';
import { PermissionMatrix, ModuleMetadata } from '@/types/permission';
import { useAuth } from '@/contexts/AuthContext';

import './permissions.scss';

export default function PermissionsPage() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [userPermissions, setUserPermissions] = useState<PermissionMatrix>({});
  const [modules, setModules] = useState<ModuleMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  // Verificar que el usuario es admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="permissions-page__access-denied">
        <div className="permissions-page__denied-content">
          <AlertCircle className="permissions-page__denied-icon" />
          <h1 className="permissions-page__denied-title">Acceso Denegado</h1>
          <p className="permissions-page__denied-text">
            Solo los administradores pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  const handleUserSelect = async (user: UserResponse) => {
    setSelectedUser(user);
    setLoading(true);

    try {
      // Fetch user permissions and modules in parallel
      const [permissionsRes, modulesRes] = await Promise.all([
        fetch(`/api/permissions/user/${user._id}`),
        modules.length === 0 ? fetch('/api/permissions/modules') : Promise.resolve(null),
      ]);

      const permissionsData = await permissionsRes.json();
      if (permissionsData.success) {
        setUserPermissions(permissionsData.data || {});
      }

      if (modulesRes) {
        const modulesData = await modulesRes.json();
        if (modulesData.success) {
          setModules(modulesData.data || []);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async (permissions: PermissionMatrix) => {
    if (!selectedUser) return;

    try {
      // Convert matrix to array format for API
      const permissionsArray = Object.entries(permissions).map(([module, actions]) => ({
        module,
        actions,
      }));

      const response = await fetch(`/api/permissions/user/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: permissionsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserPermissions(data.data || {});
        // Show success notification (you could add a toast here)
        alert('Permisos actualizados exitosamente');
      } else {
        throw new Error(data.error || 'Error al actualizar permisos');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error saving permissions:', error);
      alert('Error al guardar los permisos. Por favor, intenta de nuevo.');
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setUserPermissions({});
  };

  return (
    <div className="permissions-page">
      {/* Header */}
      <div className="permissions-page__header">
        <div className="permissions-page__icon-wrapper">
          <Shield className="permissions-page__header-icon" />
        </div>
        <div>
          <h1 className="permissions-page__title">Gestión de Permisos</h1>
          <p className="permissions-page__subtitle">
            Administra los permisos de acceso para cada usuario
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="permissions-page__grid">
        {/* User Selection Sidebar */}
        <div className="permissions-page__sidebar">
          <div className="permissions-page__card">
            <h2 className="permissions-page__card-title">
              Seleccionar Usuario
            </h2>
            <UserPermissionsSelect
              onUserSelect={handleUserSelect}
              selectedUserId={selectedUser?._id}
            />
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="permissions-page__main-content">
          {loading ? (
            <div className="permissions-page__card">
              <div className="permissions-page__loading-skeleton">
                <div className="permissions-page__skeleton-line"></div>
                <div className="permissions-page__skeleton-block"></div>
              </div>
            </div>
          ) : selectedUser ? (
            <div className="permissions-page__card">
              <div className="permissions-page__user-header">
                <h2 className="permissions-page__card-title">
                  Permisos de {selectedUser.name}
                </h2>
                <p className="permissions-page__user-info">
                  {selectedUser.email} • Rol: {selectedUser.role}
                </p>
              </div>
              <PermissionMatrixComponent
                userId={selectedUser._id}
                initialPermissions={userPermissions}
                modules={modules}
                onSave={handleSavePermissions}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="permissions-page__empty-state">
              <Shield className="permissions-page__empty-icon" />
              <h3 className="permissions-page__empty-title">
                Selecciona un usuario
              </h3>
              <p className="permissions-page__empty-text">
                Elige un usuario de la lista para gestionar sus permisos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
