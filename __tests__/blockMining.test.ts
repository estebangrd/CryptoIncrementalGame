/**
 * Unit tests for calculateTotalHashRate.
 * Verifies that hash rate reflects all the same multipliers as calculateTotalProduction.
 * Based on spec: specs/game-mechanics/block-mining-system.md
 */

import { calculateTotalHashRate, calculateTotalProduction, calculateHardwareProduction, calculateHardwareMiningSpeed, calculateHardwareElectricityCost } from '../src/utils/gameLogic';
import { BOOSTER_CONFIG } from '../src/config/balanceConfig';

// Minimal game state factory for hash rate tests
const makeState = (overrides: any = {}): any => ({
  hardware: [],
  upgrades: [],
  prestigeMultiplier: 1,
  prestigeProductionMultiplier: undefined,
  adBoost: { isActive: false, expiresAt: null },
  iapState: {
    permanentMultiplierPurchased: false,
    booster2x: { isActive: false, expiresAt: null },
    booster5x: { isActive: false, expiresAt: null },
  },
  ai: { level: 0 },
  energy: { totalGeneratedMW: 0, totalRequiredMW: 0 },
  ...overrides,
});

const CPU = { id: 'basic_cpu', baseProduction: 10, owned: 5, energyRequired: 0 };
// baseHashRate = baseProduction = 10 H/s per unit → 50 H/s for 5 units

