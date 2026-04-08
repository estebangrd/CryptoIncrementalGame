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

import { formatUSD } from '../src/utils/gameLogic';

describe('formatUSD — USD price formatter', () => {
  it('shows 4 decimal places for prices between $1 and $100', () => {
    // OU price process produces values like 1.0857 — must show all 4 decimals
    expect(formatUSD(1.0857)).toBe('$1.0857');
    expect(formatUSD(1.0863)).toBe('$1.0863');
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

  it('handles zero and non-finite inputs safely', () => {
    expect(formatUSD(0)).toBe('$0.00');
    expect(formatUSD(NaN)).toBe('$0.00');
    expect(formatUSD(Infinity)).toBe('$0.00');
  });
});
