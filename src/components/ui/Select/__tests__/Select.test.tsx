import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
} from '../Select';

// Mock ResizeObserver which is used by Radix UI
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

// Mock scrollIntoView which is missing in JSDOM but used by Radix UI
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('Select', () => {
  it('renders correctly and opens on click', async () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger aria-label="Select fruit">
          <SelectValue placeholder="Select fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByLabelText(/select fruit/i);
    expect(trigger).toBeInTheDocument();

    // In Radix Select, the placeholder or value is visible even when closed
    expect(screen.getByText('Apple')).toBeInTheDocument();

    fireEvent.click(trigger);

    // Radix Select content rendered in a portal
    await waitFor(() => {
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  it('changes value correctly', async () => {
    const onValueChange = jest.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="Select fruit">
          <SelectValue placeholder="Select fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByLabelText(/select fruit/i);
    fireEvent.click(trigger);

    const option = await screen.findByText('Banana');
    fireEvent.click(option);

    expect(onValueChange).toHaveBeenCalledWith('banana');
  });

  it('applies custom classNames', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem value="test" className="custom-item">Test</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole('combobox')).toHaveClass('custom-trigger');
  });
});
