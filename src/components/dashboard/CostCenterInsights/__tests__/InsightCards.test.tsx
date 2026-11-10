import { render, screen } from '@testing-library/react';
import {
  InventoryCard,
  ReceivablesCard,
  RecoveryCard,
  RoyaltiesCard,
} from '../InsightCards';
import {
  computeInventory,
  computeReceivables,
  computeRecovery,
  computeRoyalties,
} from '@/lib/finance/costCenterInsights';

const NOW = new Date('2026-06-15T12:00:00Z');

describe('RecoveryCard', () => {
  it('muestra el avance y los ejemplares que faltan', () => {
    render(
      <RecoveryCard
        recovery={computeRecovery({
          income: 4_000_000,
          expenses: 10_000_000,
          revenuePerUnit: 20_000,
          avgMonthlyUnits: 100,
          now: NOW,
        })}
      />
    );
    expect(screen.getByText('40% recuperado')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '40'
    );
    expect(screen.getByText(/Faltan ~300 ejemplares/)).toBeInTheDocument();
  });

  it('indica cuando la inversión ya se recuperó', () => {
    render(
      <RecoveryCard
        recovery={computeRecovery({
          income: 12,
          expenses: 10,
          revenuePerUnit: 1,
          avgMonthlyUnits: 1,
          now: NOW,
        })}
      />
    );
    expect(screen.getByText('Inversión recuperada')).toBeInTheDocument();
  });

  it('no inventa fecha sin ventas recientes', () => {
    render(
      <RecoveryCard
        recovery={computeRecovery({
          income: 0,
          expenses: 5_000_000,
          revenuePerUnit: 20_000,
          avgMonthlyUnits: 0,
          now: NOW,
        })}
      />
    );
    expect(
      screen.getByText(/no se puede estimar la fecha/)
    ).toBeInTheDocument();
  });
});

describe('InventoryCard', () => {
  const inventory = computeInventory({
    printRun: 1000,
    sold: 400,
    stock: [{ quantity: 300, atPointOfSale: false }],
    remitted: 0,
    returned: 0,
    avgMonthlyUnits: 50,
  });

  it('muestra el porcentaje del tiraje vendido', () => {
    render(<InventoryCard inventory={inventory} hasBooks />);
    expect(screen.getByText('40% del tiraje vendido')).toBeInTheDocument();
    expect(screen.getByText('Sin remisiones registradas')).toBeInTheDocument();
  });

  it('avisa si no hay libros vinculados', () => {
    render(<InventoryCard inventory={inventory} hasBooks={false} />);
    expect(screen.getByText(/Ningún libro está vinculado/)).toBeInTheDocument();
  });
});

describe('ReceivablesCard', () => {
  it('menciona las facturas sin verificar', () => {
    render(
      <ReceivablesCard
        receivables={computeReceivables(
          [{ status: 'Unchecked', amount: 500, paid: 0, date: NOW }],
          NOW
        )}
      />
    );
    expect(screen.getByText(/en facturas sin verificar/)).toBeInTheDocument();
  });
});

describe('RoyaltiesCard', () => {
  it('muestra "Por pagar" cuando las regalías superan el anticipo', () => {
    render(<RoyaltiesCard royalties={computeRoyalties(100, 300)} hasBooks />);
    expect(screen.getByText('Por pagar al autor')).toBeInTheDocument();
  });

  it('muestra el anticipo por recuperar en el caso contrario', () => {
    render(<RoyaltiesCard royalties={computeRoyalties(300, 100)} hasBooks />);
    expect(screen.getByText('Anticipo por recuperar')).toBeInTheDocument();
  });
});
