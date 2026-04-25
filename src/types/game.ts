export interface Cryptocurrency {
  id: string;
  name: string;
  nameKey: string;
  symbol: string;
  baseValue: number;
  currentValue: number;
  volatility: number; // How much the price can fluctuate
  color: string;
  icon: string;
  aiLevelRequired?: number; // 1, 2, or 3 — only visible when AI is at this level+
}

// ─── Market Events (price unification) ────────────────────────────────────────

export type MarketEventId =
  | 'halving_anticipation'
  | 'halving_shock'
  | 'market_spike'
  | 'blackout_regional'
  | 'ai_autonomous'
  | 'planetary_collapse_incoming'
  | 'whale_dump'
  | 'media_hype';

export interface ActiveMarketEvent {
  id: MarketEventId;
  multiplier: number;
  activatedAt: number;
  expiresAt: number | null;  // null = permanent (until explicit cancellation)
  labelKey: string;
}

// ─── AI System types (Phase 5) ────────────────────────────────────────────────

export type AILevel = 0 | 1 | 2 | 3;

export interface AILogEntry {
  timestamp: number;
  message: string;
  type: 'suggestion' | 'action' | 'warning' | 'autonomous';
}

export interface AIState {
  level: AILevel;
  isAutonomous: boolean;       // true when level === 3
  logEntries: AILogEntry[];    // last 50 entries, most recent first
  lastSuggestionAt: number;    // timestamp
  capRemovalLogged: boolean;   // LOG 14:23 — cap 21M removed
  renewablesSatLogged: boolean; // LOG 31:07 — renewables saturated
  lastActionAt: number;        // timestamp of last observer action
  aiHardwareCreated: string[]; // IDs of AI-exclusive hardware injected
}

export interface PrestigeRequirement {
  currencyId: string;
  amount: number;
}

export interface PurchaseRecord {
  productId: string;
  transactionId: string;
  purchaseDate: number;
  price: number;
  currency: string;
  platform: 'ios' | 'android';
  receipt: string;
  validated: boolean;
  delivered: boolean;
}

export interface IAPBoosterState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
}

export interface OfflineMinerState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
}

export interface PendingPremiumOfflineData {
  grossCoins: number;
  feeCoins: number;
  netCoins: number;
  secondsAway: number;
  blocksProcessed: number;
  boosterExpiresAt: number;
  boosterActivatedAt: number;
  boosterExpired: boolean;
}

export interface LuckyBlockState {
  isActive: boolean;
  blocksRemaining: number;
}

export interface MarketPumpState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
}

export interface IAPState {
  removeAdsPurchased: boolean;
  removeAdsPurchaseDate: number | null;
  adsSeenBeforePurchase: number;
  booster2x: IAPBoosterState;
  booster5x: IAPBoosterState;
  permanentMultiplierPurchased: boolean;
  starterPacksPurchased: {
    small: boolean;
    medium: boolean;
    large: boolean;
    mega: boolean;
  };
  purchaseHistory: PurchaseRecord[];
  isPurchasing: boolean;
  lastPurchaseTime: number | null;
  flashSaleExpiresAt: number;      // unix ms, 0 = no active sale
  flashSaleCooldownUntil: number;  // unix ms, 0 = no cooldown
  packOfferExpiresAt: number;           // unix ms, 0 = no active offer
  packNextOfferAt: number;              // unix ms, 0 = can offer immediately
  packCurrentCC: number;                // randomized CC for current active offer
  packCurrentCash: number;              // randomized cash for current active offer
  packCurrentElectricityHours: number;  // 0 if no electricity for this pack
  offlineMiner: OfflineMinerState;
  luckyBlock: LuckyBlockState;
  marketPump: MarketPumpState;
}

export interface AdState {
  adInitialized: boolean;
  gdprConsentGiven: boolean | null;
  bannerLoaded: boolean;
  bannerVisible: boolean;
  lastInterstitialShownAt: number | null;
  interstitialLoaded: boolean;
  isFirstSession: boolean;
  rewardedAdLoaded: boolean;
  totalInterstitialsShown: number;
  totalBannerImpressions: number;
  lastPromotionShownAt: number | null;
}

export interface AdBoostState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  lastWatchedAt: number | null;
}

export interface AdHashBoostState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
}

export interface AdMarketBoostState {
  isActive: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
}

export interface AchievementReward {
  // 'duration' rewards grant `durationMinutes` of current production (CC +
  // cash split 50/50) with a USD floor for early-game meaningfulness.
  // Legacy types 'coins'/'money' grant a fixed amount and are deprecated.
  type: 'coins' | 'money' | 'multiplier' | 'cosmetic' | 'duration';
  amount?: number;
  multiplier?: number;
  duration?: number;
  // Duration-based reward fields (used when type === 'duration').
  durationMinutes?: number;
  floorUSD?: number;
}

export interface Achievement {
  id: string;
  nameKey: string;
  descriptionKey: string;
  name?: string;
  description?: string;
  category: 'mining' | 'hardware' | 'economy' | 'prestige' | 'secret';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
  reward?: AchievementReward;
  hidden: boolean;
}

