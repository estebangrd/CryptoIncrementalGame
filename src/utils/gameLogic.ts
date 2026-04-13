import { GameState, Hardware, Upgrade, IAPState, AdState, AdBoostState, AdHashBoostState, AdMarketBoostState } from '../types/game';
import { GENESIS_CONSTANTS, calculateDifficulty, calculateCurrentReward, calculateNextHalving, getBasePrice, getEra } from './blockLogic';
import { generateInitialChartWindow, getInitialPriceEngineState } from './priceEngine';
import { getInitialEnergyState, getActiveHardwareWithEnergyConstraint } from './energyLogic';
import { getAIProductionMultiplier, getInitialAIState } from './aiLogic';
import { getBadgeProductionMultiplier } from './prestigeLogic';
import { hardwareProgression } from '../data/hardwareData';
import { initialUpgrades } from '../data/gameData';
import { cryptocurrencies } from '../data/cryptocurrencies';
import { ALL_ACHIEVEMENTS } from '../data/achievements';

export const isHardwareEnabled = (hw: Hardware): boolean => hw.isEnabled !== false;

export const calculateHardwareCost = (hardware: Hardware): number => {
  return Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));
};

export const calculateHardwareProduction = (hardware: Hardware, upgrades: Upgrade[]): number => {
  if (!isHardwareEnabled(hardware)) return 0;
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
  if (!isHardwareEnabled(hardware)) return 0;
  return hardware.electricityCost * hardware.owned;
};

export const calculateTotalElectricityCost = (hardware: Hardware[]): number => {
  return hardware.reduce((total, h) => total + calculateHardwareElectricityCost(h), 0);
};

/**
 * Energy-aware electricity cost: only charge for hardware that is actually mining.
 * Hardware requiring MW but lacking energy pays 0 (not producing = not consuming).
 */
export const calculateConstrainedElectricityCost = (
  hardware: Hardware[],
  totalGeneratedMW: number,
): number => {
  const activeMap: Record<string, number> = {};
  const energyResult = getActiveHardwareWithEnergyConstraint(hardware, totalGeneratedMW);
  for (const hw of energyResult) {
    activeMap[hw.id] = hw.activeUnits;
  }

  return hardware.reduce((total, h) => {
    if (!isHardwareEnabled(h) || h.owned === 0) return total;
    const effectiveOwned = h.energyRequired > 0
      ? (activeMap[h.id] ?? 0)
      : h.owned;
    return total + h.electricityCost * effectiveOwned;
  }, 0);
};

export const calculateHardwareMiningSpeed = (hardware: Hardware, upgrades: Upgrade[]): number => {
  if (!isHardwareEnabled(hardware)) return 0;
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

  // Ad bubble hash rate boost (+20%)
  let adHashMultiplier = 1.0;
  if (gameState.adHashBoost?.isActive && gameState.adHashBoost.expiresAt !== null) {
    if (Date.now() < gameState.adHashBoost.expiresAt) {
      adHashMultiplier = AD_BUBBLE_CONFIG.HASH_BOOST.multiplier;
    }
  }

  const badgeProductionMultiplier = getBadgeProductionMultiplier(gameState.unlockedBadges || []);

  return prestigeMultiplier * badgeProductionMultiplier * adBoostMultiplier * permanentMultiplier * iapBoosterMultiplier * aiMultiplier * adHashMultiplier;
};

/**
 * Returns energy-constrained mining speed (excludes manual_mining).
 */
