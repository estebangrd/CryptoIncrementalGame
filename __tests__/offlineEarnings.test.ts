/**
 * Tests for updateOfflineProgress — offline earnings modal logic.
 * Verifies that the modal only appears after genuine background time ≥ 5 min,
 * NOT after brief AppState transitions (e.g. watching a rewarded ad).
 */

import { updateOfflineProgress } from '../src/utils/gameLogic';
import { OFFLINE_SCREEN_CONFIG } from '../src/config/balanceConfig';

const makeState = (overrides: any = {}): any => ({
  hardware: [
    {
      id: 'basic_cpu',
      baseProduction: 10,
      miningSpeed: 1,
      blockReward: 50,
      owned: 1,
      baseCost: 10,
      electricityCost: 0,
      energyRequired: 0,
      isEnabled: undefined,
    },
  ],
  upgrades: [],
  blocksMined: 100,
  cryptoCoins: 500,
  totalCryptoCoins: 500,
  cryptoCoinsPerSecond: 50,
  prestigeMultiplier: 1,
  prestigeProductionMultiplier: undefined,
  adBoost: { isActive: false, expiresAt: null },
  iapState: {
    permanentMultiplierPurchased: false,
    booster2x: { isActive: false, expiresAt: null },
    booster5x: { isActive: false, expiresAt: null },
    offlineMiner: { isActive: false, activatedAt: null, expiresAt: null },
    luckyBlock: { isActive: false, blocksRemaining: 0 },
    marketPump: { isActive: false, expiresAt: null },
  },
  ai: { level: 0 },
  energy: { totalGeneratedMW: 0, totalRequiredMW: 0 },
  totalElectricityCost: 0,
  lastSaveTime: Date.now(),
  pendingOfflineEarnings: 0,
  offlineSecondsAway: 0,
  offlineWasCapped: false,
  offlineBlocksProcessed: 0,
  regulatoryPressureEvent: null,
  rationingPenaltyUntil: 0,
  ...overrides,
});

describe('updateOfflineProgress — free offline earnings path', () => {
  it('does NOT show modal when offline for less than MIN_OFFLINE_SECONDS', () => {
    const twoMinutesAgo = Date.now() - 120_000; // 2 min
    const state = makeState({ lastSaveTime: twoMinutesAgo });

    const result = updateOfflineProgress(state);

    expect(result.pendingOfflineEarnings).toBe(0);
    expect(result.lastSaveTime).toBeGreaterThan(twoMinutesAgo);
  });

  it('shows modal when genuinely offline for more than MIN_OFFLINE_SECONDS', () => {
    const tenMinutesAgo = Date.now() - 600_000; // 10 min
    const state = makeState({ lastSaveTime: tenMinutesAgo });

    const result = updateOfflineProgress(state);

    expect(result.pendingOfflineEarnings).toBeGreaterThan(0);
    expect(result.offlineSecondsAway).toBeGreaterThanOrEqual(600);
  });

  it('does NOT show modal after brief ad-induced background (stale lastSaveTime bug)', () => {
    // Scenario: user started playing 8 minutes ago but lastSaveTime was
    // refreshed by a recent production tick just 2 seconds ago.
    // This simulates the fix: lastSaveTime stays current during active play.
    const twoSecondsAgo = Date.now() - 2_000;
    const state = makeState({ lastSaveTime: twoSecondsAgo });

    const result = updateOfflineProgress(state);

    // Should NOT trigger the modal — only 2 seconds "offline"
    expect(result.pendingOfflineEarnings).toBe(0);
  });

  it('BUG REPRO: stale lastSaveTime from app start triggers false modal', () => {
    // This test reproduces the bug: lastSaveTime stuck at app-start time
    // while user was actively playing for 8 minutes, then watched an ad.
    // After the fix, lastSaveTime would be kept current by ADD_PRODUCTION,
    // so this scenario should not happen in practice. But we verify that
    // the 5-minute threshold is correctly enforced.
    const eightMinutesAgo = Date.now() - 480_000; // 8 min = 480s > 300s threshold
    const state = makeState({ lastSaveTime: eightMinutesAgo });

    const result = updateOfflineProgress(state);

    // With the OLD code this WOULD show the modal (pendingOfflineEarnings > 0).
    // This test documents that when lastSaveTime is stale, the modal DOES trigger.
    // The actual fix is in the reducer (ADD_PRODUCTION keeps lastSaveTime current).
    expect(result.pendingOfflineEarnings).toBeGreaterThan(0);
    expect(result.offlineSecondsAway).toBeGreaterThanOrEqual(480);
  });

  it('caps offline time at MAX_OFFLINE_SECONDS', () => {
    const twoHoursAgo = Date.now() - 7_200_000; // 2h
    const state = makeState({ lastSaveTime: twoHoursAgo });

    const result = updateOfflineProgress(state);

    expect(result.offlineWasCapped).toBe(true);
    expect(result.pendingOfflineEarnings).toBeGreaterThan(0);
  });
});
