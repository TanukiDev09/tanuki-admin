import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Movimientos | Tanuki',
  description: 'Historial de movimientos financieros',
};

export default function MovimientosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="movements-layout">
        <Sidebar />
        <div className="movements-layout__main-container">
          <AppHeader />
          <main className="movements-layout__content">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
