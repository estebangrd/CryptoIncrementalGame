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
