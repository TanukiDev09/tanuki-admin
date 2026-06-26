// Mock de mongoose (evita cargar bson ESM; solo expone Types.ObjectId).
jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    Types: {
      ObjectId: class {
        constructor(public id: string) {}
        toString() {
          return this.id;
        }
      },
    },
  },
}));

jest.mock('@/models/Invoice', () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}));

// Mock de la detección de anticipos (la prueba real vive en advances.test.ts).
jest.mock('../advances', () => ({
  findAdvanceMovements: jest.fn(),
}));

import {
  computeRoyaltyLines,
  resolveFavor,
  buildCreatorComputation,
  AgreementForComputation,
} from '../calculate';
import Invoice from '@/models/Invoice';
import { findAdvanceMovements } from '../advances';

const aggregateMock = Invoice.aggregate as unknown as jest.Mock;
const advanceMock = findAdvanceMovements as unknown as jest.Mock;

const BOOK_ID = '507f1f77bcf86cd799439011';
const PERIOD_START = new Date('2024-01-01');
const PERIOD_END = new Date('2024-12-31');

const aggRow = (over: Partial<Record<string, unknown>> = {}) => ({
  _id: { toString: () => 'inv-1' },
  invoiceNumber: 'FE129',
  date: new Date('2024-02-10'),
  quantity: 1,
  totalInvoiced: 55000,
  maxUnitPrice: 55000,
  ...over,
});

const agreement = (
  over: Partial<AgreementForComputation> = {}
): AgreementForComputation => ({
  _id: 'agr-1',
  role: 'author',
  royaltyPercentage: 8,
  book: { _id: BOOK_ID, title: 'Mi libro', costCenter: '01T009' },
  ...over,
});

beforeEach(() => {
  aggregateMock.mockReset();
  advanceMock.mockReset();
  advanceMock.mockResolvedValue({ total: 0, lines: [], unavailable: false });
});

describe('resolveFavor', () => {
  it('positivo → autor, negativo → editorial, cero → none', () => {
    expect(resolveFavor(100)).toBe('author');
    expect(resolveFavor(-100)).toBe('publisher');
    expect(resolveFavor(0)).toBe('none');
  });
});

describe('computeRoyaltyLines', () => {
  it('mapea cada factura a una línea con regalía = total × %', async () => {
    aggregateMock.mockResolvedValue([
      aggRow(),
      aggRow({
        _id: { toString: () => 'inv-2' },
        invoiceNumber: 'FE143',
        quantity: 8,
        totalInvoiced: 440000,
      }),
    ]);

    const res = await computeRoyaltyLines(BOOK_ID, PERIOD_START, PERIOD_END, 8);

    expect(res.lines).toHaveLength(2);
    expect(res.lines[0].totalRoyalty).toBe(4400);
    expect(res.lines[1].totalRoyalty).toBe(35200);
    expect(res.totalCopies).toBe(9);
    expect(res.totalRoyalties).toBe(39600);
  });

  it('devuelve ceros cuando no hay ventas', async () => {
    aggregateMock.mockResolvedValue([]);
    const res = await computeRoyaltyLines(BOOK_ID, PERIOD_START, PERIOD_END, 8);
    expect(res.lines).toHaveLength(0);
    expect(res.totalRoyalties).toBe(0);
  });
});

describe('buildCreatorComputation', () => {
  const base = {
    periodStart: PERIOD_START,
    periodEnd: PERIOD_END,
    previousBalance: 0,
    detectAdvances: true,
  };

  it('una sección por obra con ventas; agrega totales y detecta anticipo', async () => {
    aggregateMock.mockResolvedValue([aggRow()]); // 55000 → 8% → 4400
    advanceMock.mockResolvedValue({
      total: 1000,
      lines: [
        {
          movementId: 'm1',
          date: new Date('2024-05-07'),
          description: 'Pago',
          beneficiary: 'X',
          amount: 1000,
        },
      ],
      unavailable: false,
    });

    const c = await buildCreatorComputation({
      ...base,
      agreements: [agreement()],
    });

    expect(c.books).toHaveLength(1);
    expect(c.books[0].bookTitle).toBe('Mi libro');
    expect(c.totalRoyalties).toBe(4400);
    expect(c.advancePayment).toBe(1000);
    expect(c.advanceBreakdown).toHaveLength(1);
    expect(c.advanceBreakdown[0].bookTitle).toBe('Mi libro'); // etiquetado por obra
    // 0 + 4400 - 1000 = 3400 a favor del autor
    expect(c.netSettlement).toBe(3400);
    expect(c.balanceInFavorOf).toBe('author');
    expect(c.carryoverToNext).toBe(0);
  });

  it('omite obras sin ventas en el período', async () => {
    aggregateMock.mockResolvedValue([]); // sin ventas
    const c = await buildCreatorComputation({
      ...base,
      agreements: [agreement()],
    });
    expect(c.books).toHaveLength(0);
    expect(c.totalRoyalties).toBe(0);
    // No se busca anticipo de una obra omitida
    expect(advanceMock).not.toHaveBeenCalled();
  });

  it('agrega varias obras (suma regalías de todas)', async () => {
    aggregateMock
      .mockResolvedValueOnce([aggRow()]) // libro 1: 4400
      .mockResolvedValueOnce([
        aggRow({ quantity: 2, totalInvoiced: 110000 }),
      ]); // libro 2: 8800

    const c = await buildCreatorComputation({
      ...base,
      agreements: [
        agreement({ _id: 'a1' }),
        agreement({ _id: 'a2', book: { _id: 'b2', title: 'Libro 2' } }),
      ],
    });

    expect(c.books).toHaveLength(2);
    expect(c.totalRoyalties).toBe(13200);
  });

  it('no detecta anticipo en liquidaciones posteriores (detectAdvances false)', async () => {
    aggregateMock.mockResolvedValue([aggRow()]);
    const c = await buildCreatorComputation({
      ...base,
      detectAdvances: false,
      previousBalance: -2000,
      agreements: [agreement()],
    });
    expect(advanceMock).not.toHaveBeenCalled();
    expect(c.advancePayment).toBe(0);
    // -2000 + 4400 - 0 = 2400
    expect(c.netSettlement).toBe(2400);
  });
});
