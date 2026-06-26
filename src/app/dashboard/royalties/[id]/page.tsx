import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RoyaltyStatementDetail from '@/components/royalties/RoyaltyStatementDetail';
import '../royalties-page.scss';

export default async function RoyaltyStatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="royalties-page">
      <div className="royalties-page__header">
        <div>
          <Link href="/dashboard/royalties" className="royalties-page__back">
            <ArrowLeft className="royalties-page__btn-icon" />
            Volver a liquidaciones
          </Link>
          <h1 className="royalties-page__title">Detalle de liquidación</h1>
        </div>
      </div>

      <RoyaltyStatementDetail id={id} />
    </div>
  );
}
