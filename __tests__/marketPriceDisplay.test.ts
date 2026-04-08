/**
 * Tests for the canonical USD price formatter used across the market UI.
 *
 * These cover:
 * 1. Minute-by-minute price changes in the $1-$100 range stay distinguishable
 *    (spec: specs/game-mechanics/market-system.md).
 * 2. Extreme endgame prices (≥ 1e18) don't collapse to raw exponential output
 *    like "$1.652667965277204e+21k" anymore.
 * 3. Sub-dollar and sub-cent prices preserve enough precision to be readable.
 */

import { formatUSD, formatUSDCompact } from '../src/utils/gameLogic';

describe('formatUSD — USD price formatter', () => {
  it('shows up to 4 decimal places for prices between $1 and $100', () => {
    // OU price process produces values like 1.0857 — must show all 4 decimals
    expect(formatUSD(1.0857)).toBe('$1.0857');
    expect(formatUSD(1.0863)).toBe('$1.0863');
  });

  it('trims trailing zeros to 2 decimals for round prices in $1-$100', () => {
    // Hardware costs like $25 must NOT render as $25.0000 (finance convention
    // keeps the cents but drops meaningless trailing zeros).
    expect(formatUSD(25)).toBe('$25.00');
    expect(formatUSD(99)).toBe('$99.00');
    expect(formatUSD(1.5)).toBe('$1.50');
    expect(formatUSD(1.05)).toBe('$1.05');
    // Mixed precision: preserves 3rd/4th decimal when meaningful
    expect(formatUSD(1.085)).toBe('$1.085');
  });

  it('distinguishes adjacent minute prices in the $1-$100 band', () => {
    // With 2-decimal rounding both prices collapsed to "$1.09" — the chart
    // appeared static. 4-decimal precision keeps them distinct.
    const price1 = formatUSD(1.085);
    const price2 = formatUSD(1.094);
    expect(price1).not.toBe(price2);
  });

  it('shows 2 decimals (cents) for prices between $100 and $1000', () => {
    expect(formatUSD(100)).toBe('$100.00');
    expect(formatUSD(999.99)).toBe('$999.99');
  });

  it('shows K suffix with 2 decimals for prices >= $1000', () => {
    expect(formatUSD(1050)).toBe('$1.05K');
    expect(formatUSD(123456)).toBe('$123.46K');
  });

  it('shows 4 decimal places for prices between $0.01 and $1', () => {
    expect(formatUSD(0.0123)).toBe('$0.0123');
  });

  it('shows 6 decimal places for prices below $0.01', () => {
    expect(formatUSD(0.000123)).toBe('$0.000123');
  });

  it('uses exponential notation for sub-1e-4 prices', () => {
    const out = formatUSD(1e-6);
    expect(out.startsWith('$')).toBe(true);
    expect(out).toMatch(/e[-−]/);
  });

  it('uses M / B / T / Q suffixes in the mid-to-late endgame', () => {
    expect(formatUSD(1.23e6)).toBe('$1.23M');
    expect(formatUSD(1.23e9)).toBe('$1.23B');
    expect(formatUSD(1.23e12)).toBe('$1.23T');
    expect(formatUSD(1.23e15)).toBe('$1.23Q');
  });

  it('never produces raw scientific notation below 1e18', () => {
    // Regression test for the $1.652667965277204e+21k bug: values up to
    // 1e18 must use clean suffixes, not fall through to toFixed-induced
    // exponential output.
    for (const v of [1e3, 1.5e5, 9.9e11, 4.2e14, 7.7e17]) {
      const out = formatUSD(v);
      expect(out).not.toMatch(/e\+/i);
    }
  });

  it('falls back to exponential only for ≥ 1e18', () => {
    const out = formatUSD(1.65e24);
    expect(out.startsWith('$')).toBe(true);
    expect(out).toMatch(/e\+/);
  });

  it('handles zero and non-finite inputs as plain "$0" (finance convention)', () => {
    expect(formatUSD(0)).toBe('$0');
    expect(formatUSD(NaN)).toBe('$0');
    expect(formatUSD(Infinity)).toBe('$0');
  });
});

describe('formatUSDCompact — dense stat card formatter', () => {
  it('renders integer dollar amounts without decimals', () => {
    // BlockStatus Cash Balance / Total Earned stat cards — cent precision
    // adds noise in a compact dashboard display.
    expect(formatUSDCompact(25)).toBe('$25');
    expect(formatUSDCompact(100)).toBe('$100');
    expect(formatUSDCompact(999)).toBe('$999');
  });

  it('shows up to 1 decimal for fractional amounts', () => {
    expect(formatUSDCompact(25.5)).toBe('$25.5');
    expect(formatUSDCompact(999.9)).toBe('$999.9');
  });

  it('trims trailing zero in suffix ranges', () => {
    expect(formatUSDCompact(1000)).toBe('$1K');
    expect(formatUSDCompact(1e6)).toBe('$1M');
    expect(formatUSDCompact(3e9)).toBe('$3B');
  });

  it('keeps 1 decimal in suffix ranges when meaningful', () => {
    expect(formatUSDCompact(1234)).toBe('$1.2K');
    expect(formatUSDCompact(45.8e6)).toBe('$45.8M');
  });

  it('preserves sub-dollar precision up to 2 decimals trimmed', () => {
    expect(formatUSDCompact(0.86)).toBe('$0.86');
    expect(formatUSDCompact(0.5)).toBe('$0.5');
  });

  it('handles zero and non-finite inputs as "$0"', () => {
    expect(formatUSDCompact(0)).toBe('$0');
    expect(formatUSDCompact(NaN)).toBe('$0');
    expect(formatUSDCompact(Infinity)).toBe('$0');
  });
});
