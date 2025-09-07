import { GameState, Hardware, Upgrade } from '../types/game';
import { 
  calculateCurrentReward, 
  calculateNextHalving, 
  calculateTotalHashRate,
  GENESIS_CONSTANTS 
} from './blockLogic';

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

export const calculateTotalProduction = (gameState: GameState): number => {
  let totalProduction = 0;
  
  gameState.hardware.forEach(hardware => {
    totalProduction += calculateHardwareProduction(hardware, gameState.upgrades);
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

export const getInitialGameState = (): GameState => {
  return {
    cryptoCoins: 0,
    cryptoCoinsPerSecond: 0,
    cryptocurrencies: [],
    selectedCurrency: null,
    hardware: [],
    upgrades: [],
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
  };
};
