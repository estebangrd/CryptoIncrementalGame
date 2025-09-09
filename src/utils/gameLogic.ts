import { GameState, Hardware, Upgrade } from '../types/game';
import { 
  calculateCurrentReward, 
  calculateNextHalving, 
  calculateTotalHashRate,
  GENESIS_CONSTANTS 
} from './blockLogic';
import { getInitialMarketState } from './marketLogic';
import { hardwareProgression } from '../data/hardwareData';
import { initialUpgrades } from '../data/gameData';
import { cryptocurrencies } from '../data/cryptocurrencies';

export const calculateHardwareCost = (hardware: Hardware): number => {
  return Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));
};

export const calculateHardwareProduction = (hardware: Hardware, upgrades: Upgrade[]): number => {
  let production = hardware.baseProduction * hardware.owned;
  
  // Apply upgrades that affect this hardware
  upgrades.forEach(upgrade => {
    if (upgrade.purchased && upgrade.effect.type === 'production' && upgrade.effect.target === hardware.id) {
      production *= upgrade.effect.value;
    }
  });
  
  return production;
};

export const calculateHardwareElectricityCost = (hardware: Hardware): number => {
  return hardware.electricityCost * hardware.owned;
};

export const calculateTotalElectricityCost = (hardware: Hardware[]): number => {
  return hardware.reduce((total, h) => total + calculateHardwareElectricityCost(h), 0);
};

export const calculateHardwareMiningSpeed = (hardware: Hardware, upgrades: Upgrade[]): number => {
  let speed = hardware.miningSpeed * hardware.owned;
  
  // Apply upgrades that affect this hardware
  upgrades.forEach(upgrade => {
    if (upgrade.purchased && upgrade.effect.type === 'production' && upgrade.effect.target === hardware.id) {
      speed *= upgrade.effect.value;
    }
  });
  
  return speed;
};

export const calculateTotalMiningSpeed = (hardware: Hardware[], upgrades: Upgrade[]): number => {
  return hardware.reduce((total, h) => total + calculateHardwareMiningSpeed(h, upgrades), 0);
};

export const calculateTotalProduction = (gameState: GameState): number => {
  let totalProduction = 0;
  
  gameState.hardware.forEach(hardware => {
    // Calculate mining speed (blocks per second)
    let miningSpeed = hardware.miningSpeed * hardware.owned;
    gameState.upgrades.forEach(upgrade => {
      if (upgrade.purchased && upgrade.effect.type === 'production' && upgrade.effect.target === hardware.id) {
        miningSpeed *= upgrade.effect.value;
      }
    });
    
    // Calculate coins per second from mining
    const coinsPerSecond = miningSpeed * hardware.blockReward;
    totalProduction += coinsPerSecond;
  });
  
  return totalProduction * gameState.prestigeMultiplier;
};


export const canAffordHardware = (gameState: GameState, hardwareId: string): boolean => {
  const hardware = gameState.hardware.find(h => h.id === hardwareId);
  if (!hardware) return false;
  
  const cost = calculateHardwareCost(hardware);
  return gameState.cryptoCoins >= cost;
};

export const canAffordUpgrade = (gameState: GameState, upgradeId: string): boolean => {
  const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
  if (!upgrade || upgrade.purchased) return false;
  
  return gameState.cryptoCoins >= upgrade.cost;
};

export const buyHardware = (gameState: GameState, hardwareId: string): GameState => {
  const hardwareIndex = gameState.hardware.findIndex(h => h.id === hardwareId);
  if (hardwareIndex === -1) return gameState;
  
  const hardware = gameState.hardware[hardwareIndex];
  const cost = calculateHardwareCost(hardware);
  
  if (gameState.cryptoCoins < cost) return gameState;
  
  const newGameState = { ...gameState };
  newGameState.cryptoCoins -= cost;
  newGameState.hardware[hardwareIndex] = { ...hardware, owned: hardware.owned + 1 };
  newGameState.cryptoCoinsPerSecond = calculateTotalProduction(newGameState);
  
  return newGameState;
};

