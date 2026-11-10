import { calculateHealthMetrics } from '../health';

const months = [
  { month: '2026-07', income: 8000000, expenses: 6500000 },
  { month: '2026-08', income: 1600000, expenses: 3000000 },
  { month: '2026-09', income: 3700000, expenses: 4700000 }, // incompleto
  { month: '2026-10', income: 6300000, expenses: 4500000 },
];

const run = (options = {}) =>
  calculateHealthMetrics(
    '19600000',
    '18700000',
    '900000',
    months,
    null,
    null,
    options
  );

describe('calculateHealthMetrics', () => {
  it('sin opciones usa el saldo de los libros (comportamiento anterior)', () => {
    const base = run();
    // últimos 3 meses: ago, sep, oct
    expect(base.burnRate.gross).toBeCloseTo((3000000 + 4700000 + 4500000) / 3);
  });

  it('con meses excluidos promedia solo los meses completos', () => {
    const h = run({ excludeMonths: ['2026-09'] });
    // últimos 3 completos: jul, ago, oct
    expect(h.burnRate.gross).toBeCloseTo((6500000 + 3000000 + 4500000) / 3);
    expect(h.avgMonthlyIncome).toBeCloseTo((8000000 + 1600000 + 6300000) / 3);
  });

  it('usa la caja real como base de la pista financiera', () => {
    const burning = [
      { month: '2026-09', income: 100, expenses: 1100 },
      { month: '2026-10', income: 100, expenses: 1100 },
    ];
    const withBooks = calculateHealthMetrics(
      '200',
      '2200',
      '2000',
      burning,
      null,
      null
    );
    const withCash = calculateHealthMetrics(
      '200',
      '2200',
      '2000',
      burning,
      null,
      null,
      {
        cashBase: 10000,
      }
    );
    expect(withBooks.runway).toBeCloseTo(2);
    expect(withCash.runway).toBeCloseTo(10);
  });

  it('si todos los meses están excluidos no se queda sin datos', () => {
    const one = [{ month: '2026-09', income: 100, expenses: 400 }];
    const h = calculateHealthMetrics('100', '400', '-300', one, '2026', '9', {
      excludeMonths: ['2026-09'],
    });
    expect(h.burnRate.gross).toBeCloseTo(400);
  });
});