export const getConstrainedMiningSpeed = (gameState: GameState): number => {
  const energyState = gameState.energy;
  const totalGeneratedMW = (energyState?.totalGeneratedMW ?? 0) + (gameState.energyBonusMW ?? 0);
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
    if (!isHardwareEnabled(hardware)) return;

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

  const difficulty = calculateDifficulty(constrainedMiningSpeed);
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
    if (!isHardwareEnabled(hardware)) return;
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

  const offlineMiner = gameState.iapState?.offlineMiner;
  const hasActiveOfflineMiner = offlineMiner?.isActive && offlineMiner.expiresAt;

  // ── IAP Offline Miner path (auto-credit at 50% + premium modal) ──
  if (hasActiveOfflineMiner) {
    const offlineEnd = Math.min(now, offlineMiner.expiresAt!);
    const offlineMs = Math.max(0, offlineEnd - lastSave);
    const offlineSec = offlineMs / 1000;

    if (offlineSec <= 0) {
      return { ...gameState, lastSaveTime: now, pendingPremiumOffline: null };
    }

    const constrainedMiningSpeed = getConstrainedMiningSpeed(gameState);
    const allMult = getAllMultipliers(gameState);
    const offlineSpeed = constrainedMiningSpeed * allMult * BALANCE_CONFIG.OFFLINE_EARNINGS_MULTIPLIER;

    const difficulty = calculateDifficulty(constrainedMiningSpeed);
    const blocksPerSec = offlineSpeed / difficulty;
    const totalBlocks = Math.floor(blocksPerSec * offlineSec);

    let coinsEarned = 0;
    let blocksRemaining = totalBlocks;
    let currentBlocksMined = gameState.blocksMined;

    while (blocksRemaining > 0 && currentBlocksMined < GENESIS_CONSTANTS.TOTAL_BLOCKS) {
      const reward = calculateCurrentReward(currentBlocksMined);
      const nextHalving = calculateNextHalving(currentBlocksMined);
      const blocksUntilHalving = nextHalving - currentBlocksMined;
      const blocksThisBatch = Math.min(blocksRemaining, blocksUntilHalving, GENESIS_CONSTANTS.TOTAL_BLOCKS - currentBlocksMined);

      coinsEarned += blocksThisBatch * reward;
      currentBlocksMined += blocksThisBatch;
      blocksRemaining -= blocksThisBatch;
    }

    const electricityWeight = gameState.totalElectricityCost ?? 0;
    const ccFeeDrained = electricityWeight * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100 * offlineSec;
    const offlineMinerExpired = now >= offlineMiner.expiresAt!;
    const netCoins = Math.max(0, coinsEarned - ccFeeDrained);

    // Build premium modal data (skip for short absences or zero earnings)
    const showPremiumModal = offlineSec >= OFFLINE_SCREEN_CONFIG.PREMIUM_MIN_OFFLINE_SECONDS && netCoins > 0;

    return {
      ...gameState,
      cryptoCoins: Math.max(0, gameState.cryptoCoins + netCoins),
      totalCryptoCoins: gameState.totalCryptoCoins + coinsEarned,
      blocksMined: currentBlocksMined,
      difficulty: calculateDifficulty(constrainedMiningSpeed),
      currentReward: calculateCurrentReward(currentBlocksMined),
      nextHalving: calculateNextHalving(currentBlocksMined),
      lastSaveTime: now,
      pendingPremiumOffline: showPremiumModal ? {
        grossCoins: coinsEarned,
        feeCoins: ccFeeDrained,
        netCoins,
        secondsAway: offlineSec,
        blocksProcessed: totalBlocks,
        boosterExpiresAt: offlineMiner.expiresAt!,
        boosterActivatedAt: offlineMiner.activatedAt ?? offlineMiner.expiresAt! - BOOSTER_CONFIG.OFFLINE_MINER.baseDurationMs,
        boosterExpired: offlineMinerExpired,
      } : null,
      iapState: gameState.iapState ? {
        ...gameState.iapState,
        offlineMiner: offlineMinerExpired
          ? { isActive: false, activatedAt: null, expiresAt: null }
          : offlineMiner,
      } : gameState.iapState,
    };
  }

  // ── Free offline earnings path — store as pending (requires ad to claim) ──
  const rawOfflineSec = Math.max(0, (now - lastSave) / 1000);

  if (rawOfflineSec < OFFLINE_SCREEN_CONFIG.MIN_OFFLINE_SECONDS) {
    return { ...gameState, lastSaveTime: now };
  }

  const wasCapped = rawOfflineSec > OFFLINE_SCREEN_CONFIG.MAX_OFFLINE_SECONDS;
  const cappedSec = Math.min(rawOfflineSec, OFFLINE_SCREEN_CONFIG.MAX_OFFLINE_SECONDS);

  const constrainedMiningSpeed = getConstrainedMiningSpeed(gameState);
  const allMult = getAllMultipliers(gameState);
  const speed = constrainedMiningSpeed * allMult * BALANCE_CONFIG.OFFLINE_EARNINGS_MULTIPLIER;

  if (speed <= 0) {
    return { ...gameState, lastSaveTime: now };
  }

  const difficulty = calculateDifficulty(constrainedMiningSpeed);
  const blocksPerSec = speed / difficulty;
  const rawTotalBlocks = Math.floor(blocksPerSec * cappedSec);

  // Cap offline block advancement to MAX_OFFLINE_ERA_ADVANCE eras
  const startEra = getEra(gameState.blocksMined);
  const maxEra = startEra + OFFLINE_SCREEN_CONFIG.MAX_OFFLINE_ERA_ADVANCE;
  const maxBlocksByEra = (maxEra + 1) * GENESIS_CONSTANTS.HALVING_INTERVAL - gameState.blocksMined;
  const totalBlocks = Math.min(rawTotalBlocks, maxBlocksByEra);

  let coinsEarned = 0;
  let blocksRemaining = totalBlocks;
  let currentBlocksMined = gameState.blocksMined;

  while (blocksRemaining > 0 && currentBlocksMined < GENESIS_CONSTANTS.TOTAL_BLOCKS) {
    const reward = calculateCurrentReward(currentBlocksMined);
    const nextHalving = calculateNextHalving(currentBlocksMined);
    const blocksUntilHalving = nextHalving - currentBlocksMined;
    const blocksThisBatch = Math.min(blocksRemaining, blocksUntilHalving, GENESIS_CONSTANTS.TOTAL_BLOCKS - currentBlocksMined);

    coinsEarned += blocksThisBatch * reward;
    currentBlocksMined += blocksThisBatch;
    blocksRemaining -= blocksThisBatch;
  }

  const electricityWeight = gameState.totalElectricityCost ?? 0;
  const ccFeeDrained = electricityWeight * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100 * cappedSec;
  const netCoins = Math.max(0, coinsEarned - ccFeeDrained);

  if (netCoins <= 0) {
    return { ...gameState, lastSaveTime: now };
  }

  return {
    ...gameState,
    lastSaveTime: now,
    pendingOfflineEarnings: netCoins,
    offlineSecondsAway: rawOfflineSec,
    offlineWasCapped: wasCapped,
    offlineBlocksProcessed: totalBlocks,
  };
};

