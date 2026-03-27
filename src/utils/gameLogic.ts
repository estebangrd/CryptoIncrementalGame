import { GameState, Hardware, Upgrade } from '../types/game';
import { BTC_PRICE_HISTORY } from '../data/btcPriceHistory';
import { GENESIS_CONSTANTS, calculateDifficulty, calculateCurrentReward, calculateNextHalving } from './blockLogic';
import { getInitialMarketState } from './marketLogic';
import { getInitialEnergyState, getActiveHardwareWithEnergyConstraint } from './energyLogic';
import { getAIProductionMultiplier, getInitialAIState } from './aiLogic';
import { hardwareProgression } from '../data/hardwareData';
import { initialUpgrades } from '../data/gameData';
import { cryptocurrencies } from '../data/cryptocurrencies';
import { ALL_ACHIEVEMENTS } from '../data/achievements';

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

/**
 * Combines ALL global multipliers (prestige, ad boost, permanent, IAP booster, AI)
 * into one value. Used everywhere multipliers apply to mining speed.
 */
export const getAllMultipliers = (gameState: GameState): number => {
  const prestigeMultiplier = (gameState.prestigeProductionMultiplier ?? gameState.prestigeMultiplier ?? 1);

  let adBoostMultiplier = 1.0;
  if (gameState.adBoost?.isActive && gameState.adBoost.expiresAt !== null) {
    if (Date.now() < gameState.adBoost.expiresAt) {
      adBoostMultiplier = BOOSTER_CONFIG.REWARDED_AD_BOOST.multiplier;
    }
  }

  const permanentMultiplier = gameState.iapState?.permanentMultiplierPurchased
    ? BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier
    : 1.0;

  let iapBoosterMultiplier = 1.0;
  const now = Date.now();
  if (
    gameState.iapState?.booster5x?.isActive &&
    gameState.iapState.booster5x.expiresAt !== null &&
    now < gameState.iapState.booster5x.expiresAt
  ) {
    iapBoosterMultiplier = BOOSTER_CONFIG.BOOSTER_5X.multiplier;
  } else if (
    gameState.iapState?.booster2x?.isActive &&
    gameState.iapState.booster2x.expiresAt !== null &&
    now < gameState.iapState.booster2x.expiresAt
  ) {
    iapBoosterMultiplier = BOOSTER_CONFIG.BOOSTER_2X.multiplier;
  }

  const aiMultiplier = getAIProductionMultiplier(gameState.ai?.level ?? 0);

  return prestigeMultiplier * adBoostMultiplier * permanentMultiplier * iapBoosterMultiplier * aiMultiplier;
};

/**
 * Returns energy-constrained mining speed (excludes manual_mining).
 */
export const getConstrainedMiningSpeed = (gameState: GameState): number => {
  const energyState = gameState.energy;
  const totalGeneratedMW = energyState?.totalGeneratedMW ?? 0;
  const activeEnergyHardware = getActiveHardwareWithEnergyConstraint(
    gameState.hardware,
    totalGeneratedMW
  );
  const activeUnitsMap: Record<string, number> = {};
  for (const hw of activeEnergyHardware) {
    activeUnitsMap[hw.id] = hw.activeUnits;
  }

  let constrainedMiningSpeed = 0;
  gameState.hardware.forEach(hardware => {
    if (hardware.id === 'manual_mining') return;

    let effectiveOwned = hardware.owned;
    if (hardware.energyRequired > 0) {
      effectiveOwned = activeUnitsMap[hardware.id] ?? 0;
    }
    if (effectiveOwned === 0) return;

    const hardwareWithEffectiveOwned = { ...hardware, owned: effectiveOwned };
    constrainedMiningSpeed += calculateHardwareMiningSpeed(hardwareWithEffectiveOwned, gameState.upgrades);
  });

  return constrainedMiningSpeed;
};

