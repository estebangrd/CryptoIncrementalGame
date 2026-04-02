/**
 * Bug: Net income displays "+-55.3" when cryptoCoinsPerSecond is negative.
 * The UI unconditionally prepends "+" even when formatNumber already returns
 * a negative string.
 *
 * Also: formatNumber doesn't handle negative numbers with K/M/B/T suffixes.
 */
import { formatNumber, formatSignedNumber } from '../src/utils/gameLogic';

describe('formatNumber with negative values', () => {
  it('returns negative sign for small negative numbers', () => {
    expect(formatNumber(-55.3)).toBe('-55.3');
  });

  it('returns negative sign with K suffix', () => {
    expect(formatNumber(-1500)).toBe('-1.5K');
  });

  it('returns negative sign with M suffix', () => {
    expect(formatNumber(-2500000)).toBe('-2.5M');
  });

  it('returns positive values unchanged', () => {
    expect(formatNumber(55.3)).toBe('55.3');
    expect(formatNumber(1500)).toBe('1.5K');
  });

  it('returns 0.0 for zero', () => {
    expect(formatNumber(0)).toBe('0.0');
  });
});

describe('formatSignedNumber for net income display', () => {
  it('prepends + for positive values', () => {
    expect(formatSignedNumber(55.3)).toBe('+55.3');
  });

  it('does NOT double-sign negative values', () => {
    expect(formatSignedNumber(-55.3)).toBe('-55.3');
  });

  it('shows 0.0 for zero', () => {
    expect(formatSignedNumber(0)).toBe('0.0');
  });

  it('handles large positive values with suffix', () => {
    expect(formatSignedNumber(1500)).toBe('+1.5K');
  });

  it('handles large negative values with suffix', () => {
    expect(formatSignedNumber(-1500)).toBe('-1.5K');
  });
});
