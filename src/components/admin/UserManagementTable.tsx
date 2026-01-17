'use client';

import { useState, useEffect } from 'react';
import { UserResponse } from '@/types/user';
import { Pencil, Trash2, UserX, UserCheck } from 'lucide-react';

interface UserManagementTableProps {
  onEdit: (user: UserResponse) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
}

export default function UserManagementTable({
  onEdit,
  onDelete,
  onToggleStatus,
}: UserManagementTableProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // Mostrar solo activos por defecto

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?limit=100');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    if (filter === 'active') return user.isActive;
    if (filter === 'inactive') return !user.isActive;
    return true;
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary mx-auto mb-4"></div>
        <p className="text-foreground-muted">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
            ? 'bg-primary text-white'
            : 'bg-surface text-foreground-muted hover:bg-muted'
            }`}
        >
          Todos ({users.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'active'
            ? 'bg-primary text-white'
            : 'bg-surface text-foreground-muted hover:bg-muted'
            }`}
        >
          Activos ({users.filter((u) => u.isActive).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'inactive'
            ? 'bg-primary text-white'
            : 'bg-surface text-foreground-muted hover:bg-muted'
            }`}
        >
          Inactivos ({users.filter((u) => !u.isActive).length})
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground-muted">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.isActive
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('es-CO')
                      : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(user._id, user.isActive)}
                        className={`p-2 rounded-lg transition-colors ${user.isActive
                          ? 'hover:bg-orange-500/20 text-orange-400'
                          : 'hover:bg-green-500/20 text-green-400'
                          }`}
                        title={user.isActive ? 'Suspender' : 'Activar'}
                      >
                        {user.isActive ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(user._id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
