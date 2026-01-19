import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import './not-found.scss';

export default function NotFound() {
  return (
    <main className="not-found">
      <h1 className="not-found__title">404 - Página no encontrada</h1>
      <p className="not-found__description">Lo sentimos, no pudimos encontrar lo que buscabas.</p>
      <Link href="/dashboard">
        <Button>Volver al inicio</Button>
      </Link>
    </main>
  );
}
