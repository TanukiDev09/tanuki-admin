'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';

import { MobileMenu } from './MobileMenu';
import { useAuth } from '@/contexts/AuthContext';

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
  });

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Mobile Logo (only on small screens) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="text-2xl" aria-hidden="true">
              🦝
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              TANUKI
            </h1>
          </div>

          {/* Desktop: Empty space to push content right */}
          <div className="hidden lg:block flex-1"></div>

          {/* Right Side: Date + User Menu + Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-muted-foreground bg-muted rounded-md px-3 py-1.5 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
              </svg>
              <span className="hidden sm:inline">{currentDate}</span>
            </div>

            {/* User Info & Logout (desktop) */}
            {user && (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-muted rounded-md transition-colors group"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Abrir menú de navegación"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={pathname}
      />
    </>
  );
}
