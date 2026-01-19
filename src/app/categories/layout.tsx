import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Categorías | Tanuki',
  description: 'Gestión de categorías financieras',
};

export default function CategoriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="categories-layout">
        <Sidebar />
        <div className="categories-layout__main-container">
          <AppHeader />
          <main className="categories-layout__content">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