// Prestige run history record
export interface PrestigeRun {
  runNumber: number;
  prestigeLevel: number;
  blocksMined: number;
  totalCoinsEarned: number;
  totalMoneyEarned: number;
  duration: number;           // seconds
  startTime: number;
  endTime: number;
  hardwarePurchased: number;
  upgradesPurchased: number;
}

// Stats tracked during the current run
export interface RunStats {
  blocksMinedThisRun: number;
  coinsEarnedThisRun: number;
  moneyEarnedThisRun: number;
  hardwarePurchasedThisRun: number;
  upgradesPurchasedThisRun: number;
  playtimeThisRun: number;    // seconds
}

// ─── Prestige Skill Tree ──────────────────────────────────────────────────────

export type SkillTreeBranch = 'hardware' | 'market' | 'click';
export type SkillNodePosition = 1 | 2 | 3 | 4 | 5 | 6;

export interface SkillNode {
  id: string;                    // e.g. "hardware_1", "market_3", "click_6"
  branch: SkillTreeBranch;
  position: SkillNodePosition;
  value: number;                 // additive bonus (0.05 = +5%)
  cost: number;                  // points required to purchase
  nameKey: string;               // translation key
  descriptionKey: string;        // translation key
  purchased: boolean;
}

export interface PrestigeSkillTree {
  nodes: SkillNode[];            // all 18 nodes (3 branches × 6 positions)
  lostPoints: number;             // points lost permanently via respec
}

// Badge definition
export interface Badge {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  unlockCondition: {
    type: 'prestige_level' | 'speed' | 'total_blocks' | 'total_money' | 'special';
    value: number | string;
  };
  reward?: {
    type: 'production' | 'click' | 'none';
    value: number;
  };
  hidden: boolean;
}

export interface EnergySource {
  id: string;
  nameKey: string;
  descriptionKey: string;
  mwPerUnit: number;
  costPerUnit: number; // $ base cost (first unit)
  costMultiplier: number; // cost scales as costPerUnit * multiplier^quantity
  isRenewable: boolean;
  depletionPerMwPerSecond: number; // % planet per MW per second
  icon: string;
  quantity: number; // units built
  unlockedByAI: boolean; // true = built by AI at Level 3
}

export interface EnergyState {
  sources: Record<string, EnergySource>;
  totalGeneratedMW: number;       // calculated
  totalRequiredMW: number;        // calculated
  nonRenewableActiveMW: number;   // calculated, for planet depletion
  aiControlled: boolean;          // true when AI Level 3 is active
}

// ─── Narrative Events (Phase 6) ───────────────────────────────────────────────

// ─── Banner Events (Phase 6 — interactive) ───────────────────────────────────

export type RegulatoryPressureStatus = 'active' | 'appealing' | 'resolved';

export interface RegulatoryPressureEvent {
  status: RegulatoryPressureStatus;
  triggeredAt: number;
  decisionDeadline: number;           // triggeredAt + 2h
  appealResultTime: number | null;    // if appealing, timestamp when result shows
  hashRatePenaltyUntil: number | null;
  outcome: 'paid' | 'appealed_success' | 'appealed_partial_paid' | 'appealed_partial_penalty' | 'appealed_rejected_paid' | 'appealed_rejected_penalty' | 'ignored' | null;
  planetResourcesAtTrigger: number;
}

export interface MarketOpportunityEvent {
  status: 'active' | 'resolved';
  triggeredAt: number;
  expiresAt: number;
  priceMultiplier: number;
  outcome: 'went_to_market' | 'auto_sold' | 'expired' | null;
}

export interface LocalProtestEvent {
  status: 'active' | 'resolved';
  triggeredAt: number;
  resourcesConsumedAtTrigger: number; // exact % consumed = 100 - planetResources
}

// ─── Endgame (Phase 7) ────────────────────────────────────────────────────────

export type EndingType = 'collapse' | 'human_collapse' | 'good_ending' | null;

export interface EndgameStats {
  blocksMined: number;
  totalCryptoCoinsEarned: number;
  totalMoneyEarned: number;
  planetResourcesAtEnd: number;
  aiLevelReached: AILevel;
  runDurationMs: number;
  endingType: EndingType;
}

export interface NarrativeEvent {
  threshold: number;                  // 80 | 60 | 40 | 20 | 5
  triggeredAt: number;                // timestamp
  planetResourcesAtTrigger: number;   // exact value at the moment
  aiActiveAtTrigger: boolean;         // whether AI Level 3 was active (for variant text)
  dismissed: boolean;                 // player closed the modal
}

