import Big from 'big.js';

// Configuration for financial precision
// DP is decimal places for divisions. 20 is plenty for intermediate steps.
Big.DP = 20;
Big.RM = Big.roundHalfUp;

export type DecimalValue =
  | string
  | number
  | { toString(): string }
  | undefined
  | null;

/**
 * Converts a value to a Big instance safely.
 */
const toBig = (val: DecimalValue): Big => {
  if (val === undefined || val === null || val === '') return new Big(0);
  try {
    // Handle Decimal128 by using .toString()
    // Also handle MongoDB JSON representation: { $numberDecimal: string }
    let str = '';
    if (typeof val === 'object' && val !== null) {
      if ('$numberDecimal' in val) {
        str = String(val.$numberDecimal);
      } else if ('toString' in val) {
        str = val.toString();
      }
    } else {
      str = String(val);
    }
    // Remove any formatting spaces if present
    const cleanStr = str.replace(/\s/g, '').replace(',', '.');
    return new Big(cleanStr || 0);
  } catch (e) {
    console.warn('Error converting to Big:', val, e);
    return new Big(0);
  }
};

/**
 * Performs high-precision addition.
 */
export const add = (a: DecimalValue, b: DecimalValue): string =>
  toBig(a).plus(toBig(b)).toString();

/**
 * Performs high-precision subtraction.
 */
export const subtract = (a: DecimalValue, b: DecimalValue): string =>
  toBig(a).minus(toBig(b)).toString();

/**
 * Performs high-precision multiplication.
 */
export const multiply = (a: DecimalValue, b: DecimalValue): string =>
  toBig(a).times(toBig(b)).toString();

/**
 * Performs high-precision division.
 */
export const divide = (a: DecimalValue, b: DecimalValue): string => {
  const bBig = toBig(b);
  if (bBig.eq(0)) return '0';
  return toBig(a).div(bBig).toString();
};

/**
 * Safely converts a DecimalValue to a standard JavaScript number.
 * Use ONLY for presentation or libraries that don't support Big (like charts).
 */
export const toNumber = (val: DecimalValue): number => {
  if (val === undefined || val === null || val === '') return 0;
  return toBig(val).toNumber();
};

/**
 * Formats a decimal value to a fixed number of decimal places as a string.
 */
export const toFixed = (val: DecimalValue, dp: number = 2): string =>
  toBig(val).toFixed(dp);

/**
 * Compares two decimal values.
 * Returns 1 if a > b, -1 if a < b, 0 if a == b.
 */
export const compare = (a: DecimalValue, b: DecimalValue): number =>
  toBig(a).cmp(toBig(b));

/**
 * Checks if a value is greater than zero.
 */
export const gtZero = (val: DecimalValue): boolean => toBig(val).gt(0);

/**
 * Checks if a value is zero.
 */
export const isZero = (val: DecimalValue): boolean => toBig(val).eq(0);
