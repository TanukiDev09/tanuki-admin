'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { Badge } from '@/components/ui/Badge';
import './profile.scss';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div>
          <h2 className="profile-page__title">Perfil de Usuario</h2>
          <p className="profile-page__description">
            Gestiona la configuración de tu cuenta y seguridad.
          </p>
        </div>
      </div>

      <div className="profile-page__grid">
        <div className="profile-page__left-column">
          <div className="profile-page__info-card">
            <h3 className="profile-page__card-title">Información Personal</h3>
            <div className="profile-page__info-group">
              <div className="profile-page__field">
                <label className="profile-page__label">Nombre</label>
                <div className="profile-page__value">
                  {user?.name || 'Cargando...'}
                </div>
              </div>
              <div className="profile-page__field">
                <label className="profile-page__label">Email</label>
                <div className="profile-page__value">
                  {user?.email || 'Cargando...'}
                </div>
              </div>
              <div className="profile-page__field">
                <label className="profile-page__label">Rol</label>
                <Badge variant="secondary" className="profile-page__role-badge">
                  {user?.role || '...'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