/**
 * Apply claimed offline earnings to game state, updating genesis stats
 * (blocksMined, difficulty, currentReward, nextHalving) so offline blocks
 * count toward genesis progression — CC must not appear out of thin air.
 */
export const claimOfflineEarnings = (gameState: GameState, claimAmount: number): GameState => {
  const newBlocksMined = Math.min(
    gameState.blocksMined + (gameState.offlineBlocksProcessed ?? 0),
    GENESIS_CONSTANTS.TOTAL_BLOCKS,
  );
  const constrainedMiningSpeed = getConstrainedMiningSpeed(gameState);

  return {
    ...gameState,
    cryptoCoins: gameState.cryptoCoins + claimAmount,
    totalCryptoCoins: gameState.totalCryptoCoins + claimAmount,
    blocksMined: newBlocksMined,
    difficulty: calculateDifficulty(constrainedMiningSpeed),
    currentReward: calculateCurrentReward(newBlocksMined),
    nextHalving: calculateNextHalving(newBlocksMined),
    pendingOfflineEarnings: 0,
    offlineSecondsAway: 0,
    offlineWasCapped: false,
    offlineBlocksProcessed: 0,
  };
};

/**
 * Credit CC to the player and advance blocksMined by the equivalent number
 * of blocks at current reward rate(s). Handles halving boundaries.
 * Used by packs, achievements, and any instant CC reward.
 */
