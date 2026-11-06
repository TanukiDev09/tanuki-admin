import {
  getAttentionItems,
  getDemandTrend,
  getReprintDates,
  computeBookOperations,
  getReprintStatus,
  type BookOperationsInput,
} from '../bookOperations';

const NOW = new Date('2026-06-30T00:00:00Z');
const daysAgo = (days: number): Date =>
  new Date(NOW.getTime() - days * 86_400_000);

const pointsOfSale = [
  {
    _id: 'p1',
    name: 'Librería Panamericana S.A.S.',
    identificationNumber: '830.012.345-6',
    warehouseId: 'W1',
  },
  { _id: 'p2', name: 'Lerner Libros', warehouseId: 'W2' },
  { _id: 'p3', name: 'Casa del Libro Medellín', warehouseId: 'W3' },
];

const baseInput: BookOperationsInput = {
  now: NOW,
  pointsOfSale,
  posWarehouseIds: ['W1', 'W2', 'W3'],
  stock: [
    { warehouseId: 'ED', quantity: 90 },
    { warehouseId: 'W1', quantity: 8 },
    { warehouseId: 'W2', quantity: 30 },
    { warehouseId: 'W3', quantity: 25 },
  ],
  sales: [
    { date: daysAgo(15), quantity: 30, customerName: 'Ana Pérez' },
    { date: daysAgo(10), quantity: 30, customerTaxId: '8300123456' },
    { date: daysAgo(20), quantity: 6, customerName: 'Lerner Bogotá' },
    { date: daysAgo(200), quantity: 20, customerTaxId: '8300123456' },
    { date: daysAgo(400), quantity: 10, customerName: 'Luis Gómez' },
  ],
  movements: [
    { type: 'INGRESO', date: daysAgo(500), toWarehouseId: 'ED', quantity: 500 },
    {
      type: 'REMISION',
      date: daysAgo(40),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W1',
      quantity: 50,
    },
    {
      type: 'REMISION',
      date: daysAgo(30),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W2',
      quantity: 20,
    },
    {
      type: 'REMISION',
      date: daysAgo(300),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W3',
      quantity: 25,
    },
    {
      type: 'DEVOLUCION',
      date: daysAgo(10),
      fromWarehouseId: 'W1',
      toWarehouseId: 'ED',
      quantity: 5,
    },
  ],
};

describe('computeBookOperations — stock y demanda', () => {
  const ops = computeBookOperations(baseInput);

  it('separa el stock de la bodega propia del de las librerías', () => {
    expect(ops.stock).toEqual({
      own: 90,
      atPointsOfSale: 63,
      total: 153,
      dormantAtPointsOfSale: 25,
    });
  });

  it('calcula la demanda mensual de 90 días por canal', () => {
    expect(ops.demand.directMonthly).toBeCloseTo(10);
    expect(ops.demand.pointsOfSaleMonthly).toBeCloseTo(12);
    // (50 + 20 remitidos − 5 devueltos en 90 días) / 3
    expect(ops.demand.netRemissionsMonthly).toBeCloseTo(65 / 3);
    expect(ops.demand.ownMonthly).toBeCloseTo(10 + 65 / 3);
    expect(ops.demand.totalMonthly).toBeCloseTo(22);
  });

  it('la cobertura propia incluye venta directa y remisiones netas', () => {
    expect(ops.coverage.own).toBeCloseTo(90 / (10 + 65 / 3));
    expect(ops.coverage.network).toBeCloseTo(63 / 12);
    expect(ops.coverage.combined).toBeCloseTo(153 / 22);
  });

  it('la cobertura con recuperación suma el stock dormido de las librerías', () => {
    expect(ops.coverage.ownWithRecovery).toBeCloseTo(115 / (10 + 65 / 3));
    expect(ops.coverage.ownWithRecovery!).toBeGreaterThan(ops.coverage.own!);
  });

  it('calcula la rotación del libro con ventas de 12 meses', () => {
    // 30 directa + 56 en librerías en 12 meses (la venta de hace 400 días no cuenta)
    expect(ops.rotation.turns).toBeCloseTo(86 / 153);
    expect(ops.rotation.daysOfInventory).toBeCloseTo(153 / (22 / 30));
  });

  it('registra la última venta', () => {
    expect(ops.lastSaleDate).toBe(daysAgo(10).toISOString());
  });
});

