/**
 * Tests for production-scaled reward helper (Lucky Block, packs, achievements).
 * Validates that rewards scale with $/s (stable across halving eras) and that
 * the floorUSD fallback only activates in early game when production is still
 * microscopic — never in late game where it would explode when multiplied by
 * the era-inflated coin price.
 */

import { calculateRewardFromDuration } from '../src/utils/gameLogic';
import { PACK_CONFIG, BOOSTER_CONFIG } from '../src/config/balanceConfig';

// Minimal GameState mock sufficient for calculateTotalProduction + price lookup.
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
  priceHistory: { cryptocoin: { prices: [], lastUpdate: 0 } },
  ...overrides,
});

const cpu = (owned: number) => ({
  id: 'basic_cpu',
  miningSpeed: 0.3,
  baseProduction: 30,
  blockReward: 0,
  owned,
  energyRequired: 0,
});

// ── calculateRewardFromDuration ─────────────────────────────────────────────

describe('calculateRewardFromDuration', () => {
  it('returns floor when no production is happening', () => {
    const state = makeState();
    const r = calculateRewardFromDuration(state, 5, 5000, 0.5);
    expect(r.targetUSD).toBe(5000);
    // 50/50 split: $2500 cash, $2500 in CC
    expect(r.cash).toBeCloseTo(2500, 0);
    // At era 0 ($0.05/CC) CC portion = 2500/0.05 = 50K CC
    expect(r.cc).toBeCloseTo(50_000, 0);
  });

  it('production overrides floor when $/s × duration > floor', () => {
    // Era 5 ($8/CC) with 10 CPUs → ccPerSec ≈ 2.9, $/s ≈ 23.3
    // 60 min = 3600s → $83,880 (well above $5K floor)
    const state = makeState({
      hardware: [cpu(10)],
      blocksMined: 5 * 210_000,
      priceHistory: { cryptocoin: { prices: [8.0], lastUpdate: 0 } },
    });
    const r = calculateRewardFromDuration(state, 60, 5000, 0.5);
    expect(r.targetUSD).toBeGreaterThan(5000);
    // Should not be the floor
    expect(r.targetUSD).not.toBeCloseTo(5000);
  });

  it('floor stays bounded in late eras (no explosion)', () => {
    // Era 35: block reward ~1.5e-9, extrapolated price ~$262B/CC
    // With 1 basic_cpu, ccPerSec is microscopic, so production-based $/s
    // is still reasonable (≈ baseProduction × basePrice, stable).
    // The KEY check: total reward should not explode into quadrillions.
    const state = makeState({
      hardware: [cpu(1)],
      blocksMined: 35 * 210_000,
    });
    const r = calculateRewardFromDuration(state, 5, 5000, 0.5);
    // Hard cap: reward should never exceed $1M for a 5-min small pack in any era
    expect(r.targetUSD).toBeLessThan(1_000_000);
  });

  it('reward stays approximately stable across eras for the same player state', () => {
    // The Bitcoin-faithful economy doubles base price per halving, so $/s
    // of a given hardware config should be ~constant. Reward therefore
    // should NOT explode or collapse when comparing era 0 vs era 10.
    const mkState = (blocksMined: number) => makeState({
      hardware: [cpu(5)],
      blocksMined,
      // Use base price as current price (no market deviation)
      priceHistory: { cryptocoin: { prices: [], lastUpdate: 0 } },
    });

    const era0 = calculateRewardFromDuration(mkState(0), 10, 5000, 0.5);
    const era10 = calculateRewardFromDuration(mkState(10 * 210_000), 10, 5000, 0.5);

    // They should be within 1 order of magnitude (not 10+ orders as the
    // broken fixed-CC floor would produce).
    const ratio = Math.max(era0.targetUSD, era10.targetUSD) /
                  Math.max(1, Math.min(era0.targetUSD, era10.targetUSD));
    expect(ratio).toBeLessThan(10);
  });

  it('cc + cash (in $) always equals targetUSD', () => {
    const state = makeState({
      hardware: [cpu(10)],
      priceHistory: { cryptocoin: { prices: [10.0], lastUpdate: 0 } },
    });
    const r = calculateRewardFromDuration(state, 5, 5000, 0.5);
    const totalUSD = r.cash + r.cc * 10.0;
    expect(totalUSD).toBeCloseTo(r.targetUSD, 2);
  });

  it('cashSplit=0 delivers everything as CC', () => {
    const state = makeState();
    const r = calculateRewardFromDuration(state, 5, 5000, 0);
    expect(r.cash).toBe(0);
    expect(r.cc).toBeGreaterThan(0);
  });

  it('cashSplit=1 delivers everything as cash', () => {
    const state = makeState();
    const r = calculateRewardFromDuration(state, 5, 5000, 1);
    expect(r.cc).toBe(0);
    expect(r.cash).toBe(5000);
  });

  it('returns zero for zero duration and zero floor', () => {
    const state = makeState();
    const r = calculateRewardFromDuration(state, 0, 0, 0.5);
    expect(r.targetUSD).toBe(0);
    expect(r.cc).toBe(0);
    expect(r.cash).toBe(0);
  });
});

