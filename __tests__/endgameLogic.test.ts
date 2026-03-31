/**
 * Unit tests for Endgame system (Phase 7).
 * Based on spec: specs/game-mechanics/endgame-collapse.md
 */

import {
  calculateEndingBonus,
  calculateTotalEndgameProductionMultiplier,
  calculateRenewableDiscount,
  buildEndgameStats,
} from '../src/utils/endgameLogic';
import { ENDGAME_CONFIG } from '../src/config/balanceConfig';
import { GameState } from '../src/types/game';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeMinimalState = (overrides: Partial<GameState> = {}): GameState => ({
  cryptoCoins: 0,
  cryptoCoinsPerSecond: 0,
  totalElectricityCost: 0,
  cryptocurrencies: [],
  hardware: [],
  upgrades: [],
  lastSaveTime: 0,
  totalClicks: 0,
  totalCryptoCoins: 500,
  prestigeLevel: 2,
  prestigeMultiplier: 1,
  marketUpdateTime: 0,
  totalPrestigeGains: 0,
  prestigeProductionMultiplier: 1,
  prestigeClickMultiplier: 1,
  prestigeHistory: [],
  unlockedBadges: [],
  currentRunStartTime: Date.now() - 60_000,
  currentRunStats: {
    blocksMinedThisRun: 0,
    coinsEarnedThisRun: 0,
    moneyEarnedThisRun: 0,
    hardwarePurchasedThisRun: 0,
    upgradesPurchasedThisRun: 0,
    playtimeThisRun: 0,
  },
  blocksMined: 21_000_000,
  totalBlocks: 21_000_000,
  currentReward: 0,
  nextHalving: 0,
  difficulty: 1,
  totalHashRate: 0,
  phase: 'genesis',
  activeMarketEvents: [],
  lastRandomEventCheck: 0,
  rationingPenaltyUntil: 0,
  unlockedTabs: {
    market: false,
    hardware: false,
    upgrades: false,
    prestige: false,
    energy: false,
    chronicle: false,
  },
  realMoney: 412_833_901,
  totalRealMoneyEarned: 412_833_901,
  iapState: {
    removeAdsPurchased: false,
    removeAdsPurchaseDate: null,
    adsSeenBeforePurchase: 0,
    booster2x: { isActive: false, activatedAt: null, expiresAt: null },
    booster5x: { isActive: false, activatedAt: null, expiresAt: null },
    permanentMultiplierPurchased: false,
    starterPacksPurchased: { small: false, medium: false, large: false, mega: false },
    purchaseHistory: [],
    isPurchasing: false,
    lastPurchaseTime: null,
  },
  adState: {
    adInitialized: false,
    gdprConsentGiven: null,
    bannerLoaded: false,
    bannerVisible: false,
    lastInterstitialShownAt: null,
    interstitialLoaded: false,
    isFirstSession: true,
    rewardedAdLoaded: false,
    totalInterstitialsShown: 0,
    totalBannerImpressions: 0,
    lastPromotionShownAt: null,
  },
  adBoost: { isActive: false, activatedAt: null, expiresAt: null, lastWatchedAt: null },
  achievements: [],
  energy: {
    sources: {},
    totalGeneratedMW: 0,
    totalRequiredMW: 0,
    nonRenewableActiveMW: 0,
    aiControlled: false,
  },
  planetResources: 34,
  ai: { level: 2, isAutonomous: false, logEntries: [], lastSuggestionAt: 0 },
  aiCryptosUnlocked: [],
  narrativeEvents: [],
  planetResourcesVisible: true,
  collapseTriggered: false,
  goodEndingTriggered: false,
  collapseCount: 0,
  goodEndingCount: 0,
  lastEndgameStats: null,
  ...overrides,
});

// ─── calculateEndingBonus ─────────────────────────────────────────────────────

describe('calculateEndingBonus', () => {
  describe('collapse', () => {
    it('returns +15% production for first collapse', () => {
      const bonus = calculateEndingBonus('collapse', 1, 0);
      expect(bonus.productionMultiplier).toBeCloseTo(
        1 + ENDGAME_CONFIG.COLLAPSE_PRODUCTION_BONUS_PER_PRESTIGE * 1
      );
    });

    it('returns 0 renewable discount for collapse', () => {
      const bonus = calculateEndingBonus('collapse', 1, 0);
      expect(bonus.renewableDiscount).toBe(0);
    });

    it('accumulates 15% per collapse run', () => {
      const bonus3 = calculateEndingBonus('collapse', 3, 0);
      expect(bonus3.productionMultiplier).toBeCloseTo(1.45);
    });
  });

  describe('good_ending', () => {
    it('returns +10% production for first good ending', () => {
      const bonus = calculateEndingBonus('good_ending', 0, 1);
      expect(bonus.productionMultiplier).toBeCloseTo(
        1 + ENDGAME_CONFIG.GOOD_ENDING_PRODUCTION_BONUS_PER_PRESTIGE * 1
      );
    });

    it('returns -30% renewable discount for first good ending', () => {
      const bonus = calculateEndingBonus('good_ending', 0, 1);
      expect(bonus.renewableDiscount).toBeCloseTo(0.30);
    });

    it('accumulates renewable discount across good ending runs', () => {
      const bonus2 = calculateEndingBonus('good_ending', 0, 2);
      expect(bonus2.renewableDiscount).toBeCloseTo(0.60);
    });

    it('caps renewable discount at 80%', () => {
      const bonus = calculateEndingBonus('good_ending', 0, 10);
      expect(bonus.renewableDiscount).toBeCloseTo(
        ENDGAME_CONFIG.GOOD_ENDING_RENEWABLE_DISCOUNT_CAP
      );
    });
  });

  it('returns neutral bonus for null ending type', () => {
    const bonus = calculateEndingBonus(null, 0, 0);
    expect(bonus.productionMultiplier).toBe(1);
    expect(bonus.renewableDiscount).toBe(0);
  });
});

