'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';

import './dashboard-layout.scss';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-layout__container">
          <AppHeader />
          <main className="dashboard-layout__main">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
