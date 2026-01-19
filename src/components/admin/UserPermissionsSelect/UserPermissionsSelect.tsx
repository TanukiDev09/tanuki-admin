'use client';

import { useState, useEffect } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { UserResponse } from '@/types/user';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import './UserPermissionsSelect.scss';

interface UserPermissionsSelectProps {
  onUserSelect: (user: UserResponse) => void;
  selectedUserId?: string;
}

export function UserPermissionsSelect({
  onUserSelect,
  selectedUserId,
}: UserPermissionsSelectProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
        setFilteredUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleVariant = (
    role: string
  ):
    | 'default'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'success'
    | 'warning' => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'user':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="user-permissions-select user-permissions-select--loading">
        <div className="user-permissions-select__skeleton-search" />
        <div className="user-permissions-select__skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="user-permissions-select__skeleton-item" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="user-permissions-select">
      {/* Search */}
      <div className="user-permissions-select__search-wrapper">
        <Search className="user-permissions-select__search-icon" />
        <Input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="user-permissions-select__search-input"
        />
      </div>

      {/* Users List */}
      <div className="user-permissions-select__list">
        {filteredUsers.length === 0 ? (
          <div className="user-permissions-select__empty">
            {search
              ? 'No se encontraron usuarios'
              : 'No hay usuarios disponibles'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => onUserSelect(user)}
              className={`user-permissions-select__item ${
                selectedUserId === user._id
                  ? 'user-permissions-select__item--active'
                  : ''
              }`}
            >
              <div className="user-permissions-select__item-avatar">
                <UserIcon className="user-permissions-select__avatar-icon" />
              </div>
              <div className="user-permissions-select__item-content">
                <div className="user-permissions-select__item-name">
                  {user.name}
                </div>
                <div className="user-permissions-select__item-email">
                  {user.email}
                </div>
              </div>
              <div className="user-permissions-select__item-role">
                <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="user-permissions-select__summary">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </div>
    </div>
  );
}
