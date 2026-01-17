'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NavLinks } from './NavLinks';
import { useAuth } from '@/contexts/AuthContext';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    // Using RAF to avoid setState during render
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <aside className="hidden lg:flex lg:flex-col lg:w-56 bg-muted/30 border-r border-border/50">
        {/* Skeleton while mounting */}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col bg-muted/30 border-r border-border/50 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Toggle Button */}
      <button
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border/50 bg-background/80 shadow-sm z-20 hover:bg-accent transition-colors hidden lg:flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo Section */}
      <div className={cn("p-4 border-b border-border/50 flex items-center", isCollapsed ? "justify-center px-2" : "")}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="text-2xl shrink-0" aria-hidden="true">
            🦝
          </div>
          <div className={cn("transition-opacity duration-200", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
            <h1 className="text-lg font-semibold text-foreground/90 tracking-tight whitespace-nowrap">
              TANUKI
            </h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className={cn("p-3 border-b border-border/50", isCollapsed ? "py-3 px-2" : "")}>
          <div className={cn("flex items-center gap-2.5", isCollapsed ? "justify-center" : "")}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary/70" />
            </div>
            <div className={cn("flex-1 min-w-0 transition-opacity duration-200", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
              <p className="text-sm font-medium text-foreground/80 truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav role="navigation" aria-label="Navegación principal" className="flex-1 p-3 overflow-y-auto">
        <NavLinks currentPath={pathname} variant="vertical" collapsed={isCollapsed} />
      </nav>

      {/* Footer Info */}
      <div className={cn("p-3 border-t border-border/50", isCollapsed ? "hidden" : "")}>
        <p className="text-xs text-muted-foreground/60 text-center">
          Tanuki Libros © 2024
        </p>
      </div>
    </aside>
  );
}

