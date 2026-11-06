import { render, screen, within } from '@testing-library/react';
import {
  computeBookOperations,
  type BookOperationsInput,
} from '@/lib/inventory/bookOperations';
import BookAttention from '../BookAttention';
import BookKpiStrip from '../BookKpiStrip';
import BookPosRotation from '../BookPosRotation';
import BookReprint from '../BookReprint';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const NOW = new Date();
const daysAgo = (days: number): Date =>
  new Date(NOW.getTime() - days * 86_400_000);

const input: BookOperationsInput = {
  now: NOW,
  pointsOfSale: [
    {
      _id: 'p1',
      name: 'Librería Panamericana S.A.S.',
      city: 'Bogotá',
      identificationNumber: '830012345',
      warehouseId: 'W1',
    },
    {
      _id: 'p2',
      name: 'Casa del Libro Medellín',
      city: 'Medellín',
      warehouseId: 'W2',
    },
  ],
  posWarehouseIds: ['W1', 'W2'],
  stock: [
    { warehouseId: 'ED', quantity: 60 },
    { warehouseId: 'W1', quantity: 8 },
    { warehouseId: 'W2', quantity: 25 },
  ],
  sales: [
    { date: daysAgo(15), quantity: 30, customerName: 'Ana Pérez' },
    { date: daysAgo(10), quantity: 30, customerTaxId: '830012345' },
  ],
  movements: [
    {
      type: 'REMISION',
      date: daysAgo(40),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W1',
      quantity: 50,
    },
    {
      type: 'REMISION',
      date: daysAgo(300),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W2',
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

const operations = computeBookOperations(input);

describe('BookKpiStrip', () => {
  it('muestra las cifras clave de operaciones', () => {
    render(<BookKpiStrip operations={operations} loading={false} />);
    expect(screen.getByText('Stock total')).toBeInTheDocument();
    expect(screen.getByText('Cobertura bodega propia')).toBeInTheDocument();
    expect(screen.getByText('Cobertura combinada')).toBeInTheDocument();
    expect(screen.getByText('Rotación del libro')).toBeInTheDocument();
    expect(screen.getByText('Tasa de devolución')).toBeInTheDocument();
    expect(screen.getByText('93')).toBeInTheDocument(); // 60 + 8 + 25
  });

  it('no renderiza nada sin datos', () => {
    const { container } = render(
      <BookKpiStrip operations={null} loading={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra un estado de carga', () => {
    const { container } = render(<BookKpiStrip operations={null} loading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});

describe('BookReprint', () => {
  it('indica reimprimir ya cuando la bodega propia dura menos que una reimpresión', () => {
    render(<BookReprint operations={operations} />);
    // Cobertura propia = 60 / 25 al mes = 2,4 meses < 3 meses de una reimpresión.
    expect(screen.getByRole('status')).toHaveTextContent('Reimprimir ya');
  });

  it('sugiere recuperar el stock dormido de las librerías', () => {
    render(<BookReprint operations={operations} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Recuperando 25 ejemplares dormidos'
    );
  });

  it('separa la bodega propia de las librerías', () => {
    render(<BookReprint operations={operations} />);
    expect(
      screen.getByText('Bodega propia y venta directa')
    ).toBeInTheDocument();
    expect(screen.getByText('Librerías')).toBeInTheDocument();
    expect(screen.getByText('Stock en bodega propia')).toBeInTheDocument();
    expect(screen.getByText('Stock en consignación')).toBeInTheDocument();
  });

  it('sin demanda no hay señal de reimpresión', () => {
    const quiet = computeBookOperations({
      ...input,
      sales: [],
      movements: [],
    });
    render(<BookReprint operations={quiet} />);
    expect(screen.getByRole('status')).toHaveTextContent('Sin señal');
  });
});

describe('BookPosRotation', () => {
  it('lista los puntos de venta con su estado', () => {
    render(<BookPosRotation operations={operations} />);
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // encabezado + 2 puntos
    expect(rows).toHaveLength(3);
    expect(
      within(table).getByText('Librería Panamericana S.A.S.')
    ).toBeInTheDocument();
    expect(
      within(table).getByText('Casa del Libro Medellín')
    ).toBeInTheDocument();
    expect(within(table).getByText('Reponer')).toBeInTheDocument(); // W1: 0,8 meses
    expect(within(table).getByText('Dormido')).toBeInTheDocument(); // W2: sin ventas
  });

  it('muestra un mensaje cuando no hay puntos de venta con actividad', () => {
    const empty = computeBookOperations({
      ...input,
      stock: [{ warehouseId: 'ED', quantity: 10 }],
      sales: [],
      movements: [],
    });
    render(<BookPosRotation operations={empty} />);
    expect(
      screen.getByText(
        'Este libro no tiene stock ni ventas en puntos de venta.'
      )
    ).toBeInTheDocument();
  });
});

describe('BookKpiStrip costo unitario', () => {
  const cost = {
    amount: 12000,
    purchaseDate: '2026-03-10T00:00:00.000Z',
    quantity: 500,
    supplier: 'Imprenta Andina',
    source: 'total' as const,
    fromLatestPurchase: true,
    percentOfPrice: 30,
  };

  it('muestra el costo unitario estimado de la última compra', () => {
    render(
      <BookKpiStrip operations={operations} loading={false} unitCost={cost} />
    );
    expect(screen.getByText('Costo unitario estimado')).toBeInTheDocument();
    expect(screen.getByText(/12.000/)).toBeInTheDocument();
    expect(screen.getByText(/30.*del precio/)).toBeInTheDocument();
  });

  it('avisa cuando no hay compra con precio registrado', () => {
    render(<BookKpiStrip operations={operations} loading={false} />);
    expect(
      screen.getByText('Sin compra con precio registrado')
    ).toBeInTheDocument();
  });
});

describe('BookReprint fechas', () => {
  it('muestra cuándo se agota y hasta cuándo pedir', () => {
    render(<BookReprint operations={operations} />);
    expect(screen.getByText(/Se agota hacia/)).toBeInTheDocument();
  });
});

describe('BookAttention', () => {
  it('lista las excepciones que requieren una decisión', () => {
    render(<BookAttention operations={operations} />);
    expect(screen.getByLabelText('Requiere atención')).toBeInTheDocument();
  });

  it('no aparece si todo está en orden', () => {
    const calm = computeBookOperations({
      ...input,
      sales: [],
      stock: [],
      movements: [],
    });
    const { container } = render(<BookAttention operations={calm} />);
    expect(container).toBeEmptyDOMElement();
  });
});
