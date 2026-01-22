import type { Metadata } from 'next';
import { Work_Sans, Montserrat } from 'next/font/google';
import '../styles/globals.scss';
import './globals.css';
import './root-layout.scss';
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { Toaster } from '@/components/ui/Toast';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tanuki | Finanzas',
  description: 'Monitor financiero.',
};

import ReactQueryProvider from '@/providers/ReactQueryProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${workSans.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body className="root-layout" suppressHydrationWarning>
        <AuthProvider>
          <PermissionProvider>
            <ReactQueryProvider>
              {children}
              <Toaster />
            </ReactQueryProvider>
          </PermissionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