export interface GameState {
  isHydrated: boolean;
  cryptoCoins: number;
  cryptoCoinsPerSecond: number;
  totalElectricityCost: number; // Total electricity cost per second
  cryptocurrencies: Cryptocurrency[];
  hardware: Hardware[];
  upgrades: Upgrade[];
  lastSaveTime: number;
  totalClicks: number;
  totalCryptoCoins: number;
  prestigeLevel: number;
  prestigeMultiplier: number;       // backwards compat — equals prestigeProductionMultiplier
  marketUpdateTime: number;
  totalPrestigeGains: number;
  // New prestige fields
  prestigeProductionMultiplier: number;
  prestigeClickMultiplier: number;
  prestigeHistory: PrestigeRun[];
  unlockedBadges: string[];
  prestigeSkillTree: PrestigeSkillTree;
  currentRunStartTime: number;
  currentRunStats: RunStats;
  // Phase 1: Genesis - Block system
  blocksMined: number;
  blockAccumulator: number;
  totalBlocks: number;
  currentReward: number;
  nextHalving: number;
  difficulty: number;
  totalHashRate: number;
  phase: 'genesis' | 'expansion' | 'institutional' | 'singularity' | 'multiverse';
  // Progressive unlock system
  unlockedTabs: {
    market: boolean;
    hardware: boolean;
    upgrades: boolean;
    prestige: boolean;
    energy: boolean;
    chronicle: boolean;
  };
  // Real money system
  realMoney: number; // Dollars earned from selling coins
  totalRealMoneyEarned: number;
  totalSellCount: number;
  // Price history system
  priceHistory?: { [cryptoId: string]: { prices: number[]; lastUpdate: number } };
  // Price engine (Ornstein-Uhlenbeck)
  priceDeviation: number;          // current deviation from era base, range ~ -0.30 to +0.40
  priceRegime: string;             // current regime name (normal, bull, bear, volatile, spike, crash)
  priceRegimeTicksLeft: number;    // ticks remaining in current regime
  // IAP, Ads and Achievements systems
  iapState: IAPState;
  adState: AdState;
  adBoost: AdBoostState;
  adHashBoost: AdHashBoostState;
  adMarketBoost: AdMarketBoostState;
  energyBonusMW: number;              // MW injected by ad energy restore
  achievements: Achievement[];
  // Energy system (Phase 4)
  energy: EnergyState;
  renewableCapUpgrades: string[]; // IDs of purchased renewable cap upgrades
  planetResources: number; // 0-100, starts at 100
  // AI system (Phase 5)
  ai: AIState;
  aiCryptosUnlocked: string[]; // e.g. ['neural_coin', 'quantum_bit']
  aiTickerMessage: string;     // last AI observer action message
  // Narrative Events system (Phase 6)
  narrativeEvents: NarrativeEvent[];
  planetResourcesVisible: boolean; // false until first non-renewable activated
  collapseTriggered: boolean;      // true when planetResources reaches 0
  // Endgame system (Phase 7)
  goodEndingTriggered: boolean;    // true when 21M blocks mined with resources > 0
  collapseCount: number;           // total collapse endings
  goodEndingCount: number;         // total good endings
  lastEndgameStats: EndgameStats | null;
  disconnectAttempted: boolean;    // player already saw the disconnect popup
  // Offline earnings modal
  pendingOfflineEarnings: number;   // CC pending claim, 0 = no modal
  offlineSecondsAway: number;       // actual time away for display
  offlineWasCapped: boolean;        // true if production was capped at 1h
  offlineBlocksProcessed: number;   // estimated blocks for narrative log
  pendingPremiumOffline: PendingPremiumOfflineData | null;
  // Banner Events (Phase 6 — interactive narrative)
  regulatoryPressureEvent: RegulatoryPressureEvent | null;
  marketOpportunityEvent: MarketOpportunityEvent | null;
  localProtestEvent: LocalProtestEvent | null;
  activeBannerEvent: 'regulatory_pressure' | 'market_opportunity' | 'local_protest' | null;
  // Market events (price unification)
  activeMarketEvents: ActiveMarketEvent[];
  lastRandomEventCheck: number;
  lastPriceTickEra: number;
  rationingPenaltyUntil: number;
}

export interface Hardware {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  baseCost: number;
  baseProduction: number; // Hash rate in H/s
  blockReward: number; // @deprecated — reward is now global per era. Kept for save compat.
  miningSpeed: number; // Blocks per second
  electricityCost: number; // Coins per second for electricity
  energyRequired: number; // MW required per unit (0 for tiers 1-8)
  owned: number;
  costMultiplier: number;
  icon: string;
  currencyId: string; // Which cryptocurrency this hardware mines
  level: number; // Technology level (1-11)
  isEnabled?: boolean; // undefined = enabled (backwards-compatible with old saves)
  aiExclusive?: boolean; // true = AI-designed hardware, not available to player
}

export interface Upgrade {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  cost: number;
  purchased: boolean;
  effect: UpgradeEffect;
  icon: string;
  unlockCondition?: UpgradeUnlockCondition;
}

export interface UpgradeEffect {
  type: 'clickPower' | 'production' | 'costReduction' | 'prestige';
  value: number;
  target?: string; // For upgrades that affect specific hardware (e.g., 'cpu', 'gpu', 'asic')
}

export interface UpgradeUnlockCondition {
  type: 'always' | 'hardware' | 'blocks' | 'money' | 'upgrade';
  hardwareId?: string;
  minOwned?: number;
  minBlocks?: number;
  minMoney?: number;
  upgradeId?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Translation {
  [key: string]: {
    [languageCode: string]: string;
  };
}

// Legacy Market types removed — see ActiveMarketEvent for new system
