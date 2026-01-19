'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PermissionMatrix, ModuleName, PermissionAction } from '@/types/permission';
import { useAuth } from './AuthContext';

interface PermissionContextType {
  permissions: PermissionMatrix;
  loading: boolean;
  hasPermission: (module: ModuleName, action: PermissionAction) => boolean;
  hasAnyPermission: (module: ModuleName) => boolean;
  refetchPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user?._id) {
      setPermissions({});
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/permissions/user/${user._id}`);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPermissions(data.data || {});

        // Cache en localStorage
        localStorage.setItem(
          `permissions_${user._id}`,
          JSON.stringify(data.data || {})
        );
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);

      // Intentar cargar desde cache si falla el fetch o el parseo
      const cached = localStorage.getItem(`permissions_${user._id}`);
      if (cached) {
        setPermissions(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const hasPermission = (module: ModuleName, action: PermissionAction): boolean => {
    // Admin tiene todos los permisos
    if (user?.role === 'admin') {
      return true;
    }

    const modulePermissions = permissions[module];
    return modulePermissions ? modulePermissions.includes(action) : false;
  };

  const hasAnyPermission = (module: ModuleName): boolean => {
    // Admin tiene todos los permisos
    if (user?.role === 'admin') {
      return true;
    }

    const modulePermissions = permissions[module];
    return modulePermissions ? modulePermissions.length > 0 : false;
  };

  const refetchPermissions = async () => {
    setLoading(true);
    await fetchPermissions();
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        refetchPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
