jest.mock('@/models/RoyaltyStatement', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

import { serializeStatement, resolveDefaults } from '../statement';
import RoyaltyStatement from '@/models/RoyaltyStatement';

const findOneMock = RoyaltyStatement.findOne as unknown as jest.Mock;

beforeEach(() => {
  findOneMock.mockReset();
});

describe('serializeStatement', () => {
  it('convierte los campos Decimal128 / numéricos a números planos', () => {
    const doc = {
      _id: '507f1f77bcf86cd799439011',
      creatorName: 'Autora',
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
    expect(out.creatorName).toBe('Autora');
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

  it('primera liquidación del creador: saldo 0 y detectAdvances=true', async () => {
    mockPrior(null);

    const res = await resolveDefaults({
      creatorId: 'creator1',
      periodStart: new Date('2024-01-01'),
    });

    expect(res.previousBalance).toBe(0);
    expect(res.detectAdvances).toBe(true);
    expect(res.source).toBe('first');
  });

  it('liquidación posterior: arrastra el saldo previo y detectAdvances=false', async () => {
    mockPrior({ carryoverToNext: { $numberDecimal: '-5600' } });

    const res = await resolveDefaults({
      creatorId: 'creator1',
      periodStart: new Date('2025-01-01'),
    });

    expect(res.previousBalance).toBe(-5600);
    expect(res.detectAdvances).toBe(false);
    expect(res.source).toBe('carryover');
  });

  it('busca la liquidación previa del creador (aprobada/pagada, anterior al período)', async () => {
    mockPrior(null);
    await resolveDefaults({
      creatorId: 'creator1',
      periodStart: new Date('2024-06-01'),
    });

    const query = findOneMock.mock.calls[0][0];
    expect(query.creator).toBe('creator1');
    expect(query.status.$in).toEqual(
      expect.arrayContaining(['approved', 'paid'])
    );
    expect(query.periodEnd.$lt).toEqual(new Date('2024-06-01'));
  });
});
