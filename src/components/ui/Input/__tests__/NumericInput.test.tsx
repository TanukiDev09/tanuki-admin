import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NumericInput, type NumericInputProps } from '../NumericInput';

// Test wrapper to manage state like a real parent component
const NumericInputWrapper = ({ initialValue, ...props }: { initialValue?: number } & NumericInputProps) => {
  const [value, setValue] = React.useState(initialValue);
  return (
    <NumericInput
      {...props}
      value={value}
      onValueChange={(val: number | undefined) => {
        setValue(val);
        if (props.onValueChange) props.onValueChange(val);
      }}
    />
  );
};

describe('NumericInput', () => {
  it('renders correctly with initial numeric value', async () => {
    render(<NumericInputWrapper initialValue={1234567.89} placeholder="Numeric" />);
    const input = screen.getByPlaceholderText(/numeric/i) as HTMLInputElement;

    await waitFor(() => {
      expect(input.value.replace(/\u00A0/g, ' ')).toBe('1 234 567,89');
    });
  });

  it('updates value correctly on change', async () => {
    const onValueChange = jest.fn();
    render(<NumericInputWrapper onValueChange={onValueChange} placeholder="Numeric" />);
    const input = screen.getByPlaceholderText(/numeric/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '1234' } });

    expect(onValueChange).toHaveBeenCalledWith(1234);

    await waitFor(() => {
      expect(input.value.replace(/\u00A0/g, ' ')).toBe('1 234');
    });
  });

  it('handles decimal separators (comma)', async () => {
    render(<NumericInputWrapper placeholder="Numeric" />);
    const input = screen.getByPlaceholderText(/numeric/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '1234,' } });
    expect(input.value).toBe('1234,');

    fireEvent.change(input, { target: { value: '1234,5' } });
    await waitFor(() => {
      expect(input.value.replace(/\u00A0/g, ' ')).toBe('1 234,5');
    });
  });

  it('handles blur correctly', async () => {
    render(<NumericInputWrapper initialValue={1234} placeholder="Numeric" />);
    const input = screen.getByPlaceholderText(/numeric/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '5678,' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(input.value.replace(/\u00A0/g, ' ')).toBe('5 678');
    });
  });

  it('clears value when empty', async () => {
    const onValueChange = jest.fn();
    render(<NumericInputWrapper initialValue={1234} onValueChange={onValueChange} placeholder="Numeric" />);
    const input = screen.getByPlaceholderText(/numeric/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
      expect(input.value).toBe('');
    });
  });

  it('handles minus sign for negative numbers', async () => {
    render(<NumericInputWrapper placeholder="Numeric" />);
    const input = screen.getByPlaceholderText(/numeric/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '-' } });
    expect(input.value).toBe('-');

    fireEvent.change(input, { target: { value: '-123' } });
    await waitFor(() => {
      expect(input.value.replace(/\u00A0/g, ' ')).toBe('-123');
    });
  });
});
