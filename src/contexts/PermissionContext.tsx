'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  PermissionMatrix,
  ModuleName,
  PermissionAction,
} from '@/types/permission';
import { useAuth } from './AuthContext';

interface PermissionContextType {
  permissions: PermissionMatrix;
  loading: boolean;
  hasPermission: (module: ModuleName, action: PermissionAction) => boolean;
  hasAnyPermission: (module: ModuleName) => boolean;
  refetchPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined
);

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
      const primaryUrl = `/api/permissions/user/${user._id}`;
      const fallbackUrl = `/api/permissions?userId=${user._id}`;

      let response = await fetch(primaryUrl);

      // Si falla con 404, intentar la ruta fallback
      if (response.status === 404) {
        console.warn(
          `[PermissionContext] Primary route ${primaryUrl} failed with 404, trying fallback ${fallbackUrl}`
        );
        response = await fetch(fallbackUrl);
      }

      if (!response.ok) {
        throw new Error(
          `Server responded with status: ${response.status} at ${response.url}`
        );
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

  const hasPermission = (
    module: ModuleName,
    action: PermissionAction
  ): boolean => {
    // Admin tiene todos los permisos
    if (user?.role === 'admin') {
      return true;
    }

    const modulePermissions = permissions[module];
    let hasPerm = modulePermissions
      ? modulePermissions.includes(action)
      : false;

    // Fallback logic for Debts using Finance permissions
    if (!hasPerm && module === ModuleName.DEBTS) {
      const financePerms = permissions[ModuleName.FINANCE];
      hasPerm = financePerms ? financePerms.includes(action) : false;
    }

    return hasPerm;
  };

  const hasAnyPermission = (module: ModuleName): boolean => {
    // Admin tiene todos los permisos
    if (user?.role === 'admin') {
      return true;
    }

    const modulePermissions = permissions[module];
    let hasAny = modulePermissions ? modulePermissions.length > 0 : false;

    // Fallback logic for Debts using Finance permissions
    if (!hasAny && module === ModuleName.DEBTS) {
      const financePerms = permissions[ModuleName.FINANCE];
      hasAny = financePerms ? financePerms.length > 0 : false;
    }

    return hasAny;
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
