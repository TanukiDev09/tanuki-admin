'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NewRoyaltyStatement from '@/components/royalties/NewRoyaltyStatement';
import '../royalties-page.scss';

export default function NewRoyaltyStatementPage() {
  return (
    <div className="royalties-page">
      <div className="royalties-page__header">
        <div>
          <Link href="/dashboard/royalties" className="royalties-page__back">
            <ArrowLeft className="royalties-page__btn-icon" />
            Volver
          </Link>
          <h1 className="royalties-page__title">Nueva liquidación</h1>
          <p className="royalties-page__description">
            Elige el contrato y el período; el sistema calcula las regalías de
            las ventas en papel.
          </p>
        </div>
      </div>

      <NewRoyaltyStatement />
    </div>
  );
}
