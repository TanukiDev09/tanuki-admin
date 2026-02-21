import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../Label';

describe('Label', () => {
  it('renders correctly', () => {
    render(<Label>Username</Label>);
    const label = screen.getByText(/username/i);
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('label');
  });

  it('applies custom className', () => {
    render(<Label className="custom-label">Password</Label>);
    const label = screen.getByText(/password/i);
    expect(label).toHaveClass('custom-label');
  });

  it('associates with an input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Label Text</Label>
        <input id="test-input" />
      </>
    );
    const label = screen.getByText(/label text/i);
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