export const calculateTotalProduction = (gameState: GameState): number => {
  // Bitcoin-faithful: multipliers boost mining speed, not CC output
  // boostedSpeed = constrainedMiningSpeed × allMult
  // blocksPerSec = boostedSpeed / difficulty
  // CC/sec = blocksPerSec × globalReward
  const constrainedMiningSpeed = getConstrainedMiningSpeed(gameState);
  const allMult = getAllMultipliers(gameState);
  const boostedSpeed = constrainedMiningSpeed * allMult;

  const difficulty = calculateDifficulty(gameState.blocksMined ?? 0);
  const globalBlockReward = calculateCurrentReward(gameState.blocksMined ?? 0);

  const blocksPerSecond = boostedSpeed / difficulty;
  const finalProduction = blocksPerSecond * globalBlockReward;

  return finalProduction;
};


export const calculateTotalHashRate = (gameState: GameState): number => {
  let totalHashRate = 0;

  gameState.hardware.forEach(hardware => {
    // manual_mining represents click-based mining; exclude from auto-production stats
    if (hardware.id === 'manual_mining') return;
    if (hardware.owned === 0) return;
    const baseHashRate = hardware.baseProduction * 10;
    // Apply same per-hardware upgrade multipliers as calculateHardwareMiningSpeed
    let upgradeMultiplier = 1;
    gameState.upgrades.forEach(upgrade => {
      if (upgrade.purchased && upgrade.effect.type === 'production') {
        if (upgrade.effect.target === hardware.id) {
          upgradeMultiplier *= upgrade.effect.value;
        } else if (upgrade.effect.target === 'cpu' && (hardware.id === 'basic_cpu' || hardware.id === 'advanced_cpu')) {
          upgradeMultiplier *= upgrade.effect.value;
        } else if (upgrade.effect.target === 'gpu' && (hardware.id === 'basic_gpu' || hardware.id === 'advanced_gpu')) {
          upgradeMultiplier *= upgrade.effect.value;
        } else if (upgrade.effect.target === 'asic' && (hardware.id === 'asic_gen1' || hardware.id === 'asic_gen2' || hardware.id === 'asic_gen3')) {
          upgradeMultiplier *= upgrade.effect.value;
        }
      }
    });
    totalHashRate += baseHashRate * hardware.owned * upgradeMultiplier;
  });

  // Apply global multipliers via unified helper
  return totalHashRate * getAllMultipliers(gameState);
};

