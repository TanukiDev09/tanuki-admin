'use client';

import { useState, useEffect } from 'react';
import { UserResponse } from '@/types/user';
import { Pencil, Trash2, UserX, UserCheck } from 'lucide-react';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatNumber } from '@/lib/utils';
import './UsersTable.scss';

interface UsersTableProps {
  onEdit: (user: UserResponse) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
}

export function UsersTable({
  onEdit,
  onDelete,
  onToggleStatus,
}: UsersTableProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // Default to active
  const { hasPermission } = usePermission();

  const canUpdate = hasPermission(ModuleName.USERS, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.USERS, PermissionAction.DELETE);

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

  const getRoleVariant = (
    role: string
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'outline' | 'destructive'
    > = {
      admin: 'default',
      user: 'secondary',
      viewer: 'outline',
    };
    return variants[role] || 'outline';
  };

  if (loading) {
    return (
      <div className="users-table__loading">
        <div className="users-table__spinner"></div>
        <p className="users-table__loading-text">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="users-table">
      {/* Filters */}
      <div className="users-table__filters">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className="users-table__filter-btn"
        >
          Todos ({formatNumber(users.length)})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'ghost'}
          onClick={() => setFilter('active')}
          className="users-table__filter-btn"
        >
          Activos ({formatNumber(users.filter((u) => u.isActive).length)})
        </Button>
        <Button
          variant={filter === 'inactive' ? 'default' : 'ghost'}
          onClick={() => setFilter('inactive')}
          className="users-table__filter-btn"
        >
          Inactivos ({formatNumber(users.filter((u) => !u.isActive).length)})
        </Button>
      </div>

      {/* Table */}
      <div className="users-table__container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead className="users-table__cell--right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} className="users-table__row">
                <TableCell>
                  <div className="users-table__user-name">{user.name}</div>
                </TableCell>
                <TableCell>
                  <div className="users-table__user-email">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'success' : 'destructive'}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="users-table__date">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('es-CO')
                    : 'Nunca'}
                </TableCell>
                <TableCell className="users-table__cell--right">
                  <div className="users-table__actions">
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(user)}
                        title="Editar"
                      >
                        <Pencil className="users-table__icon" />
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleStatus(user._id, user.isActive)}
                        className={
                          user.isActive
                            ? 'users-table__action-btn--warning'
                            : 'users-table__action-btn--success'
                        }
                        title={user.isActive ? 'Suspender' : 'Activar'}
                      >
                        {user.isActive ? (
                          <UserX className="users-table__icon" />
                        ) : (
                          <UserCheck className="users-table__icon" />
                        )}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(user._id)}
                        className="users-table__action-btn--destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="users-table__icon" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
