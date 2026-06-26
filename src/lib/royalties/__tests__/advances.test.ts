// Mock de mongoose (evita cargar bson ESM; advances.ts solo lo usa como tipo).
jest.mock('mongoose', () => ({ __esModule: true, default: {} }));

jest.mock('@/models/Movement', () => ({
  __esModule: true,
  default: { collection: { find: jest.fn() } },
}));

jest.mock('@/models/Category', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

import { findAdvanceMovements, ROLE_CATEGORY } from '../advances';
import Movement from '@/models/Movement';
import Category from '@/models/Category';

const findMock = (Movement as unknown as { collection: { find: jest.Mock } })
  .collection.find;
const catFindOneMock = Category.findOne as unknown as jest.Mock;

const mockMovements = (movs: unknown[]) =>
  findMock.mockReturnValue({
    sort: () => ({ toArray: () => Promise.resolve(movs) }),
  });

const mockCategory = (cat: unknown) =>
  catFindOneMock.mockReturnValue({ lean: () => Promise.resolve(cat) });

beforeEach(() => {
  findMock.mockReset();
  catFindOneMock.mockReset();
});

describe('ROLE_CATEGORY', () => {
  it('mapea cada rol a su categoría de movimiento', () => {
    expect(ROLE_CATEGORY.translator).toBe('traducción');
    expect(ROLE_CATEGORY.author).toBe('regalías por derechos de autor');
    expect(ROLE_CATEGORY.illustrator).toBe('Ilustración');
  });
});

describe('findAdvanceMovements', () => {
  const periodEnd = new Date('2024-12-31');

  it('suma los egresos del libro/rol y devuelve el desglose', async () => {
    mockCategory({ _id: 'cat-traduccion' });
    mockMovements([
      {
        _id: { toString: () => 'm1' },
        date: new Date('2024-05-07'),
        description: 'Traducción Resignación',
        beneficiary: 'Ariana Vallejo',
        amountInCOP: 3402000,
        amount: 3402000,
      },
    ]);

    const res = await findAdvanceMovements({
      bookCostCenter: '01T009',
      role: 'translator',
      periodEnd,
    });

    expect(res.unavailable).toBe(false);
    expect(res.total).toBe(3402000);
    expect(res.lines).toHaveLength(1);
    expect(res.lines[0]).toMatchObject({
      movementId: 'm1',
      beneficiary: 'Ariana Vallejo',
      amount: 3402000,
    });
  });

  it('usa amount cuando amountInCOP es 0', async () => {
    mockCategory({ _id: 'cat' });
    mockMovements([
      {
        _id: { toString: () => 'm2' },
        date: new Date('2024-03-01'),
        description: 'Pago',
        amountInCOP: 0,
        amount: 5000,
      },
    ]);

    const res = await findAdvanceMovements({
      bookCostCenter: '01T009',
      role: 'illustrator',
      periodEnd,
    });

    expect(res.total).toBe(5000);
  });

  it('construye el filtro por centro de costo, categoría, egreso y fecha', async () => {
    mockCategory({ _id: 'cat-id' });
    mockMovements([]);

    await findAdvanceMovements({
      bookCostCenter: '01T009',
      role: 'translator',
      periodEnd,
    });

    const query = findMock.mock.calls[0][0];
    expect(query.costCenter).toBe('01T009');
    // Matchea el _id de la categoría (en sus dos formas), nunca el nombre.
    expect(query.category.$in).toEqual(expect.arrayContaining(['cat-id']));
    expect(query.category.$in).not.toContain('traducción');
    expect(query.date.$lte).toEqual(periodEnd);
    expect(query.$or).toEqual(
      expect.arrayContaining([
        { type: 'Egreso' },
        { flowDirection: 'outflow' },
      ])
    );
  });

  it('no busca si falta el centro de costo del libro', async () => {
    const res = await findAdvanceMovements({
      bookCostCenter: undefined,
      role: 'translator',
      periodEnd,
    });

    expect(res.unavailable).toBe(true);
    expect(res.total).toBe(0);
    expect(findMock).not.toHaveBeenCalled();
  });

  it('no busca si el rol no tiene categoría mapeada', async () => {
    const res = await findAdvanceMovements({
      bookCostCenter: '01T009',
      role: 'editor',
      periodEnd,
    });

    expect(res.unavailable).toBe(true);
    expect(findMock).not.toHaveBeenCalled();
  });
});
