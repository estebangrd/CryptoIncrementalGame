/**
 * Unit tests for calculateTotalHashRate.
 * Verifies that hash rate reflects all the same multipliers as calculateTotalProduction.
 * Based on spec: specs/game-mechanics/block-mining-system.md
 */

import { calculateTotalHashRate, calculateTotalProduction } from '../src/utils/gameLogic';
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
// baseHashRate = 10 * 10 = 100 H/s per unit → 500 H/s for 5 units

describe('calculateTotalHashRate', () => {
  describe('base calculation', () => {
    it('returns 0 when no hardware is owned', () => {
      const state = makeState({ hardware: [{ ...CPU, owned: 0 }] });
      expect(calculateTotalHashRate(state)).toBe(0);
    });

    it('sums baseProduction * 10 * owned for each hardware', () => {
      const state = makeState({ hardware: [CPU] });
      // 10 * 10 * 5 = 500
      expect(calculateTotalHashRate(state)).toBe(500);
    });

    it('sums across multiple hardware types', () => {
      const gpu = { id: 'basic_gpu', baseProduction: 20, owned: 3, energyRequired: 0 };
      const state = makeState({ hardware: [CPU, gpu] });
      // cpu: 10*10*5=500, gpu: 20*10*3=600 → 1100
      expect(calculateTotalHashRate(state)).toBe(1100);
    });
  });

  describe('upgrade multipliers', () => {
    it('applies upgrade multiplier for matching hardware id', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'basic_cpu', value: 2 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      // 500 * 2 = 1000
      expect(calculateTotalHashRate(state)).toBe(1000);
    });

    it('applies category upgrade for cpu hardware', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'cpu', value: 3 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      // 500 * 3 = 1500
      expect(calculateTotalHashRate(state)).toBe(1500);
    });

    it('applies category upgrade for gpu hardware', () => {
      const gpu = { id: 'basic_gpu', baseProduction: 20, owned: 2, energyRequired: 0 };
      const upgrade = {
        purchased: true,
        effect: { type: 'production', target: 'gpu', value: 4 },
      };
      const state = makeState({ hardware: [gpu], upgrades: [upgrade] });
      // 20*10*2*4 = 1600
      expect(calculateTotalHashRate(state)).toBe(1600);
    });

    it('ignores unpurchased upgrades', () => {
      const upgrade = {
        purchased: false,
        effect: { type: 'production', target: 'basic_cpu', value: 2 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      expect(calculateTotalHashRate(state)).toBe(500);
    });

    it('ignores non-production upgrade types', () => {
      const upgrade = {
        purchased: true,
        effect: { type: 'clickPower', target: 'basic_cpu', value: 5 },
      };
      const state = makeState({ hardware: [CPU], upgrades: [upgrade] });
      expect(calculateTotalHashRate(state)).toBe(500);
    });

    it('stacks multiple upgrade multipliers multiplicatively', () => {
      const upgrades = [
        { purchased: true, effect: { type: 'production', target: 'basic_cpu', value: 2 } },
        { purchased: true, effect: { type: 'production', target: 'cpu', value: 3 } },
      ];
      const state = makeState({ hardware: [CPU], upgrades });
      // 500 * 2 * 3 = 3000
      expect(calculateTotalHashRate(state)).toBe(3000);
    });
  });

  describe('prestige multiplier', () => {
    it('applies prestigeProductionMultiplier when present', () => {
      const state = makeState({ hardware: [CPU], prestigeProductionMultiplier: 2 });
      expect(calculateTotalHashRate(state)).toBe(1000); // 500 * 2
    });

    it('falls back to prestigeMultiplier when prestigeProductionMultiplier is undefined', () => {
      const state = makeState({
        hardware: [CPU],
        prestigeMultiplier: 3,
        prestigeProductionMultiplier: undefined,
      });
      expect(calculateTotalHashRate(state)).toBe(1500); // 500 * 3
    });

    it('defaults to 1x when both prestige fields are absent', () => {
      const state = makeState({ hardware: [CPU] });
      expect(calculateTotalHashRate(state)).toBe(500);
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
      expect(calculateTotalHashRate(state)).toBe(500 * BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier);
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
      expect(calculateTotalHashRate(state)).toBe(500 * BOOSTER_CONFIG.BOOSTER_2X.multiplier);
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
      expect(calculateTotalHashRate(state)).toBe(500 * BOOSTER_CONFIG.BOOSTER_5X.multiplier);
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
      expect(calculateTotalHashRate(state)).toBe(500 * BOOSTER_CONFIG.BOOSTER_5X.multiplier);
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
      expect(calculateTotalHashRate(state)).toBe(500);
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
      // 500 * 2 (upgrade) * 3 (prestige) * 2 (IAP permanent) = 6000
      expect(calculateTotalHashRate(state)).toBe(
        500 * 2 * 3 * BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier
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
  blockReward: 50,
  owned: 1,
  energyRequired: 0,
};

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
      // Only CPU contributes: 10 * 10 * 5 = 500
      expect(calculateTotalHashRate(state)).toBe(500);
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
      // basic_cpu: miningSpeed=1, blockReward=10 → 1*10=10 CC/s (no prestige)
      const cpu = { id: 'basic_cpu', baseProduction: 10, miningSpeed: 1, blockReward: 10, owned: 1, energyRequired: 0 };
      const state = makeProductionState({ hardware: [MANUAL_MINING, cpu] });
      expect(calculateTotalProduction(state)).toBe(10);
    });

    it('prestige multiplier does not inflate production from manual_mining alone', () => {
      const state = makeProductionState({ hardware: [MANUAL_MINING], prestigeProductionMultiplier: 3 });
      expect(calculateTotalProduction(state)).toBe(0);
    });
  });
});