export const creditCryptoCoins = (gameState: GameState, ccAmount: number): GameState => {
  let ccRemaining = ccAmount;
  let currentBlocksMined = gameState.blocksMined;

  while (ccRemaining > 0 && currentBlocksMined < GENESIS_CONSTANTS.TOTAL_BLOCKS) {
    const reward = calculateCurrentReward(currentBlocksMined);
    const nextHalving = calculateNextHalving(currentBlocksMined);
    const blocksUntilHalving = nextHalving - currentBlocksMined;
    const blocksUntilCap = GENESIS_CONSTANTS.TOTAL_BLOCKS - currentBlocksMined;
    const blocksForCC = Math.ceil(ccRemaining / reward);
    const blocksThisBatch = Math.min(blocksForCC, blocksUntilHalving, blocksUntilCap);

    ccRemaining -= blocksThisBatch * reward;
    currentBlocksMined += blocksThisBatch;
  }

  const constrainedMiningSpeed = getConstrainedMiningSpeed(gameState);

  return {
    ...gameState,
    cryptoCoins: gameState.cryptoCoins + ccAmount,
    totalCryptoCoins: gameState.totalCryptoCoins + ccAmount,
    blocksMined: currentBlocksMined,
    difficulty: calculateDifficulty(constrainedMiningSpeed),
    currentReward: calculateCurrentReward(currentBlocksMined),
    nextHalving: calculateNextHalving(currentBlocksMined),
  };
};

/**
 * Returns the current CryptoCoin market price (USD per CC), falling back
 * to the era base price when no market history is available.
 */
export const getCurrentCoinPrice = (gameState: GameState): number => {
  const history = gameState.priceHistory?.cryptocoin?.prices;
  const latest = history && history.length > 0 ? history[history.length - 1] : 0;
  return latest > 0 ? latest : getBasePrice(gameState.blocksMined ?? 0);
};

/**
 * Computes a CC + cash reward scaled by `durationMinutes` of current
 * production, using $/s as the stable metric across halving eras. Falls
 * back to `floorUSD` in early game when production is still microscopic.
 *
 * The CC component is derived by converting the target USD value back to
 * CC at the current coin price, ensuring monotonicity: as the player
 * progresses the $ value either grows (from production) or stays at
 * `floorUSD`, but never explodes from a fixed CC floor × an era-inflated
 * coin price.
 *
 * `cashSplit` (0..1) controls how the target USD is distributed between
 * the CC grant (scaled by coinPrice) and the direct cash grant. Default
 * 0.5 — half in CC, half in cash — so packs deliver both currencies.
 */
export const calculateRewardFromDuration = (
  gameState: GameState,
  durationMinutes: number,
  floorUSD: number,
  cashSplit: number = 0.5,
): { cc: number; cash: number; targetUSD: number } => {
  const durationSec = Math.max(0, durationMinutes) * 60;
  const ccPerSec = Math.max(0, calculateTotalProduction(gameState));
  const coinPrice = Math.max(0, getCurrentCoinPrice(gameState));
  const dollarsPerSec = ccPerSec * coinPrice;

  // $/s × duration gives the production-equivalent $ value; fall back to
  // floorUSD in early game (or if production/price are momentarily zero).
  const productionUSD = dollarsPerSec * durationSec;
  const targetUSD = Math.max(floorUSD, productionUSD);

  const clampedSplit = Math.min(1, Math.max(0, cashSplit));
  const ccUSDPortion = targetUSD * (1 - clampedSplit);
  const cashUSDPortion = targetUSD * clampedSplit;

  // Convert CC portion back to CC count. Guard against zero price (very
  // early game before OU engine has emitted a price) by using era base.
  const effectivePrice = coinPrice > 0 ? coinPrice : getBasePrice(gameState.blocksMined ?? 0);
  const cc = effectivePrice > 0 ? ccUSDPortion / effectivePrice : 0;

  return { cc, cash: cashUSDPortion, targetUSD };
};

