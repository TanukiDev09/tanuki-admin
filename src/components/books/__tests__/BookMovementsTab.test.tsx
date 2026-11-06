import { render, screen, waitFor, within } from '@testing-library/react';
import {
  computeBookOperations,
  type BookOperationsInput,
  type RecentMovement,
} from '@/lib/inventory/bookOperations';
import BookConsignment from '../BookConsignment';
import BookDemandChart from '../BookDemandChart';
import BookKardex from '../BookKardex';
import BookUnitFlow from '../BookUnitFlow';
import BookVolumes from '../BookVolumes';

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

// Recharts necesita medidas de layout que jsdom no tiene.
jest.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ResponsiveContainer: Passthrough,
    BarChart: Passthrough,
    Bar: () => null,
    CartesianGrid: () => null,
    ReferenceLine: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

const NOW = new Date();
const daysAgo = (days: number): Date =>
  new Date(NOW.getTime() - days * 86_400_000);

const input: BookOperationsInput = {
  now: NOW,
  pointsOfSale: [
    {
      _id: 'p1',
      name: 'Librería Panamericana S.A.S.',
      identificationNumber: '830012345',
      warehouseId: 'W1',
    },
    { _id: 'p2', name: 'Casa del Libro Medellín', warehouseId: 'W2' },
  ],
  posWarehouseIds: ['W1', 'W2'],
  stock: [
    { warehouseId: 'ED', quantity: 90 },
    { warehouseId: 'W1', quantity: 8 },
    { warehouseId: 'W2', quantity: 10 },
  ],
  sales: [
    { date: daysAgo(15), quantity: 30, customerName: 'Ana Pérez' },
    { date: daysAgo(10), quantity: 30, customerTaxId: '830012345' },
  ],
  movements: [
    { type: 'INGRESO', date: daysAgo(500), toWarehouseId: 'ED', quantity: 200 },
    {
      type: 'REMISION',
      date: daysAgo(40),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W1',
      quantity: 50,
    },
    {
      type: 'REMISION',
      date: daysAgo(40),
      fromWarehouseId: 'ED',
      toWarehouseId: 'W2',
      quantity: 10,
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
};
const operations = computeBookOperations(input);

describe('BookUnitFlow', () => {
  it('muestra el ciclo de vida de los ejemplares ingresados', () => {
    render(<BookUnitFlow operations={operations} />);
    expect(screen.getByText('Vendido en venta directa')).toBeInTheDocument();
    expect(screen.getByText('Vendido en librerías')).toBeInTheDocument();
    expect(screen.getByText('En bodega propia')).toBeInTheDocument();
    expect(screen.getByText('En librerías')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/Ciclo de vida/);
  });

  it('muestra un mensaje si el libro no tiene movimiento', () => {
    const empty = computeBookOperations({
      ...input,
      stock: [],
      sales: [],
      movements: [],
    });
    render(<BookUnitFlow operations={empty} />);
    expect(
      screen.getByText(/aún no tiene ingresos, ventas ni stock/)
    ).toBeInTheDocument();
  });
});

describe('BookConsignment', () => {
  it('lista remitido, devuelto, liquidado y stock por punto', () => {
    render(<BookConsignment operations={operations} />);
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // encabezado + 2 puntos

    const pan = within(table)
      .getByText('Librería Panamericana S.A.S.')
      .closest('tr')!;
    expect(within(pan).getByText('35')).toBeInTheDocument();
    const casa = within(table)
      .getByText('Casa del Libro Medellín')
      .closest('tr')!;
    expect(within(casa).getByText('Nunca')).toBeInTheDocument();
  });

  it('muestra un mensaje sin remisiones ni stock en puntos de venta', () => {
    const empty = computeBookOperations({
      ...input,
      stock: [{ warehouseId: 'ED', quantity: 10 }],
      sales: [],
      movements: [],
    });
    render(<BookConsignment operations={empty} />);
    expect(
      screen.getByText(/no tiene remisiones ni stock en puntos de venta/)
    ).toBeInTheDocument();
  });
});

describe('BookKardex', () => {
  const movements: RecentMovement[] = [
    {
      id: 'm1',
      type: 'REMISION',
      date: daysAgo(3).toISOString(),
      quantity: 50,
      from: 'Bodega Editorial',
      to: 'Panamericana',
    },
    {
      id: 'm2',
      type: 'INGRESO',
      date: daysAgo(90).toISOString(),
      quantity: 200,
      to: 'Bodega Editorial',
    },
  ];

  it('lista los movimientos con tipo, ruta y cantidad', () => {
    render(<BookKardex bookId="b1" movements={movements} />);
    expect(screen.getByText('Remisión')).toBeInTheDocument();
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
    expect(
      screen.getByText('Bodega Editorial → Panamericana')
    ).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('enlaza al historial filtrado por el libro', () => {
    render(<BookKardex bookId="b1" movements={movements} />);
    expect(
      screen.getByRole('link', { name: 'Ver todos los movimientos' })
    ).toHaveAttribute('href', '/dashboard/inventory/movements?bookId=b1');
  });

  it('muestra un mensaje sin movimientos', () => {
    render(<BookKardex bookId="b1" movements={[]} />);
    expect(
      screen.getByText('Este libro aún no tiene movimientos de inventario.')
    ).toBeInTheDocument();
  });
});

describe('BookDemandChart', () => {
  it('muestra la leyenda de canales cuando hay ventas', () => {
    render(<BookDemandChart data={operations.monthlyDemand} />);
    const legend = screen.getByRole('list');
    expect(within(legend).getByText(/Librer/)).toBeInTheDocument();
    expect(within(legend).getByText('Venta directa')).toBeInTheDocument();
  });

  it('muestra un mensaje si no hubo ventas en 12 meses', () => {
    const quiet = computeBookOperations({ ...input, sales: [] });
    render(<BookDemandChart data={quiet.monthlyDemand} />);
    expect(
      screen.getByText('Sin ventas en los últimos 12 meses.')
    ).toBeInTheDocument();
  });
});

describe('BookVolumes', () => {
  const volumes = [
    { _id: 'v1', title: 'Tomo I' },
    { _id: 'v2', title: 'Tomo II' },
  ];

  const ops = (own: number) =>
    computeBookOperations({
      now: NOW,
      pointsOfSale: [],
      posWarehouseIds: [],
      stock: [{ warehouseId: 'ED', quantity: own }],
      sales: [{ date: daysAgo(10), quantity: 30, customerName: 'Ana Pérez' }],
      movements: [],
    });

  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      const data = url.includes('/v1/') ? ops(120) : ops(20);
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: { isBundle: false, operations: data },
          }),
      });
    }) as unknown as typeof fetch;
  });

  it('muestra cada volumen y marca el que limita la obra', async () => {
    render(<BookVolumes volumes={volumes} />);
    await waitFor(() => expect(screen.getByText('Tomo I')).toBeInTheDocument());

    const tomoII = screen.getByText('Tomo II').closest('li')!;
    expect(within(tomoII).getByText('Limita la obra')).toBeInTheDocument();
    // 20 ejemplares y 10/mes de demanda = 2 meses < 3 → reimprimir ya
    expect(within(tomoII).getByText('Reimprimir ya')).toBeInTheDocument();

    const tomoI = screen.getByText('Tomo I').closest('li')!;
    expect(within(tomoI).queryByText('Limita la obra')).not.toBeInTheDocument();
  });
});

