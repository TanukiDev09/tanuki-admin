'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import './AppHeader.scss';

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="header">
      <div className="header__container">
        {/* Mobile Logo */}
        <div className="header__mobile-logo">
          <div className="header__logo-emoji" aria-hidden="true">
            🦝
          </div>
          <h1 className="header__logo-title">TANUKI</h1>
        </div>

        {/* Spacer for Desktop */}
        <div className="header__spacer"></div>

        {/* User Actions */}
        <div className="header__actions">
          {user && (
            <div className="header__user-menu">
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="header__action-button"
                aria-label="Perfil"
                title="Perfil"
              >
                <User className="header__action-icon" />
              </button>
              <button
                onClick={handleLogout}
                className="header__action-button header__action-button--logout"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="header__action-icon" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