/**
 * Canonical compact formatter for CryptoCoin amounts and generic counts
 * (hash rate, blocks mined, percentages). No currency prefix.
 *
 * Ranges:
 * - 0 or non-finite           → "0"   (no decimals — finance convention)
 * - (0, 1)                    → 2 significant digits, e.g. "0.023", "0.00056"
 * - [1, 1000)                 → up to 1 decimal, trimmed when round:
 *                               "276", "123.4" (never "276.0")
 * - [1K, 1M, 1B, 1T, 1Q)      → suffix with up to 1 decimal, trimmed when
 *                               round: "1.5K", "2K", "45.8M" (never "2.0K")
 * - ≥ 1e18                    → scientific notation, e.g. "1.23e+18"
 *
 * Use this for anything that is NOT a USD $ amount. For USD use `formatUSD`.
 */
export const formatNumber = (num: number): string => {
  if (!isFinite(num)) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs === 0) return '0';
  if (abs < 0.001) {
    // Scientific notation for very small values (e.g., 1.5e-6 instead of 0.0000015)
    return sign + abs.toExponential(1);
  }
  if (abs < 1) {
    // Adaptive precision: keep 2 significant digits so tiny values stay legible
    // (e.g., 0.023, 0.56) instead of collapsing to "0.0".
    return sign + Number(abs.toPrecision(2)).toString();
  }
  if (abs < 1000) return sign + trimTrailingDecimalZeros(abs.toFixed(1));
  if (abs < 1e6) return sign + trimTrailingDecimalZeros((abs / 1e3).toFixed(1)) + 'K';
  if (abs < 1e9) return sign + trimTrailingDecimalZeros((abs / 1e6).toFixed(1)) + 'M';
  if (abs < 1e12) return sign + trimTrailingDecimalZeros((abs / 1e9).toFixed(1)) + 'B';
  if (abs < 1e15) return sign + trimTrailingDecimalZeros((abs / 1e12).toFixed(1)) + 'T';
  if (abs < 1e18) return sign + trimTrailingDecimalZeros((abs / 1e15).toFixed(1)) + 'Qa';
  if (abs < 1e21) return sign + trimTrailingDecimalZeros((abs / 1e18).toFixed(1)) + 'Qi';
  if (abs < 1e24) return sign + trimTrailingDecimalZeros((abs / 1e21).toFixed(1)) + 'Sx';
  if (abs < 1e27) return sign + trimTrailingDecimalZeros((abs / 1e24).toFixed(1)) + 'Sp';
  if (abs < 1e30) return sign + trimTrailingDecimalZeros((abs / 1e27).toFixed(1)) + 'Oc';
  return sign + abs.toExponential(2);
};

/**
 * Trim trailing zero decimals from a fixed-decimal string while keeping any
 * meaningful fractional part. Examples:
 *   "276.0"  → "276"
 *   "276.5"  → "276.5"
 *   "2.00"   → "2"
 *   "1.50"   → "1.5"
 *   "1.05"   → "1.05"
 * Safe on integer strings ("10" stays "10") because it short-circuits when
 * there is no decimal point.
 */
const trimTrailingDecimalZeros = (s: string): string => {
  if (!s.includes('.')) return s;
  return s.replace(/\.?0+$/, '').replace(/\.$/, '');
};

/**
 * Alias of `formatNumber` for semantic clarity when formatting CryptoCoin
 * amounts. Prefer `formatCC` for CC values in the UI so intent is obvious.
 */
export const formatCC = formatNumber;

/**
 * Canonical compact formatter for USD money amounts. Always emits the `$`
 * prefix so callers never need to prepend it themselves.
 *
 * Ranges:
 * - 0 or non-finite            → "$0"  (no decimals — finance convention)
 * - (0, 1e-4)                  → exponential, e.g. "$1.23e-5"
 * - [1e-4, 0.01)               → up to 6 decimals, e.g. "$0.000123"
 * - [0.01, 100)                → up to 4 decimals, trim trailing zeros beyond
 *                                the cents, e.g. "$25.00", "$1.0857"
 *                                (fine precision so minute-by-minute market
 *                                 price changes stay visible in the chart,
 *                                 but round hardware prices don't show zeros)
 * - [100, 1000)                → 2 decimals, e.g. "$123.45"
 * - [1K, 1M, 1B, 1T, 1Q)       → suffix with 2 decimals, e.g. "$1.23M"
 * - ≥ 1e18                     → scientific notation, e.g. "$1.23e+18"
 *
 * Use this for ANY USD value in the UI (prices, balances, costs, earnings).
 */
