// Mock de mongoose: evita cargar bson (ESM) y solo expone Types.ObjectId.
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

// Mock del modelo Invoice: solo necesitamos controlar la agregación.
jest.mock('@/models/Invoice', () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}));

import {
  computeRoyaltyLines,
  resolveFavor,
  buildComputation,
} from '../calculate';

import Invoice from '@/models/Invoice';

const aggregateMock = Invoice.aggregate as unknown as jest.Mock;

// ObjectId válido (24 hex) para que `new mongoose.Types.ObjectId(bookId)` no falle.
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

beforeEach(() => {
  aggregateMock.mockReset();
});

describe('resolveFavor', () => {
  it('positivo → autor', () => {
    expect(resolveFavor(100)).toBe('author');
  });
  it('negativo → editorial', () => {
    expect(resolveFavor(-100)).toBe('publisher');
  });
  it('cero → none', () => {
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
        maxUnitPrice: 55000,
      }),
    ]);

    const res = await computeRoyaltyLines(
      BOOK_ID,
      PERIOD_START,
      PERIOD_END,
      8
    );

    expect(res.lines).toHaveLength(2);
    expect(res.lines[0]).toMatchObject({
      invoiceId: 'inv-1',
      invoiceNumber: 'FE129',
      quantity: 1,
      pvp: 55000,
      totalInvoiced: 55000,
      totalRoyalty: 4400,
    });
    expect(res.lines[1].totalRoyalty).toBe(35200); // 440000 * 8%
    expect(res.totalCopies).toBe(9);
    expect(res.totalInvoiced).toBe(495000);
    expect(res.totalRoyalties).toBe(39600);
  });

  it('calcula PVP como total / ejemplares cuando hay varios', async () => {
    aggregateMock.mockResolvedValue([
      aggRow({ quantity: 2, totalInvoiced: 110000, maxUnitPrice: 55000 }),
    ]);

    const res = await computeRoyaltyLines(BOOK_ID, PERIOD_START, PERIOD_END, 8);

    expect(res.lines[0].pvp).toBe(55000);
    expect(res.lines[0].totalRoyalty).toBe(8800);
  });

  it('devuelve ceros cuando no hay ventas', async () => {
    aggregateMock.mockResolvedValue([]);

    const res = await computeRoyaltyLines(BOOK_ID, PERIOD_START, PERIOD_END, 8);

    expect(res.lines).toHaveLength(0);
    expect(res.totalCopies).toBe(0);
    expect(res.totalInvoiced).toBe(0);
    expect(res.totalRoyalties).toBe(0);
  });

  it('filtra facturas Cancelled y Draft, y respeta el rango de fechas', async () => {
    aggregateMock.mockResolvedValue([]);
    await computeRoyaltyLines(BOOK_ID, PERIOD_START, PERIOD_END, 8);

    const pipeline = aggregateMock.mock.calls[0][0];
    const match = pipeline[0].$match;
    expect(match.status.$nin).toEqual(
      expect.arrayContaining(['Cancelled', 'Draft'])
    );
    expect(match.date.$gte).toEqual(PERIOD_START);
    expect(match.date.$lte).toEqual(PERIOD_END);
  });
});

describe('buildComputation', () => {
  const base = {
    bookId: BOOK_ID,
    periodStart: PERIOD_START,
    periodEnd: PERIOD_END,
    royaltyPercentage: 8,
  };

  beforeEach(() => {
    // 55000 facturado, 8% → 4400 de regalías generadas
    aggregateMock.mockResolvedValue([aggRow()]);
  });

  it('saldo a favor del autor cuando regalías > anticipo (sin arrastre)', async () => {
    const c = await buildComputation({
      ...base,
      previousBalance: 0,
      advancePayment: 1000,
    });
    // 0 + 4400 - 1000 = 3400
    expect(c.netSettlement).toBe(3400);
    expect(c.balanceInFavorOf).toBe('author');
    expect(c.carryoverToNext).toBe(0);
  });

  it('saldo a favor de la editorial cuando el anticipo supera las regalías (arrastra)', async () => {
    const c = await buildComputation({
      ...base,
      previousBalance: 0,
      advancePayment: 10000,
    });
    // 0 + 4400 - 10000 = -5600
    expect(c.netSettlement).toBe(-5600);
    expect(c.balanceInFavorOf).toBe('publisher');
    expect(c.carryoverToNext).toBe(-5600);
  });

  it('incorpora el saldo de periodos anteriores (negativo) al neto', async () => {
    const c = await buildComputation({
      ...base,
      previousBalance: -2000,
      advancePayment: 0,
    });
    // -2000 + 4400 - 0 = 2400
    expect(c.netSettlement).toBe(2400);
    expect(c.balanceInFavorOf).toBe('author');
  });

  it('neto exactamente cero → none, sin arrastre', async () => {
    const c = await buildComputation({
      ...base,
      previousBalance: 0,
      advancePayment: 4400,
    });
    expect(c.netSettlement).toBe(0);
    expect(c.balanceInFavorOf).toBe('none');
    expect(c.carryoverToNext).toBe(0);
  });
});
