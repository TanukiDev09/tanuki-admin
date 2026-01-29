'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NavLinks } from '../NavLinks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
      <aside className={cn(
        "sidebar",
        isCollapsed && "sidebar--collapsed"
      )}>
        {/* Decorative Background Elements */}
        <div className="sidebar__glow" />

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
            <div className="sidebar__logo-emoji">
              🦝
            </div>
            {!isCollapsed && (
              <div className="sidebar__logo-text">
                <h1 className="sidebar__logo-title">TANUKI</h1>
                <div className="sidebar__logo-badge">ADMIN</div>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="sidebar__user">
            <div className="sidebar__user-card">
              <div className="sidebar__user-avatar">
                <User className="sidebar__user-icon" />
                <div className="sidebar__user-status" />
              </div>
              {!isCollapsed && (
                <div className="sidebar__user-info">
                  <p className="sidebar__user-name">{user.name}</p>
                  <p className="sidebar__user-role">Súper Administrador</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="sidebar__nav">
          <div className="sidebar__nav-label">Navegación</div>
          <NavLinks
            currentPath={pathname}
            variant="vertical"
            collapsed={isCollapsed}
          />
        </nav>

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="sidebar__footer">
            <div className="sidebar__footer-line" />
            <p className="sidebar__footer-text">Tanuki Libros v1.0.3</p>
          </div>
        )}
      </aside>
    </>
  );
}