export const formatUSD = (num: number): string => {
  if (!isFinite(num) || num === 0) return '$0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs < 1e-4) return sign + '$' + abs.toExponential(2);
  if (abs < 0.01) return sign + '$' + trimUSDDecimals(abs.toFixed(6));
  if (abs < 0.10) return sign + '$' + trimUSDDecimals(abs.toFixed(4));
  if (abs < 10) return sign + '$' + trimUSDDecimals(abs.toFixed(2));
  if (abs < 1000) return sign + '$' + abs.toFixed(2);
  if (abs < 1e6) return sign + '$' + (abs / 1e3).toFixed(2) + 'K';
  if (abs < 1e9) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
  if (abs < 1e12) return sign + '$' + (abs / 1e9).toFixed(2) + 'B';
  if (abs < 1e15) return sign + '$' + (abs / 1e12).toFixed(2) + 'T';
  if (abs < 1e18) return sign + '$' + (abs / 1e15).toFixed(2) + 'Q';
  return sign + '$' + abs.toExponential(2);
};

/**
 * Trim trailing zeros in a decimal string while preserving at least 2 decimals
 * (cent precision — finance convention). Used by `formatUSD` so round amounts
 * like "25.0000" render as "25.00" while sub-cent prices like "1.0857" keep
 * their extra precision.
 */
const trimUSDDecimals = (fixed: string): string => {
  const m = fixed.match(/^(-?\d+\.\d{2})(\d*)$/);
  if (!m) return fixed;
  const extra = m[2].replace(/0+$/, '');
  return m[1] + extra;
};

/**
 * Compact USD formatter for dense stat cards where cent precision adds noise.
 * Uses at most 1 decimal and trims trailing zeros.
 *
 * Ranges:
 * - 0 or non-finite            → "$0"
 * - (0, 1e-4)                  → exponential, e.g. "$1.23e-5"
 * - [1e-4, 1)                  → up to 2 decimals trimmed, e.g. "$0.86"
 * - [1, 1000)                  → up to 1 decimal trimmed, e.g. "$25", "$25.5"
 * - [1K, 1M, 1B, 1T, 1Q)       → suffix with up to 1 decimal trimmed,
 *                                e.g. "$1.2K", "$3M", "$45.8M"
 * - ≥ 1e18                     → scientific notation
 *
 * Use for stat cards, dashboards, and dense UIs. For transactional displays
 * (store, market, balances) prefer `formatUSD` which keeps cent precision.
 */
export const formatUSDCompact = (num: number): string => {
  if (!isFinite(num) || num === 0) return '$0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs < 1e-4) return sign + '$' + abs.toExponential(2);
  if (abs < 1) return sign + '$' + trimTrailingDecimalZeros(abs.toFixed(2));
  if (abs < 1000) return sign + '$' + trimTrailingDecimalZeros(abs.toFixed(1));
  if (abs < 1e6) return sign + '$' + trimTrailingDecimalZeros((abs / 1e3).toFixed(1)) + 'K';
  if (abs < 1e9) return sign + '$' + trimTrailingDecimalZeros((abs / 1e6).toFixed(1)) + 'M';
  if (abs < 1e12) return sign + '$' + trimTrailingDecimalZeros((abs / 1e9).toFixed(1)) + 'B';
  if (abs < 1e15) return sign + '$' + trimTrailingDecimalZeros((abs / 1e12).toFixed(1)) + 'T';
  if (abs < 1e18) return sign + '$' + trimTrailingDecimalZeros((abs / 1e15).toFixed(1)) + 'Qa';
  if (abs < 1e21) return sign + '$' + trimTrailingDecimalZeros((abs / 1e18).toFixed(1)) + 'Qi';
  if (abs < 1e24) return sign + '$' + trimTrailingDecimalZeros((abs / 1e21).toFixed(1)) + 'Sx';
  if (abs < 1e27) return sign + '$' + trimTrailingDecimalZeros((abs / 1e24).toFixed(1)) + 'Sp';
  if (abs < 1e30) return sign + '$' + trimTrailingDecimalZeros((abs / 1e27).toFixed(1)) + 'Oc';
  return sign + '$' + abs.toExponential(2);
};

