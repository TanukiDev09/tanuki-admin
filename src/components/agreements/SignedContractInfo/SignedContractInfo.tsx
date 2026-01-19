'use client';

import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './SignedContractInfo.scss';

interface SignedContractInfoProps {
  url?: string;
  className?: string;
}

export function SignedContractInfo({
  url,
  className,
}: SignedContractInfoProps) {
  if (!url) {
    return (
      <div className={`signed-contract-info__empty ${className || ''}`}>
        No se ha subido ningún documento PDF.
      </div>
    );
  }

  return (
    <div className={`signed-contract-info ${className || ''}`}>
      <FileText className="signed-contract-info__icon" />
      <div className="signed-contract-info__content">
        <p className="signed-contract-info__filename">Contrato Firmado.pdf</p>
        <p className="signed-contract-info__meta">Disponible para descarga</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`/uploads/contracts/${url}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download className="signed-contract-info__action-icon" />
          Descargar / Ver
        </a>
      </Button>
    </div>
  );
}