describe('calculateTotalHashRate', () => {
  describe('base calculation', () => {
    it('returns 0 when no hardware is owned', () => {
      const state = makeState({ hardware: [{ ...CPU, owned: 0 }] });
      expect(calculateTotalHashRate(state)).toBe(0);
    });

    it('sums baseProduction * owned for each hardware', () => {
      const state = makeState({ hardware: [CPU] });
      // 10 * 5 = 50
      expect(calculateTotalHashRate(state)).toBe(50);
    });

    it('sums across multiple hardware types', () => {
      const gpu = { id: 'basic_gpu', baseProduction: 20, owned: 3, energyRequired: 0 };
      const state = makeState({ hardware: [CPU, gpu] });
      // cpu: 10*5=50, gpu: 20*3=60 → 110
      expect(calculateTotalHashRate(state)).toBe(110);
    });
  });

  describe('upgrade multipliers', () => {
    it('applies upgrade multiplier for matching hardware id', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'basic_cpu', value: 2 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      // 50 * 2 = 100
      expect(calculateTotalHashRate(state)).toBe(100);
    });

    it('applies category upgrade for cpu hardware', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'cpu', value: 3 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      // 50 * 3 = 150
      expect(calculateTotalHashRate(state)).toBe(150);
    });

    it('applies category upgrade for gpu hardware', () => {
      const gpu = { id: 'basic_gpu', baseProduction: 20, owned: 2, energyRequired: 0 };
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'gpu', value: 4 },
      };
      const state = makeState({ hardware: [gpu], upgrades: [upgrade] });
      // 20*2*4 = 160
      expect(calculateTotalHashRate(state)).toBe(160);
    });

    it('ignores unpurchased upgrades', () => {
      const upgrade = {
        purchased: false,
        effect: { type: 'production', target: 'basic_cpu', value: 2 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      expect(calculateTotalHashRate(state)).toBe(50);
    });

    it('ignores non-production upgrade types', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'clickPower', target: 'basic_cpu', value: 5 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      expect(calculateTotalHashRate(state)).toBe(50);
    });

    it('stacks multiple upgrade multipliers multiplicatively', () => {
      const upgrades = [
        { purchased: true, effect: { type: 'production', target: 'basic_cpu', value: 2 } },
        { purchased: true, effect: { type: 'production', target: 'cpu', value: 3 } },
      ];
      const state = makeState({ hardware: [CPU], upgrades });
      // 50 * 2 * 3 = 300
      expect(calculateTotalHashRate(state)).toBe(300);
    });
  });

  describe('prestige multiplier', () => {
    it('applies prestigeProductionMultiplier when present', () => {
      const state = makeState({ hardware: [CPU], prestigeProductionMultiplier: 2 });
      expect(calculateTotalHashRate(state)).toBe(100); // 50 * 2
    });

    it('falls back to prestigeMultiplier when prestigeProductionMultiplier is undefined', () => {
      const state = makeState({
        hardware: [CPU],
        prestigeMultiplier: 3,
        prestigeProductionMultiplier: undefined,
      });
      expect(calculateTotalHashRate(state)).toBe(150); // 50 * 3
    });

    it('defaults to 1x when both prestige fields are absent', () => {
      const state = makeState({ hardware: [CPU] });
      expect(calculateTotalHashRate(state)).toBe(50);
    });
  });

  describe('IAP multipliers', () => {
    it('applies permanent IAP multiplier when purchased', () => {
      const state = makeState({
        hardware: [CPU],
        iapState: {
          permanentMultiplierPurchased: true,
          booster2x: { isActive: false, expiresAt: null },
          booster5x: { isActive: false, expiresAt: null },
        },
      });
      expect(calculateTotalHashRate(state)).toBe(50 * BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier);
    });

    it('applies active 2x booster', () => {
      const futureExpiry = Date.now() + 60 * 60 * 1000;
      const state = makeState({
        hardware: [CPU],
        iapState: {
          permanentMultiplierPurchased: false,
          booster2x: { isActive: true, expiresAt: futureExpiry },
          booster5x: { isActive: false, expiresAt: null },
        },
      });
      expect(calculateTotalHashRate(state)).toBe(50 * BOOSTER_CONFIG.BOOSTER_2X.multiplier);
    });

    it('applies active 5x booster', () => {
      const futureExpiry = Date.now() + 60 * 60 * 1000;
      const state = makeState({
        hardware: [CPU],
        iapState: {
          permanentMultiplierPurchased: false,
          booster2x: { isActive: false, expiresAt: null },
          booster5x: { isActive: true, expiresAt: futureExpiry },
        },
      });
      expect(calculateTotalHashRate(state)).toBe(50 * BOOSTER_CONFIG.BOOSTER_5X.multiplier);
    });

    it('5x booster takes priority over 2x when both active', () => {
      const futureExpiry = Date.now() + 60 * 60 * 1000;
      const state = makeState({
        hardware: [CPU],
        iapState: {
          permanentMultiplierPurchased: false,
          booster2x: { isActive: true, expiresAt: futureExpiry },
          booster5x: { isActive: true, expiresAt: futureExpiry },
        },
      });
      expect(calculateTotalHashRate(state)).toBe(50 * BOOSTER_CONFIG.BOOSTER_5X.multiplier);
    });

    it('ignores expired booster', () => {
      const pastExpiry = Date.now() - 1000;
      const state = makeState({
        hardware: [CPU],
        iapState: {
          permanentMultiplierPurchased: false,
          booster2x: { isActive: true, expiresAt: pastExpiry },
          booster5x: { isActive: false, expiresAt: null },
        },
      });
      expect(calculateTotalHashRate(state)).toBe(50);
    });
  });

  describe('combined multipliers', () => {
    it('stacks upgrade + prestige + IAP permanent multiplicatively', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'basic_cpu', value: 2 },
      };
      const state = makeState({
        hardware: [CPU],
        upgrades: [upgrade],
        prestigeProductionMultiplier: 3,
        iapState: {
          permanentMultiplierPurchased: true,
          booster2x: { isActive: false, expiresAt: null },
          booster5x: { isActive: false, expiresAt: null },
        },
      });
      // 50 * 2 (upgrade) * 3 (prestige) * 2 (IAP permanent) = 600
      expect(calculateTotalHashRate(state)).toBe(
        50 * 2 * 3 * BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier
      );
    });

    it('is consistent with production: same multipliers applied to both', () => {
      // If calculateTotalHashRate returns X without multipliers and Y with,
      // the ratio Y/X must equal the combined global multiplier
      const base = makeState({ hardware: [CPU] });
      const withPrestige = makeState({ hardware: [CPU], prestigeProductionMultiplier: 4 });

      const baseRate = calculateTotalHashRate(base);
      const boostedRate = calculateTotalHashRate(withPrestige);

      expect(boostedRate / baseRate).toBe(4);
    });
  });
});

