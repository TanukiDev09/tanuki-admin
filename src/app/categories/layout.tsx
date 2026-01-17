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
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
