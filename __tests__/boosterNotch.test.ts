/**
 * Tests for BoosterNotch logic:
 * - getActiveBoostersList: returns all currently active boosters
 * - getTotalProductionMultiplier: calculates combined production multiplier
 *
 * Based on spec: specs/ui-ux/blockchain-tycoon-notch.html
 */

import {
  getActiveBoostersList,
  getTotalProductionMultiplier,
  ActiveBooster,
} from '../src/utils/boosterNotchLogic';
import { BOOSTER_CONFIG } from '../src/config/balanceConfig';

// ─── Helpers ────────────────────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

function makeIAPState(overrides: Record<string, any> = {}) {
  return {
    booster2x: { isActive: false, activatedAt: null, expiresAt: null },
    booster5x: { isActive: false, activatedAt: null, expiresAt: null },
    permanentMultiplierPurchased: false,
    offlineMiner: { isActive: false, activatedAt: null, expiresAt: null },
    luckyBlock: { isActive: false, blocksRemaining: 0 },
    marketPump: { isActive: false, activatedAt: null, expiresAt: null },
    ...overrides,
  };
}

function makeAdBoost(overrides: Record<string, any> = {}) {
  return {
    isActive: false,
    activatedAt: null,
    expiresAt: null,
    lastWatchedAt: null,
    ...overrides,
  };
}

// ─── getActiveBoostersList ──────────────────────────────────────────────────

