'use client';

import { BookOpen } from 'lucide-react';
import { AgreementResponse } from '@/types/agreement';
import './AgreementDetails.scss';

interface AgreementDetailsProps {
  agreement: AgreementResponse;
  className?: string;
}

export function AgreementDetails({ agreement, className }: AgreementDetailsProps) {
  const isPublicDomain = (agreement as { isPublicDomain?: boolean }).isPublicDomain;

  if (isPublicDomain) {
    return (
      <div className={`agreement-details__public-domain ${className || ''}`}>
        <div className="agreement-details__public-domain-header">
          <BookOpen className="agreement-details__public-domain-icon" />
          <h3 className="agreement-details__public-domain-title">Obra de Dominio Público</h3>
        </div>
        <p className="agreement-details__public-domain-text">
          Esta obra no requiere pago de regalías ni adelantos. Los derechos de autor han expirado o no aplican.
        </p>
      </div>
    );
  }

  return (
    <div className={`agreement-details ${className || ''}`}>
      <div className="agreement-details__field">
        <h3 className="agreement-details__label">Tipo de Acuerdo</h3>
        <p className="agreement-details__value">
          {agreement.royaltyPercentage > 0 ? 'Regalías' : 'Pago de Contado'}
        </p>
      </div>
      <div className="agreement-details__field">
        <h3 className="agreement-details__label">
          {agreement.royaltyPercentage > 0 ? '% Royalties' : 'Monto Pago'}
        </h3>
        <p className="agreement-details__value agreement-details__value--mono">
          {agreement.royaltyPercentage > 0 ? `${agreement.royaltyPercentage}%` : `$${agreement.advancePayment || 0}`}
        </p>
      </div>
      {agreement.royaltyPercentage > 0 && (
        <div className="agreement-details__field">
          <h3 className="agreement-details__label">Adelanto</h3>
          <p className="agreement-details__value agreement-details__value--mono">
            ${agreement.advancePayment || 0}
          </p>
        </div>
      )}
      <div className="agreement-details__field">
        <h3 className="agreement-details__label">Fechas</h3>
        <p className="agreement-details__value">
          {agreement.validFrom ? new Date(agreement.validFrom).toLocaleDateString() : '—'}
          {' -> '}
          {agreement.validUntil ? new Date(agreement.validUntil).toLocaleDateString() : 'Indefinido'}
        </p>
      </div>
    </div>
  );
}
