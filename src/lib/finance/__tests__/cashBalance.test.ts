import {
  buildCashHistory,
  buildCashSeries,
  currentPeriod,
  monthName,
  monthsWithOpening,
  periodBalances,
  shortMonth,
  sliceCashYear,
  type ReconciliationRow,
} from '../cashBalance';

const BANK = 'banco';
const MP = 'mercadopago';
const EP = 'epayco';

const row = (
  account: string,
  period: string,
  opening: number | null,
  closing: number | null,
  extra: Partial<ReconciliationRow> = {}
): ReconciliationRow => ({
  account,
  period,
  openingBalance: opening,
  closingBalance: closing,
  basis: account === BANK ? 'extracto' : 'reporte',
  ...extra,
});

// Cierres reales de Tanuki (extractos Davivienda y reportes de billeteras).
const reconciliations: ReconciliationRow[] = [
  row(BANK, '2025-12', null, 100000),
  row(BANK, '2026-08', 100000, 154350.64),
  row(BANK, '2026-09', 154350.64, 180049.51),
  row(MP, '2026-09', null, 296779, {
    flowRange: { low: -177521.31, high: -7521.31 },
  }),
  row(EP, '2026-09', null, 0.82),
  row(BANK, '2026-10', 180049.51, 2293858.16),
  row(MP, '2026-10', 296779, 0.65),
  row(EP, '2026-10', 0.82, 0.54),
];

const build = (currentMonth = '2026-10', booksNet = {}) =>
  buildCashSeries({ year: 2026, reconciliations, booksNet, currentMonth });

describe('buildCashSeries', () => {
  it('devuelve null si no hay ancla documentada', () => {
    expect(
      buildCashSeries({
        year: 2026,
        reconciliations: [row(BANK, '2026-05', 1, 2)],
        booksNet: {},
        currentMonth: '2026-10',
      })
    ).toBeNull();
  });

  it('suma los cierres de todas las cuentas del mes', () => {
    const sep = build()!.months[8];
    expect(sep.closing).toBe(476829.33);
    expect(sep.basis).toBe('documentado');
  });

  it('septiembre: saldo real, flujo no determinable y rango estimado', () => {
    const sep = build()!.months[8];
    expect(sep.flow).toBeNull();
    expect(sep.flowEstimated).toBe(true);
    expect(sep.flowRange).toEqual({ low: -177521.31, high: -7521.31 });
    expect(sep.note).toBeTruthy();
    expect(sep.bankClosing).toBe(180049.51);
  });

  it('octubre: el flujo es exacto y no depende de septiembre', () => {
    const oct = build()!.months[9];
    expect(oct.closing).toBe(2293859.35);
    expect(oct.flow).toBe(1817030.02); // 2.293.859,35 - 476.829,33
    expect(oct.flowEstimated).toBe(false);
  });

  it('el saldo de caja nunca es negativo en los cierres documentados', () => {
    const months = build()!.months.filter((m) => m.closing !== null);
    for (const m of months)
      expect(m.closing as number).toBeGreaterThanOrEqual(0);
  });

  it('un mes sin cierre se calcula con el flujo de los movimientos', () => {
    const nov = build('2026-11', { '2026-11': -50000 })!.months[10];
    expect(nov.basis).toBe('calculado');
    expect(nov.flow).toBe(-50000);
    expect(nov.closing).toBe(2243859.35);
  });

  it('los meses futuros quedan vacíos', () => {
    const series = build('2026-10')!;
    expect(series.months[10].closing).toBeNull();
    expect(series.months[11].closing).toBeNull();
    expect(series.current).toBe(2293859.35);
    expect(series.currentMonth).toBe('2026-10');
  });

  it('enero sin cierre de diciembre anterior usa el cierre de enero como ancla', () => {
    const series = buildCashSeries({
      year: 2026,
      reconciliations: [row(BANK, '2026-01', null, 500)],
      booksNet: {},
      currentMonth: '2026-02',
    })!;
    expect(series.months[0].closing).toBe(500);
    expect(series.months[0].flowEstimated).toBe(true);
    expect(series.months[1].basis).toBe('calculado');
  });

  it('identifica la cuenta del banco', () => {
    expect(build()!.bankAccountId).toBe(BANK);
  });
});

