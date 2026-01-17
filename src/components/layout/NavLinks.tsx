'use client';

import Link from 'next/link';
import { Home, List, Tag, HelpCircle, Settings, Users, BookOpen, PenTool, FileText, Store, Warehouse, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/catalog', label: 'Catálogo', icon: BookOpen },
  { href: '/dashboard/creators', label: 'Creadores', icon: PenTool },
  { href: '/dashboard/points-of-sale', label: 'Puntos de Venta', icon: Store },
  { href: '/dashboard/warehouses', label: 'Bodegas', icon: Warehouse },
  { href: '/dashboard/agreements', label: 'Contratos', icon: FileText },
  { href: '/dashboard/movements', label: 'Movimientos', icon: List },
  { href: '/dashboard/inventory', label: 'Inventario', icon: Package },
  { href: '/dashboard/categories', label: 'Categorías', icon: Tag },
  { href: '/help', label: 'Ayuda', icon: HelpCircle },
  { href: '/settings', label: 'Configuración', icon: Settings },
] as const;

const adminNavItems = [
  { href: '/dashboard/users', label: 'Usuarios', icon: Users },
] as const;

interface NavLinksProps {
  currentPath?: string;
  variant?: 'horizontal' | 'vertical';
  onLinkClick?: () => void;
  className?: string;
  collapsed?: boolean;
}

export function NavLinks({
  currentPath = '/',
  variant = 'horizontal',
  onLinkClick,
  className,
  collapsed = false,
}: NavLinksProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath?.startsWith(href);
  };

  const baseStyles =
    'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors hover:bg-muted/50 text-foreground/70 hover:text-foreground';
  const activeStyles = 'bg-primary/5 text-primary/90 font-medium';

  // Combinar items regulares con items de admin si el usuario es admin
  const allNavItems = isAdmin
    ? [...navItems, ...adminNavItems]
    : navItems;

  if (variant === 'vertical') {
    return (
      <nav className={cn('flex flex-col gap-2', className)} aria-label="Navegación principal">
        {allNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                baseStyles,
                active && activeStyles,
                collapsed ? 'justify-center px-2' : 'justify-start text-base'
              )}
              title={collapsed ? label : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn("w-4 h-4", collapsed ? "w-5 h-5" : "")} aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Navegación principal">
      {allNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={cn(
              baseStyles,
              'border-b-2 border-transparent',
              active && activeStyles,
              active && 'border-primary'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