// ── PACK_CONFIG shape ───────────────────────────────────────────────────────

describe('PACK_CONFIG uses duration + floorUSD model', () => {
  it('all packs have durationMinutes and floorUSD', () => {
    for (const tier of ['small', 'medium', 'large', 'mega'] as const) {
      expect(PACK_CONFIG[tier].durationMinutes).toBeGreaterThan(0);
      expect(PACK_CONFIG[tier].floorUSD).toBeGreaterThan(0);
    }
  });

  it('pack durations are monotonically increasing', () => {
    expect(PACK_CONFIG.small.durationMinutes).toBeLessThan(PACK_CONFIG.medium.durationMinutes);
    expect(PACK_CONFIG.medium.durationMinutes).toBeLessThan(PACK_CONFIG.large.durationMinutes);
    expect(PACK_CONFIG.large.durationMinutes).toBeLessThan(PACK_CONFIG.mega.durationMinutes);
  });

  it('total pack duration stays under 15% of a 12h game', () => {
    const total = PACK_CONFIG.small.durationMinutes +
                  PACK_CONFIG.medium.durationMinutes +
                  PACK_CONFIG.large.durationMinutes +
                  PACK_CONFIG.mega.durationMinutes;
    // 12h = 720 min. 15% = 108 min.
    expect(total).toBeLessThan(108);
  });
});

// ── Lucky Block config ──────────────────────────────────────────────────────

describe('BOOSTER_CONFIG.LUCKY_BLOCK uses duration model', () => {
  it('has durationMinutes and minBlocks', () => {
    expect(BOOSTER_CONFIG.LUCKY_BLOCK.durationMinutes).toBe(15);
    expect(BOOSTER_CONFIG.LUCKY_BLOCK.minBlocks).toBeGreaterThan(0);
  });

  it('Lucky Block scales with mining speed (boostedSpeed × durationSec)', () => {
    // Formula: blocks = max(minBlocks, round(boostedSpeed × 900))
    const durationSec = BOOSTER_CONFIG.LUCKY_BLOCK.durationMinutes * 60;
    expect(durationSec).toBe(900);
    // Early player at speed 1 → 900 blocks (above minBlocks=50)
    const early = Math.max(BOOSTER_CONFIG.LUCKY_BLOCK.minBlocks, Math.round(1 * durationSec));
    expect(early).toBe(900);
    // Late player at speed 2000 → 1.8M blocks
    const late = Math.max(BOOSTER_CONFIG.LUCKY_BLOCK.minBlocks, Math.round(2000 * durationSec));
    expect(late).toBe(1_800_000);
  });
});