export const formatSignedNumber = (num: number): string => {
  const prefix = num > 0 ? '+' : '';
  return prefix + formatNumber(num);
};

import { UNLOCK_CONFIG, HARDWARE_CONFIG, BOOSTER_CONFIG, BALANCE_CONFIG, ELECTRICITY_FEE_CONFIG, AD_BUBBLE_CONFIG, OFFLINE_SCREEN_CONFIG } from '../config/balanceConfig';

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
  const initialPrices = generateInitialChartWindow(0);
  const initialCCPrice = initialPrices[initialPrices.length - 1];
  const priceState = getInitialPriceEngineState();

  return {
    isHydrated: false,
    cryptoCoins: 0,
    cryptoCoinsPerSecond: 0,
    totalElectricityCost: 0,
    cryptocurrencies: cryptocurrencies.map(c =>
      c.id === 'cryptocoin' ? { ...c, currentValue: initialCCPrice } : c
    ),
    hardware: hardwareProgression,
    upgrades: initialUpgrades,
    lastSaveTime: Date.now(),
    totalClicks: 0,
    totalCryptoCoins: 0,
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    marketUpdateTime: Date.now(),
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
    blockAccumulator: 0,
    totalBlocks: GENESIS_CONSTANTS.TOTAL_BLOCKS,
    currentReward: GENESIS_CONSTANTS.INITIAL_REWARD,
    nextHalving: GENESIS_CONSTANTS.HALVING_INTERVAL,
    difficulty: GENESIS_CONSTANTS.INITIAL_DIFFICULTY,
    totalHashRate: 0,
    phase: 'genesis',
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
    // Price engine (Ornstein-Uhlenbeck)
    priceDeviation: priceState.priceDeviation,
    priceRegime: priceState.priceRegime,
    priceRegimeTicksLeft: priceState.priceRegimeTicksLeft,
    priceHistory: {
      cryptocoin: {
        prices: initialPrices,
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
    // Offline earnings modal
    pendingOfflineEarnings: 0,
    offlineSecondsAway: 0,
    offlineWasCapped: false,
    offlineBlocksProcessed: 0,
    pendingPremiumOffline: null,
    // IAP & Ad state
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
      flashSaleExpiresAt: 0,
      flashSaleCooldownUntil: 0,
      packOfferExpiresAt: 0,
      packNextOfferAt: 0,
      packCurrentCC: 0,
      packCurrentCash: 0,
      packCurrentElectricityHours: 0,
      offlineMiner: { isActive: false, activatedAt: null, expiresAt: null },
      luckyBlock: { isActive: false, blocksRemaining: 0 },
      marketPump: { isActive: false, activatedAt: null, expiresAt: null },
    } as IAPState,
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
    } as AdState,
    adBoost: {
      isActive: false,
      activatedAt: null,
      expiresAt: null,
      lastWatchedAt: null,
    } as AdBoostState,
    adHashBoost: { isActive: false, activatedAt: null, expiresAt: null } as AdHashBoostState,
    adMarketBoost: { isActive: false, activatedAt: null, expiresAt: null } as AdMarketBoostState,
    energyBonusMW: 0,
    // Market events
    activeMarketEvents: [],
    lastRandomEventCheck: Date.now(),
    lastPriceTickEra: 0,
    rationingPenaltyUntil: 0,
  } as GameState;
};
