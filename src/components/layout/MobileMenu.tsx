'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, LogOut, User } from 'lucide-react';
import { NavLinks } from './NavLinks';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

export function MobileMenu({ isOpen, onClose, currentPath }: MobileMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[280px] bg-card z-50 lg:hidden',
          'shadow-2xl transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="p-4">
          <NavLinks
            currentPath={currentPath}
            variant="vertical"
            onLinkClick={onClose}
          />
        </div>
      </div>
    </>
  );
}
