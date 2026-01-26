'use client';

import Link from 'next/link';
import {
  BookOpen,
  Library,
  Warehouse,
  Package,
  Store,
  DollarSign,
  Tags,
  FileText,
  UserCog,
  Shield,
  Calculator,
  LucideIcon,
  Receipt,
  PenTool,
} from 'lucide-react';
import {
  ModuleName,
  PermissionAction,
  MODULE_METADATA,
} from '@/types/permission';
import { usePermissions } from '@/contexts/PermissionContext';
import './ModuleLinks.scss';

// Map module names to icons
const MODULE_ICONS: Record<ModuleName, LucideIcon> = {
  [ModuleName.BOOKS]: BookOpen,
  [ModuleName.COLLECTIONS]: Library,
  [ModuleName.CREATORS]: PenTool,
  [ModuleName.INVENTORY]: Package,
  [ModuleName.FINANCE]: DollarSign,
  [ModuleName.INVOICES]: Receipt,
  [ModuleName.POINTS_OF_SALE]: Store,
  [ModuleName.WAREHOUSES]: Warehouse,
  [ModuleName.AGREEMENTS]: FileText,
  [ModuleName.CATEGORIES]: Tags,
  [ModuleName.COST_CENTERS]: Calculator,
  [ModuleName.USERS]: UserCog,
  [ModuleName.PERMISSIONS]: Shield,
};

// Map module names to routes
const MODULE_ROUTES: Record<ModuleName, string> = {
  [ModuleName.BOOKS]: '/dashboard/catalog',
  [ModuleName.COLLECTIONS]: '/dashboard/collections',
  [ModuleName.CREATORS]: '/dashboard/creators',
  [ModuleName.INVENTORY]: '/dashboard/inventory',
  [ModuleName.FINANCE]: '/dashboard/movements',
  [ModuleName.INVOICES]: '/dashboard/invoices',
  [ModuleName.POINTS_OF_SALE]: '/dashboard/points-of-sale',
  [ModuleName.WAREHOUSES]: '/dashboard/warehouses',
  [ModuleName.AGREEMENTS]: '/dashboard/agreements',
  [ModuleName.CATEGORIES]: '/dashboard/categories',
  [ModuleName.COST_CENTERS]: '/dashboard/cost-centers',
  [ModuleName.USERS]: '/dashboard/users',
  [ModuleName.PERMISSIONS]: '/dashboard/permissions',
};

export function ModuleLinks() {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="module-links">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="module-card module-card--skeleton"
            style={{
              height: '140px',
              background: 'rgba(0,0,0,0.05)',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  // Filter modules based on read permission
  const accessibleModules = Object.values(ModuleName).filter((moduleName) =>
    hasPermission(moduleName, PermissionAction.READ)
  );

  if (accessibleModules.length === 0) {
    return (
      <div
        className="module-links__empty"
        style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}
      >
        No tienes acceso a ningún módulo. Contacta a un administrador.
      </div>
    );
  }

  return (
    <div className="module-links">
      {accessibleModules.map((moduleName) => {
        const metadata = MODULE_METADATA[moduleName];
        const Icon = MODULE_ICONS[moduleName] || Book; // Fallback icon
        const route = MODULE_ROUTES[moduleName] || '/dashboard';

        return (
          <Link href={route} key={moduleName} className="module-card">
            <div className="module-card__header">
              <div className="module-card__icon-wrapper">
                <Icon className="module-card__icon" />
              </div>
              <span className="module-card__title">{metadata.label}</span>
            </div>
            <p className="module-card__description">{metadata.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
