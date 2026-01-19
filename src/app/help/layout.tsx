import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Ayuda | Tanuki',
  description: 'Glosario de términos financieros',
};

export default function AyudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="help-layout">
        <Sidebar />
        <div className="help-layout__main-container">
          <AppHeader />
          <main className="help-layout__content">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
