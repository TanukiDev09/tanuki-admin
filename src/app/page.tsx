'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import './login.scss';

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
      <main className="login-page login-page--loading">
        <h1 className="sr-only">Verificando sesión</h1>
        <div className="login-page__spinner-container">
          <div className="login-page__spinner"></div>
          <p className="login-page__loading-text">Verificando sesión...</p>
        </div>
      </main>
    );
  }

  // Si ya está autenticado, redirigiendo
  if (user) {
    return (
      <main className="login-page login-page--redirecting">
        <h1 className="login-page__redirect-text">Redirigiendo al dashboard...</h1>
      </main>
    );
  }

  return (
    <div className="login-page">
      <div className="login-page__background"></div>
      <div className="login-page__content">
        <LoginForm />
      </div>
    </div>
  );
}
