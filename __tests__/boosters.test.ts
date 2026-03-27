/**
 * Unit tests for booster/multiplier logic.
 * Based on spec: specs/monetization/boosters-catalog.md
 */

import { BOOSTER_CONFIG, STARTER_PACK_REWARDS } from '../src/config/balanceConfig';

// ─── helpers (mirror of gameLogic.ts logic) ─────────────────────────────────

function calculateActiveTemporaryBooster(iapState: any): number {
  const now = Date.now();

  if (iapState.booster5x?.isActive && iapState.booster5x?.expiresAt !== null) {
    if (now < iapState.booster5x.expiresAt) {
      return BOOSTER_CONFIG.BOOSTER_5X.multiplier;
    }
  }

  if (iapState.booster2x?.isActive && iapState.booster2x?.expiresAt !== null) {
    if (now < iapState.booster2x.expiresAt) {
      return BOOSTER_CONFIG.BOOSTER_2X.multiplier;
    }
  }

  return 1.0;
}

function calculatePermanentMultiplier(iapState: any): number {
  return iapState.permanentMultiplierPurchased
    ? BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier
    : 1.0;
}

// ─── Booster tests ───────────────────────────────────────────────────────────

describe('Boosters - Temporary Multipliers', () => {
  const futureExpiry = Date.now() + 60 * 60 * 1000; // 1 hour from now

  it('returns 1.0 when no booster is active', () => {
    const iapState = {
      booster2x: { isActive: false, expiresAt: null },
      booster5x: { isActive: false, expiresAt: null },
    };
    expect(calculateActiveTemporaryBooster(iapState)).toBe(1.0);
  });

  it('applies 2x multiplier when booster2x is active', () => {
    const iapState = {
      booster2x: { isActive: true, expiresAt: futureExpiry },
      booster5x: { isActive: false, expiresAt: null },
    };
    expect(calculateActiveTemporaryBooster(iapState)).toBe(2.0);
  });

  it('applies 5x multiplier when booster5x is active', () => {
    const iapState = {
      booster2x: { isActive: false, expiresAt: null },
      booster5x: { isActive: true, expiresAt: futureExpiry },
    };
    expect(calculateActiveTemporaryBooster(iapState)).toBe(5.0);
  });

  it('5x takes priority over 2x when both are active', () => {
    const iapState = {
      booster2x: { isActive: true, expiresAt: futureExpiry },
      booster5x: { isActive: true, expiresAt: futureExpiry },
    };
    expect(calculateActiveTemporaryBooster(iapState)).toBe(5.0);
  });

  it('returns 1.0 when booster is marked active but has expired', () => {
    const pastExpiry = Date.now() - 1000; // 1 second ago
    const iapState = {
      booster2x: { isActive: true, expiresAt: pastExpiry },
      booster5x: { isActive: false, expiresAt: null },
    };
    expect(calculateActiveTemporaryBooster(iapState)).toBe(1.0);
  });
});

// ─── Permanent multiplier tests ──────────────────────────────────────────────

describe('Boosters - Permanent Multiplier', () => {
  it('returns 1.0 when permanent multiplier is not purchased', () => {
    expect(calculatePermanentMultiplier({ permanentMultiplierPurchased: false })).toBe(1.0);
  });

  it('returns 2.0 when permanent multiplier is purchased', () => {
    expect(calculatePermanentMultiplier({ permanentMultiplierPurchased: true })).toBe(2.0);
  });

  it('stacks multiplicatively with temporary booster', () => {
    const futureExpiry = Date.now() + 60 * 60 * 1000;
    const iapState = {
      permanentMultiplierPurchased: true,
      booster5x: { isActive: true, expiresAt: futureExpiry },
      booster2x: { isActive: false, expiresAt: null },
    };
    const base = 1000;
    const permanent = calculatePermanentMultiplier(iapState);
    const temporary = calculateActiveTemporaryBooster(iapState);
    expect(base * permanent * temporary).toBe(10000); // 1000 × 2 × 5
  });
});

// ─── BOOSTER_CONFIG values ───────────────────────────────────────────────────

describe('BOOSTER_CONFIG constants', () => {
  it('BOOSTER_2X has correct multiplier and duration', () => {
    expect(BOOSTER_CONFIG.BOOSTER_2X.multiplier).toBe(2.0);
    expect(BOOSTER_CONFIG.BOOSTER_2X.durationMs).toBe(4 * 60 * 60 * 1000);
  });

  it('BOOSTER_5X has correct multiplier and duration', () => {
    expect(BOOSTER_CONFIG.BOOSTER_5X.multiplier).toBe(5.0);
    expect(BOOSTER_CONFIG.BOOSTER_5X.durationMs).toBe(24 * 60 * 60 * 1000);
  });

  it('PERMANENT_MULTIPLIER has correct multiplier', () => {
    expect(BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier).toBe(2.0);
  });
});

// ─── Starter Pack rewards ────────────────────────────────────────────────────

describe('Starter Packs - Rewards', () => {
  it('Small pack grants correct resources', () => {
    expect(STARTER_PACK_REWARDS.small.cryptoCoins).toBe(6000);
    expect(STARTER_PACK_REWARDS.small.realMoney).toBe(75);
  });

  it('Medium pack grants correct resources', () => {
    expect(STARTER_PACK_REWARDS.medium.cryptoCoins).toBe(65000);
    expect(STARTER_PACK_REWARDS.medium.realMoney).toBe(4000);
  });

  it('Large pack grants correct resources', () => {
    expect(STARTER_PACK_REWARDS.large.cryptoCoins).toBe(125000);
    expect(STARTER_PACK_REWARDS.large.realMoney).toBe(25000);
  });

  it('Mega pack grants correct resources', () => {
    expect(STARTER_PACK_REWARDS.mega.cryptoCoins).toBe(400000);
    expect(STARTER_PACK_REWARDS.mega.realMoney).toBe(100000);
  });

  it('Mega pack has more resources than all others combined', () => {
    const othersTotal =
      STARTER_PACK_REWARDS.small.cryptoCoins +
      STARTER_PACK_REWARDS.medium.cryptoCoins +
      STARTER_PACK_REWARDS.large.cryptoCoins;
    expect(STARTER_PACK_REWARDS.mega.cryptoCoins).toBeGreaterThan(othersTotal);
  });
});
