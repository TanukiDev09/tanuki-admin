'use client';

import './dashboard.scss';
import { ModuleLinks } from '@/components/dashboard/ModuleLinks/ModuleLinks';



export default function DashboardPage() {
  return (
    <div className="dashboard__container">
      {/* HEADER SECTION */}
      <header className="dashboard__header">
        <div className="dashboard__header-content">
          <h1 className="dashboard__header-title">Panel de Control</h1>
          <p className="dashboard__header-subtitle">
            Selecciona un módulo para comenzar
          </p>
        </div>
      </header>

      {/* MODULE LINKS SECTION */}
      <section className="dashboard__section">
        <ModuleLinks />
      </section>
    </div>
  );
}