export const canAffordHardware = (gameState: GameState, hardwareId: string): boolean => {
  const hardware = gameState.hardware.find(h => h.id === hardwareId);
  if (!hardware) return false;

  const cost = calculateHardwareCost(hardware);
  return gameState.realMoney >= cost;
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
  const lastSave = gameState.lastSaveTime ?? now;

  // Only apply offline earnings if offline miner is active
  const offlineMiner = gameState.iapState?.offlineMiner;
  if (!offlineMiner?.isActive || !offlineMiner.expiresAt) {
    return { ...gameState, lastSaveTime: now };
  }

  // Cap offline time to the miner's remaining active window
  const offlineEnd = Math.min(now, offlineMiner.expiresAt);
  const offlineMs = Math.max(0, offlineEnd - lastSave);
  const offlineSec = offlineMs / 1000;

  if (offlineSec <= 0) {
    return { ...gameState, lastSaveTime: now };
  }

  // Simulate real block mining at 50% mining speed
  const constrainedMiningSpeed = getConstrainedMiningSpeed(gameState);
  const allMult = getAllMultipliers(gameState);
  const offlineSpeed = constrainedMiningSpeed * allMult * BALANCE_CONFIG.OFFLINE_EARNINGS_MULTIPLIER;

  let blocksMined = gameState.blocksMined;
  const difficulty = calculateDifficulty(blocksMined);
  const blocksPerSec = offlineSpeed / difficulty;
  const totalBlocks = Math.floor(blocksPerSec * offlineSec);

  // Process blocks through halvings for accurate CC calculation
  let coinsEarned = 0;
  let blocksRemaining = totalBlocks;
  let currentBlocksMined = blocksMined;

  while (blocksRemaining > 0 && currentBlocksMined < GENESIS_CONSTANTS.TOTAL_BLOCKS) {
    const reward = calculateCurrentReward(currentBlocksMined);
    const nextHalving = calculateNextHalving(currentBlocksMined);
    const blocksUntilHalving = nextHalving - currentBlocksMined;
    const blocksThisBatch = Math.min(blocksRemaining, blocksUntilHalving, GENESIS_CONSTANTS.TOTAL_BLOCKS - currentBlocksMined);

    coinsEarned += blocksThisBatch * reward;
    currentBlocksMined += blocksThisBatch;
    blocksRemaining -= blocksThisBatch;
  }

  // Drain electricity cost
  const electricityCost = gameState.totalElectricityCost ?? 0;
  const electricityDrained = electricityCost * offlineSec;

  const offlineMinerExpired = now >= offlineMiner.expiresAt;

  return {
    ...gameState,
    cryptoCoins: gameState.cryptoCoins + coinsEarned,
    totalCryptoCoins: gameState.totalCryptoCoins + coinsEarned,
    blocksMined: currentBlocksMined,
    realMoney: Math.max(0, gameState.realMoney - electricityDrained),
    difficulty: calculateDifficulty(currentBlocksMined),
    currentReward: calculateCurrentReward(currentBlocksMined),
    nextHalving: calculateNextHalving(currentBlocksMined),
    lastSaveTime: now,
    iapState: gameState.iapState ? {
      ...gameState.iapState,
      offlineMiner: offlineMinerExpired
        ? { isActive: false, activatedAt: null, expiresAt: null }
        : offlineMiner,
    } : gameState.iapState,
  };
};

export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toFixed(1);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  return (num / 1000000000000).toFixed(1) + 'T';
};

import { UNLOCK_CONFIG, HARDWARE_CONFIG, BOOSTER_CONFIG, BALANCE_CONFIG, BLOCK_CONFIG } from '../config/balanceConfig';

// Rango del seed: 90000–96000 → BTC/seed ≈ volatility factor around 1.0
const PRICE_SEED_MIN = 90000;
const PRICE_SEED_RANGE = 6000; // 90000–96000
// Punto de inicio acotado al primer mes para garantizar ≥2 meses antes del loop
const FIRST_MONTH_POINTS = 30 * 24 * 60; // 43,200

export const generatePriceSeed = (): number =>
  Math.floor(Math.random() * PRICE_SEED_RANGE) + PRICE_SEED_MIN;

export const generatePriceStartIndex = (): number =>
  Math.floor(Math.random() * FIRST_MONTH_POINTS);

// Era 0 base price ($0.10) × BTC volatility factor
export const getInitialChartWindow = (startIndex: number, seed: number): number[] =>
  Array.from({ length: 30 }, (_, i) => {
    const idx = (startIndex - 29 + i + BTC_PRICE_HISTORY.length) % BTC_PRICE_HISTORY.length;
    const eraBasePrice = BLOCK_CONFIG.ERA_BASE_PRICES[0]; // Era 0
    return eraBasePrice * (BTC_PRICE_HISTORY[idx] / seed);
  });

// Progressive unlock system
export const UNLOCK_REQUIREMENTS = {
  MARKET_BLOCKS: UNLOCK_CONFIG.market.requiredBlocks,
  MARKET_COINS: UNLOCK_CONFIG.market.requiredCoins,
  HARDWARE_MONEY: UNLOCK_CONFIG.hardware.requiredMoney,
  UPGRADES_HARDWARE: UNLOCK_CONFIG.upgrades.requiredHardware,
  PRESTIGE_LEVEL: UNLOCK_CONFIG.prestige.requiredLevel,
};