describe('periodBalances', () => {
  it('año completo: de diciembre anterior al último saldo', () => {
    expect(periodBalances(build()!, null)).toEqual({
      previousMonth: 100000,
      currentMonth: 2293859.35,
      note: null,
    });
  });

  it('mes exacto: cierre anterior y cierre del mes', () => {
    expect(periodBalances(build()!, 10)).toEqual({
      previousMonth: 476829.33,
      currentMonth: 2293859.35,
      note: null,
    });
  });

  it('mes con flujo no determinable: compara solo el banco y avisa', () => {
    const sep = periodBalances(build()!, 9)!;
    expect(sep.previousMonth).toBe(154350.64);
    expect(sep.currentMonth).toBe(180049.51);
    expect(sep.note).toMatch(/banco/i);
  });

  it('devuelve null si falta el dato', () => {
    expect(periodBalances(build()!, 11)).toBeNull();
  });
});

describe('currentPeriod', () => {
  it('usa la hora de Colombia (UTC-5)', () => {
    expect(currentPeriod(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10');
    expect(currentPeriod(new Date('2026-11-01T06:00:00Z'))).toBe('2026-11');
  });
});

describe('ayudas de presentación', () => {
  it('nombra los meses en español', () => {
    expect(monthName('2026-09')).toBe('Septiembre 2026');
    expect(shortMonth('2026-09')).toBe('Sep');
    expect(shortMonth('2025-12', true)).toBe('Dic 25');
  });

  it('antepone el cierre de diciembre anterior a la serie', () => {
    const series = build()!;
    const months = monthsWithOpening(series);
    expect(months).toHaveLength(13);
    expect(months[0]).toMatchObject({
      month: '2025-12',
      closing: 100000,
      flow: null,
    });
  });
});

describe('buildCashHistory', () => {
  const history = () =>
    buildCashHistory({
      reconciliations,
      booksNet: { '2026-11': -50000 },
      currentMonth: '2026-11',
    })!;

  it('arranca en el primer cierre documentado y llega al mes en curso', () => {
    const months = history().months;
    expect(months[0].month).toBe('2025-12');
    expect(months[months.length - 1].month).toBe('2026-11');
    expect(history().current).toBe(2243859.35);
  });

  it('une varios años en una sola serie', () => {
    const rows = [
      ...reconciliations,
      row(BANK, '2027-01', 2293858.16, 1000000),
    ];
    const h = buildCashHistory({
      reconciliations: rows,
      booksNet: {},
      currentMonth: '2027-01',
    })!;
    expect(h.months.some((m) => m.month === '2026-10')).toBe(true);
    expect(h.months[h.months.length - 1].month).toBe('2027-01');
    expect(h.months[h.months.length - 1].closing).toBe(1000000);
  });

  it('se extiende hacia atrás hasta el primer movimiento', () => {
    const anchor = history().months[0].closing!;
    const h = buildCashHistory({
      reconciliations,
      booksNet: { '2025-11': 100, '2025-12': 500, '2025-10': -40 },
      currentMonth: '2026-11',
      firstMonth: '2025-10',
    })!;
    expect(h.months[0].month).toBe('2025-10');
    expect(h.months[0].basis).toBe('calculado');
    expect(h.months[1].closing).toBe(anchor - 500);
    expect(h.months[0].closing).toBe(anchor - 500 - 100);
    expect(h.months[2].month).toBe('2025-12');
    expect(h.months[2].closing).toBe(anchor);
  });

  it('sin cierres devuelve null', () => {
    expect(
      buildCashHistory({
        reconciliations: [],
        booksNet: {},
        currentMonth: '2026-11',
      })
    ).toBeNull();
  });
});

describe('sliceCashYear', () => {
  const history = buildCashHistory({
    reconciliations,
    booksNet: { '2025-12': 500, '2025-11': 100 },
    currentMonth: '2026-11',
    firstMonth: '2025-06',
  })!;

  it('arma un año anterior a los cierres con saldos reconstruidos', () => {
    const y = sliceCashYear(history, 2025)!;
    expect(y.months).toHaveLength(12);
    expect(y.months[0].closing).toBeNull();
    expect(y.months[5].basis).toBe('calculado');
    expect(y.months[11].closing).toBe(
      history.months.find((m) => m.month === '2025-12')!.closing
    );
  });

  it('un año sin saldos devuelve null', () => {
    expect(sliceCashYear(history, 2019)).toBeNull();
  });
});
