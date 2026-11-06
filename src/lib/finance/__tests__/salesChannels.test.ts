import {
  buildBookPointsOfSaleStats,
  buildSalesChannelSlices,
  buildTopPointsOfSale,
  isPointOfSaleCustomer,
} from '../salesChannels';

const pos = [
  { name: 'Librería Panamericana S.A.S.', identificationNumber: '830.012.345-6' },
  { name: 'Lerner Libros', identificationNumber: '' },
];

describe('isPointOfSaleCustomer', () => {
  it('coincide por NIT ignorando puntuación', () => {
    expect(
      isPointOfSaleCustomer({ customerTaxId: '8300123456' }, pos)
    ).toBe(true);
  });

  it('coincide por nombre sin sufijo societario ni tildes', () => {
    expect(
      isPointOfSaleCustomer({ customerName: 'LIBRERIA PANAMERICANA SA' }, pos)
    ).toBe(true);
    expect(
      isPointOfSaleCustomer({ customerName: 'Lerner Bogotá' }, pos)
    ).toBe(true);
  });

  it('un cliente final no es punto de venta', () => {
    expect(
      isPointOfSaleCustomer(
        { customerName: 'Ana Pérez', customerTaxId: '1020304050' },
        pos
      )
    ).toBe(false);
  });

  it('no coincide con NIT vacío', () => {
    expect(isPointOfSaleCustomer({ customerTaxId: '' }, pos)).toBe(false);
  });
});

describe('buildSalesChannelSlices', () => {
  it('suma ejemplares por canal', () => {
    const slices = buildSalesChannelSlices(
      [
        { customerTaxId: '8300123456', quantity: 10 },
        { customerName: 'Ana Pérez', quantity: 3 },
        { customerName: 'Luis', quantity: 2 },
      ],
      pos
    );
    expect(slices).toEqual([
      { name: 'Puntos de venta', value: 10 },
      { name: 'Venta directa', value: 5 },
    ]);
  });

  it('devuelve ceros sin facturas', () => {
    expect(buildSalesChannelSlices([], pos).map((s) => s.value)).toEqual([0, 0]);
  });
});

describe('buildTopPointsOfSale', () => {
  const catalog = [
    {
      _id: 'a',
      name: 'Librería Panamericana S.A.S.',
      code: 'PAN',
      identificationNumber: '830.012.345-6',
    },
    { _id: 'b', name: 'Lerner Libros', code: 'LER' },
    { _id: 'c', name: 'Casa del Libro', code: 'CAS' },
  ];

  it('ordena por ingresos, ignora compradores directos y limita', () => {
    const top = buildTopPointsOfSale(
      [
        { customerTaxId: '8300123456', quantity: 2, total: 100, date: '2026-01-10' },
        { customerTaxId: '8300123456', quantity: 3, total: 150, date: '2026-03-05' },
        { customerName: 'Lerner Bogotá', quantity: 20, total: 1000 },
        { customerName: 'Ana Pérez', quantity: 99, total: 99999 },
      ],
      catalog,
      5
    );
    expect(top.map((t) => t.code)).toEqual(['LER', 'PAN']);
    expect(top[1]).toMatchObject({ units: 5, revenue: 250, invoices: 2 });
    expect(top[1].lastSaleDate).toContain('2026-03-05');
  });

  it('respeta el límite', () => {
    const rows = [
      { customerName: 'Lerner', quantity: 1, total: 3 },
      { customerName: 'Casa del Libro', quantity: 1, total: 2 },
      { customerTaxId: '8300123456', quantity: 1, total: 1 },
    ];
    expect(buildTopPointsOfSale(rows, catalog, 2).map((t) => t.code)).toEqual([
      'LER',
      'CAS',
    ]);
  });
});

describe('buildBookPointsOfSaleStats', () => {
  const rows = [
    { customerTaxId: '8300123456', quantity: 30, total: 300000 },
    { customerTaxId: '8300123456', quantity: 10, total: 100000 },
    { customerName: 'Lerner Bogotá', quantity: 20, total: 200000 },
    { customerName: 'Ana Pérez', quantity: 40, total: 400000 },
  ];

  it('calcula la proporción puntos de venta vs. venta directa', () => {
    const { summary } = buildBookPointsOfSaleStats(rows, pos);
    expect(summary.totalUnits).toBe(100);
    expect(summary.posUnits).toBe(60);
    expect(summary.directUnits).toBe(40);
    expect(summary.posUnitsPct).toBe(60);
    expect(summary.posRevenuePct).toBe(60);
    expect(summary.pointsOfSaleWithSales).toBe(2);
    expect(summary.avgUnitsPerPointOfSale).toBe(30);
  });

  it('calcula la participación de cada punto de venta, ordenada por ejemplares', () => {
    const { pointsOfSale } = buildBookPointsOfSaleStats(rows, pos);
    expect(pointsOfSale.map((p) => p.name)).toEqual([
      'Librería Panamericana S.A.S.',
      'Lerner Libros',
    ]);
    expect(pointsOfSale[0]).toMatchObject({
      units: 40,
      invoices: 2,
      unitsShare: 40,
      revenueShare: 40,
    });
    expect(pointsOfSale[0].channelShare).toBeCloseTo(66.67, 1);
    expect(pointsOfSale[1].unitsShare).toBe(20);
  });

  it('devuelve ceros y sin NaN cuando no hay ventas', () => {
    const { summary, pointsOfSale } = buildBookPointsOfSaleStats([], pos);
    expect(pointsOfSale).toEqual([]);
    expect(summary.totalUnits).toBe(0);
    expect(summary.posUnitsPct).toBe(0);
    expect(summary.avgUnitsPerPointOfSale).toBe(0);
  });

  it('todo es venta directa si ningún cliente es punto de venta', () => {
    const { summary } = buildBookPointsOfSaleStats(
      [{ customerName: 'Ana Pérez', quantity: 5, total: 50000 }],
      pos
    );
    expect(summary.posUnits).toBe(0);
    expect(summary.directUnits).toBe(5);
    expect(summary.posUnitsPct).toBe(0);
  });
});
