import * as React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../Table';

describe('Table', () => {
  it('renders all table components correctly', () => {
    render(
      <Table className="custom-table">
        <TableCaption className="custom-caption">Caption</TableCaption>
        <TableHeader className="custom-header">
          <TableRow className="custom-row-header">
            <TableHead className="custom-head">Head 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body">
          <TableRow className="custom-row-body">
            <TableCell className="custom-cell">Cell 1</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="custom-footer">
          <TableRow className="custom-row-footer">
            <TableCell>Footer 1</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    // Check wrapper and table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('table', 'custom-table');
    expect(table.parentElement).toHaveClass('table-wrapper');

    // Check caption
    const caption = screen.getByText('Caption');
    expect(caption).toHaveClass('table__caption', 'custom-caption');

    // Check header
    const header = screen.getByText('Head 1').closest('thead');
    expect(header).toHaveClass('table__header', 'custom-header');

    // Check body
    const body = screen.getByText('Cell 1').closest('tbody');
    expect(body).toHaveClass('table__body', 'custom-body');

    // Check row
    const row = screen.getByText('Cell 1').closest('tr');
    expect(row).toHaveClass('table__row', 'custom-row-body');

    // Check head
    const head = screen.getByText('Head 1');
    expect(head).toHaveClass('table__head', 'custom-head');
    expect(head.tagName).toBe('TH');

    // Check cell
    const cell = screen.getByText('Cell 1');
    expect(cell).toHaveClass('table__cell', 'custom-cell');
    expect(cell.tagName).toBe('TD');

    // Check footer
    const footer = screen.getByText('Footer 1').closest('tfoot');
    expect(footer).toHaveClass('table__footer', 'custom-footer');
  });

  it('forwards refs correctly', () => {
    const tableRef = React.createRef<HTMLTableElement>();
    const cellRef = React.createRef<HTMLTableCellElement>();

    render(
      <Table ref={tableRef}>
        <TableBody>
          <TableRow>
            <TableCell ref={cellRef}>Ref Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
    expect(cellRef.current).toBeInstanceOf(HTMLTableCellElement);
  });
});
