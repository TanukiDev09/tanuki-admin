import { serializeStatement, resolveDefaults } from '../statement';

jest.mock('@/models/RoyaltyStatement', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

import RoyaltyStatement from '@/models/RoyaltyStatement';

const findOneMock = RoyaltyStatement.findOne as unknown as jest.Mock;

beforeEach(() => {
  findOneMock.mockReset();
});

describe('serializeStatement', () => {
  it('convierte los campos Decimal128 / numéricos a números planos', () => {
    const doc = {
      _id: '507f1f77bcf86cd799439011',
      bookTitle: 'Mi libro',
      advancePayment: { $numberDecimal: '100' },
      previousBalance: -50,
      totalInvoiced: { $numberDecimal: '1000' },
      totalRoyalties: '80',
      netSettlement: { $numberDecimal: '-70' },
      carryoverToNext: -70,
      paidAmount: 0,
      status: 'draft',
    };

    const out = serializeStatement(doc);

    expect(out.advancePayment).toBe(100);
    expect(out.previousBalance).toBe(-50);
    expect(out.totalInvoiced).toBe(1000);
    expect(out.totalRoyalties).toBe(80);
    expect(out.netSettlement).toBe(-70);
    expect(out.carryoverToNext).toBe(-70);
    expect(out.paidAmount).toBe(0);
    // Campos no monetarios se conservan
    expect(out.bookTitle).toBe('Mi libro');
    expect(out.status).toBe('draft');
  });

  it('usa toObject() cuando el documento lo expone', () => {
    const doc = {
      toObject: () => ({
        _id: 'abc',
        advancePayment: 5,
        previousBalance: 0,
        totalInvoiced: 0,
        totalRoyalties: 0,
        netSettlement: 5,
        carryoverToNext: 0,
        paidAmount: 0,
      }),
    };

    const out = serializeStatement(doc);
    expect(out.advancePayment).toBe(5);
    expect(out.netSettlement).toBe(5);
  });
});

describe('resolveDefaults', () => {
  const mockPrior = (prior: unknown) =>
    findOneMock.mockReturnValue({ sort: () => Promise.resolve(prior) });

  it('primera liquidación: saldo 0 y anticipo del contrato', async () => {
    mockPrior(null);

    const res = await resolveDefaults('agr1', 30000, new Date('2024-01-01'));

    expect(res).toEqual({ previousBalance: 0, advancePayment: 30000 });
  });

  it('liquidación posterior: arrastra el saldo previo y el anticipo es 0', async () => {
    mockPrior({ carryoverToNext: { $numberDecimal: '-5600' } });

    const res = await resolveDefaults('agr1', 30000, new Date('2025-01-01'));

    expect(res).toEqual({ previousBalance: -5600, advancePayment: 0 });
  });

  it('filtra por contrato y por estados aprobada/pagada', async () => {
    mockPrior(null);
    await resolveDefaults('agr1', 0, new Date('2024-06-01'));

    const query = findOneMock.mock.calls[0][0];
    expect(query.agreement).toBe('agr1');
    expect(query.status.$in).toEqual(
      expect.arrayContaining(['approved', 'paid'])
    );
    expect(query.periodEnd.$lt).toEqual(new Date('2024-06-01'));
  });
});
