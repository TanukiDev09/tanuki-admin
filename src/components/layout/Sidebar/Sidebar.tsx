'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NavLinks } from '../NavLinks';
import { useAuth } from '@/contexts/AuthContext';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.scss';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <aside className="sidebar sidebar--skeleton">
        {/* Skeleton while mounting */}
      </aside>
    );
  }

  return (
    <>
      {/* Desktop/Sidebar Navigation */}
      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Toggle Button */}
        <button
          className="sidebar__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? (
            <ChevronRight className="sidebar__toggle-icon" />
          ) : (
            <ChevronLeft className="sidebar__toggle-icon" />
          )}
        </button>

        {/* Logo Section */}
        <div className="sidebar__logo-container">
          <div className="sidebar__logo-wrapper">
            <div className="sidebar__logo-emoji" aria-hidden="true">
              🦝
            </div>
            {!isCollapsed && (
              <div className="sidebar__logo-text">
                <h1 className="sidebar__logo-title">TANUKI</h1>
                <p className="sidebar__logo-subtitle">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="sidebar__user">
            <div className="sidebar__user-wrapper">
              <div className="sidebar__user-avatar">
                <User className="sidebar__user-icon" />
              </div>
              {!isCollapsed && (
                <div className="sidebar__user-info">
                  <p className="sidebar__user-name">{user.name}</p>
                  <p className="sidebar__user-email">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav
          role="navigation"
          aria-label="Navegación principal"
          className="sidebar__nav"
        >
          <NavLinks
            currentPath={pathname}
            variant="vertical"
            collapsed={isCollapsed}
          />
        </nav>

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="sidebar__footer">
            <p className="sidebar__footer-text">Tanuki Libros © 2024</p>
          </div>
        )}
      </aside>

      {/* Mobile Navigation (Bottom Bar) */}
      <nav
        className="mobile-nav"
        role="navigation"
        aria-label="Navegación móvil"
      >
        <NavLinks currentPath={pathname} variant="mobile" />
      </nav>
    </>
  );
}
