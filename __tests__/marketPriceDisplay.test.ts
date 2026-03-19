/**
 * Tests for market price display bugs:
 * 1. Price header in PriceChart should show 4 decimal places for prices in $1-$100
 *    so minute-by-minute changes (~$0.001) are visible to the player.
 *
 * Based on spec: specs/game-mechanics/market-system.md
 */

// We test the exported formatPrice directly so we can confirm it's broken before the fix.
jest.mock('react-native-svg', () => ({
  default: 'Svg',
  Path: 'Path',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
  Circle: 'Circle',
}));

import { formatPrice } from '../src/components/PriceChart';

describe('PriceChart formatPrice precision', () => {
  it('shows 4 decimal places for prices between $1 and $100', () => {
    // BTC dataset / seed produces values like 1.0857 — must show all 4 decimals
    expect(formatPrice(1.0857)).toBe('$1.0857');
    expect(formatPrice(1.0863)).toBe('$1.0863');
  });

  it('distinguishes adjacent minute prices that 2-decimal rounding collapses', () => {
    // Before fix: both showed $1.09 → price appeared static
    const price1 = formatPrice(1.085);
    const price2 = formatPrice(1.094);
    expect(price1).not.toBe(price2);
  });

  it('shows 0 decimal places for prices >= $100', () => {
    expect(formatPrice(100)).toBe('$100');
  });

  it('shows k-suffix for prices >= $1000', () => {
    expect(formatPrice(1050)).toBe('$1.1k');
  });

  it('shows 4 decimal places for prices between $0.01 and $1', () => {
    expect(formatPrice(0.0123)).toBe('$0.0123');
  });

  it('shows 6 decimal places for prices below $0.01', () => {
    expect(formatPrice(0.000123)).toBe('$0.000123');
  });
});
