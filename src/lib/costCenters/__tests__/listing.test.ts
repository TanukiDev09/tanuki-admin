import {
  computeTrend,
  filterCostCenters,
  sortCostCenters,
  withShares,
} from '../listing';
import type { CostCenterStats } from '@/types/cost-center';

const cc = (over: Partial<CostCenterStats>): CostCenterStats => ({
  _id: over.code ?? 'x',
  code: 'X',
  name: 'X',
  income: 0,
  expense: 0,
  balance: 0,
  history: [0, 0, 0, 0, 0, 0],
  isBook: false,
  units: 0,
  ...over,
});

const items = [
  cc({
    code: 'B1',
    name: 'Un lápiz labial para una momia',
    income: 600,
    expense: 200,
    balance: 400,
    history: [0, 0, 0, 100, 150, 150],
    isBook: true,
    bookTitle: 'Un lápiz labial para una momia',
    units: 30,
  }),
  cc({
    code: 'A1',
    name: 'Árbol',
    income: 300,
    expense: 600,
    balance: -300,
    history: [-50, -50, -50, -100, -100, -100],
    isBook: true,
    units: 10,
  }),
  cc({
    code: 'OF',
    name: 'Oficina',
    income: 100,
    expense: 200,
    balance: -100,
    history: [-10, -10, -10, -10, -10, -10],
    isBook: false,
  }),
];

describe('computeTrend', () => {
  it('resta la primera mitad del historial a la segunda', () => {
    expect(computeTrend([0, 0, 0, 100, 150, 150])).toBe(400);
    expect(computeTrend([-50, -50, -50, -100, -100, -100])).toBe(-150);
  });

  it('es 0 con historial vacío o de un solo mes', () => {
    expect(computeTrend([])).toBe(0);
    expect(computeTrend([5])).toBe(0);
  });
});

describe('withShares', () => {
  it('calcula la participación sobre el total de todos los centros', () => {
    const rows = withShares(items);
    expect(rows.find((r) => r.code === 'B1')!.incomeShare).toBeCloseTo(60);
    expect(rows.find((r) => r.code === 'A1')!.incomeShare).toBeCloseTo(30);
    expect(rows.find((r) => r.code === 'A1')!.expenseShare).toBeCloseTo(60);
  });

  it('da 0 a quien no tiene ingresos y no divide entre cero', () => {
    const rows = withShares([cc({ code: 'Z' })]);
    expect(rows[0].incomeShare).toBe(0);
    expect(rows[0].expenseShare).toBe(0);
  });
});

describe('filterCostCenters', () => {
  const rows = withShares(items);

  it('filtra por tipo', () => {
    expect(
      filterCostCenters(rows, { search: '', kind: 'books' }).map((r) => r.code)
    ).toEqual(['B1', 'A1']);
    expect(
      filterCostCenters(rows, { search: '', kind: 'other' }).map((r) => r.code)
    ).toEqual(['OF']);
    expect(filterCostCenters(rows, { search: '', kind: 'all' })).toHaveLength(
      3
    );
  });

  it('busca por código, nombre o título del libro, sin importar mayúsculas', () => {
    expect(
      filterCostCenters(rows, { search: 'MOMIA', kind: 'all' }).map(
        (r) => r.code
      )
    ).toEqual(['B1']);
    expect(
      filterCostCenters(rows, { search: ' of ', kind: 'all' }).map(
        (r) => r.code
      )
    ).toEqual(['OF']);
  });

  it('combina búsqueda y tipo', () => {
    expect(
      filterCostCenters(rows, { search: 'oficina', kind: 'books' })
    ).toEqual([]);
  });
});

describe('sortCostCenters', () => {
  const rows = withShares(items);
  const codes = (r: typeof rows) => r.map((x) => x.code);

  it('ordena por valores numéricos en ambos sentidos', () => {
    expect(codes(sortCostCenters(rows, 'balance', 'desc'))).toEqual([
      'B1',
      'OF',
      'A1',
    ]);
    expect(codes(sortCostCenters(rows, 'balance', 'asc'))).toEqual([
      'A1',
      'OF',
      'B1',
    ]);
    expect(codes(sortCostCenters(rows, 'expenseShare', 'desc'))).toEqual([
      'A1',
      'OF',
      'B1',
    ]);
    expect(codes(sortCostCenters(rows, 'trend', 'desc'))).toEqual([
      'B1',
      'OF',
      'A1',
    ]);
    expect(codes(sortCostCenters(rows, 'units', 'desc'))).toEqual([
      'B1',
      'A1',
      'OF',
    ]);
  });

  it('ordena texto ignorando tildes y mayúsculas', () => {
    expect(codes(sortCostCenters(rows, 'name', 'asc'))).toEqual([
      'A1',
      'OF',
      'B1',
    ]);
    expect(codes(sortCostCenters(rows, 'code', 'desc'))).toEqual([
      'OF',
      'B1',
      'A1',
    ]);
  });

  it('no modifica el arreglo original', () => {
    const before = codes(rows);
    sortCostCenters(rows, 'income', 'asc');
    expect(codes(rows)).toEqual(before);
  });

  it('desempata por nombre', () => {
    const tied = withShares([
      cc({ code: '2', name: 'Beta', income: 10 }),
      cc({ code: '1', name: 'Alfa', income: 10 }),
    ]);
    expect(codes(sortCostCenters(tied, 'income', 'desc'))).toEqual(['1', '2']);
  });
});
