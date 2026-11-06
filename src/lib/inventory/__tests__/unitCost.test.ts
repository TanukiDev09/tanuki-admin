import {
  estimateFromPrintingTotal,
  estimateUnitCost,
  type BookPurchase,
} from '../unitCost';

const BOOK = 'book-1';

const purchase = (overrides: Partial<BookPurchase> = {}): BookPurchase => ({
  date: '2026-03-10T00:00:00.000Z',
  quantity: 500,
  bookCount: 1,
  financials: {
    amountInCOP: 6_000_000,
    exchangeRate: 1,
    supplier: 'Imprenta Andina',
  },
  ...overrides,
});

describe('estimateUnitCost', () => {
  it('divide el total pagado entre los ejemplares si la compra es de un solo libro', () => {
    const cost = estimateUnitCost([purchase()], BOOK, 40000);
    expect(cost).toMatchObject({
      amount: 12000,
      source: 'total',
      quantity: 500,
      supplier: 'Imprenta Andina',
      fromLatestPurchase: true,
    });
    expect(cost?.percentOfPrice).toBeCloseTo(30);
  });

  it('prefiere el precio unitario de la línea del libro', () => {
    const cost = estimateUnitCost(
      [
        purchase({
          bookCount: 3,
          financials: {
            amountInCOP: 20_000_000,
            exchangeRate: 1,
            items: [
              { bookId: 'otro', quantity: 100, unitValue: 9000 },
              { bookId: BOOK, quantity: 500, unitValue: 11500 },
            ],
          },
        }),
      ],
      BOOK
    );
    expect(cost).toMatchObject({ amount: 11500, source: 'line-item' });
  });

  it('convierte a COP el precio de línea en otra moneda', () => {
    const cost = estimateUnitCost(
      [
        purchase({
          financials: {
            amountInCOP: 4_000_000,
            exchangeRate: 4000,
            items: [{ bookId: BOOK, quantity: 500, unitValue: 2 }],
          },
        }),
      ],
      BOOK
    );
    expect(cost?.amount).toBe(8000);
  });

  it('usa la compra más reciente aunque venga desordenada', () => {
    const cost = estimateUnitCost(
      [
        purchase({
          date: '2025-01-10T00:00:00.000Z',
          financials: { amountInCOP: 5_000_000, exchangeRate: 1 },
        }),
        purchase(),
      ],
      BOOK
    );
    expect(cost?.amount).toBe(12000);
    expect(cost?.fromLatestPurchase).toBe(true);
  });

  it('si la última compra no tiene precio usa la anterior y lo indica', () => {
    const cost = estimateUnitCost(
      [
        purchase({ date: '2026-05-01T00:00:00.000Z', financials: null }),
        purchase({
          date: '2025-01-10T00:00:00.000Z',
          financials: { amountInCOP: 5_000_000, exchangeRate: 1 },
        }),
      ],
      BOOK
    );
    expect(cost?.amount).toBe(10000);
    expect(cost?.fromLatestPurchase).toBe(false);
    expect(cost?.purchaseDate).toBe('2025-01-10T00:00:00.000Z');
  });

  it('no reparte el total de una compra de varios libros sin precio por línea', () => {
    expect(
      estimateUnitCost([purchase({ bookCount: 2 })], BOOK, 40000)
    ).toBeNull();
  });

  it('sin compras o sin movimiento financiero no hay estimado', () => {
    expect(estimateUnitCost([], BOOK)).toBeNull();
    expect(estimateUnitCost([purchase({ financials: null })], BOOK)).toBeNull();
  });

  it('ignora precios en cero o inválidos', () => {
    expect(
      estimateUnitCost(
        [
          purchase({
            quantity: 0,
            financials: { amountInCOP: 0, exchangeRate: 1 },
          }),
        ],
        BOOK
      )
    ).toBeNull();
  });

  it('sin precio de catálogo no calcula el porcentaje', () => {
    expect(estimateUnitCost([purchase()], BOOK)?.percentOfPrice).toBeNull();
    expect(estimateUnitCost([purchase()], BOOK, 0)?.percentOfPrice).toBeNull();
  });

  it('un tipo de cambio inválido se trata como 1', () => {
    const cost = estimateUnitCost(
      [
        purchase({
          financials: {
            amountInCOP: 1,
            exchangeRate: 0,
            items: [{ bookId: BOOK, quantity: 1, unitValue: 9500 }],
          },
        }),
      ],
      BOOK
    );
    expect(cost?.amount).toBe(9500);
  });
});

describe('estimateFromPrintingTotal', () => {
  it('reparte lo pagado entre los ejemplares ingresados', () => {
    const cost = estimateFromPrintingTotal({
      totalPaid: 3_900_000,
      copies: 500,
      lastPaymentDate: '2026-10-08T00:00:00.000Z',
      supplier: 'Alejandría',
      catalogPrice: 60000,
    });
    expect(cost).toMatchObject({ amount: 7800, source: 'cost-center' });
    expect(cost?.percentOfPrice).toBeCloseTo(13);
  });

  it('sin pagos o sin ejemplares no hay estimado', () => {
    const base = { lastPaymentDate: '2026-10-08' };
    expect(
      estimateFromPrintingTotal({ ...base, totalPaid: 0, copies: 500 })
    ).toBeNull();
    expect(
      estimateFromPrintingTotal({ ...base, totalPaid: 100, copies: 0 })
    ).toBeNull();
  });
});
