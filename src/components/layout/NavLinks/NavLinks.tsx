'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  List,
  Tag,
  HelpCircle,
  Settings,
  Users,
  BookOpen,
  PenTool,
  FileText,
  Store,
  Warehouse,
  Package,
  Shield,
  Activity,
  MoreHorizontal,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import './NavLinks.scss';

export const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  {
    href: '/dashboard/financial-health',
    label: 'Salud Financiera',
    icon: Activity,
  },
  { href: '/dashboard/catalog', label: 'Catálogo', icon: BookOpen },
  { href: '/dashboard/collections', label: 'Colecciones', icon: List },
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
  { href: '/dashboard/permissions', label: 'Permisos', icon: Shield },
] as const;

const mobileNavItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/financial-health', label: 'Salud', icon: Activity },
  { href: '/dashboard/catalog', label: 'Catálogo', icon: BookOpen },
  { href: '/dashboard/movements', label: 'Movimientos', icon: List },
  { href: '/dashboard/inventory', label: 'Inventario', icon: Package },
] as const;

interface NavLinksProps {
  currentPath?: string;
  variant?: 'horizontal' | 'vertical' | 'mobile';
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();

  const canSee = (href: string) => {
    if (href === '/dashboard' || href === '/help' || href === '/settings')
      return true;

    const modulePermissionMap: Record<string, ModuleName> = {
      '/dashboard/catalog': ModuleName.BOOKS,
      '/dashboard/creators': ModuleName.CREATORS,
      '/dashboard/collections': ModuleName.COLLECTIONS,
      '/dashboard/points-of-sale': ModuleName.POINTS_OF_SALE,
      '/dashboard/warehouses': ModuleName.WAREHOUSES,
      '/dashboard/agreements': ModuleName.AGREEMENTS,
      '/dashboard/movements': ModuleName.FINANCE,
      '/dashboard/financial-health': ModuleName.FINANCE,
      '/dashboard/inventory': ModuleName.INVENTORY,
      '/dashboard/categories': ModuleName.CATEGORIES,
      '/dashboard/users': ModuleName.USERS,
      '/dashboard/permissions': ModuleName.PERMISSIONS,
    };

    const entry = Object.entries(modulePermissionMap).find(([path]) =>
      href.startsWith(path)
    );

    if (entry) {
      return hasPermission(entry[1], PermissionAction.READ);
    }

    return true;
  };

  const isAdmin = user?.role === 'admin';
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath?.startsWith(href);
  };

  const allNavItems = (
    isAdmin ? [...navItems, ...adminNavItems] : navItems
  ).filter((item) => canSee(item.href));

  const mobileNavItemsVisible = mobileNavItems.filter((item) =>
    canSee(item.href)
  );

  // Mobile variant - bottom navigation bar
  if (variant === 'mobile') {
    const moreItems = allNavItems.filter(
      (item) =>
        !mobileNavItems.some((mobileItem) => mobileItem.href === item.href)
    );

    return (
      <div className={`nav-links nav-links--mobile ${className || ''}`}>
        {mobileNavItemsVisible.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`nav-links__mobile-item ${active ? 'nav-links__mobile-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="nav-links__mobile-icon" aria-hidden="true" />
              <span className="nav-links__mobile-label">{label}</span>
            </Link>
          );
        })}

        {/* More menu */}
        <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="nav-links__mobile-item nav-links__mobile-item--more"
              aria-label="Más opciones"
            >
              <MoreHorizontal
                className="nav-links__mobile-icon"
                aria-hidden="true"
              />
              <span className="nav-links__mobile-label">Más</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="nav-links__dropdown">
            {moreItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <DropdownMenuItem key={href} asChild>
                  <Link
                    href={href}
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onLinkClick?.();
                    }}
                    className={`nav-links__dropdown-item ${active ? 'nav-links__dropdown-item--active' : ''}`}
                  >
                    <Icon
                      className="nav-links__dropdown-icon"
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator className="nav-links__dropdown-separator" />

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/profile"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onLinkClick?.();
                }}
                className={`nav-links__dropdown-item ${currentPath === '/dashboard/profile' ? 'nav-links__dropdown-item--active' : ''}`}
              >
                <User className="nav-links__dropdown-icon" aria-hidden="true" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                setMoreMenuOpen(false);
                logout();
                router.push('/');
              }}
              className="nav-links__dropdown-item nav-links__dropdown-item--logout"
            >
              <LogOut className="nav-links__dropdown-icon" aria-hidden="true" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Vertical (Sidebar) variant
  if (variant === 'vertical') {
    return (
      <nav
        className={`nav-links nav-links--vertical ${collapsed ? 'nav-links--collapsed' : ''} ${className || ''}`}
        aria-label="Navegación principal"
      >
        {allNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`nav-links__item ${active ? 'nav-links__item--active' : ''}`}
              title={collapsed ? label : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="nav-links__icon" aria-hidden="true" />
              {!collapsed && <span className="nav-links__label">{label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Horizontal variant
  return (
    <nav
      className={`nav-links nav-links--horizontal ${className || ''}`}
      aria-label="Navegación principal"
    >
      {allNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={`nav-links__item ${active ? 'nav-links__item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="nav-links__icon" aria-hidden="true" />
            <span className="nav-links__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
