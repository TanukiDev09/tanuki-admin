import {
  add,
  subtract,
  multiply,
  divide,
  toNumber,
  toFixed,
  compare,
  compareFinancial,
  isMatchedFinancial,
  gtZero,
  isZero,
} from '../math';

describe('math utility', () => {
  describe('addition', () => {
    it('adds numbers correctly', () => {
      expect(add(10, 20)).toBe('30');
      expect(add('10.5', '20.3')).toBe('30.8');
    });

    it('handles floating point precision', () => {
      // 0.1 + 0.2 is notoriously 0.30000000000000004 in standard JS
      expect(add(0.1, 0.2)).toBe('0.3');
    });

    it('handles empty/null values as 0', () => {
      expect(add(null, 5)).toBe('5');
      expect(add(undefined, '')).toBe('0');
    });

    it('handles formatting (comma as decimal separator)', () => {
      expect(add('1.234,56', '43,44')).toBe('1278');
    });
  });

  describe('subtraction', () => {
    it('subtracts numbers correctly', () => {
      expect(subtract(50, 20)).toBe('30');
      expect(subtract('0.3', '0.1')).toBe('0.2');
    });
  });

  describe('multiplication', () => {
    it('multiplies numbers correctly', () => {
      expect(multiply(10, 5)).toBe('50');
      expect(multiply('0.1', '0.2')).toBe('0.02');
    });
  });

  describe('division', () => {
    it('divides numbers correctly', () => {
      expect(divide(10, 2)).toBe('5');
      expect(divide(1, 3)).toContain('0.3333333333333333'); // Precision test
    });

    it('handles division by zero', () => {
      expect(divide(10, 0)).toBe('0');
    });
  });

  describe('conversions', () => {
    it('converts to number safely', () => {
      expect(toNumber('123.45')).toBe(123.45);
      expect(toNumber(null)).toBe(0);
    });

    it('formats to fixed decimal places', () => {
      expect(toFixed('123.456', 2)).toBe('123.46');
      expect(toFixed(10, 2)).toBe('10.00');
    });
  });

  describe('comparisons', () => {
    it('compares values correctly', () => {
      expect(compare(10, 5)).toBe(1);
      expect(compare(5, 10)).toBe(-1);
      expect(compare(10, 10)).toBe(0);
    });

    it('compares financial values with precision', () => {
      expect(compareFinancial(10.001, 10.002, 2)).toBe(0);
      expect(compareFinancial(10.01, 10.02, 2)).toBe(-1);
    });

    it('checks for financial match within tolerance', () => {
      expect(isMatchedFinancial(100, 104, 5)).toBe(true);
      expect(isMatchedFinancial(100, 106, 5)).toBe(false);
    });

    it('checks for gtZero and isZero', () => {
      expect(gtZero(0.1)).toBe(true);
      expect(gtZero(0)).toBe(false);
      expect(gtZero(-1)).toBe(false);
      expect(isZero(0)).toBe(true);
      expect(isZero('0.000')).toBe(true);
    });
  });
});
