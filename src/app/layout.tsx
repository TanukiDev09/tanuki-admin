import type { Metadata } from 'next';
import { Work_Sans, Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';



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
    <html lang="es" className={`${workSans.variable} ${montserrat.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <AuthProvider>
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
