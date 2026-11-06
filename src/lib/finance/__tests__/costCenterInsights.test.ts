import {
  computeInventory,
  computeSalesPace,
  computeReceivables,
  computeRecovery,
  computeRoyalties,
} from '../costCenterInsights';

const NOW = new Date('2026-06-15T12:00:00Z');

describe('computeRecovery', () => {
  it('estima ejemplares y fecha para cubrir la inversión', () => {
    const r = computeRecovery({
      income: 4_000_000,
      expenses: 10_000_000,
      revenuePerUnit: 20_000,
      avgMonthlyUnits: 100,
      now: NOW,
    });
    expect(r.status).toBe('in-progress');
    expect(r.recoveredPct).toBeCloseTo(40);
    expect(r.remaining).toBe(6_000_000);
    expect(r.unitsToBreakEven).toBe(300);
    // 300 ejemplares / 100 al mes = 3 meses (~91 días)
    const days =
      (new Date(r.estimatedDate!).getTime() - NOW.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(91);
  });

  it('marca recuperada cuando los ingresos cubren los egresos', () => {
    const r = computeRecovery({
      income: 12_000_000,
      expenses: 10_000_000,
      revenuePerUnit: 20_000,
      avgMonthlyUnits: 50,
      now: NOW,
    });
    expect(r).toMatchObject({
      status: 'recovered',
      recoveredPct: 100,
      remaining: 0,
      unitsToBreakEven: 0,
      estimatedDate: null,
    });
  });

  it('sin ventas recientes no inventa fecha', () => {
    const r = computeRecovery({
      income: 0,
      expenses: 5_000_000,
      revenuePerUnit: 20_000,
      avgMonthlyUnits: 0,
      now: NOW,
    });
    expect(r.unitsToBreakEven).toBe(250);
    expect(r.estimatedDate).toBeNull();
  });

  it('sin precio por ejemplar no estima nada', () => {
    const r = computeRecovery({
      income: 0,
      expenses: 5_000_000,
      revenuePerUnit: 0,
      avgMonthlyUnits: 10,
      now: NOW,
    });
    expect(r.unitsToBreakEven).toBeNull();
    expect(r.estimatedDate).toBeNull();
  });

  it('sin egresos no hay inversión que recuperar', () => {
    const r = computeRecovery({
      income: 100,
      expenses: 0,
      revenuePerUnit: 10,
      avgMonthlyUnits: 1,
      now: NOW,
    });
    expect(r.status).toBe('no-investment');
  });
});

describe('computeSalesPace', () => {
  const rows = [
    { date: '2026-03-10', quantity: 10, total: 200_000 },
    { date: '2026-05-20', quantity: 6, total: 120_000 },
    { date: '2026-06-05', quantity: 4, total: 80_000 },
  ];

  it('rellena los meses sin ventas y cuenta desde la publicación', () => {
    const pace = computeSalesPace(rows, '2026-03-01', NOW);
    expect(pace.series.map((p) => p.month)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    expect(pace.series[1].units).toBe(0);
    expect(pace.series.map((p) => p.monthsSincePublication)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(pace.totalUnits).toBe(20);
    expect(pace.revenuePerUnit).toBe(20_000);
  });

  it('compara los últimos 30 y 90 días con el periodo anterior', () => {
    const pace = computeSalesPace(rows, null, NOW);
    // últimos 30 días (16 may - 15 jun): 6 + 4 = 10; previos: 0
    expect(pace.last30).toEqual({ last: 10, previous: 0, changePct: null });
    // últimos 90 días (16 mar - 15 jun): 10; previos 90 días: 10 (10 mar)
    expect(pace.last90.last).toBe(10);
    expect(pace.last90.previous).toBe(10);
    expect(pace.last90.changePct).toBe(0);
    expect(pace.avgMonthlyUnits).toBeCloseTo(10 / 3);
    expect(pace.series.every((p) => p.monthsSincePublication === null)).toBe(
      true
    );
  });

  it('sin ventas devuelve valores vacíos', () => {
    const pace = computeSalesPace([], null, NOW);
    expect(pace.series).toEqual([]);
    expect(pace.revenuePerUnit).toBe(0);
    expect(pace.avgMonthlyUnits).toBe(0);
  });
});

describe('computeInventory', () => {
  it('separa bodega y puntos de venta y calcula cobertura y devoluciones', () => {
    const inv = computeInventory({
      printRun: 1000,
      sold: 400,
      stock: [
        { quantity: 300, atPointOfSale: false },
        { quantity: 100, atPointOfSale: true },
        { quantity: 50, atPointOfSale: true },
      ],
      remitted: 200,
      returned: 30,
      avgMonthlyUnits: 50,
    });
    expect(inv).toMatchObject({
      soldPct: 40,
      inWarehouse: 300,
      atPointsOfSale: 150,
      onHand: 450,
      coverageMonths: 9,
      returnRate: 15,
    });
  });

  it('devuelve null donde no hay base de cálculo', () => {
    const inv = computeInventory({
      printRun: 0,
      sold: 10,
      stock: [],
      remitted: 0,
      returned: 0,
      avgMonthlyUnits: 0,
    });
    expect(inv.soldPct).toBeNull();
    expect(inv.coverageMonths).toBeNull();
    expect(inv.returnRate).toBeNull();
  });
});

describe('computeReceivables', () => {
  const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

  it('clasifica la cartera por antigüedad e ignora anuladas y borradores', () => {
    const r = computeReceivables(
      [
        { status: 'Paid', amount: 100, paid: 100, date: day(100) },
        {
          status: 'Partial',
          amount: 200,
          paid: 50,
          date: day(80),
          dueDate: day(10),
        },
        {
          status: 'Sent',
          amount: 300,
          paid: 0,
          date: day(200),
          dueDate: day(120),
        },
        {
          status: 'Sent',
          amount: 40,
          paid: 0,
          date: day(5),
          dueDate: new Date(NOW.getTime() + 86_400_000),
        },
        { status: 'Unchecked', amount: 500, paid: 0, date: day(30) },
        { status: 'Cancelled', amount: 999, paid: 0, date: day(30) },
        { status: 'Draft', amount: 999, paid: 0, date: day(30) },
      ],
      NOW
    );
    expect(r.invoiced).toBe(640);
    expect(r.collected).toBe(150);
    expect(r.pending).toBe(490);
    expect(r.aging).toEqual({
      current: 40,
      days1to30: 150,
      days31to60: 0,
      days61to90: 0,
      over90: 300,
    });
    expect(r.overdue).toBe(450);
    expect(r.unverified).toBe(500);
  });

  it('usa la fecha de emisión si no hay vencimiento', () => {
    const r = computeReceivables(
      [{ status: 'Sent', amount: 10, paid: 0, date: day(45) }],
      NOW
    );
    expect(r.aging.days31to60).toBe(10);
  });
});

describe('computeRoyalties', () => {
  it('anticipo por recuperar cuando las regalías no lo cubren', () => {
    expect(computeRoyalties(1000, 400)).toEqual({
      advance: 1000,
      accrued: 400,
      advanceToRecover: 600,
      toPay: 0,
    });
  });

  it('por pagar cuando las regalías superan el anticipo', () => {
    expect(computeRoyalties(1000, 1500)).toMatchObject({
      advanceToRecover: 0,
      toPay: 500,
    });
  });
});
