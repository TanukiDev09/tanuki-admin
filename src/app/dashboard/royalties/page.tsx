'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import RoyaltyStatementList from '@/components/royalties/RoyaltyStatementList';
import './royalties-page.scss';

export default function RoyaltiesPage() {
  return (
    <div className="royalties-page">
      <div className="royalties-page__header">
        <div>
          <h1 className="royalties-page__title">Liquidación de regalías</h1>
          <p className="royalties-page__description">
            Genera, aprueba y paga liquidaciones de regalías a autores.
          </p>
        </div>
        <Link href="/dashboard/royalties/nueva">
          <Button>
            <Plus className="royalties-page__btn-icon" />
            Nueva liquidación
          </Button>
        </Link>
      </div>

      <RoyaltyStatementList />
    </div>
  );
}
