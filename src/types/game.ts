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
}

export interface PrestigeRequirement {
  currencyId: string;
  amount: number;
}

export interface GameState {
  cryptoCoins: number;
  cryptoCoinsPerSecond: number;
  totalElectricityCost: number; // Total electricity cost per second
  cryptocurrencies: Cryptocurrency[];
  selectedCurrency: string | null; // ID of the currently selected cryptocurrency
  hardware: Hardware[];
  upgrades: Upgrade[];
  lastSaveTime: number;
  totalClicks: number;
  totalCryptoCoins: number;
  prestigeLevel: number;
  prestigeMultiplier: number;
  marketUpdateTime: number;
  // Prestige system
  currencyBalances: { [currencyId: string]: number };
  totalPrestigeGains: number;
  // Phase 1: Genesis - Block system
  blocksMined: number;
  totalBlocks: number;
  currentReward: number;
  nextHalving: number;
  difficulty: number;
  totalHashRate: number;
  phase: 'genesis' | 'expansion' | 'institutional' | 'singularity' | 'multiverse';
  // Market system
  marketState: MarketState;
  // Progressive unlock system
  unlockedTabs: {
    market: boolean;
    hardware: boolean;
    upgrades: boolean;
    prestige: boolean;
  };
  // Real money system
  realMoney: number; // Dollars earned from selling coins
  totalRealMoneyEarned: number;
  // Price history system
  priceHistory?: { [cryptoId: string]: { prices: number[]; lastUpdate: number } };
}

export interface Hardware {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  baseCost: number;
  baseProduction: number; // Hash rate in H/s
  blockReward: number; // Coins per block mined
  miningSpeed: number; // Blocks per second
  electricityCost: number; // Coins per second for electricity
  owned: number;
  costMultiplier: number;
  icon: string;
  currencyId: string; // Which cryptocurrency this hardware mines
  level: number; // Technology level (1-8)
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
}

export interface UpgradeEffect {
  type: 'clickPower' | 'production' | 'costReduction' | 'prestige';
  value: number;
  target?: string; // For upgrades that affect specific hardware
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

// NPC (Non-Player Character) types
export interface NPC {
  id: string;
  name: string;
  nameKey: string;
  type: 'buyer' | 'seller' | 'trader';
  behavior: 'conservative' | 'aggressive' | 'speculative';
  baseDemand: number; // Base demand for coins
  priceSensitivity: number; // How much price affects demand
  maxPurchaseAmount: number; // Maximum coins they can buy
  minPurchaseAmount: number; // Minimum coins they will buy
  priceMultiplier: number; // Multiplier for their offer price
  lastActivity: number; // Last time they were active
  cooldown: number; // Time between activities
}

// Market event types
export interface MarketEvent {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  type: 'pizza' | 'regulation' | 'adoption' | 'crash' | 'boom';
  duration: number; // Duration in milliseconds
  priceMultiplier: number; // How it affects prices
  demandMultiplier: number; // How it affects demand
  probability: number; // Probability of occurring (0-1)
  lastOccurred: number; // Last time this event occurred
  cooldown: number; // Minimum time between occurrences
}

// Market state
export interface MarketState {
  basePrice: number; // Base price of the coin
  currentPrice: number; // Current market price
  priceHistory: number[]; // Price history for charts
  totalVolume: number; // Total trading volume
  dailyVolume: number; // Daily trading volume
  liquidity: number; // Market liquidity (0-1)
  fearGreedIndex: number; // Market sentiment (-1 to 1)
  lastUpdate: number; // Last market update
  activeEvents: MarketEvent[]; // Currently active events
  npcs: NPC[]; // Active NPCs
}