describe('BookDemandChart accesibilidad y tendencia', () => {
  it('ofrece una tabla accesible con los datos de la gráfica', () => {
    render(<BookDemandChart data={operations.monthlyDemand} />);
    const table = screen.getByRole('table', {
      name: 'Ejemplares vendidos por mes y canal',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(13);
  });

  it('muestra la tendencia frente a los 3 meses anteriores', () => {
    render(<BookDemandChart data={operations.monthlyDemand} />);
    expect(screen.getByText('Últimos 3 meses')).toBeInTheDocument();
    // Todas las ventas son recientes: no hay base de comparación.
    expect(screen.getByText('Sin ventas antes')).toBeInTheDocument();
  });

  it('compara contra los 3 meses anteriores cuando hay base', () => {
    const data = [
      { month: '2026-01', direct: 5, pointsOfSale: 5 },
      { month: '2026-02', direct: 0, pointsOfSale: 0 },
      { month: '2026-03', direct: 0, pointsOfSale: 0 },
      { month: '2026-04', direct: 10, pointsOfSale: 5 },
      { month: '2026-05', direct: 0, pointsOfSale: 0 },
      { month: '2026-06', direct: 0, pointsOfSale: 0 },
    ];
    render(<BookDemandChart data={data} />);
    expect(screen.getByText(/\+50.*vs\. 3 meses antes/)).toBeInTheDocument();
  });
});
