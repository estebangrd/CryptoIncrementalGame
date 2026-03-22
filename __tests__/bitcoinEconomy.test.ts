/**
 * Tests for Bitcoin-faithful economy redesign.
 * Validates difficulty scaling, era system, base pricing, and global block reward.
 */

import { calculateDifficulty, getEra, getBasePrice, calculateCurrentReward } from '../src/utils/blockLogic';
import { calculateTotalProduction, calculateTotalMiningSpeed } from '../src/utils/gameLogic';
import { BLOCK_CONFIG } from '../src/config/balanceConfig';

// ── Difficulty ───────────────────────────────────────────────────────────────

describe('calculateDifficulty (Bitcoin-faithful)', () => {
  it('returns 1.0 at 0 blocks mined', () => {
    expect(calculateDifficulty(0)).toBe(1.0);
  });

  it('returns ~1.09 at 50,000 blocks', () => {
    const d = calculateDifficulty(50_000);
    expect(d).toBeCloseTo(1.09, 1);
  });

  it('returns ~1.15 at 100,000 blocks', () => {
    const d = calculateDifficulty(100_000);
    expect(d).toBeCloseTo(1.15, 1);
  });

  it('returns ~1.25 at 210,000 blocks', () => {
    const d = calculateDifficulty(210_000);
    expect(d).toBeCloseTo(1.25, 1);
  });

  it('returns ~2.00 at 10,000,000 blocks', () => {
    const d = calculateDifficulty(10_000_000);
    expect(d).toBeCloseTo(2.00, 1);
  });

  it('returns ~2.16 at 21,000,000 blocks', () => {
    const d = calculateDifficulty(21_000_000);
    expect(d).toBeCloseTo(2.16, 1);
  });

  it('is monotonically increasing', () => {
    let prev = calculateDifficulty(0);
    const checkpoints = [1000, 10_000, 50_000, 100_000, 210_000, 500_000, 1_000_000, 10_000_000, 21_000_000];
    for (const blocks of checkpoints) {
      const d = calculateDifficulty(blocks);
      expect(d).toBeGreaterThan(prev);
      prev = d;
    }
  });
});

// ── Era ──────────────────────────────────────────────────────────────────────

describe('getEra', () => {
  it('era 0 at block 0', () => {
    expect(getEra(0)).toBe(0);
  });

  it('era 0 at block 209,999', () => {
    expect(getEra(209_999)).toBe(0);
  });

  it('era 1 at block 210,000', () => {
    expect(getEra(210_000)).toBe(1);
  });

  it('era 2 at block 420,000', () => {
    expect(getEra(420_000)).toBe(2);
  });

  it('era 4 at block 840,000', () => {
    expect(getEra(840_000)).toBe(4);
  });
});

// ── Base Price ───────────────────────────────────────────────────────────────

describe('getBasePrice', () => {
  it('returns $0.10 at era 0', () => {
    expect(getBasePrice(0)).toBe(0.10);
  });

  it('returns $2.00 at era 1', () => {
    expect(getBasePrice(210_000)).toBe(2.00);
  });

  it('returns $10.00 at era 2', () => {
    expect(getBasePrice(420_000)).toBe(10.00);
  });

  it('returns $40.00 at era 3', () => {
    expect(getBasePrice(630_000)).toBe(40.00);
  });

  it('returns $100.00 at era 4', () => {
    expect(getBasePrice(840_000)).toBe(100.00);
  });

  it('caps at $100.00 for eras beyond the price array', () => {
    expect(getBasePrice(2_100_000)).toBe(100.00);
  });
});

// ── Global Block Reward ──────────────────────────────────────────────────────

describe('calculateCurrentReward (global)', () => {
  it('returns 50 at block 0', () => {
    expect(calculateCurrentReward(0)).toBe(50);
  });

  it('returns 25 at block 210,000', () => {
    expect(calculateCurrentReward(210_000)).toBe(25);
  });

  it('returns 12.5 at block 420,000', () => {
    expect(calculateCurrentReward(420_000)).toBe(12.5);
  });

  it('returns 6.25 at block 630,000', () => {
    expect(calculateCurrentReward(630_000)).toBe(6.25);
  });
});

