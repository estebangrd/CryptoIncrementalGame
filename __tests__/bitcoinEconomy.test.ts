/**
 * Tests for Bitcoin-faithful economy redesign.
 * Validates difficulty scaling (hash-rate-based), era system, base pricing, and global block reward.
 */

import { calculateDifficulty, getEra, getBasePrice, calculateCurrentReward, GENESIS_CONSTANTS } from '../src/utils/blockLogic';
import { calculateTotalProduction, getAllMultipliers, updateOfflineProgress } from '../src/utils/gameLogic';
import { BLOCK_CONFIG } from '../src/config/balanceConfig';

// ── Difficulty (hash-rate-based) ─────────────────────────────────────────────

describe('calculateDifficulty (hash-rate-based power curve)', () => {
  it('returns 1.0 at 0 mining speed', () => {
    expect(calculateDifficulty(0)).toBe(1.0);
  });

  it('returns ~1.003 at mining speed 0.3 (1 basic_cpu)', () => {
    const d = calculateDifficulty(0.3);
    expect(d).toBeGreaterThan(1.0);
    expect(d).toBeLessThan(1.01);
  });

  it('returns moderate difficulty at mining speed 100', () => {
    // 1.0 + 0.35 * (100/80)^0.70 ≈ 1.41
    const d = calculateDifficulty(100);
    expect(d).toBeCloseTo(1.41, 1);
  });

  it('returns high difficulty at mining speed 1,000,000', () => {
    // 1.0 + 0.25 * (1000000/100)^0.65
    const d = calculateDifficulty(1_000_000);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(500);
  });

  it('is monotonically increasing', () => {
    let prev = calculateDifficulty(0);
    const checkpoints = [0.1, 1, 10, 100, 1000, 10_000, 100_000, 1_000_000, 21_000_000];
    for (const speed of checkpoints) {
      const d = calculateDifficulty(speed);
      expect(d).toBeGreaterThan(prev);
      prev = d;
    }
  });

  it('sublinear scaling: 10x speed does NOT produce 10x difficulty', () => {
    const d1 = calculateDifficulty(100);
    const d10 = calculateDifficulty(1000);
    // With exponent 0.65, ratio should be much less than 10
    expect(d10 / d1).toBeLessThan(5);
    expect(d10 / d1).toBeGreaterThan(1);
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
  it('returns $0.05 at era 0', () => {
    expect(getBasePrice(0)).toBe(0.05);
  });

  it('returns $0.18 at era 1', () => {
    expect(getBasePrice(210_000)).toBe(0.18);
  });

  it('returns $0.55 at era 2', () => {
    expect(getBasePrice(420_000)).toBe(0.55);
  });

  it('returns $1.40 at era 3', () => {
    expect(getBasePrice(630_000)).toBe(1.40);
  });

  it('returns $3.50 at era 4', () => {
    expect(getBasePrice(840_000)).toBe(3.50);
  });

  it('returns $8.00 at era 5', () => {
    expect(getBasePrice(1_050_000)).toBe(8.00);
  });

  it('caps at last price for eras beyond the price array', () => {
    expect(getBasePrice(4_200_000)).toBe(4000000.00);
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

  it('caps halvings at ERA_BASE_PRICES.length - 1 so reward never underflows', () => {
    const maxEra = BLOCK_CONFIG.ERA_BASE_PRICES.length - 1; // 19
    const rewardAtLastEra = calculateCurrentReward(maxEra * 210_000);
    // Beyond the last designed era, reward should NOT keep halving
    const rewardFarBeyond = calculateCurrentReward(9_000_000); // era 42
    expect(rewardFarBeyond).toBe(rewardAtLastEra);
    expect(rewardFarBeyond).toBeGreaterThan(1e-10); // must be meaningful, not underflowed
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
    // At blocksMined=0: reward=50
    // basic_cpu with miningSpeed=0.3: difficulty ≈ 1.003
    // CC/s ≈ (0.3 / 1.003) × 50 ≈ 14.96
    const cpu = { id: 'basic_cpu', miningSpeed: 0.3, baseProduction: 30, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({ hardware: [cpu], blocksMined: 0 });
    const prod = calculateTotalProduction(state);
    expect(prod).toBeGreaterThan(14);
    expect(prod).toBeLessThan(16);
  });

  it('halving reduces production at higher block counts', () => {
    const cpu = { id: 'basic_cpu', miningSpeed: 0.3, baseProduction: 30, blockReward: 0, owned: 1, energyRequired: 0 };
    const stateEarly = makeState({ hardware: [cpu], blocksMined: 0 });
    const stateLate = makeState({ hardware: [cpu], blocksMined: 210_000 });
    const prodEarly = calculateTotalProduction(stateEarly);
    const prodLate = calculateTotalProduction(stateLate);
    // Late: reward halved (25) → less production
    expect(prodLate).toBeLessThan(prodEarly);
  });

  it('buying hardware always increases production', () => {
    const cpu1 = { id: 'basic_cpu', miningSpeed: 0.3, baseProduction: 30, blockReward: 0, owned: 1, energyRequired: 0 };
    const cpu5 = { ...cpu1, owned: 5 };
    const state1 = makeState({ hardware: [cpu1], blocksMined: 100_000 });
    const state5 = makeState({ hardware: [cpu5], blocksMined: 100_000 });
    expect(calculateTotalProduction(state5)).toBeGreaterThan(calculateTotalProduction(state1));
  });

  it('hardware blockReward=0 does not affect production (uses global reward)', () => {
    const cpu = { id: 'basic_cpu', miningSpeed: 1, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({ hardware: [cpu], blocksMined: 0 });
    // CC/s = (1 / difficulty) × 50, difficulty ≈ 1.25 for speed=1
    // CC/s ≈ 50 / 1.25 = 40 (approx)
    const prod = calculateTotalProduction(state);
    expect(prod).toBeGreaterThan(30);
    expect(prod).toBeLessThan(50);
  });
});

// ── Hardware Costs ───────────────────────────────────────────────────────────

describe('hardware costs are in $ (real money)', () => {
  it('basic_cpu baseCost is $25', () => {
    expect(BLOCK_CONFIG.ERA_BASE_PRICES[0]).toBe(0.05); // sanity check era 0 price
    const { baseCost } = require('../src/config/balanceConfig').HARDWARE_CONFIG.levels.basic_cpu;
    expect(baseCost).toBe(25);
  });

  it('all hardware blockReward is 0', () => {
    const { HARDWARE_CONFIG } = require('../src/config/balanceConfig');
    for (const [_id, config] of Object.entries(HARDWARE_CONFIG.levels) as [string, any][]) {
      expect(config.blockReward).toBe(0);
    }
  });
});

// ── Booster-on-hashrate (unified model) ─────────────────────────────────────

describe('boosters multiply mining speed (not CC output)', () => {
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

  const cpu = { id: 'basic_cpu', miningSpeed: 1, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };

  it('2x booster doubles CC/sec (via doubled mining speed)', () => {
    const futureExpiry = Date.now() + 60 * 60 * 1000;
    const base = makeState({ hardware: [cpu] });
    const boosted = makeState({
      hardware: [cpu],
      iapState: {
        permanentMultiplierPurchased: false,
        booster2x: { isActive: true, expiresAt: futureExpiry },
        booster5x: { isActive: false, expiresAt: null },
      },
    });
    const baseProd = calculateTotalProduction(base);
    const boostedProd = calculateTotalProduction(boosted);
    // With hash-rate-based difficulty, boosted speed has same difficulty (pre-multiplier)
    // so ratio should be exactly 2.0
    expect(boostedProd / baseProd).toBeCloseTo(2.0, 5);
  });

  it('prestige × permanent stack multiplicatively on mining speed', () => {
    const base = makeState({ hardware: [cpu] });
    const stacked = makeState({
      hardware: [cpu],
      prestigeProductionMultiplier: 3,
      iapState: {
        permanentMultiplierPurchased: true,
        booster2x: { isActive: false, expiresAt: null },
        booster5x: { isActive: false, expiresAt: null },
      },
    });
    const baseProd = calculateTotalProduction(base);
    const stackedProd = calculateTotalProduction(stacked);
    // 3 (prestige) × 2 (permanent) = 6x (multipliers bypass difficulty)
    expect(stackedProd / baseProd).toBeCloseTo(6.0, 5);
  });

  it('getAllMultipliers returns combined multiplier value', () => {
    const futureExpiry = Date.now() + 60 * 60 * 1000;
    const state = makeState({
      prestigeProductionMultiplier: 2,
      iapState: {
        permanentMultiplierPurchased: true,
        booster2x: { isActive: true, expiresAt: futureExpiry },
        booster5x: { isActive: false, expiresAt: null },
      },
    });
    // 2 (prestige) × 2 (permanent) × 2 (booster2x) = 8
    expect(getAllMultipliers(state)).toBeCloseTo(8.0, 5);
  });
});

// ── Offline Miner (block-based) ────────────────────────────────────────────

describe('updateOfflineProgress (block-based)', () => {
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
      offlineMiner: { isActive: false, activatedAt: null, expiresAt: null },
    },
    ai: { level: 0 },
    blocksMined: 0,
    cryptoCoins: 0,
    totalCryptoCoins: 0,
    realMoney: 10000,
    totalElectricityCost: 0,
    cryptoCoinsPerSecond: 0,
    lastSaveTime: Date.now(),
    ...overrides,
  });

  it('does nothing when offline miner is inactive', () => {
    const state = makeState();
    const result = updateOfflineProgress(state);
    expect(result.cryptoCoins).toBe(0);
    expect(result.blocksMined).toBe(0);
  });

  it('mines blocks and earns CC when offline miner is active', () => {
    const now = Date.now();
    const cpu = { id: 'basic_cpu', miningSpeed: 10, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({
      hardware: [cpu],
      lastSaveTime: now - 3600 * 1000, // 1 hour ago
      iapState: {
        permanentMultiplierPurchased: false,
        booster2x: { isActive: false, expiresAt: null },
        booster5x: { isActive: false, expiresAt: null },
        offlineMiner: { isActive: true, activatedAt: now - 7200 * 1000, expiresAt: now + 3600 * 1000 },
      },
    });
    const result = updateOfflineProgress(state);
    expect(result.blocksMined).toBeGreaterThan(0);
    expect(result.cryptoCoins).toBeGreaterThan(0);
    expect(result.totalCryptoCoins).toBeGreaterThan(0);
  });

  it('advances blocksMined counter (processes halvings)', () => {
    const now = Date.now();
    const cpu = { id: 'basic_cpu', miningSpeed: 100, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({
      hardware: [cpu],
      blocksMined: 209_990,
      lastSaveTime: now - 3600 * 1000,
      iapState: {
        permanentMultiplierPurchased: false,
        booster2x: { isActive: false, expiresAt: null },
        booster5x: { isActive: false, expiresAt: null },
        offlineMiner: { isActive: true, activatedAt: now - 7200 * 1000, expiresAt: now + 3600 * 1000 },
      },
    });
    const result = updateOfflineProgress(state);
    // Should have crossed the halving boundary
    expect(result.blocksMined).toBeGreaterThan(210_000);
    // Reward should be halved after crossing
    expect(result.currentReward).toBe(25);
  });

  it('does not drain realMoney for electricity (CC fee only)', () => {
    const now = Date.now();
    const cpu = { id: 'basic_cpu', miningSpeed: 10, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({
      hardware: [cpu],
      cryptoCoins: 50000,
      realMoney: 10000,
      totalElectricityCost: 100,
      lastSaveTime: now - 3600 * 1000,
      iapState: {
        permanentMultiplierPurchased: false,
        booster2x: { isActive: false, expiresAt: null },
        booster5x: { isActive: false, expiresAt: null },
        offlineMiner: { isActive: true, activatedAt: now - 7200 * 1000, expiresAt: now + 3600 * 1000 },
      },
    });
    const result = updateOfflineProgress(state);
    // realMoney should NOT be drained
    expect(result.realMoney).toBe(10000);
    // CC should increase (offline miner active)
    expect(result.cryptoCoins).toBeGreaterThanOrEqual(50000);
  });

  it('does not exceed TOTAL_BLOCKS cap', () => {
    const now = Date.now();
    const cpu = { id: 'basic_cpu', miningSpeed: 1000, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({
      hardware: [cpu],
      blocksMined: GENESIS_CONSTANTS.TOTAL_BLOCKS - 10,
      lastSaveTime: now - 3600 * 1000,
      iapState: {
        permanentMultiplierPurchased: false,
        booster2x: { isActive: false, expiresAt: null },
        booster5x: { isActive: false, expiresAt: null },
        offlineMiner: { isActive: true, activatedAt: now - 7200 * 1000, expiresAt: now + 3600 * 1000 },
      },
    });
    const result = updateOfflineProgress(state);
    expect(result.blocksMined).toBeLessThanOrEqual(GENESIS_CONSTANTS.TOTAL_BLOCKS);
  });
});

// ── Free Offline Earnings (ad-gated) — genesis tracking ─────────────────────

describe('free offline earnings must update genesis stats', () => {
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
      offlineMiner: { isActive: false, activatedAt: null, expiresAt: null },
    },
    ai: { level: 0 },
    blocksMined: 0,
    cryptoCoins: 0,
    totalCryptoCoins: 0,
    realMoney: 10000,
    totalElectricityCost: 0,
    cryptoCoinsPerSecond: 0,
    lastSaveTime: Date.now(),
    pendingOfflineEarnings: 0,
    offlineSecondsAway: 0,
    offlineWasCapped: false,
    offlineBlocksProcessed: 0,
    ...overrides,
  });

  it('updateOfflineProgress stores pending coins and blocks for free path', () => {
    const now = Date.now();
    const cpu = { id: 'basic_cpu', miningSpeed: 10, baseProduction: 10, blockReward: 0, owned: 1, energyRequired: 0 };
    const state = makeState({
      hardware: [cpu],
      lastSaveTime: now - 600 * 1000, // 10 min ago (above MIN_OFFLINE_SECONDS)
    });
    const result = updateOfflineProgress(state);
    expect(result.pendingOfflineEarnings).toBeGreaterThan(0);
    expect(result.offlineBlocksProcessed).toBeGreaterThan(0);
    // blocksMined should NOT change yet (pending claim)
    expect(result.blocksMined).toBe(0);
  });

  it('claimOfflineEarnings updates blocksMined alongside coins', () => {
    const { claimOfflineEarnings } = require('../src/utils/gameLogic');
    const state = makeState({
      blocksMined: 1000,
      cryptoCoins: 500,
      totalCryptoCoins: 500,
      pendingOfflineEarnings: 50000,
      offlineBlocksProcessed: 1000,
    });
    const result = claimOfflineEarnings(state, 50000);
    // Coins must be credited
    expect(result.cryptoCoins).toBe(500 + 50000);
    expect(result.totalCryptoCoins).toBe(500 + 50000);
    // blocksMined MUST advance by offlineBlocksProcessed
    expect(result.blocksMined).toBe(2000);
    // Genesis state must be updated
    expect(result.currentReward).toBeDefined();
    expect(result.difficulty).toBeDefined();
    expect(result.nextHalving).toBeDefined();
    // Pending state must be cleared
    expect(result.pendingOfflineEarnings).toBe(0);
    expect(result.offlineBlocksProcessed).toBe(0);
  });

  it('claimOfflineEarnings respects halving boundary', () => {
    const { claimOfflineEarnings } = require('../src/utils/gameLogic');
    const state = makeState({
      blocksMined: 209_500,
      cryptoCoins: 0,
      totalCryptoCoins: 0,
      pendingOfflineEarnings: 100000,
      offlineBlocksProcessed: 1000,
    });
    const result = claimOfflineEarnings(state, 100000);
    expect(result.blocksMined).toBe(210_500);
    // After crossing 210,000 boundary, reward should be 25
    expect(result.currentReward).toBe(25);
    expect(result.nextHalving).toBe(420_000);
  });

  it('claimOfflineEarnings does not exceed TOTAL_BLOCKS cap', () => {
    const { claimOfflineEarnings } = require('../src/utils/gameLogic');
    const state = makeState({
      blocksMined: GENESIS_CONSTANTS.TOTAL_BLOCKS - 5,
      cryptoCoins: 0,
      totalCryptoCoins: 0,
      pendingOfflineEarnings: 10000,
      offlineBlocksProcessed: 100,
    });
    const result = claimOfflineEarnings(state, 10000);
    expect(result.blocksMined).toBeLessThanOrEqual(GENESIS_CONSTANTS.TOTAL_BLOCKS);
  });
});

// ── creditCryptoCoins — generic CC-to-blocks for packs & achievements ───────

describe('creditCryptoCoins advances blocksMined for any CC reward', () => {
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
      offlineMiner: { isActive: false, activatedAt: null, expiresAt: null },
    },
    ai: { level: 0 },
    blocksMined: 0,
    cryptoCoins: 0,
    totalCryptoCoins: 0,
    ...overrides,
  });

  it('credits CC and advances blocksMined proportionally', () => {
    const { creditCryptoCoins } = require('../src/utils/gameLogic');
    // At blocksMined=0, reward=50 CC/block. 500 CC = 10 blocks.
    const state = makeState({ blocksMined: 0, cryptoCoins: 100, totalCryptoCoins: 100 });
    const result = creditCryptoCoins(state, 500);
    expect(result.cryptoCoins).toBe(600);
    expect(result.totalCryptoCoins).toBe(600);
    expect(result.blocksMined).toBe(10); // 500 / 50 = 10 blocks
    expect(result.currentReward).toBe(50);
    expect(result.nextHalving).toBe(210_000);
  });

  it('handles halving boundary correctly', () => {
    const { creditCryptoCoins } = require('../src/utils/gameLogic');
    // 5 blocks before halving at 50 CC/block, then next blocks at 25 CC/block.
    // 5 blocks × 50 = 250 CC, remaining 250 CC / 25 = 10 blocks → 15 total blocks
    const state = makeState({ blocksMined: 209_995 });
    const result = creditCryptoCoins(state, 500);
    expect(result.blocksMined).toBe(209_995 + 15); // 5 at 50 CC + 10 at 25 CC
    expect(result.currentReward).toBe(25);
  });

  it('caps at TOTAL_BLOCKS', () => {
    const { creditCryptoCoins } = require('../src/utils/gameLogic');
    const state = makeState({ blocksMined: GENESIS_CONSTANTS.TOTAL_BLOCKS - 2 });
    const result = creditCryptoCoins(state, 1_000_000);
    expect(result.blocksMined).toBeLessThanOrEqual(GENESIS_CONSTANTS.TOTAL_BLOCKS);
    // CC is still fully credited even if blocks are capped
    expect(result.cryptoCoins).toBe(1_000_000);
  });

  it('updates difficulty and nextHalving', () => {
    const { creditCryptoCoins } = require('../src/utils/gameLogic');
    const state = makeState({ blocksMined: 0 });
    const result = creditCryptoCoins(state, 10000);
    expect(result.difficulty).toBeDefined();
    expect(result.nextHalving).toBeDefined();
    expect(result.currentReward).toBeDefined();
    expect(result.blocksMined).toBe(200); // 10000 / 50 = 200
  });
});
