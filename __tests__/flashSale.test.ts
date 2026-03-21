/**
 * Unit tests for flash sale logic in the Remove Ads tab.
 * Spec: specs/monetization/remove-ads-product.md
 *
 * Bug: the roll useEffect in ShopScreen had iapState.flashSaleExpiresAt and
 * iapState.flashSaleCooldownUntil in its dependency array, causing re-rolls
 * whenever those values changed (e.g. on LOAD_GAME or after a sale expired).
 * This made the discounted price appear more often than the 35% chance intended.
 */

import {
  computeHasActiveSale,
  shouldRollFlashSale,
} from '../src/utils/flashSaleLogic';

describe('computeHasActiveSale', () => {
  it('returns false when flashSaleExpiresAt is 0 (no sale ever rolled)', () => {
    expect(computeHasActiveSale({ flashSaleExpiresAt: 0, removeAdsPurchased: false })).toBe(false);
  });

  it('returns false when flashSaleExpiresAt is in the past (expired)', () => {
    const pastTime = Date.now() - 1000;
    expect(computeHasActiveSale({ flashSaleExpiresAt: pastTime, removeAdsPurchased: false })).toBe(false);
  });

  it('returns true when flashSaleExpiresAt is in the future', () => {
    const futureTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
    expect(computeHasActiveSale({ flashSaleExpiresAt: futureTime, removeAdsPurchased: false })).toBe(true);
  });

  it('returns false even with future flashSaleExpiresAt if removeAdsPurchased is true', () => {
    const futureTime = Date.now() + 60 * 60 * 1000;
    expect(computeHasActiveSale({ flashSaleExpiresAt: futureTime, removeAdsPurchased: true })).toBe(false);
  });
});

describe('shouldRollFlashSale', () => {
  it('returns false when removeAdsPurchased is true', () => {
    const now = Date.now();
    expect(
      shouldRollFlashSale({
        removeAdsPurchased: true,
        flashSaleExpiresAt: 0,
        flashSaleCooldownUntil: 0,
        now,
      })
    ).toBe(false);
  });

  it('returns false when a sale is already active', () => {
    const now = Date.now();
    expect(
      shouldRollFlashSale({
        removeAdsPurchased: false,
        flashSaleExpiresAt: now + 5 * 60 * 1000, // 5 minutes remaining
        flashSaleCooldownUntil: 0,
        now,
      })
    ).toBe(false);
  });

  it('returns false when in cooldown period (24h after previous sale)', () => {
    const now = Date.now();
    expect(
      shouldRollFlashSale({
        removeAdsPurchased: false,
        flashSaleExpiresAt: 0,
        flashSaleCooldownUntil: now + 23 * 60 * 60 * 1000, // 23 hours remaining
        now,
      })
    ).toBe(false);
  });

  it('returns true when no active sale and no cooldown', () => {
    const now = Date.now();
    expect(
      shouldRollFlashSale({
        removeAdsPurchased: false,
        flashSaleExpiresAt: 0,
        flashSaleCooldownUntil: 0,
        now,
      })
    ).toBe(true);
  });

  it('returns true when cooldown has passed (expired cooldown)', () => {
    const now = Date.now();
    expect(
      shouldRollFlashSale({
        removeAdsPurchased: false,
        flashSaleExpiresAt: 0,
        flashSaleCooldownUntil: now - 1000, // cooldown expired 1 second ago
        now,
      })
    ).toBe(true);
  });

  it('returns false when sale expiry is in the past but cooldown is active', () => {
    const now = Date.now();
    expect(
      shouldRollFlashSale({
        removeAdsPurchased: false,
        flashSaleExpiresAt: now - 5000, // expired 5 seconds ago
        flashSaleCooldownUntil: now + 20 * 60 * 60 * 1000, // cooldown active
        now,
      })
    ).toBe(false);
  });
});
