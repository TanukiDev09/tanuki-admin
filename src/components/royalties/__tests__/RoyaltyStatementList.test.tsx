import { render, screen } from '@testing-library/react';
import RoyaltyStatementList from '../RoyaltyStatementList';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const statements = [
  {
    _id: 's1',
    creatorName: 'Nathaly Sánchez',
    bookTitle: 'La cólera en los tiempos del amor',
    periodStart: '2021-10-01T00:00:00.000Z',
    periodEnd: '2025-05-25T00:00:00.000Z',
    netSettlement: 1386628,
    balanceInFavorOf: 'author',
    status: 'paid',
    createdAt: '2025-05-25T00:00:00.000Z',
  },
  {
    _id: 's2',
    creatorName: 'Otro Autor',
    bookTitle: 'Otro libro',
    periodStart: '2024-01-01T00:00:00.000Z',
    periodEnd: '2024-12-31T00:00:00.000Z',
    netSettlement: -5600,
    balanceInFavorOf: 'publisher',
    status: 'draft',
    createdAt: '2024-12-31T00:00:00.000Z',
  },
];

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: statements }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('RoyaltyStatementList', () => {
  it('pide las liquidaciones y las pinta con su estado', async () => {
    render(<RoyaltyStatementList />);

    // Filas
    expect(await screen.findByText('Nathaly Sánchez')).toBeInTheDocument();
    expect(
      screen.getByText('La cólera en los tiempos del amor')
    ).toBeInTheDocument();
    expect(screen.getByText('Otro Autor')).toBeInTheDocument();

    // Estados traducidos
    expect(screen.getByText('Pagada')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();

    // Saldo a favor
    expect(screen.getByText('A favor del autor')).toBeInTheDocument();
    expect(screen.getByText('A favor de la editorial')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('/api/royalties');
  });

  it('muestra el mensaje vacío cuando no hay liquidaciones', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;

    render(<RoyaltyStatementList />);

    expect(
      await screen.findByText(/Aún no hay liquidaciones/i)
    ).toBeInTheDocument();
  });
});
