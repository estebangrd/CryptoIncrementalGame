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
    if (upgrade.purchased && upgrade.effect.type === 'production') {
      // Check if upgrade affects this specific hardware
      if (upgrade.effect.target === hardware.id) {
        production *= upgrade.effect.value;
      }
      // Check if upgrade affects hardware category (cpu, gpu, asic)
      else if (upgrade.effect.target === 'cpu' && (hardware.id === 'basic_cpu' || hardware.id === 'advanced_cpu')) {
        production *= upgrade.effect.value;
      }
      else if (upgrade.effect.target === 'gpu' && (hardware.id === 'basic_gpu' || hardware.id === 'advanced_gpu')) {
        production *= upgrade.effect.value;
      }
      else if (upgrade.effect.target === 'asic' && (hardware.id === 'asic_gen1' || hardware.id === 'asic_gen2' || hardware.id === 'asic_gen3')) {
        production *= upgrade.effect.value;
      }
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
    if (upgrade.purchased && upgrade.effect.type === 'production') {
      // Check if upgrade affects this specific hardware
      if (upgrade.effect.target === hardware.id) {
        speed *= upgrade.effect.value;
      }
      // Check if upgrade affects hardware category (cpu, gpu, asic)
      else if (upgrade.effect.target === 'cpu' && (hardware.id === 'basic_cpu' || hardware.id === 'advanced_cpu')) {
        speed *= upgrade.effect.value;
      }
      else if (upgrade.effect.target === 'gpu' && (hardware.id === 'basic_gpu' || hardware.id === 'advanced_gpu')) {
        speed *= upgrade.effect.value;
      }
      else if (upgrade.effect.target === 'asic' && (hardware.id === 'asic_gen1' || hardware.id === 'asic_gen2' || hardware.id === 'asic_gen3')) {
        speed *= upgrade.effect.value;
      }
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
    // Calculate mining speed (blocks per second) using the helper function
    const miningSpeed = calculateHardwareMiningSpeed(hardware, gameState.upgrades);
    
    // Calculate coins per second from mining
    const coinsPerSecond = miningSpeed * hardware.blockReward;
    totalProduction += coinsPerSecond;
    
    // Debug log for hardware with owned > 0
    if (hardware.owned > 0) {
      console.log(`DEBUG: Hardware ${hardware.id} has ${hardware.owned} owned, miningSpeed: ${miningSpeed}, blockReward: ${hardware.blockReward}, coinsPerSecond: ${coinsPerSecond}`);
    }
  });
  
  const finalProduction = totalProduction * gameState.prestigeMultiplier;
  if (finalProduction > 0) {
    console.log(`DEBUG: Total production calculated: ${finalProduction}, prestigeMultiplier: ${gameState.prestigeMultiplier}`);
  }
  
  return finalProduction;
};


export const canAffordHardware = (gameState: GameState, hardwareId: string): boolean => {
  const hardware = gameState.hardware.find(h => h.id === hardwareId);
  if (!hardware) return false;
  
  const cost = calculateHardwareCost(hardware);
  return gameState.cryptoCoins >= cost;
};

export const isUpgradeUnlocked = (gameState: GameState, upgrade: Upgrade): boolean => {
  if (!upgrade.unlockCondition) return true;
  
  const condition = upgrade.unlockCondition;
  
  switch (condition.type) {
    case 'always':
      return true;
    case 'hardware':
      if (!condition.hardwareId || !condition.minOwned) return false;
      const hardware = gameState.hardware.find(h => h.id === condition.hardwareId);
      return hardware ? hardware.owned >= condition.minOwned : false;
    case 'blocks':
      return condition.minBlocks ? gameState.blocksMined >= condition.minBlocks : false;
    case 'money':
      return condition.minMoney ? gameState.realMoney >= condition.minMoney : false;
    default:
      return false;
  }
};

export const canAffordUpgrade = (gameState: GameState, upgradeId: string): boolean => {
  const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
  if (!upgrade || upgrade.purchased) return false;
  
  // Check if upgrade is unlocked
  if (!isUpgradeUnlocked(gameState, upgrade)) return false;
  
  // Upgrades now cost real money ($) instead of CryptoCoins
  return gameState.realMoney >= upgrade.cost;
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
  MARKET_COINS: 1000, // Unlock market after earning 1000 cryptocoins
  HARDWARE_MONEY: 200, // Unlock hardware after earning $200
  UPGRADES_HARDWARE: 1, // Unlock upgrades after buying 1 hardware
  PRESTIGE_LEVEL: 1, // Unlock prestige after reaching level 1
};

export const checkAndUpdateUnlocks = (gameState: GameState): GameState => {
  const newUnlockedTabs = { ...gameState.unlockedTabs };
  
  // Debug logs for market unlock
  console.log('DEBUG: checkAndUpdateUnlocks - Market unlock check');
  console.log('DEBUG: blocksMined:', gameState.blocksMined, 'required:', UNLOCK_REQUIREMENTS.MARKET_BLOCKS);
  console.log('DEBUG: cryptoCoins:', gameState.cryptoCoins, 'required:', UNLOCK_REQUIREMENTS.MARKET_COINS);
  console.log('DEBUG: market currently unlocked:', newUnlockedTabs.market);
  
  // Unlock Market: After mining enough blocks AND earning enough cryptocoins
  if (!newUnlockedTabs.market &&
      gameState.blocksMined >= UNLOCK_REQUIREMENTS.MARKET_BLOCKS &&
      gameState.cryptoCoins >= UNLOCK_REQUIREMENTS.MARKET_COINS) {
    console.log('DEBUG: Market should be unlocked now!');
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

// Check if hardware is unlocked based on previous hardware ownership
export const isHardwareUnlocked = (gameState: GameState, hardware: Hardware): boolean => {
  // Manual mining is always hidden
  if (hardware.id === 'manual_mining') return false;
  
  // First hardware (basic_cpu) is always unlocked
  if (hardware.level === 2) return true;
  
  // For other hardware, check if previous level has at least 5 units
  const previousLevel = hardware.level - 1;
  const previousHardware = gameState.hardware.find(h => h.level === previousLevel);
  
  if (!previousHardware) return false;
  
  return previousHardware.owned >= 5;
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