// ── Total CC Supply ──────────────────────────────────────────────────────────

describe('total CC supply across all eras', () => {
  it('total CC from eras 0-6 is approximately 20,835,937.5', () => {
    let totalCC = 0;
    let reward = 50;
    const halvingInterval = 210_000;
    for (let era = 0; era <= 6; era++) {
      totalCC += halvingInterval * reward;
      reward /= 2;
    }
    expect(totalCC).toBeCloseTo(20_835_937.5, 0);
  });
});

// ── Production Formula ───────────────────────────────────────────────────────

describe('calculateTotalProduction (Bitcoin-faithful)', () => {
  const makeState = (overrides: any = {}): any => ({
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
    blocksMined: 0,
    ...overrides,
  });

  it('returns 0 when no hardware is owned', () => {
    const state = makeState();
    expect(calculateTotalProduction(state)).toBe(0);
  });

  it('uses global formula: (miningSpeed / difficulty) × globalReward', () => {
    // At blocksMined=0: difficulty=1.0, reward=50
    // basic_cpu with miningSpeed=0.3: CC/s = (0.3 / 1.0) × 50 = 15
    const cpu = { id: 'basic_cpu', miningSpeed: 0.3, baseProduction: 30, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({ hardware: [cpu], blocksMined: 0 });
    expect(calculateTotalProduction(state)).toBeCloseTo(15, 1);
  });

  it('difficulty reduces production at higher block counts', () => {
    const cpu = { id: 'basic_cpu', miningSpeed: 0.3, baseProduction: 30, blockReward: 0, owned: 1, energyRequired: 0 };
    const stateEarly = makeState({ hardware: [cpu], blocksMined: 0 });
    const stateLate = makeState({ hardware: [cpu], blocksMined: 210_000 });
    const prodEarly = calculateTotalProduction(stateEarly);
    const prodLate = calculateTotalProduction(stateLate);
    // Late: reward halved (25) AND difficulty higher (~1.25) → much less production
    expect(prodLate).toBeLessThan(prodEarly);
  });

  it('buying hardware always increases production (difficulty does not change)', () => {
    const cpu1 = { id: 'basic_cpu', miningSpeed: 0.3, baseProduction: 30, blockReward: 0, owned: 1, energyRequired: 0 };
    const cpu5 = { ...cpu1, owned: 5 };
    const state1 = makeState({ hardware: [cpu1], blocksMined: 100_000 });
    const state5 = makeState({ hardware: [cpu5], blocksMined: 100_000 });
    expect(calculateTotalProduction(state5)).toBeGreaterThan(calculateTotalProduction(state1));
  });

  it('hardware blockReward=0 does not affect production (uses global reward)', () => {
    const cpu = { id: 'basic_cpu', miningSpeed: 1, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({ hardware: [cpu], blocksMined: 0 });
    // CC/s = (1 / 1.0) × 50 = 50 (uses global reward, ignores hardware.blockReward)
    expect(calculateTotalProduction(state)).toBe(50);
  });
});

// ── Hardware Costs ───────────────────────────────────────────────────────────

describe('hardware costs are in $ (real money)', () => {
  it('basic_cpu baseCost is $30', () => {
    expect(BLOCK_CONFIG.ERA_BASE_PRICES[0]).toBe(0.10); // sanity check era 0 price
    const { baseCost } = require('../src/config/balanceConfig').HARDWARE_CONFIG.levels.basic_cpu;
    expect(baseCost).toBe(30);
  });

  it('all hardware blockReward is 0', () => {
    const { HARDWARE_CONFIG } = require('../src/config/balanceConfig');
    for (const [_id, config] of Object.entries(HARDWARE_CONFIG.levels) as [string, any][]) {
      expect(config.blockReward).toBe(0);
    }
  });
});