export const checkAndUpdateUnlocks = (gameState: GameState): GameState => {
  const newUnlockedTabs = {
    ...gameState.unlockedTabs,
    energy: gameState.unlockedTabs?.energy ?? false,
    chronicle: gameState.unlockedTabs?.chronicle ?? false,
  };

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

  // Unlock Prestige: when blocksMined reaches 21M OR player has already prestiged
  // Once unlocked it stays unlocked
  if (!newUnlockedTabs.prestige &&
      (gameState.blocksMined >= GENESIS_CONSTANTS.TOTAL_BLOCKS || gameState.prestigeLevel >= 1)) {
    newUnlockedTabs.prestige = true;
  }
  // Also keep it unlocked if already unlocked
  if (gameState.unlockedTabs?.prestige) {
    newUnlockedTabs.prestige = true;
  }

  // Unlock Energy tab: when player has >= 1 hardware of tier 9+
  if (!newUnlockedTabs.energy &&
      gameState.hardware.some(h => h.energyRequired > 0 && h.owned > 0)) {
    newUnlockedTabs.energy = true;
  }

  // Unlock Chronicle tab: when first narrative event has fired
  if (!newUnlockedTabs.chronicle && (gameState.narrativeEvents?.length ?? 0) > 0) {
    newUnlockedTabs.chronicle = true;
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

  // For other hardware, check if previous level has required units
  const previousLevel = hardware.level - 1;
  const previousHardware = gameState.hardware.find(h => h.level === previousLevel);

  if (!previousHardware) return false;

  return previousHardware.owned >= HARDWARE_CONFIG.UNLOCK_REQUIREMENT;
};

export const getInitialGameState = (): GameState => {
  const priceSeed = generatePriceSeed();
  const priceHistoryIndex = generatePriceStartIndex();
  const eraBasePrice = BLOCK_CONFIG.ERA_BASE_PRICES[0]; // Era 0
  const initialCCPrice = eraBasePrice * (BTC_PRICE_HISTORY[priceHistoryIndex] / priceSeed);

  return {
    isHydrated: false,
    cryptoCoins: 0,
    cryptoCoinsPerSecond: 0,
    totalElectricityCost: 0,
    cryptocurrencies: cryptocurrencies.map(c =>
      c.id === 'cryptocoin' ? { ...c, currentValue: initialCCPrice } : c
    ),
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
    // New prestige fields
    prestigeProductionMultiplier: 1,
    prestigeClickMultiplier: 1,
    prestigeHistory: [],
    unlockedBadges: [],
    currentRunStartTime: Date.now(),
    currentRunStats: {
      blocksMinedThisRun: 0,
      coinsEarnedThisRun: 0,
      moneyEarnedThisRun: 0,
      hardwarePurchasedThisRun: 0,
      upgradesPurchasedThisRun: 0,
      playtimeThisRun: 0,
    },
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
      energy: false,
      chronicle: false,
    },
    // Real money system
    realMoney: 0,
    totalRealMoneyEarned: 0,
    // Price history system
    priceSeed,
    priceHistoryIndex,
    priceHistory: {
      cryptocoin: {
        prices: getInitialChartWindow(priceHistoryIndex, priceSeed),
        lastUpdate: Date.now(),
      },
    },
    // Achievements
    achievements: ALL_ACHIEVEMENTS,
    // Energy system
    energy: getInitialEnergyState(),
    planetResources: 100,
    // AI system (Phase 5)
    ai: getInitialAIState(),
    aiCryptosUnlocked: [],
    // Narrative Events system (Phase 6)
    narrativeEvents: [],
    planetResourcesVisible: false,
    collapseTriggered: false,
    // Endgame system (Phase 7)
    goodEndingTriggered: false,
    collapseCount: 0,
    goodEndingCount: 0,
    lastEndgameStats: null,
    disconnectAttempted: false,
  } as GameState;
};
