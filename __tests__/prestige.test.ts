/**
 * Unit tests for Prestige System.
 * Based on spec: specs/game-mechanics/prestige-system.md
 */

import { calculateProductionMultiplier, calculateClickMultiplier, canPrestige, checkBadgeUnlocks } from '../src/utils/prestigeLogic';
import { PRESTIGE_CONFIG } from '../src/config/balanceConfig';

describe('calculateProductionMultiplier', () => {
  it('returns 1.0 for level 0', () => {
    expect(calculateProductionMultiplier(0)).toBe(1.0);
  });

  it('returns 1.1 for level 1', () => {
    expect(calculateProductionMultiplier(1)).toBeCloseTo(1.1, 5);
  });

  it('returns 1.5 for level 5', () => {
    expect(calculateProductionMultiplier(5)).toBeCloseTo(1.5, 5);
  });

  it('returns 2.0 for level 10', () => {
    expect(calculateProductionMultiplier(10)).toBeCloseTo(2.0, 5);
  });

  it('returns 3.0 for level 20', () => {
    expect(calculateProductionMultiplier(20)).toBeCloseTo(3.0, 5);
  });
});

describe('calculateClickMultiplier', () => {
  it('returns 1.0 for level 0', () => {
    expect(calculateClickMultiplier(0)).toBe(1.0);
  });

  it('returns 1.05 for level 1', () => {
    expect(calculateClickMultiplier(1)).toBeCloseTo(1.05, 5);
  });

  it('returns 1.5 for level 10', () => {
    expect(calculateClickMultiplier(10)).toBeCloseTo(1.5, 5);
  });
});

describe('canPrestige', () => {
  it('returns true when blocksMined equals totalBlocks (21M)', () => {
    const state = { blocksMined: 21000000 } as any;
    expect(canPrestige(state)).toBe(true);
  });

  it('returns true when blocksMined exceeds 21M', () => {
    const state = { blocksMined: 21000001 } as any;
    expect(canPrestige(state)).toBe(true);
  });

  it('returns false when less than 21M blocks mined', () => {
    const state = { blocksMined: 1000000 } as any;
    expect(canPrestige(state)).toBe(false);
  });

  it('returns false when blocksMined is 0', () => {
    const state = { blocksMined: 0 } as any;
    expect(canPrestige(state)).toBe(false);
  });
});

describe('PRESTIGE_CONFIG', () => {
  it('requires exactly 21M blocks', () => {
    expect(PRESTIGE_CONFIG.requirements.minBlocks).toBe(21000000);
  });

  it('has correct production bonus', () => {
    expect(PRESTIGE_CONFIG.bonuses.productionBonus).toBe(0.1);
  });

  it('has correct click bonus', () => {
    expect(PRESTIGE_CONFIG.bonuses.clickBonus).toBe(0.05);
  });

  it('has correct confirmation text', () => {
    expect(PRESTIGE_CONFIG.confirmationText).toBe('PRESTIGE');
  });
});

describe('checkBadgeUnlocks', () => {
  it('unlocks first_prestige at level 1', () => {
    const state = {
      prestigeLevel: 1,
      unlockedBadges: [],
      prestigeHistory: [],
      totalRealMoneyEarned: 0,
    } as any;
    const badges = checkBadgeUnlocks(state);
    expect(badges).toContain('first_prestige');
  });

  it('unlocks first_prestige and prestige_master at level 10', () => {
    const state = {
      prestigeLevel: 10,
      unlockedBadges: [],
      prestigeHistory: [],
      totalRealMoneyEarned: 0,
    } as any;
    const badges = checkBadgeUnlocks(state);
    expect(badges).toContain('first_prestige');
    expect(badges).toContain('prestige_master');
  });

  it('does not duplicate already unlocked badges', () => {
    const state = {
      prestigeLevel: 10,
      unlockedBadges: ['first_prestige'],
      prestigeHistory: [],
      totalRealMoneyEarned: 0,
    } as any;
    const badges = checkBadgeUnlocks(state);
    expect(badges.filter((b: string) => b === 'first_prestige').length).toBe(1);
  });

  it('unlocks speed_runner for fast runs (under 2 hours)', () => {
    const state = {
      prestigeLevel: 1,
      unlockedBadges: [],
      prestigeHistory: [{ duration: 7000 }], // 1h 56m
      totalRealMoneyEarned: 0,
    } as any;
    const badges = checkBadgeUnlocks(state);
    expect(badges).toContain('speed_runner');
  });

  it('does not unlock speed_runner for slow runs', () => {
    const state = {
      prestigeLevel: 1,
      unlockedBadges: [],
      prestigeHistory: [{ duration: 9000 }], // 2h 30m
      totalRealMoneyEarned: 0,
    } as any;
    const badges = checkBadgeUnlocks(state);
    expect(badges).not.toContain('speed_runner');
  });
});
