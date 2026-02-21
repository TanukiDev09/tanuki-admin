import { cn, formatCurrency, formatNumber } from '../utils';

describe('general utilities', () => {
  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined && 'class2', 'class3')).toBe(
        'class1 class3'
      );
      expect(cn('class1', { class2: true, class3: false })).toBe(
        'class1 class2'
      );
    });
  });

  describe('formatCurrency', () => {
    it('formats COP correctly', () => {
      const result = formatCurrency(1234.56, 'COP');
      // COP uses 0 decimal places in configuration
      expect(result).toContain('1\u00A0235'); // Rounded
    });

    it('formats JPY correctly', () => {
      const result = formatCurrency(1234.56, 'JPY');
      expect(result).toContain('1\u00A0235'); // JPY uses 0 decimal places
    });

    it('formats USD correctly', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('1\u00A0234,56'); // es-CO locale used for general currency
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with es-CO locale', () => {
      expect(formatNumber(1234.56)).toBe('1\u00A0234,56');
    });

    it('handles string input', () => {
      expect(formatNumber('1234.56')).toBe('1\u00A0234,56');
    });

    it('handles non-numeric strings', () => {
      expect(formatNumber('not-a-number')).toBe('not-a-number');
    });
  });
});
