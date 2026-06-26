jest.mock('@/models/RoyaltyStatement', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

// Mock de la detección de anticipos para aislar resolveDefaults.
jest.mock('../advances', () => ({
  findAdvanceMovements: jest.fn(),
  ROLE_CATEGORY: {
    author: 'regalías por derechos de autor',
    translator: 'traducción',
    illustrator: 'Ilustración',
  },
}));

import { serializeStatement, resolveDefaults } from '../statement';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import { findAdvanceMovements } from '../advances';

const findOneMock = RoyaltyStatement.findOne as unknown as jest.Mock;
const findAdvanceMock = findAdvanceMovements as unknown as jest.Mock;

beforeEach(() => {
  findOneMock.mockReset();
  findAdvanceMock.mockReset();
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

  const baseParams = {
    agreementId: 'agr1',
    role: 'translator',
    bookCostCenter: '01T009',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-12-31'),
  };

  it('primera liquidación: detecta el anticipo en los movimientos financieros', async () => {
    mockPrior(null);
    findAdvanceMock.mockResolvedValue({
      total: 3402000,
      lines: [
        {
          movementId: 'm1',
          date: new Date('2024-05-07'),
          description: 'Traducción Resignación',
          beneficiary: 'Ariana Vallejo',
          amount: 3402000,
        },
      ],
      unavailable: false,
    });

    const res = await resolveDefaults(baseParams);

    expect(res.previousBalance).toBe(0);
    expect(res.advancePayment).toBe(3402000);
    expect(res.advanceSource).toBe('movements');
    expect(res.advanceLines).toHaveLength(1);
    // Buscó por libro/rol/fin de período
    expect(findAdvanceMock).toHaveBeenCalledWith({
      bookCostCenter: '01T009',
      role: 'translator',
      periodEnd: baseParams.periodEnd,
    });
  });

  it('sin movimientos: anticipo 0 y fuente "none"', async () => {
    mockPrior(null);
    findAdvanceMock.mockResolvedValue({ total: 0, lines: [], unavailable: false });

    const res = await resolveDefaults(baseParams);

    expect(res.advancePayment).toBe(0);
    expect(res.advanceSource).toBe('none');
  });

  it('liquidación posterior: arrastra el saldo previo, anticipo 0, sin buscar movimientos', async () => {
    mockPrior({ carryoverToNext: { $numberDecimal: '-5600' } });

    const res = await resolveDefaults(baseParams);

    expect(res.previousBalance).toBe(-5600);
    expect(res.advancePayment).toBe(0);
    expect(res.advanceSource).toBe('carryover');
    expect(findAdvanceMock).not.toHaveBeenCalled();
  });

  it('filtra por contrato y por estados aprobada/pagada', async () => {
    mockPrior(null);
    findAdvanceMock.mockResolvedValue({ total: 0, lines: [], unavailable: false });
    await resolveDefaults({ ...baseParams, periodStart: new Date('2024-06-01') });

    const query = findOneMock.mock.calls[0][0];
    expect(query.agreement).toBe('agr1');
    expect(query.status.$in).toEqual(
      expect.arrayContaining(['approved', 'paid'])
    );
    expect(query.periodEnd.$lt).toEqual(new Date('2024-06-01'));
  });
});