// Minimal production state factory (mirrors makeState but with production fields)
const makeProductionState = (overrides: any = {}): any => ({
  hardware: [],
  upgrades: [],
  energy: { totalGeneratedMW: 0, totalRequiredMW: 0, sources: {} },
  prestigeProductionMultiplier: 1,
  prestigeMultiplier: 1,
  adBoost: { isActive: false, expiresAt: null },
  iapState: {
    permanentMultiplierPurchased: false,
    booster2x: { isActive: false, expiresAt: null },
    booster5x: { isActive: false, expiresAt: null },
  },
  ai: { level: 0 },
  ...overrides,
});

const MANUAL_MINING = {
  id: 'manual_mining',
  baseProduction: 10,
  miningSpeed: 0.1,
  blockReward: 0,
  owned: 1,
  energyRequired: 0,
};

/**
 * Hardware card display value consistency.
 * Stats (HASH RATE, MINE SPEED, COINS/SEC, POWER) must show 0 when owned=0.
 * blockReward is now global (not per-hardware), so reward column was removed.
 */
describe('hardware card stat display values for 0-owned hardware', () => {
  const ADV_CPU = { id: 'advanced_cpu', baseProduction: 30, miningSpeed: 0.8, blockReward: 0, electricityCost: 1.2, owned: 0 };

  it('hashRate is 0 when owned=0', () => {
    expect(calculateHardwareProduction(ADV_CPU, [])).toBe(0);
  });

  it('miningSpeed is 0 when owned=0', () => {
    expect(calculateHardwareMiningSpeed(ADV_CPU, [])).toBe(0);
  });

  it('electricityCost is 0 when owned=0', () => {
    expect(calculateHardwareElectricityCost(ADV_CPU)).toBe(0);
  });

  it('coinsPerSecond is 0 when owned=0 (global formula)', () => {
    const speed = calculateHardwareMiningSpeed(ADV_CPU, []);
    // Global formula: CC/s = (miningSpeed / difficulty) × globalReward
    // With speed=0, result is always 0 regardless of global reward
    expect(speed).toBe(0);
  });
});

/**
 * Regression tests for bug: after prestige, manual_mining.owned=1 causes
 * non-zero hash rate and net income to be displayed even before the player
 * buys any hardware. manual_mining must be excluded from auto-production calcs.
 */
describe('manual_mining exclusion from auto-production stats', () => {
  describe('calculateTotalHashRate', () => {
    it('returns 0 when only manual_mining is owned (post-prestige state)', () => {
      const state = makeState({ hardware: [MANUAL_MINING] });
      expect(calculateTotalHashRate(state)).toBe(0);
    });

    it('still counts real hardware alongside manual_mining', () => {
      const state = makeState({ hardware: [MANUAL_MINING, CPU] });
      // Only CPU contributes: 10 * 5 = 50
      expect(calculateTotalHashRate(state)).toBe(50);
    });

    it('prestige multiplier does not inflate hash rate from manual_mining alone', () => {
      const state = makeState({ hardware: [MANUAL_MINING], prestigeProductionMultiplier: 3 });
      expect(calculateTotalHashRate(state)).toBe(0);
    });
  });

  describe('calculateTotalProduction', () => {
    it('returns 0 when only manual_mining is owned (post-prestige state)', () => {
      const state = makeProductionState({ hardware: [MANUAL_MINING] });
      expect(calculateTotalProduction(state)).toBe(0);
    });

    it('still counts real hardware alongside manual_mining', () => {
      // Bitcoin-faithful: CC/s = (miningSpeed / difficulty) × globalBlockReward
      // At blocksMined=0: reward=50, difficulty based on miningSpeed=1
      // difficulty ≈ 1.0 + 0.25*(1/100)^0.65 ≈ 1.0012
      // CC/s ≈ (1 / 1.0012) × 50 ≈ 49.94
      const cpu = { id: 'basic_cpu', baseProduction: 10, miningSpeed: 1, blockReward: 0, owned: 1, energyRequired: 0 };
      const state = makeProductionState({ hardware: [MANUAL_MINING, cpu], blocksMined: 0 });
      const prod = calculateTotalProduction(state);
      expect(prod).toBeGreaterThan(49);
      expect(prod).toBeLessThanOrEqual(50);
    });

    it('prestige multiplier does not inflate production from manual_mining alone', () => {
      const state = makeProductionState({ hardware: [MANUAL_MINING], prestigeProductionMultiplier: 3 });
      expect(calculateTotalProduction(state)).toBe(0);
    });
  });
});
