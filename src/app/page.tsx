'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar el formulario mientras redirige
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-surface to-background p-4">
      <LoginForm />
    </div>
  );
}