export const buyUpgrade = (gameState: GameState, upgradeId: string): GameState => {
  const upgradeIndex = gameState.upgrades.findIndex(u => u.id === upgradeId);
  if (upgradeIndex === -1) return gameState;
  
  const upgrade = gameState.upgrades[upgradeIndex];
  if (upgrade.purchased || gameState.cryptoCoins < upgrade.cost) return gameState;
  
  const newGameState = { ...gameState };
  newGameState.cryptoCoins -= upgrade.cost;
  newGameState.upgrades[upgradeIndex] = { ...upgrade, purchased: true };
  newGameState.cryptoCoinsPerSecond = calculateTotalProduction(newGameState);
  
  return newGameState;
};


export const updateOfflineProgress = (gameState: GameState): GameState => {
  const now = Date.now();
  const timeDiff = (now - gameState.lastSaveTime) / 1000; // Convert to seconds
  
  if (timeDiff <= 0) return gameState;
  
  const newGameState = { ...gameState };
  const offlineEarnings = gameState.cryptoCoinsPerSecond * timeDiff;
  
  newGameState.cryptoCoins += offlineEarnings;
  newGameState.totalCryptoCoins += offlineEarnings;
  newGameState.lastSaveTime = now;
  
  return newGameState;
};

export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toFixed(1);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  return (num / 1000000000000).toFixed(1) + 'T';
};

// Progressive unlock system
export const UNLOCK_REQUIREMENTS = {
  MARKET_BLOCKS: 15, // Unlock market after mining 15 blocks
  HARDWARE_MONEY: 200, // Unlock hardware after earning $200
  UPGRADES_HARDWARE: 1, // Unlock upgrades after buying 1 hardware
  PRESTIGE_LEVEL: 1, // Unlock prestige after reaching level 1
};

export const checkAndUpdateUnlocks = (gameState: GameState): GameState => {
  const newUnlockedTabs = { ...gameState.unlockedTabs };
  
  // Unlock Market: After mining enough blocks
  if (!newUnlockedTabs.market && gameState.blocksMined >= UNLOCK_REQUIREMENTS.MARKET_BLOCKS) {
    newUnlockedTabs.market = true;
  }
  
  // Unlock Hardware: After earning enough real money
  if (!newUnlockedTabs.hardware && gameState.totalRealMoneyEarned >= UNLOCK_REQUIREMENTS.HARDWARE_MONEY) {
    newUnlockedTabs.hardware = true;
  }
  
  // Unlock Upgrades: After buying hardware
  if (!newUnlockedTabs.upgrades && gameState.hardware.some(h => h.owned > 0)) {
    newUnlockedTabs.upgrades = true;
  }
  
  // Unlock Prestige: After reaching certain level (future implementation)
  if (!newUnlockedTabs.prestige && gameState.prestigeLevel >= UNLOCK_REQUIREMENTS.PRESTIGE_LEVEL) {
    newUnlockedTabs.prestige = true;
  }
  
  return {
    ...gameState,
    unlockedTabs: newUnlockedTabs,
  };
};

export const getInitialGameState = (): GameState => {
  return {
    cryptoCoins: 0,
    cryptoCoinsPerSecond: 0,
    totalElectricityCost: 0,
    cryptocurrencies: cryptocurrencies,
    selectedCurrency: null,
    hardware: hardwareProgression,
    upgrades: initialUpgrades,
    lastSaveTime: Date.now(),
    totalClicks: 0,
    totalCryptoCoins: 0,
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    marketUpdateTime: Date.now(),
    currencyBalances: {},
    totalPrestigeGains: 0,
    // Phase 1: Genesis - Block system
    blocksMined: 0,
    totalBlocks: GENESIS_CONSTANTS.TOTAL_BLOCKS,
    currentReward: GENESIS_CONSTANTS.INITIAL_REWARD,
    nextHalving: GENESIS_CONSTANTS.HALVING_INTERVAL,
    difficulty: GENESIS_CONSTANTS.INITIAL_DIFFICULTY,
    totalHashRate: 0,
    phase: 'genesis',
    // Market system
    marketState: getInitialMarketState(),
    // Progressive unlock system
    unlockedTabs: {
      market: false,
      hardware: false,
      upgrades: false,
      prestige: false,
    },
    // Real money system
    realMoney: 0,
    totalRealMoneyEarned: 0,
  };
};
