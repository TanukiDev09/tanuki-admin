import { fireEvent, render, screen, within } from '@testing-library/react';
import CostCenterListing from '../CostCenterListing';
import type { CostCenterStats } from '@/types/cost-center';

// recharts no calcula tamaños en jsdom; la sparkline no es lo que se prueba.
jest.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

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

const data = [
  cc({
    code: 'LAP',
    name: 'Un lápiz labial para una momia',
    income: 600,
    expense: 200,
    balance: 400,
    isBook: true,
    bookTitle: 'Un lápiz labial para una momia',
    units: 30,
  }),
  cc({
    code: 'ARB',
    name: 'Árbol',
    income: 300,
    expense: 600,
    balance: -300,
    isBook: true,
    units: 10,
  }),
  cc({
    code: 'OFI',
    name: 'Oficina',
    income: 100,
    expense: 200,
    balance: -100,
  }),
];

const renderListing = (props = {}) =>
  render(
    <CostCenterListing
      costCenters={data}
      loading={false}
      canUpdate
      canDelete
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      {...props}
    />
  );

const names = () =>
  screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('CostCenterListing', () => {
  it('muestra una ficha por centro, con sus estadísticas dentro', () => {
    renderListing();
    // orden por defecto: código ascendente (ARB, LAP, OFI)
    expect(names()).toEqual([
      'Árbol',
      'Un lápiz labial para una momia',
      'Oficina',
    ]);
    const card = screen.getByText('Oficina').closest('article')!;
    expect(within(card).getByText('Ingresos')).toBeInTheDocument();
    expect(within(card).getByText('% de ingresos')).toBeInTheDocument();
    // un centro que no es libro no muestra ejemplares
    expect(within(card).queryByText('Ejemplares vendidos')).toBeNull();
  });

  it('el filtro "Libros" deja solo los centros que son libro', () => {
    renderListing();
    fireEvent.click(screen.getByRole('button', { name: /Libros/ }));
    expect(names()).toEqual(
      expect.arrayContaining(['Árbol', 'Un lápiz labial para una momia'])
    );
    expect(screen.queryByText('Oficina')).toBeNull();
    expect(screen.getByText('2 centros encontrados')).toBeInTheDocument();
  });

  it('el filtro "Otros" deja los que no son libro', () => {
    renderListing();
    fireEvent.click(screen.getByRole('button', { name: /Otros/ }));
    expect(names()).toEqual(['Oficina']);
    expect(screen.getByText('1 centro encontrado')).toBeInTheDocument();
  });

  it('muestra la cantidad de centros en cada filtro', () => {
    renderListing();
    expect(screen.getByRole('button', { name: /Todos/ })).toHaveTextContent(
      '3'
    );
    expect(screen.getByRole('button', { name: /Libros/ })).toHaveTextContent(
      '2'
    );
    expect(screen.getByRole('button', { name: /Otros/ })).toHaveTextContent(
      '1'
    );
  });

  it('invierte el orden con el botón ascendente/descendente', () => {
    renderListing();
    const before = names();
    fireEvent.click(screen.getByRole('button', { name: /Orden ascendente/ }));
    expect(names()).toEqual([...before].reverse());
    expect(
      screen.getByRole('button', { name: /Orden descendente/ })
    ).toBeInTheDocument();
  });

  it('la búsqueda filtra y "Limpiar filtros" la deshace', () => {
    renderListing();
    fireEvent.change(screen.getByLabelText('Buscar centros de costo'), {
      target: { value: 'zzz' },
    });
    expect(
      screen.getByText('Ningún centro coincide con los filtros.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(names()).toHaveLength(3);
  });

  it('oculta editar y eliminar sin permisos', () => {
    renderListing({ canUpdate: false, canDelete: false });
    expect(screen.queryByRole('button', { name: /Editar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Eliminar/ })).toBeNull();
  });

  it('llama a onEdit y onDelete con el centro correcto', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderListing({ onEdit, onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Editar Oficina' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Oficina' }));
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'OFI' })
    );
    expect(onDelete).toHaveBeenCalledWith('OFI');
  });

  it('muestra marcadores de carga y no las fichas', () => {
    renderListing({ loading: true });
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });
});