// ─── calculateTotalEndgameProductionMultiplier ────────────────────────────────

describe('calculateTotalEndgameProductionMultiplier', () => {
  it('returns 1 when no endings', () => {
    expect(calculateTotalEndgameProductionMultiplier(0, 0)).toBe(1);
  });

  it('combines collapse and good ending bonuses multiplicatively', () => {
    const result = calculateTotalEndgameProductionMultiplier(2, 2);
    const collapseBonus = 1 + 0.15 * 2;   // 1.30
    const goodBonus = 1 + 0.10 * 2;       // 1.20
    expect(result).toBeCloseTo(collapseBonus * goodBonus); // 1.56
  });

  it('collapseCount only works', () => {
    const result = calculateTotalEndgameProductionMultiplier(3, 0);
    expect(result).toBeCloseTo(1 + 0.15 * 3); // 1.45
  });

  it('goodEndingCount only works', () => {
    const result = calculateTotalEndgameProductionMultiplier(0, 3);
    expect(result).toBeCloseTo(1 + 0.10 * 3); // 1.30
  });
});

// ─── calculateRenewableDiscount ───────────────────────────────────────────────

describe('calculateRenewableDiscount', () => {
  it('returns 0 for 0 good endings', () => {
    expect(calculateRenewableDiscount(0)).toBe(0);
  });

  it('returns 30% for 1 good ending', () => {
    expect(calculateRenewableDiscount(1)).toBeCloseTo(0.30);
  });

  it('caps at 80%', () => {
    expect(calculateRenewableDiscount(10)).toBeCloseTo(
      ENDGAME_CONFIG.GOOD_ENDING_RENEWABLE_DISCOUNT_CAP
    );
  });

  it('caps at exactly 3 good endings (90% raw → 80% capped)', () => {
    expect(calculateRenewableDiscount(3)).toBeCloseTo(0.80);
  });
});

// ─── buildEndgameStats ────────────────────────────────────────────────────────

describe('buildEndgameStats', () => {
  it('captures blocksMined from state', () => {
    const state = makeMinimalState({ blocksMined: 18_421_039 });
    const stats = buildEndgameStats(state, 'collapse');
    expect(stats.blocksMined).toBe(18_421_039);
  });

  it('captures planetResources from state', () => {
    const state = makeMinimalState({ planetResources: 0 });
    const stats = buildEndgameStats(state, 'collapse');
    expect(stats.planetResourcesAtEnd).toBe(0);
  });

  it('captures aiLevel from state', () => {
    const state = makeMinimalState({ ai: { level: 3, isAutonomous: true, logEntries: [], lastSuggestionAt: 0 } });
    const stats = buildEndgameStats(state, 'collapse');
    expect(stats.aiLevelReached).toBe(3);
  });

  it('captures totalCryptoCoins from state', () => {
    const state = makeMinimalState({ totalCryptoCoins: 891_000_000_000 });
    const stats = buildEndgameStats(state, 'good_ending');
    expect(stats.totalCryptoCoinsEarned).toBe(891_000_000_000);
  });

  it('captures totalRealMoneyEarned from state', () => {
    const state = makeMinimalState({ totalRealMoneyEarned: 412_833_901 });
    const stats = buildEndgameStats(state, 'good_ending');
    expect(stats.totalMoneyEarned).toBe(412_833_901);
  });

  it('captures endingType correctly', () => {
    const collapseStats = buildEndgameStats(makeMinimalState(), 'collapse');
    const goodStats = buildEndgameStats(makeMinimalState(), 'good_ending');
    expect(collapseStats.endingType).toBe('collapse');
    expect(goodStats.endingType).toBe('good_ending');
  });

  it('runDurationMs is positive', () => {
    const state = makeMinimalState({ currentRunStartTime: Date.now() - 5000 });
    const stats = buildEndgameStats(state, 'collapse');
    expect(stats.runDurationMs).toBeGreaterThan(0);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('collapse has priority over good ending: collapse at 21M blocks with 0 resources', () => {
    // If blocksMined === 21M AND planetResources === 0, collapse should have been triggered
    // (not good ending). This is enforced in ADD_PRODUCTION reducer: collapse check first.
    // Here we just verify bonus logic for collapse in this edge scenario:
    const bonus = calculateEndingBonus('collapse', 1, 0);
    expect(bonus.productionMultiplier).toBeCloseTo(1.15);
    expect(bonus.renewableDiscount).toBe(0);
  });

  it('good ending only with resources > 0', () => {
    const state = makeMinimalState({ blocksMined: 21_000_000, planetResources: 34 });
    const stats = buildEndgameStats(state, 'good_ending');
    expect(stats.planetResourcesAtEnd).toBe(34);
    expect(stats.endingType).toBe('good_ending');
  });
});
