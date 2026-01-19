'use client';

import * as React from 'react';
import { Input, InputProps } from './Input';
import { formatNumber } from '@/lib/utils';

interface NumericInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: number | string;
  onValueChange?: (value: number | undefined) => void;
  allowDecimals?: boolean;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onValueChange, allowDecimals = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Update display value when prop value changes
    React.useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
      } else {
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '').replace(',', '.')) : value;
        if (!isNaN(numValue)) {
          const formatted = formatNumber(numValue);
          // Only update if the numeric value is different to avoid cursor jumps
          const currentNumeric = parseFloat(displayValue.replace(/\s/g, '').replace(',', '.'));
          if (numValue !== currentNumeric || displayValue === '') {
            setDisplayValue(formatted);
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow only digits, spaces, and one decimal separator
      const decimalSeparator = ','; // Using comma for es-CO

      // Strip spaces for validation and parsing
      const cleanValue = input.replace(/\s/g, '');
      const normalizedValue = cleanValue.replace(decimalSeparator, '.');

      // Check if it's a valid intermediate state (empty, just minus, or valid number)
      if (cleanValue === '' || cleanValue === '-' || !isNaN(Number(normalizedValue))) {
        // Find cursor position before update
        const cursorPosition = e.target.selectionStart || 0;
        const spacesBefore = (input.substring(0, cursorPosition).match(/\s/g) || []).length;

        // Update with spaces formatting
        let nextDisplay = input;
        let nextValue: number | undefined = undefined;

        if (cleanValue !== '' && cleanValue !== '-') {
          const num = parseFloat(normalizedValue);
          nextValue = num;
          // Format immediately if it doesn't end with a decimal separator
          if (!cleanValue.endsWith(decimalSeparator)) {
            nextDisplay = formatNumber(num);
          }
        } else {
          nextDisplay = input; // Keep '-' or ''
        }

        setDisplayValue(nextDisplay);
        if (onValueChange) {
          onValueChange(nextValue);
        }

        // Restore cursor position
        setTimeout(() => {
          if (e.target) {
            const nextSpacesBefore = (nextDisplay.substring(0, cursorPosition).match(/\s/g) || []).length;
            const diff = nextSpacesBefore - spacesBefore;
            e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
          }
        }, 0);
      }
    };

    const handleBlur = () => {
      if (displayValue === '-' || displayValue === '') {
        setDisplayValue('');
        if (onValueChange) onValueChange(undefined);
        return;
      }
      const numValue = parseFloat(displayValue.replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(numValue)) {
        setDisplayValue(formatNumber(numValue));
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={allowDecimals ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';
