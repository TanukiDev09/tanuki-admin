/**
 * Tests de los handlers de `/api/royalties/[id]` (GET, PATCH, DELETE).
 * Se mockean permisos, conexión a BD y modelos para aislar la lógica de
 * transición de estados y los efectos sobre Debt.
 */

// --- Mocks de infraestructura ---
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/apiPermissions', () => ({
  requirePermission: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('mongoose', () => {
  class ObjectId {
    constructor(public id: string) {}
    toString() {
      return this.id;
    }
    static isValid() {
      return true;
    }
  }
  return {
    __esModule: true,
    default: { Types: { ObjectId }, models: {}, model: () => ({}), Schema: class {} },
  };
});

// Modelos importados como efecto secundario en la ruta
jest.mock('@/models/Book', () => ({ __esModule: true, default: {} }));
jest.mock('@/models/Creator', () => ({ __esModule: true, default: {} }));
jest.mock('@/models/Invoice', () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}));

jest.mock('@/models/Movement', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock('@/models/Category', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('@/models/Agreement', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock('@/models/RoyaltyStatement', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('@/models/Debt', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

import { GET, PATCH, DELETE } from '../[id]/route';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import Debt from '@/models/Debt';

const findByIdMock = RoyaltyStatement.findById as unknown as jest.Mock;
const debtCreate = Debt.create as unknown as jest.Mock;
const debtFindById = Debt.findById as unknown as jest.Mock;
const debtFindByIdAndDelete = Debt.findByIdAndDelete as unknown as jest.Mock;

interface FakeStatement {
  [key: string]: unknown;
  save: jest.Mock;
  deleteOne: jest.Mock;
  populate: jest.Mock;
}

function makeStatement(overrides: Record<string, unknown> = {}): FakeStatement {
  const doc = {
    _id: 'stmt1',
    creator: 'creator1',
    creatorName: 'Autora Prueba',
    bookTitle: 'Mi libro',
    currency: 'COP',
    status: 'draft',
    balanceInFavorOf: 'author',
    netSettlement: 4400,
    paidAmount: 0,
    previousBalance: 0,
    advancePayment: 0,
    totalInvoiced: 55000,
    totalRoyalties: 4400,
    carryoverToNext: 0,
    book: { _id: { toString: () => 'book1' } },
    ...overrides,
  } as Record<string, unknown>;
  const fake = doc as unknown as FakeStatement;
  fake.save = jest.fn().mockResolvedValue(fake);
  fake.deleteOne = jest.fn().mockResolvedValue(undefined);
  fake.populate = jest.fn(() => fake);
  return fake;
}

const reqWith = (body: unknown) => ({ json: async () => body }) as never;
const ctx = (id = 'stmt1') => ({ params: Promise.resolve({ id }) });

// Simula un Query de mongoose encadenable que resuelve a null (documento inexistente).
function notFoundQuery() {
  const q: Record<string, unknown> = {
    populate: () => q,
    then: (resolve: (v: null) => void) => resolve(null),
  };
  return q;
}

// Silencia el logging esperado del catch en los caminos de error.
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  errorSpy.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/royalties/[id]', () => {
  it('devuelve la liquidación serializada', async () => {
    findByIdMock.mockReturnValue(makeStatement());
    const res = (await GET(reqWith(null), ctx())) as unknown as {
      status: number;
      body: { data?: { netSettlement?: number } };
    };
    expect(res.status).toBe(200);
    expect(res.body.data?.netSettlement).toBe(4400);
  });

  it('404 si no existe', async () => {
    findByIdMock.mockReturnValue(notFoundQuery());
    const res = (await GET(reqWith(null), ctx())) as unknown as {
      status: number;
    };
    expect(res.status).toBe(404);
  });
});

describe('PATCH approve', () => {
  it('aprueba un borrador a favor del autor y crea una Cuenta por Pagar', async () => {
    const stmt = makeStatement({ balanceInFavorOf: 'author', netSettlement: 4400 });
    findByIdMock.mockReturnValue(stmt);
    debtCreate.mockResolvedValue({ _id: 'debt1' });

    const res = (await PATCH(reqWith({ action: 'approve' }), ctx())) as unknown as {
      status: number;
    };

    expect(res.status).toBe(200);
    expect(stmt.status).toBe('approved');
    expect(stmt.debtId).toBe('debt1');
    expect(debtCreate).toHaveBeenCalledTimes(1);
    const debtArg = debtCreate.mock.calls[0][0];
    expect(debtArg).toMatchObject({
      type: 'Cuenta por Pagar',
      entityType: 'Creator',
      entityId: 'creator1',
      totalAmount: 4400,
    });
    expect(debtArg.source.type).toBe('Regalías');
  });

  it('aprueba a favor de la editorial sin crear deuda', async () => {
    const stmt = makeStatement({
      balanceInFavorOf: 'publisher',
      netSettlement: -5600,
    });
    findByIdMock.mockReturnValue(stmt);

    await PATCH(reqWith({ action: 'approve' }), ctx());

    expect(stmt.status).toBe('approved');
    expect(debtCreate).not.toHaveBeenCalled();
    expect(stmt.debtId).toBeUndefined();
  });

  it('no permite aprobar si no es borrador', async () => {
    findByIdMock.mockReturnValue(makeStatement({ status: 'approved' }));
    const res = (await PATCH(reqWith({ action: 'approve' }), ctx())) as unknown as {
      status: number;
    };
    expect(res.status).toBe(400);
    expect(debtCreate).not.toHaveBeenCalled();
  });
});

describe('PATCH pay', () => {
  const makeApproved = () =>
    makeStatement({
      status: 'approved',
      balanceInFavorOf: 'author',
      netSettlement: 4400,
      paidAmount: 0,
      debtId: 'debt1',
    });

  const makeDebt = () => ({
    paidAmount: 0,
    totalAmount: 4400,
    remainingBalance: 4400,
    status: 'Pendiente',
    save: jest.fn(),
  });

  it('pago total → liquidación pagada y deuda saldada', async () => {
    const stmt = makeApproved();
    const debt = makeDebt();
    findByIdMock.mockReturnValue(stmt);
    debtFindById.mockResolvedValue(debt);

    await PATCH(reqWith({ action: 'pay' }), ctx());

    expect(stmt.paidAmount).toBe(4400);
    expect(stmt.status).toBe('paid');
    expect(stmt.paidAt).toBeInstanceOf(Date);
    expect(debt.status).toBe('Pagado');
    expect(debt.remainingBalance).toBe(0);
  });

  it('pago parcial → deuda parcial y liquidación sigue aprobada', async () => {
    const stmt = makeApproved();
    const debt = makeDebt();
    findByIdMock.mockReturnValue(stmt);
    debtFindById.mockResolvedValue(debt);

    await PATCH(reqWith({ action: 'pay', amount: 1000 }), ctx());

    expect(stmt.paidAmount).toBe(1000);
    expect(stmt.status).toBe('approved');
    expect(debt.status).toBe('Pagado Parcial');
    expect(debt.remainingBalance).toBe(3400);
  });

  it('rechaza pago mayor al saldo pendiente', async () => {
    const stmt = makeApproved();
    findByIdMock.mockReturnValue(stmt);
    const res = (await PATCH(
      reqWith({ action: 'pay', amount: 99999 }),
      ctx()
    )) as unknown as { status: number };
    expect(res.status).toBe(400);
    expect(stmt.status).toBe('approved');
  });

  it('no permite pagar una liquidación no aprobada', async () => {
    findByIdMock.mockReturnValue(makeStatement({ status: 'draft' }));
    const res = (await PATCH(reqWith({ action: 'pay' }), ctx())) as unknown as {
      status: number;
    };
    expect(res.status).toBe(400);
  });
});

describe('PATCH revert', () => {
  it('revierte una aprobación sin pagos y elimina la deuda', async () => {
    const stmt = makeStatement({
      status: 'approved',
      paidAmount: 0,
      debtId: 'debt1',
    });
    findByIdMock.mockReturnValue(stmt);
    debtFindByIdAndDelete.mockResolvedValue(undefined);

    await PATCH(reqWith({ action: 'revert' }), ctx());

    expect(debtFindByIdAndDelete).toHaveBeenCalledWith('debt1');
    expect(stmt.status).toBe('draft');
    expect(stmt.debtId).toBeUndefined();
  });

  it('no revierte si ya hay pagos', async () => {
    const stmt = makeStatement({
      status: 'approved',
      paidAmount: 500,
      debtId: 'debt1',
    });
    findByIdMock.mockReturnValue(stmt);
    const res = (await PATCH(reqWith({ action: 'revert' }), ctx())) as unknown as {
      status: number;
    };
    expect(res.status).toBe(400);
    expect(debtFindByIdAndDelete).not.toHaveBeenCalled();
    expect(stmt.status).toBe('approved');
  });
});

describe('DELETE /api/royalties/[id]', () => {
  it('elimina un borrador', async () => {
    const stmt = makeStatement({ status: 'draft' });
    findByIdMock.mockReturnValue(stmt);
    const res = (await DELETE(reqWith(null), ctx())) as unknown as {
      status: number;
      body: { success?: boolean };
    };
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(stmt.deleteOne).toHaveBeenCalled();
  });

  it('no elimina si no es borrador', async () => {
    const stmt = makeStatement({ status: 'approved' });
    findByIdMock.mockReturnValue(stmt);
    const res = (await DELETE(reqWith(null), ctx())) as unknown as {
      status: number;
    };
    expect(res.status).toBe(400);
    expect(stmt.deleteOne).not.toHaveBeenCalled();
  });
});
