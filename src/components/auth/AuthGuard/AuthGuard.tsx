'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './AuthGuard.scss';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="auth-guard">
        <div className="auth-guard__container">
          <div className="auth-guard__spinner"></div>
          <p className="auth-guard__text">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // No mostrar nada si no está autenticado (mientras redirige)
  if (!user) {
    return null;
  }

  // Mostrar contenido protegido
  return <>{children}</>;
}