describe('getActiveBoostersList', () => {
  it('returns empty array when no boosters are active', () => {
    const now = Date.now();
    const result = getActiveBoostersList(makeIAPState(), makeAdBoost(), now);
    expect(result).toEqual([]);
  });

  it('includes permanent 2x when purchased', () => {
    const now = Date.now();
    const iap = makeIAPState({ permanentMultiplierPurchased: true });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('permanent');
    expect(result[0].multiplier).toBe(BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier);
    expect(result[0].isPermanent).toBe(true);
  });

  it('includes 2x booster when active and not expired', () => {
    const now = Date.now();
    const iap = makeIAPState({
      booster2x: { isActive: true, activatedAt: now - HOUR, expiresAt: now + HOUR },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('booster2x');
    expect(result[0].multiplier).toBe(2);
  });

  it('excludes 2x booster when expired', () => {
    const now = Date.now();
    const iap = makeIAPState({
      booster2x: { isActive: true, activatedAt: now - 2 * HOUR, expiresAt: now - HOUR },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toEqual([]);
  });

  it('includes 5x booster when active', () => {
    const now = Date.now();
    const iap = makeIAPState({
      booster5x: { isActive: true, activatedAt: now - HOUR, expiresAt: now + 23 * HOUR },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('booster5x');
    expect(result[0].multiplier).toBe(5);
  });

  it('includes ad boost when active', () => {
    const now = Date.now();
    const adBoost = makeAdBoost({
      isActive: true,
      activatedAt: now - 30 * MIN,
      expiresAt: now + 3.5 * HOUR,
    });
    const result = getActiveBoostersList(makeIAPState(), adBoost, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('adBoost');
    expect(result[0].multiplier).toBe(2);
  });

  it('includes lucky block when active with blocks remaining', () => {
    const now = Date.now();
    const iap = makeIAPState({
      luckyBlock: { isActive: true, blocksRemaining: 500 },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('luckyBlock');
  });

  it('excludes lucky block when blocksRemaining is 0', () => {
    const now = Date.now();
    const iap = makeIAPState({
      luckyBlock: { isActive: true, blocksRemaining: 0 },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toEqual([]);
  });

  it('includes market pump when active', () => {
    const now = Date.now();
    const iap = makeIAPState({
      marketPump: { isActive: true, activatedAt: now - 10 * MIN, expiresAt: now + 20 * MIN },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('marketPump');
  });

  it('includes offline miner when active', () => {
    const now = Date.now();
    const iap = makeIAPState({
      offlineMiner: { isActive: true, activatedAt: now - HOUR, expiresAt: now + 7 * HOUR },
    });
    const result = getActiveBoostersList(iap, makeAdBoost(), now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('offlineMiner');
  });

  it('returns all active boosters when multiple are active', () => {
    const now = Date.now();
    const iap = makeIAPState({
      permanentMultiplierPurchased: true,
      booster2x: { isActive: true, activatedAt: now - HOUR, expiresAt: now + 3 * HOUR },
      booster5x: { isActive: true, activatedAt: now - HOUR, expiresAt: now + 23 * HOUR },
      luckyBlock: { isActive: true, blocksRemaining: 1000 },
      marketPump: { isActive: true, activatedAt: now - 5 * MIN, expiresAt: now + 25 * MIN },
    });
    const adBoost = makeAdBoost({
      isActive: true,
      activatedAt: now - 30 * MIN,
      expiresAt: now + 3.5 * HOUR,
    });
    const result = getActiveBoostersList(iap, adBoost, now);
    expect(result).toHaveLength(6); // permanent, 2x, 5x, adBoost, luckyBlock, marketPump
  });
});

// ─── getTotalProductionMultiplier ───────────────────────────────────────────

describe('getTotalProductionMultiplier', () => {
  it('returns 1 when no boosters active', () => {
    expect(getTotalProductionMultiplier([])).toBe(1);
  });

  it('returns 2 for permanent only', () => {
    const boosters: ActiveBooster[] = [
      { id: 'permanent', multiplier: 2, isPermanent: true, icon: '♾', label: 'Permanent 2x', color: '#a040ff' },
    ];
    expect(getTotalProductionMultiplier(boosters)).toBe(2);
  });

  it('multiplies production boosters together (permanent × 5x = 10)', () => {
    const boosters: ActiveBooster[] = [
      { id: 'permanent', multiplier: 2, isPermanent: true, icon: '♾', label: 'Permanent 2x', color: '#a040ff' },
      { id: 'booster5x', multiplier: 5, isPermanent: false, expiresAt: Date.now() + HOUR, totalDurationMs: 24 * HOUR, icon: '🚀', label: '5x Booster', color: '#ff6b1a' },
    ];
    expect(getTotalProductionMultiplier(boosters)).toBe(10);
  });

  it('includes ad boost in production multiplier', () => {
    const boosters: ActiveBooster[] = [
      { id: 'permanent', multiplier: 2, isPermanent: true, icon: '♾', label: 'Permanent 2x', color: '#a040ff' },
      { id: 'adBoost', multiplier: 2, isPermanent: false, expiresAt: Date.now() + HOUR, totalDurationMs: 4 * HOUR, icon: '📺', label: 'Ad 2x', color: '#ffd600' },
    ];
    expect(getTotalProductionMultiplier(boosters)).toBe(4);
  });

  it('excludes non-production boosters (luckyBlock, marketPump, offlineMiner) from multiplier', () => {
    const boosters: ActiveBooster[] = [
      { id: 'permanent', multiplier: 2, isPermanent: true, icon: '♾', label: 'Permanent 2x', color: '#a040ff' },
      { id: 'luckyBlock', multiplier: 10, isPermanent: false, blocksRemaining: 500, icon: '🎲', label: 'Lucky Block', color: '#00ff88', isNonProduction: true },
      { id: 'marketPump', multiplier: 2, isPermanent: false, expiresAt: Date.now() + 20 * MIN, totalDurationMs: 30 * MIN, icon: '📈', label: 'Market Pump', color: '#ff3d5a', isNonProduction: true },
    ];
    // Only permanent (×2) counts for production — luckyBlock and marketPump are non-production
    expect(getTotalProductionMultiplier(boosters)).toBe(2);
  });

  it('stacks all production boosters: permanent × 2x × 5x × adBoost = 40', () => {
    const now = Date.now();
    const boosters: ActiveBooster[] = [
      { id: 'permanent', multiplier: 2, isPermanent: true, icon: '♾', label: 'Permanent 2x', color: '#a040ff' },
      { id: 'booster2x', multiplier: 2, isPermanent: false, expiresAt: now + 3 * HOUR, totalDurationMs: 4 * HOUR, icon: '⚡', label: '2x Booster', color: '#ffd600' },
      { id: 'booster5x', multiplier: 5, isPermanent: false, expiresAt: now + 23 * HOUR, totalDurationMs: 24 * HOUR, icon: '🚀', label: '5x Booster', color: '#ff6b1a' },
      { id: 'adBoost', multiplier: 2, isPermanent: false, expiresAt: now + 3.5 * HOUR, totalDurationMs: 4 * HOUR, icon: '📺', label: 'Ad 2x', color: '#ffd600' },
    ];
    expect(getTotalProductionMultiplier(boosters)).toBe(40);
  });
});
