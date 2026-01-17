'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
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
