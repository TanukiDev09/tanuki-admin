import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Configuración | Tanuki',
  description: 'Configuración de la aplicación',
};

import './settings-layout.scss';

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="settings-layout">
        <Sidebar />
        <div className="settings-layout__content">
          <AppHeader />
          <main className="settings-layout__main">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
