'use client';

import { usePathname } from 'next/navigation';
import { NavLinks } from '../NavLinks';
import './MobileNav.scss';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-nav"
      role="navigation"
      aria-label="Navegación móvil"
    >
      <NavLinks currentPath={pathname} variant="mobile" />
    </nav>
  );
}