describe('computeBookOperations — red de librerías', () => {
  const ops = computeBookOperations(baseInput);
  const byId = Object.fromEntries(ops.pointsOfSale.map((p) => [p.id, p]));

  it('ordena los puntos de mejor a peor rotación', () => {
    expect(ops.pointsOfSale.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('calcula rotación, cobertura y estado por punto', () => {
    expect(byId.p1.rotation).toBeCloseTo(50 / 8);
    expect(byId.p1.coverageMonths).toBeCloseTo(0.8);
    expect(byId.p1.status).toBe('low');

    expect(byId.p2.coverageMonths).toBeCloseTo(15);
    expect(byId.p2.status).toBe('overstock');
  });

  it('marca como dormido el punto con stock y sin ventas en 90 días', () => {
    expect(byId.p3.status).toBe('dormant');
    expect(byId.p3.coverageMonths).toBeNull();
    expect(ops.network.dormantPoints).toBe(1);
  });

  it('calcula devolución y sell-through por punto, acotado a 100%', () => {
    expect(byId.p1.returnRatePct).toBeCloseTo(10);
    expect(byId.p1.sellThroughPct).toBe(100); // 50 vendidos / 50 remitidos
    expect(byId.p2.sellThroughPct).toBeCloseTo(30);
    expect(byId.p3.sellThroughPct).toBe(0);
  });

  it('resume la red', () => {
    expect(ops.network.remitted).toBe(95);
    expect(ops.network.returned).toBe(5);
    expect(ops.network.returnRatePct).toBeCloseTo((5 / 95) * 100);
    expect(ops.network.pointsWithStock).toBe(3);
  });

  it('un punto sin stock pero con ventas recientes está agotado', () => {
    const result = computeBookOperations({
      ...baseInput,
      stock: baseInput.stock.filter((s) => s.warehouseId !== 'W1'),
    });
    const p1 = result.pointsOfSale.find((p) => p.id === 'p1');
    expect(p1?.status).toBe('stockout');
    expect(p1?.rotation).toBeNull();
  });
});

describe('computeBookOperations — casos límite', () => {
  it('sin ventas ni movimientos no hay cobertura ni NaN', () => {
    const ops = computeBookOperations({
      now: NOW,
      pointsOfSale,
      posWarehouseIds: ['W1'],
      stock: [{ warehouseId: 'ED', quantity: 40 }],
      sales: [],
      movements: [],
    });
    expect(ops.stock.total).toBe(40);
    expect(ops.coverage).toEqual({
      own: null,
      network: null,
      combined: null,
      ownWithRecovery: null,
    });
    expect(ops.rotation.turns).toBe(0);
    expect(ops.rotation.daysOfInventory).toBeNull();
    expect(ops.network.returnRatePct).toBeNull();
    expect(ops.pointsOfSale).toEqual([]);
  });

  it('sin stock la rotación no está definida', () => {
    const ops = computeBookOperations({
      ...baseInput,
      stock: [],
    });
    expect(ops.rotation.turns).toBeNull();
    expect(ops.coverage.own).toBe(0);
  });

  it('las devoluciones mayores a las remisiones no dan demanda negativa', () => {
    const ops = computeBookOperations({
      now: NOW,
      pointsOfSale,
      posWarehouseIds: ['W1'],
      stock: [{ warehouseId: 'ED', quantity: 10 }],
      sales: [],
      movements: [
        {
          type: 'DEVOLUCION',
          date: daysAgo(5),
          fromWarehouseId: 'W1',
          toWarehouseId: 'ED',
          quantity: 30,
        },
      ],
    });
    expect(ops.demand.netRemissionsMonthly).toBeLessThan(0);
    expect(ops.demand.ownMonthly).toBe(0);
    expect(ops.coverage.own).toBeNull();
  });

  it('un punto de venta sin bodega enlazada no inventa stock', () => {
    const ops = computeBookOperations({
      ...baseInput,
      pointsOfSale: [{ _id: 'p9', name: 'Lerner Libros' }],
    });
    expect(ops.pointsOfSale[0].stock).toBe(0);
    expect(ops.pointsOfSale[0].remitted).toBe(0);
    expect(ops.pointsOfSale[0].sellThroughPct).toBeNull();
  });
});

describe('getReprintStatus', () => {
  it('sin demanda reciente no hay señal', () => {
    expect(getReprintStatus(null, 3)).toBe('no-demand');
  });

  it('reimprimir ya cuando el stock se agota antes de que llegue la reimpresión', () => {
    expect(getReprintStatus(2, 3)).toBe('now');
    expect(getReprintStatus(3, 3)).toBe('now');
  });

  it('planear cuando la holgura es menor a 2 meses', () => {
    expect(getReprintStatus(4, 3)).toBe('plan');
    expect(getReprintStatus(5, 3)).toBe('plan');
  });

  it('ok con holgura suficiente', () => {
    expect(getReprintStatus(5.1, 3)).toBe('ok');
    expect(getReprintStatus(12, 3)).toBe('ok');
  });

  it('stock en cero con demanda es reimprimir ya', () => {
    expect(getReprintStatus(0, 3)).toBe('now');
  });
});

describe('computeBookOperations — flujo, consignación y demanda mensual', () => {
  const ops = computeBookOperations({
    now: NOW,
    pointsOfSale,
    posWarehouseIds: ['W1'],
    stock: [
      { warehouseId: 'ED', quantity: 90 },
      { warehouseId: 'W1', quantity: 8 },
    ],
    sales: [
      { date: daysAgo(15), quantity: 30, customerName: 'Ana Pérez' },
      { date: daysAgo(10), quantity: 30, customerTaxId: '8300123456' },
      { date: daysAgo(400), quantity: 10, customerName: 'Luis Gómez' },
    ],
    movements: [
      {
        type: 'INGRESO',
        date: daysAgo(500),
        toWarehouseId: 'ED',
        quantity: 200,
      },
      {
        type: 'REMISION',
        date: daysAgo(40),
        fromWarehouseId: 'ED',
        toWarehouseId: 'W1',
        quantity: 50,
      },
      {
        type: 'DEVOLUCION',
        date: daysAgo(30),
        fromWarehouseId: 'W1',
        toWarehouseId: 'ED',
        quantity: 5,
      },
      {
        type: 'LIQUIDACION',
        date: daysAgo(60),
        fromWarehouseId: 'W1',
        quantity: 5,
      },
      {
        type: 'LIQUIDACION',
        date: daysAgo(20),
        fromWarehouseId: 'W1',
        quantity: 30,
      },
    ],
  });

  it('resume el ciclo de vida de los ejemplares ingresados', () => {
    expect(ops.flow).toEqual({
      received: 200,
      soldDirect: 40, // incluye la venta de hace 400 días
      soldPointsOfSale: 30,
      onHandOwn: 90,
      onHandPointsOfSale: 8,
      difference: 200 - 70 - 98,
    });
  });

  it('controla la consignación: remitido − devuelto − liquidado − stock', () => {
    const w1 = ops.pointsOfSale.find((p) => p.id === 'p1');
    expect(w1).toMatchObject({
      remitted: 50,
      returned: 5,
      liquidated: 35,
      stock: 8,
      difference: 2,
    });
    expect(w1?.lastLiquidationDate).toBe(daysAgo(20).toISOString());
  });

  it('un punto cuadrado no tiene diferencia', () => {
    const balanced = computeBookOperations({
      now: NOW,
      pointsOfSale,
      posWarehouseIds: ['W1'],
      stock: [{ warehouseId: 'W1', quantity: 10 }],
      sales: [],
      movements: [
        {
          type: 'REMISION',
          date: daysAgo(40),
          fromWarehouseId: 'ED',
          toWarehouseId: 'W1',
          quantity: 50,
        },
        {
          type: 'DEVOLUCION',
          date: daysAgo(30),
          fromWarehouseId: 'W1',
          toWarehouseId: 'ED',
          quantity: 5,
        },
        {
          type: 'LIQUIDACION',
          date: daysAgo(20),
          fromWarehouseId: 'W1',
          quantity: 35,
        },
      ],
    });
    expect(balanced.pointsOfSale[0].difference).toBe(0);
  });

  it('arma 12 meses continuos de demanda por canal, terminando en el mes actual', () => {
    expect(ops.monthlyDemand).toHaveLength(12);
    const key = `${NOW.getUTCFullYear()}-${String(NOW.getUTCMonth() + 1).padStart(2, '0')}`;
    expect(ops.monthlyDemand[11].month).toBe(key);
    const months = ops.monthlyDemand.map((m) => m.month);
    expect(new Set(months).size).toBe(12);
    // La venta de hace 400 días queda fuera de la ventana de 12 meses.
    expect(ops.monthlyDemand.reduce((s, m) => s + m.direct, 0)).toBe(30);
    expect(ops.monthlyDemand.reduce((s, m) => s + m.pointsOfSale, 0)).toBe(30);
  });

  it('sin ventas la serie mensual es de ceros', () => {
    const empty = computeBookOperations({
      now: NOW,
      pointsOfSale,
      posWarehouseIds: [],
      stock: [],
      sales: [],
      movements: [],
    });
    expect(empty.monthlyDemand).toHaveLength(12);
    expect(
      empty.monthlyDemand.every((m) => m.direct === 0 && m.pointsOfSale === 0)
    ).toBe(true);
    expect(empty.flow.difference).toBe(0);
  });
});

describe('getReprintDates', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  it('calcula agotamiento y fecha límite de reimpresión', () => {
    const dates = getReprintDates(6, 2, now)!;
    expect(dates.stockoutDate).toBe('2026-06-30T00:00:00.000Z');
    expect(dates.reprintByDate).toBe('2026-05-01T00:00:00.000Z');
    expect(dates.overdue).toBe(false);
  });

  it('marca vencida la fecha límite cuando la cobertura es menor al plazo', () => {
    expect(getReprintDates(1, 3, now)?.overdue).toBe(true);
  });

  it('sin cobertura no hay fechas', () => {
    expect(getReprintDates(null, 3, now)).toBeNull();
  });
});

describe('getDemandTrend', () => {
  const month = (m: number, direct: number, pos = 0) => ({
    month: `2026-${String(m).padStart(2, '0')}`,
    direct,
    pointsOfSale: pos,
  });

  it('compara los últimos 3 meses con los 3 anteriores', () => {
    const data = [
      month(1, 5),
      month(2, 5),
      month(3, 0),
      month(4, 10),
      month(5, 5),
      month(6, 5, 5),
    ];
    expect(getDemandTrend(data)).toEqual({
      recent: 25,
      previous: 10,
      changePct: 150,
    });
  });

  it('sin ventas previas no da porcentaje', () => {
    const data = [
      month(1, 0),
      month(2, 0),
      month(3, 0),
      month(4, 4),
      month(5, 0),
      month(6, 0),
    ];
    expect(getDemandTrend(data)?.changePct).toBeNull();
  });

  it('sin suficientes meses o sin ventas no hay tendencia', () => {
    expect(getDemandTrend([month(1, 5)])).toBeNull();
    expect(
      getDemandTrend(Array.from({ length: 6 }, (_, i) => month(i + 1, 0)))
    ).toBeNull();
  });
});

describe('getAttentionItems', () => {
  it('sin demanda ni stock en red no marca excepciones', () => {
    const ops = computeBookOperations({
      now: new Date(),
      pointsOfSale: [],
      posWarehouseIds: [],
      stock: [],
      sales: [],
      movements: [],
    });
    expect(getAttentionItems(ops, 3)).toEqual([]);
  });

  it('marca reimprimir ya como crítico', () => {
    const now = new Date();
    const ops = computeBookOperations({
      now,
      pointsOfSale: [],
      posWarehouseIds: [],
      stock: [{ warehouseId: 'ED', quantity: 10 }],
      sales: [
        {
          date: new Date(now.getTime() - 86_400_000),
          quantity: 30,
          customerName: 'Ana',
        },
      ],
      movements: [],
    });
    expect(getAttentionItems(ops, 3)[0]).toMatchObject({
      key: 'reprint',
      level: 'critical',
    });
  });
});
