import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders correctly with default props', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText(/new/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('badge--default');
  });

  it('renders correctly with different variants', () => {
    const { rerender } = render(<Badge variant="destructive">Error</Badge>);
    let badge = screen.getByText(/error/i);
    expect(badge).toHaveClass('badge--destructive');

    rerender(<Badge variant="secondary">Draft</Badge>);
    badge = screen.getByText(/draft/i);
    expect(badge).toHaveClass('badge--secondary');

    rerender(<Badge variant="success">Paid</Badge>);
    badge = screen.getByText(/paid/i);
    expect(badge).toHaveClass('badge--success');

    rerender(<Badge variant="warning">Pending</Badge>);
    badge = screen.getByText(/pending/i);
    expect(badge).toHaveClass('badge--warning');

    rerender(<Badge variant="info">Info</Badge>);
    badge = screen.getByText(/info/i);
    expect(badge).toHaveClass('badge--info');

    rerender(<Badge variant="outline">Outline</Badge>);
    badge = screen.getByText(/outline/i);
    expect(badge).toHaveClass('badge--outline');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText(/custom/i);
    expect(badge).toHaveClass('custom-class');
  });

  it('passes other props correctly', () => {
    render(<Badge title="Badge Title">With Title</Badge>);
    const badge = screen.getByText(/with title/i);
    expect(badge).toHaveAttribute('title', 'Badge Title');
  });
});
