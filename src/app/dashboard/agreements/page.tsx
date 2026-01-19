'use client';

import GlobalAgreementList from '@/components/agreements/GlobalAgreementList';
import './agreements-page.scss';

export default function AgreementsPage() {
  return (
    <div className="agreements-page">
      <div className="agreements-page__header">
        <div>
          <h1 className="agreements-page__title">Contratos</h1>
          <p className="agreements-page__description">
            Gestión global de contratos y acuerdos con creadores.
          </p>
        </div>
      </div>

      <GlobalAgreementList />
    </div>
  );
}
