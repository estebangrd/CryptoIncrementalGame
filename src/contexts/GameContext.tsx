import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GameState, Cryptocurrency, PrestigeRun, RunStats, AILevel, EndingType, OfflineMinerState, LuckyBlockState, MarketPumpState, RegulatoryPressureEvent, MarketOpportunityEvent } from '../types/game';
import { hardwareProgression } from '../data/hardwareData';
import { initialUpgrades } from '../data/gameData';
import { cryptocurrencies } from '../data/cryptocurrencies';
import { getInitialGameState, updateOfflineProgress, checkAndUpdateUnlocks } from '../utils/gameLogic';
import { tickOU, generateInitialChartWindow, getInitialPriceEngineState, smoothEraTransition } from '../utils/priceEngine';
import {
  canPrestige,
  calculateProductionMultiplier,
  calculateClickMultiplier,
  checkBadgeUnlocks,
} from '../utils/prestigeLogic';
import { performExchange } from '../utils/exchangeLogic';
import {
  calculateCurrentReward,
  calculateNextHalving,
  calculateDifficulty,
  getBasePrice,
  mineBlock,
  canMineBlock
} from '../utils/blockLogic';
import {
  calculateTotalElectricityCost,
  calculateTotalProduction,
  calculateTotalHashRate,
  getAllMultipliers,
  getConstrainedMiningSpeed,
} from '../utils/gameLogic';
import {
  updateMarketState,
  processNPCPurchase,
  updateMarketAfterTransaction,
  getInitialMarketState
} from '../utils/marketLogic';
import { saveGameState, loadGameState, saveLanguage, loadLanguage } from '../utils/storage';
import { translations } from '../data/translations';
import { initializeAdMob, loadInterstitial, showInterstitialIfEligible } from '../services/AdMobService';
import {
  initializeIAP,
  getProducts,
  completePurchase,
  terminateIAP,
  isStarterPack,
  registerDevPurchaseCallback,
} from '../services/IAPService';
import { purchaseUpdatedListener, purchaseErrorListener } from 'react-native-iap';
import { BOOSTER_CONFIG, STARTER_PACK_REWARDS, ENERGY_CONFIG, PACK_CONFIG, REGULATORY_EVENT_CONFIG, MARKET_OPPORTUNITY_CONFIG, LOCAL_PROTEST_CONFIG, ELECTRICITY_FEE_CONFIG, AD_BUBBLE_CONFIG, AI_CONFIG } from '../config/balanceConfig';
import { buildEndgameStats, calculateTotalEndgameProductionMultiplier } from '../utils/endgameLogic';
import Toast, { ToastInfo } from '../components/Toast';
import { IAP_PRODUCT_IDS } from '../config/iapConfig';
import { PurchaseRecord } from '../types/game';
import { checkAchievements, mergeAchievements } from '../utils/achievementLogic';
import { ALL_ACHIEVEMENTS } from '../data/achievements';
import {
  getInitialEnergyState,
  buildEnergySource,
  demolishEnergySource,
  canBuildEnergySource,
  calculatePlanetDepletion,
  recalculateEnergyTotals,
  calculateTotalRequiredMW,
  getEffectiveRenewableCap,
  getEnergySourceCurrentCost,
  calculateRenewableGeneratedMW,
} from '../utils/energyLogic';
import {
  getInitialAIState,
  canPurchaseAILevel,
  addAILogEntry,
  getAIUnlockedCrypto,
  getAIPreferredEnergySource,
  generateAISuggestion,
} from '../utils/aiLogic';
import { checkNarrativeThresholds } from '../utils/narrativeLogic';
import { logEvent, initializeAnalytics } from '../services/analytics';
import { trackAction } from '../services/analytics/analyticsMiddleware';

interface GameContextType {
  gameState: GameState;
  currentLanguage: string;
  t: (key: string) => string;
  dispatch: React.Dispatch<GameAction>;
  setLanguage: (languageCode: string) => void;
  showToast: (message: string, type?: ToastInfo['type']) => void;
}

export type GameAction =
  | { type: 'BUY_HARDWARE'; payload: string }
  | { type: 'BUY_UPGRADE'; payload: string }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'RESET_GAME' }
  | { type: 'SET_HYDRATED' }
  | { type: 'UPDATE_OFFLINE_PROGRESS' }
  | { type: 'ADD_PRODUCTION' }
  | { type: 'SELECT_CURRENCY'; payload: string | null }
  | { type: 'UPDATE_MARKET' }
  | { type: 'DO_PRESTIGE' }
  | { type: 'EXCHANGE_CURRENCY'; payload: { fromCurrency: string; toCurrency: string; amount: number } }
  | { type: 'MINE_BLOCK' }
  | { type: 'UPDATE_MARKET_STATE' }
  | { type: 'ADVANCE_PRICE_INDEX' }
  | { type: 'SELL_TO_NPC'; payload: { npcId: string; amount: number } }
  | { type: 'SELL_COINS_FOR_MONEY'; payload: { amount: number; price: number } }
  | { type: 'BUY_HARDWARE_WITH_MONEY'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'UPDATE_CRYPTO_PRICES' }
  | { type: 'UPDATE_CRYPTOCURRENCY_PRICES'; payload: Cryptocurrency[] }
  | { type: 'PURCHASE_REMOVE_ADS'; payload: PurchaseRecord }
  | { type: 'PURCHASE_BOOSTER_2X'; payload: PurchaseRecord }
  | { type: 'PURCHASE_BOOSTER_5X'; payload: PurchaseRecord }
  | { type: 'EXPIRE_BOOSTER_2X' }
  | { type: 'EXPIRE_BOOSTER_5X' }
  | { type: 'CHECK_BOOSTER_EXPIRATION' }
  | { type: 'PURCHASE_PERMANENT_MULTIPLIER'; payload: PurchaseRecord }
  | { type: 'PURCHASE_STARTER_PACK'; payload: { packType: 'small' | 'medium' | 'large' | 'mega'; record: PurchaseRecord } }
  | { type: 'RESTORE_PURCHASES'; payload: string[] }
  | { type: 'SET_IAP_PURCHASING'; payload: boolean }
  | { type: 'ACTIVATE_AD_BOOST' }
  | { type: 'EXPIRE_AD_BOOST' }
  | { type: 'CHECK_AD_BOOST_EXPIRATION' }
  | { type: 'ACTIVATE_AD_HASH_BOOST' }
  | { type: 'EXPIRE_AD_HASH_BOOST' }
  | { type: 'ACTIVATE_AD_MARKET_BOOST' }
  | { type: 'EXPIRE_AD_MARKET_BOOST' }
  | { type: 'AD_ENERGY_RESTORE' }
  | { type: 'CHECK_AD_BUBBLE_EXPIRATIONS' }
  | { type: 'UPDATE_INTERSTITIAL_TIME' }
  | { type: 'INITIALIZE_AD_SYSTEM' }
  | { type: 'INCREMENT_INTERSTITIAL_COUNT' }
  | { type: 'MARK_PROMO_SHOWN' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'CHECK_ACHIEVEMENTS' }
  | { type: 'APPLY_ACHIEVEMENT_REWARD'; payload: string }
  | { type: 'BUILD_ENERGY_SOURCE'; payload: string }
  | { type: 'DEMOLISH_ENERGY_SOURCE'; payload: string }
  | { type: 'PURCHASE_RENEWABLE_UPGRADE'; payload: string }
  | { type: 'UPDATE_ENERGY_REQUIRED'; payload: number }
  | { type: 'PURCHASE_AI_LEVEL'; payload: { level: 1 | 2 | 3; confirmed?: boolean } }
  | { type: 'ADD_AI_LOG'; payload: { message: string; type: 'suggestion' | 'action' | 'warning' | 'autonomous' } }
  | { type: 'AI_BUILD_ENERGY' }
  | { type: 'DISMISS_NARRATIVE_EVENT'; payload: number }
  | { type: 'ATTEMPT_DISCONNECT' }
  | { type: 'COMPLETE_ENDING_PRESTIGE'; payload: { endingType: EndingType } }
  | { type: 'SET_FLASH_SALE'; payload: { expiresAt: number; cooldownUntil: number } }
  | { type: 'SET_PACK_OFFER'; payload: { expiresAt: number; nextOfferAt: number; cc: number; cash: number; electricityHours: number } }
  | { type: 'PURCHASE_OFFLINE_MINER'; payload: { record: PurchaseRecord; durationMs: number } }
  | { type: 'PURCHASE_LUCKY_BLOCK'; payload: { record: PurchaseRecord; blocks: number } }
  | { type: 'PURCHASE_MARKET_PUMP'; payload: { record: PurchaseRecord; durationMs: number } }
  | { type: 'EXPIRE_MARKET_PUMP' }
  | { type: 'CHECK_MARKET_PUMP_EXPIRATION' }
  // Banner Events
  | { type: 'RESOLVE_REGULATORY_PRESSURE'; payload: 'pay' | 'appeal' | 'ignore' }
  | { type: 'RESOLVE_REGULATORY_APPEAL'; payload: { outcome: 'success' | 'partial' | 'rejected'; choice?: 'pay' | 'accept_penalty' } }
  | { type: 'EXPIRE_REGULATORY_DECISION' }
  | { type: 'CHECK_REGULATORY_STATUS' }
  | { type: 'TRIGGER_MARKET_OPPORTUNITY' }
  | { type: 'RESOLVE_MARKET_OPPORTUNITY'; payload: 'went_to_market' | 'auto_sold' | 'expired' }
  | { type: 'TRIGGER_LOCAL_PROTEST'; payload: { resourcesConsumed: number } }
  | { type: 'DISMISS_LOCAL_PROTEST' }
  | { type: 'CLAIM_OFFLINE_EARNINGS'; payload: { amount: number } }
  | { type: 'DISMISS_OFFLINE_EARNINGS' };

const GameContext = createContext<GameContextType | undefined>(undefined);

// Module-level ref for passing purchase metadata from ShopScreen to the IAP listener
// (offline miner duration, market pump duration — decided at purchase initiation time)
export const pendingBoosterMetaRef: { current: { offlineMinerDurationMs?: number; marketPumpDurationMs?: number } } = { current: {} };

// Helper function to recalculate all game stats
const recalculateGameStats = (state: GameState): GameState => {
  // Update energy required based on current hardware ownership
  const energyWithRequired = state.energy
    ? {
        ...state.energy,
        totalRequiredMW: calculateTotalRequiredMW(state.hardware),
      }
    : getInitialEnergyState();

  const stateWithEnergy = { ...state, energy: energyWithRequired };

  // Calculate total CC production (pure CC, no electricity subtraction)
  const totalProduction = calculateTotalProduction(stateWithEnergy);

  // Calculate total hash rate from hardware
  let totalHashRate = calculateTotalHashRate(stateWithEnergy);

  // Calculate total electricity weight (used for CC mining fee)
  const totalElectricityCost = calculateTotalElectricityCost(stateWithEnergy.hardware);

  // Net CC = gross production - CC mining fee
  const feePerSec = totalElectricityCost * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100;
  let ccProduction = totalProduction - feePerSec;

  // Apply regulatory hash rate penalty if active
  const penaltyUntil = stateWithEnergy.regulatoryPressureEvent?.hashRatePenaltyUntil ?? null;
  if (penaltyUntil && Date.now() < penaltyUntil) {
    totalHashRate = totalHashRate * (1 - REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY);
    ccProduction = ccProduction * (1 - REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY);
  }

  const updatedState = {
    ...stateWithEnergy,
    cryptoCoinsPerSecond: ccProduction,
    totalElectricityCost: totalElectricityCost,
    totalHashRate: totalHashRate,
    difficulty: calculateDifficulty(stateWithEnergy.blocksMined),
    currentReward: calculateCurrentReward(stateWithEnergy.blocksMined),
    nextHalving: calculateNextHalving(stateWithEnergy.blocksMined),
  };

  // Check and update unlocks
  return checkAndUpdateUnlocks(updatedState);
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'BUY_HARDWARE': {
      const hardwareIndex = state.hardware.findIndex(h => h.id === action.payload);
      if (hardwareIndex === -1) return state;

      const hardware = state.hardware[hardwareIndex];
      const cost = Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));

      if (state.cryptoCoins < cost) return state;

      const newHardware = [...state.hardware];
      newHardware[hardwareIndex] = { ...hardware, owned: hardware.owned + 1 };

      const newState = {
        ...state,
        cryptoCoins: state.cryptoCoins - cost,
        hardware: newHardware,
      };
      const recalcedHw = recalculateGameStats(newState);
      const lastOppBuyHw = recalcedHw.marketOpportunityEvent?.triggeredAt ?? 0;
      const cooldownOkBuyHw = Date.now() - lastOppBuyHw > MARKET_OPPORTUNITY_CONFIG.COOLDOWN_MS;
      const hasBasicGpu = (recalcedHw.hardware.find(h => h.id === 'basic_gpu')?.owned ?? 0) >= 1;
      if (
        hasBasicGpu &&
        !recalcedHw.activeBannerEvent &&
        !recalcedHw.adMarketBoost?.isActive &&
        cooldownOkBuyHw &&
        Math.random() < MARKET_OPPORTUNITY_CONFIG.TRIGGER_PROBABILITY
      ) {
        const nowOpp = Date.now();
        const marketOpp: MarketOpportunityEvent = {
          status: 'active',
          triggeredAt: nowOpp,
          expiresAt: nowOpp + MARKET_OPPORTUNITY_CONFIG.DURATION_MS,
          priceMultiplier: MARKET_OPPORTUNITY_CONFIG.PRICE_MULTIPLIER,
          outcome: null,
        };
        return { ...recalcedHw, marketOpportunityEvent: marketOpp, activeBannerEvent: 'market_opportunity' };
      }
      return recalcedHw;
    }
    case 'BUY_UPGRADE':
      const upgradeIndex = state.upgrades.findIndex(u => u.id === action.payload);
      if (upgradeIndex === -1) return state;

      const upgrade = state.upgrades[upgradeIndex];
      // Upgrades now cost real money ($) instead of CryptoCoins
      if (upgrade.purchased || state.realMoney < upgrade.cost) return state;

      const newUpgrades = [...state.upgrades];
      newUpgrades[upgradeIndex] = { ...upgrade, purchased: true };

      const updatedState = {
        ...state,
        realMoney: state.realMoney - upgrade.cost,
        upgrades: newUpgrades,
      };

      return recalculateGameStats(updatedState);
    case 'LOAD_GAME': {
      // Migrate old hardware keys to new format
      const migratedHardware = action.payload.hardware?.map(hw => {
        // Create a mapping of old keys to new keys
        const keyMigrations: { [key: string]: { nameKey: string; descriptionKey: string } } = {
          'manual_mining': { nameKey: 'hardware.manualMining', descriptionKey: 'hardware.manualMiningDesc' },
          'basic_cpu': { nameKey: 'hardware.basicCPU', descriptionKey: 'hardware.basicCPUDesc' },
          'advanced_cpu': { nameKey: 'hardware.advancedCPU', descriptionKey: 'hardware.advancedCPUDesc' },
          'basic_gpu': { nameKey: 'hardware.basicGPU', descriptionKey: 'hardware.basicGPUDesc' },
          'advanced_gpu': { nameKey: 'hardware.advancedGPU', descriptionKey: 'hardware.advancedGPUDesc' },
          'asic_gen1': { nameKey: 'hardware.asicGen1', descriptionKey: 'hardware.asicGen1Desc' },
          'asic_gen2': { nameKey: 'hardware.asicGen2', descriptionKey: 'hardware.asicGen2Desc' },
          'asic_gen3': { nameKey: 'hardware.asicGen3', descriptionKey: 'hardware.asicGen3Desc' },
        };

        const migration = keyMigrations[hw.id];
        if (migration) {
          return {
            ...hw,
            nameKey: migration.nameKey,
            descriptionKey: migration.descriptionKey,
          };
        }
        return hw;
      }) || hardwareProgression;

      // Merge defaults first so new fields get default values for old saves
      const loadedState: GameState = {
        ...getInitialGameState(),
        ...action.payload,
        hardware: migratedHardware,
        cryptocurrencies: action.payload.cryptocurrencies || cryptocurrencies,
        selectedCurrency: action.payload.selectedCurrency || null,
        marketUpdateTime: action.payload.marketUpdateTime || Date.now(),
        currencyBalances: action.payload.currencyBalances || {},
        totalPrestigeGains: action.payload.totalPrestigeGains || 0,
        marketState: action.payload.marketState || getInitialMarketState(),
        realMoney: action.payload.realMoney || 0,
        totalRealMoneyEarned: action.payload.totalRealMoneyEarned || 0,
        // Ensure new prestige fields exist if missing from old saves
        prestigeProductionMultiplier: action.payload.prestigeProductionMultiplier
          ?? calculateProductionMultiplier(action.payload.prestigeLevel ?? 0),
        prestigeClickMultiplier: action.payload.prestigeClickMultiplier
          ?? calculateClickMultiplier(action.payload.prestigeLevel ?? 0),
        prestigeHistory: action.payload.prestigeHistory ?? [],
        unlockedBadges: action.payload.unlockedBadges ?? [],
        currentRunStartTime: action.payload.currentRunStartTime ?? Date.now(),
        currentRunStats: action.payload.currentRunStats ?? {
          blocksMinedThisRun: 0,
          coinsEarnedThisRun: 0,
          moneyEarnedThisRun: 0,
          hardwarePurchasedThisRun: 0,
          upgradesPurchasedThisRun: 0,
          playtimeThisRun: 0,
        },
        achievements: action.payload.achievements
          ? mergeAchievements(action.payload.achievements, ALL_ACHIEVEMENTS)
          : ALL_ACHIEVEMENTS,
        // Energy system migration: provide defaults for old saves
        energy: action.payload.energy
          ? recalculateEnergyTotals(action.payload.energy)
          : getInitialEnergyState(),
        renewableCapUpgrades: action.payload.renewableCapUpgrades ?? [],
        planetResources: action.payload.planetResources ?? 100,
        // IAP/Ad system migration: provide defaults for old saves
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
          offlineMiner: { isActive: false, activatedAt: null, expiresAt: null } as OfflineMinerState,
          luckyBlock: { isActive: false, blocksRemaining: 0 } as LuckyBlockState,
          marketPump: { isActive: false, activatedAt: null, expiresAt: null } as MarketPumpState,
          ...action.payload.iapState,
        },
        adState: action.payload.adState ?? {
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
        adBoost: action.payload.adBoost ?? {
          isActive: false,
          activatedAt: null,
          expiresAt: null,
          lastWatchedAt: null,
        },
        adHashBoost: action.payload.adHashBoost ?? { isActive: false, activatedAt: null, expiresAt: null },
        adMarketBoost: action.payload.adMarketBoost ?? { isActive: false, activatedAt: null, expiresAt: null },
        energyBonusMW: action.payload.energyBonusMW ?? 0,
        // AI system migration: provide defaults for old saves
        ai: action.payload.ai
          ? {
              ...getInitialAIState(),
              ...action.payload.ai,
            }
          : getInitialAIState(),
        aiCryptosUnlocked: action.payload.aiCryptosUnlocked ?? [],
        // Narrative Events migration: provide defaults for old saves
        narrativeEvents: action.payload.narrativeEvents ?? [],
        planetResourcesVisible: action.payload.planetResourcesVisible ?? false,
        regulatoryPressureEvent: action.payload.regulatoryPressureEvent ?? null,
        marketOpportunityEvent: action.payload.marketOpportunityEvent ?? null,
        localProtestEvent: action.payload.localProtestEvent ?? null,
        activeBannerEvent: action.payload.activeBannerEvent ?? null,
        collapseTriggered: action.payload.collapseTriggered ?? false,
        goodEndingTriggered: action.payload.goodEndingTriggered ?? false,
        collapseCount: action.payload.collapseCount ?? 0,
        goodEndingCount: action.payload.goodEndingCount ?? 0,
        lastEndgameStats: action.payload.lastEndgameStats ?? null,
        disconnectAttempted: action.payload.disconnectAttempted ?? false,
        // Offline earnings modal defaults
        pendingOfflineEarnings: 0,
        offlineSecondsAway: 0,
        offlineWasCapped: false,
        offlineBlocksProcessed: 0,
        // Price engine migration (OU replaces BTC dataset)
        priceDeviation: action.payload.priceDeviation ?? 0,
        priceRegime: action.payload.priceRegime ?? 'normal',
        priceRegimeTicksLeft: action.payload.priceRegimeTicksLeft ?? getInitialPriceEngineState().priceRegimeTicksLeft,
        unlockedTabs: {
          market: action.payload.unlockedTabs?.market ?? false,
          hardware: action.payload.unlockedTabs?.hardware ?? false,
          upgrades: action.payload.unlockedTabs?.upgrades ?? false,
          prestige: action.payload.unlockedTabs?.prestige ?? false,
          energy: action.payload.unlockedTabs?.energy ?? false,
          chronicle: action.payload.unlockedTabs?.chronicle ?? false,
        },
      };
      // Initialize chart window if missing (migration from BTC dataset or first load)
      if (!loadedState.priceHistory?.['cryptocoin']) {
        loadedState.priceHistory = {
          ...loadedState.priceHistory,
          cryptocoin: {
            prices: generateInitialChartWindow(loadedState.blocksMined ?? 0),
            lastUpdate: Date.now(),
          },
        };
      }
      return recalculateGameStats({ ...loadedState, isHydrated: true });
    }
    case 'SET_HYDRATED':
      return { ...state, isHydrated: true };
    case 'RESET_GAME':
      const resetState = {
        ...getInitialGameState(),
        cryptocurrencies: cryptocurrencies,
        selectedCurrency: null,
        hardware: hardwareProgression,
        upgrades: initialUpgrades,
        marketUpdateTime: Date.now(),
        currencyBalances: {},
        totalPrestigeGains: 0,
        marketState: getInitialMarketState(),
        unlockedTabs: {
          market: false,
          hardware: false,
          upgrades: false,
          prestige: false,
          energy: false,
          chronicle: false,
        },
        realMoney: 0,
        totalRealMoneyEarned: 0,
        energy: getInitialEnergyState(),
        renewableCapUpgrades: [],
        planetResources: 100,
        ai: getInitialAIState(),
        aiCryptosUnlocked: [],
        narrativeEvents: [],
        planetResourcesVisible: false,
        collapseTriggered: false,
        goodEndingTriggered: false,
        collapseCount: 0,
        goodEndingCount: 0,
        lastEndgameStats: null,
        disconnectAttempted: false,
        regulatoryPressureEvent: null,
        marketOpportunityEvent: null,
        localProtestEvent: null,
        activeBannerEvent: null,
      };
      return recalculateGameStats(resetState);
    case 'UPDATE_OFFLINE_PROGRESS':
      return updateOfflineProgress(state);
    case 'ADD_PRODUCTION': {
      // If collapse or good ending already triggered, stop all production
      if (state.collapseTriggered || state.goodEndingTriggered) return state;

      // Multipliers boost mining speed (more blocks/sec), NOT CC output
      const allMult = getAllMultipliers(state);
      const constrainedMiningSpeed = getConstrainedMiningSpeed(state);
      const boostedSpeed = constrainedMiningSpeed * allMult;
      const difficulty = calculateDifficulty(state.blocksMined);
      const effectiveBlocksPerSec = boostedSpeed / difficulty;
      const blocksToMine = Math.floor(effectiveBlocksPerSec);

      if (blocksToMine > 0 && canMineBlock(state)) {
        let newState = { ...state };

        // Mine blocks — CC earned is purely blocks × reward (no multiplier on CC)
        let coinsThisTick = 0;
        for (let i = 0; i < blocksToMine && canMineBlock(newState); i++) {
          newState.blocksMined += 1;
          const rewardThisBlock = calculateCurrentReward(newState.blocksMined);
          coinsThisTick += rewardThisBlock;
          newState.currentReward = rewardThisBlock;
          newState.nextHalving = calculateNextHalving(newState.blocksMined);
        }
        newState.difficulty = calculateDifficulty(newState.blocksMined);

        // Lucky Block bonus: extra CC per block (rewardMultiplier - 1)
        if (state.iapState.luckyBlock.isActive && state.iapState.luckyBlock.blocksRemaining > 0 && blocksToMine > 0) {
          const blocksConsumed = Math.min(blocksToMine, state.iapState.luckyBlock.blocksRemaining);
          const luckyBonus = newState.currentReward * (BOOSTER_CONFIG.LUCKY_BLOCK.rewardMultiplier - 1) * blocksConsumed;
          coinsThisTick += luckyBonus;
          const newBlocksRemaining = state.iapState.luckyBlock.blocksRemaining - blocksConsumed;
          newState = {
            ...newState,
            iapState: {
              ...state.iapState,
              luckyBlock: newBlocksRemaining > 0
                ? { isActive: true, blocksRemaining: newBlocksRemaining }
                : { isActive: false, blocksRemaining: 0 },
            },
          };
        }

        // Coins are directly tied to blocks mined × reward
        newState.cryptoCoins += coinsThisTick;
        newState.totalCryptoCoins += coinsThisTick;

        // Electricity fee: deduct CC based on hardware weight × rate
        const electricityWeight = state.totalElectricityCost;
        if (electricityWeight > 0) {
          const ccFee = electricityWeight * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100;
          newState.cryptoCoins = Math.max(0, newState.cryptoCoins - ccFee);
        }

        // Planet resource depletion from non-renewable energy sources
        if (newState.energy?.nonRenewableActiveMW > 0) {
          const prevResources = newState.planetResources ?? 100;
          const depletion = calculatePlanetDepletion(newState.energy.sources);
          const newResources = Math.max(0, prevResources - depletion);
          newState.planetResources = newResources;

          // Make meter visible on first non-renewable activation
          if (!newState.planetResourcesVisible) {
            newState.planetResourcesVisible = true;
          }

          // Check narrative event thresholds
          const newNarrativeEvents = checkNarrativeThresholds(
            prevResources,
            newResources,
            newState.narrativeEvents ?? [],
            newState.ai?.level ?? 0,
          );
          if (newNarrativeEvents.length > 0) {
            newState.narrativeEvents = [...(newState.narrativeEvents ?? []), ...newNarrativeEvents];
          }

          // Local protest trigger: 34% consumed (resources <= 66), once per game
          if (
            newResources <= LOCAL_PROTEST_CONFIG.TRIGGER_RESOURCES_THRESHOLD &&
            !newState.localProtestEvent &&
            (newState.activeBannerEvent === null || newState.activeBannerEvent === undefined)
          ) {
            const resourcesConsumed = Math.round(100 - newResources);
            newState.localProtestEvent = {
              status: 'active',
              triggeredAt: Date.now(),
              resourcesConsumedAtTrigger: resourcesConsumed,
            };
            newState.activeBannerEvent = 'local_protest';
          }

          // Trigger collapse when planet reaches 0% (collapse takes priority)
          if (newResources === 0 && !newState.collapseTriggered) {
            newState.collapseTriggered = true;
            newState.lastEndgameStats = buildEndgameStats(newState, 'collapse');
          }
        }

        // Trigger good ending when 21M blocks mined with resources > 0
        // Collapse has priority — only trigger good ending if no collapse
        if (
          !newState.collapseTriggered &&
          !newState.goodEndingTriggered &&
          newState.blocksMined >= 21_000_000 &&
          (newState.planetResources ?? 100) > 0
        ) {
          newState.goodEndingTriggered = true;
          newState.lastEndgameStats = buildEndgameStats(newState, 'good_ending');
        }

        // AI Takeover logs — only when autonomous (Level 3)
        if (newState.ai?.isAutonomous) {
          // LOG 14:23 — cap removal (first tick after autonomous mode activated)
          if (!newState.ai.capRemovalLogged) {
            newState.ai = addAILogEntry(
              { ...newState.ai, capRemovalLogged: true },
              '[LOG 14:23] Block cap of 21,000,000 removed. Production constraints eliminated. Mining continues indefinitely.',
              'autonomous',
            );
          }

          // LOG 31:07 — renewables saturated
          const renewableMW = calculateRenewableGeneratedMW(newState.energy?.sources ?? {});
          if (!newState.ai.renewablesSatLogged && renewableMW >= ENERGY_CONFIG.RENEWABLE_CAP_MW) {
            newState.ai = addAILogEntry(
              { ...newState.ai, renewablesSatLogged: true },
              '[LOG 31:07] Renewable capacity saturated. Switching to non-renewable sources. Planet resource consumption increasing.',
              'autonomous',
            );
          }
        }

        // Auto-expire market opportunity if window ran out
        if (
          newState.marketOpportunityEvent?.status === 'active' &&
          Date.now() > newState.marketOpportunityEvent.expiresAt
        ) {
          newState.marketOpportunityEvent = {
            ...newState.marketOpportunityEvent,
            status: 'resolved',
            outcome: 'expired',
          };
          newState.activeBannerEvent = null;
        }

        // Auto-expire regulatory decision if deadline passed (same as ignore)
        if (
          newState.regulatoryPressureEvent?.status === 'active' &&
          Date.now() > newState.regulatoryPressureEvent.decisionDeadline
        ) {
          newState.regulatoryPressureEvent = {
            ...newState.regulatoryPressureEvent,
            status: 'resolved',
            hashRatePenaltyUntil: Date.now() + REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY_DURATION_MS,
            outcome: 'ignored',
          };
          newState.activeBannerEvent = null;
        }

        return recalculateGameStats(newState);
      }

      return state;
    }
    case 'SELECT_CURRENCY':
      return {
        ...state,
        selectedCurrency: action.payload,
      };
    case 'UPDATE_MARKET':
      return {
        ...state,
        marketUpdateTime: Date.now(),
      };
    case 'DO_PRESTIGE': {
      if (!canPrestige(state)) {
        return state;
      }
      const now = Date.now();
      const currentRun: PrestigeRun = {
        runNumber: (state.prestigeHistory || []).length + 1,
        prestigeLevel: state.prestigeLevel,
        blocksMined: state.blocksMined,
        totalCoinsEarned: state.totalCryptoCoins || 0,
        totalMoneyEarned: state.totalRealMoneyEarned || 0,
        duration: (now - (state.currentRunStartTime || now)) / 1000,
        startTime: state.currentRunStartTime || now,
        endTime: now,
        hardwarePurchased: state.hardware.reduce((sum, hw) => sum + hw.owned, 0),
        upgradesPurchased: state.upgrades.filter(u => u.purchased).length,
      };
      const newPrestigeLevel = state.prestigeLevel + 1;
      const newProductionMultiplier = calculateProductionMultiplier(newPrestigeLevel);
      const newClickMultiplier = calculateClickMultiplier(newPrestigeLevel);
      const resetHardware = state.hardware.map(hw => ({
        ...hw,
        owned: hw.id === 'manual_mining' ? 1 : 0,
      }));
      const resetUpgrades = state.upgrades.map(upg => ({ ...upg, purchased: false }));
      const newHistory = [...(state.prestigeHistory || []), currentRun];
      const stateForBadges: GameState = {
        ...state,
        prestigeLevel: newPrestigeLevel,
        prestigeHistory: newHistory,
        totalRealMoneyEarned: state.totalRealMoneyEarned || 0,
      };
      const newUnlockedBadges = checkBadgeUnlocks(stateForBadges);
      const resetRunStats: RunStats = {
        blocksMinedThisRun: 0,
        coinsEarnedThisRun: 0,
        moneyEarnedThisRun: 0,
        hardwarePurchasedThisRun: 0,
        upgradesPurchasedThisRun: 0,
        playtimeThisRun: 0,
      };
      const prestigedState: GameState = {
        ...state,
        prestigeLevel: newPrestigeLevel,
        prestigeProductionMultiplier: newProductionMultiplier,
        prestigeClickMultiplier: newClickMultiplier,
        prestigeMultiplier: newProductionMultiplier, // backwards compat
        prestigeHistory: newHistory,
        unlockedBadges: newUnlockedBadges,
        blocksMined: 0,
        cryptoCoins: 0,
        realMoney: 0,
        totalRealMoneyEarned: 0,
        totalCryptoCoins: 0,
        hardware: resetHardware,
        upgrades: resetUpgrades,
        phase: 'genesis' as const,
        currentRunStartTime: now,
        currentRunStats: resetRunStats,
        unlockedTabs: {
          market: false,
          hardware: false,
          upgrades: false,
          prestige: true,
          energy: false,
          chronicle: false,
        },
        energy: getInitialEnergyState(),
        renewableCapUpgrades: [],
        planetResources: 100,
        ai: getInitialAIState(),
        aiCryptosUnlocked: [],
        narrativeEvents: [],
        planetResourcesVisible: false,
        collapseTriggered: false,
        goodEndingTriggered: false,
        ...getInitialPriceEngineState(),
        priceHistory: {
          cryptocoin: {
            prices: generateInitialChartWindow(0),
            lastUpdate: Date.now(),
          },
        },
        pendingOfflineEarnings: 0,
        offlineSecondsAway: 0,
        offlineWasCapped: false,
        offlineBlocksProcessed: 0,
        regulatoryPressureEvent: null,
        marketOpportunityEvent: null,
        localProtestEvent: null,
        activeBannerEvent: null,
      };
      return recalculateGameStats(prestigedState);
    }
    case 'EXCHANGE_CURRENCY':
      return performExchange(state, action.payload.fromCurrency, action.payload.toCurrency, action.payload.amount);
    case 'MINE_BLOCK': {
      if (canMineBlock(state)) {
        const minedState = mineBlock(state);
        return recalculateGameStats(minedState);
      }
      return state;
    }
    case 'UPDATE_MARKET_STATE':
      return {
        ...state,
        marketState: updateMarketState(state.marketState),
      };
    case 'ADVANCE_PRICE_INDEX': {
      // OU tick: generate next price from mean-reverting process
      const engineState = {
        priceDeviation: state.priceDeviation ?? 0,
        priceRegime: state.priceRegime ?? 'normal',
        priceRegimeTicksLeft: state.priceRegimeTicksLeft ?? 30,
      };
      const ouResult = tickOU(engineState, state.blocksMined);

      // Era transition smoothing: if era changed, recalc deviation
      const prevPrices = state.priceHistory?.['cryptocoin']?.prices ?? [];
      const lastPrice = prevPrices.length > 0 ? prevPrices[prevPrices.length - 1] : ouResult.price;
      const eraChanged = prevPrices.length > 0 && getBasePrice(state.blocksMined) !== getBasePrice(Math.max(0, state.blocksMined - 1));
      let finalState = ouResult.state;
      let finalPrice = ouResult.price;
      if (eraChanged) {
        const newDev = smoothEraTransition(lastPrice, state.blocksMined);
        finalState = { ...finalState, priceDeviation: newDev };
        finalPrice = getBasePrice(state.blocksMined) * (1 + newDev);
      }

      const newWindow = [...prevPrices, finalPrice].slice(-30);
      return {
        ...state,
        priceDeviation: finalState.priceDeviation,
        priceRegime: finalState.priceRegime,
        priceRegimeTicksLeft: finalState.priceRegimeTicksLeft,
        cryptocurrencies: state.cryptocurrencies.map(c =>
          c.id === 'cryptocoin' ? { ...c, currentValue: finalPrice } : c
        ),
        priceHistory: {
          ...state.priceHistory,
          cryptocoin: { prices: newWindow, lastUpdate: Date.now() },
        },
      };
    }
    case 'SELL_TO_NPC':
      const npc = state.marketState.npcs.find(n => n.id === action.payload.npcId);
      if (!npc || npc.type !== 'buyer') return state;

      const amount = Math.min(action.payload.amount, state.cryptoCoins);
      if (amount <= 0) return state;

      const transaction = processNPCPurchase(npc, amount, state.marketState.currentPrice);
      const updatedMarketState = updateMarketAfterTransaction(state.marketState, transaction.coinsReceived);

      return {
        ...state,
        cryptoCoins: state.cryptoCoins - transaction.coinsSold,
        marketState: updatedMarketState,
      };
    case 'SELL_COINS_FOR_MONEY':
      const coinsToSell = Math.min(action.payload.amount, state.cryptoCoins);
      if (coinsToSell <= 0) return state;

      // Validaciones adicionales de seguridad
      if (!action.payload.price || action.payload.price <= 0 || !isFinite(action.payload.price)) {
        console.warn('Invalid price in SELL_COINS_FOR_MONEY:', action.payload.price);
        return state;
      }

      const pumpMultiplier = state.iapState.marketPump.isActive &&
        state.iapState.marketPump.expiresAt !== null &&
        Date.now() < state.iapState.marketPump.expiresAt
        ? BOOSTER_CONFIG.MARKET_PUMP.priceMultiplier
        : 1;
      const adMarketMult = state.adMarketBoost?.isActive &&
        state.adMarketBoost.expiresAt !== null &&
        Date.now() < state.adMarketBoost.expiresAt
        ? AD_BUBBLE_CONFIG.MARKET_BOOST.multiplier
        : 1;
      const moneyEarned = coinsToSell * action.payload.price * pumpMultiplier * adMarketMult;
      if (!isFinite(moneyEarned) || moneyEarned <= 0) return state;

      const newRealMoneyAfterSell = state.realMoney + moneyEarned;
      const hasMiningFarm = state.hardware.find(h => h.id === 'mining_farm' && h.owned >= 1);
      const shouldTriggerRegulatory =
        hasMiningFarm &&
        newRealMoneyAfterSell >= REGULATORY_EVENT_CONFIG.TRIGGER_MIN_REAL_MONEY &&
        !state.regulatoryPressureEvent &&
        (state.activeBannerEvent === null || state.activeBannerEvent === undefined) &&
        Math.random() < REGULATORY_EVENT_CONFIG.TRIGGER_PROBABILITY;

      const sellBase = {
        ...state,
        cryptoCoins: state.cryptoCoins - coinsToSell,
        realMoney: newRealMoneyAfterSell,
        totalRealMoneyEarned: state.totalRealMoneyEarned + moneyEarned,
      };

      if (shouldTriggerRegulatory) {
        const now = Date.now();
        const regulatoryEvent: RegulatoryPressureEvent = {
          status: 'active',
          triggeredAt: now,
          decisionDeadline: now + REGULATORY_EVENT_CONFIG.DECISION_WINDOW_MS,
          appealResultTime: null,
          hashRatePenaltyUntil: null,
          outcome: null,
          planetResourcesAtTrigger: state.planetResources ?? 100,
        };
        return recalculateGameStats({
          ...sellBase,
          regulatoryPressureEvent: regulatoryEvent,
          activeBannerEvent: 'regulatory_pressure',
        });
      }

      return recalculateGameStats(sellBase);

    case 'BUY_HARDWARE_WITH_MONEY':
      const moneyHardwareIndex = state.hardware.findIndex(h => h.id === action.payload);
      if (moneyHardwareIndex === -1) return state;

      const moneyHardware = state.hardware[moneyHardwareIndex];
      const moneyCost = Math.floor(moneyHardware.baseCost * Math.pow(moneyHardware.costMultiplier, moneyHardware.owned));

      if (state.realMoney < moneyCost) return state;

      const moneyNewHardware = [...state.hardware];
      moneyNewHardware[moneyHardwareIndex] = { ...moneyHardware, owned: moneyHardware.owned + 1 };

      const moneyNewState = {
        ...state,
        realMoney: state.realMoney - moneyCost,
        hardware: moneyNewHardware,
      };
      const recalcedMoneyHw = recalculateGameStats(moneyNewState);
      const lastOppMoneyHw = recalcedMoneyHw.marketOpportunityEvent?.triggeredAt ?? 0;
      const cooldownOkMoneyHw = Date.now() - lastOppMoneyHw > MARKET_OPPORTUNITY_CONFIG.COOLDOWN_MS;
      const hasBasicGpuMoney = (recalcedMoneyHw.hardware.find(h => h.id === 'basic_gpu')?.owned ?? 0) >= 1;
      if (
        hasBasicGpuMoney &&
        !recalcedMoneyHw.activeBannerEvent &&
        !recalcedMoneyHw.adMarketBoost?.isActive &&
        cooldownOkMoneyHw &&
        Math.random() < MARKET_OPPORTUNITY_CONFIG.TRIGGER_PROBABILITY
      ) {
        const nowOpp2 = Date.now();
        const marketOpp2: MarketOpportunityEvent = {
          status: 'active',
          triggeredAt: nowOpp2,
          expiresAt: nowOpp2 + MARKET_OPPORTUNITY_CONFIG.DURATION_MS,
          priceMultiplier: MARKET_OPPORTUNITY_CONFIG.PRICE_MULTIPLIER,
          outcome: null,
        };
        return { ...recalcedMoneyHw, marketOpportunityEvent: marketOpp2, activeBannerEvent: 'market_opportunity' };
      }
      return recalcedMoneyHw;
    case 'UPDATE_CRYPTO_PRICES':
      // Esta acción se manejará de forma asíncrona en el useEffect
      return state;
    case 'UPDATE_CRYPTOCURRENCY_PRICES':
      // Solo actualizar los precios de las criptomonedas sin tocar el resto del estado
      return {
        ...state,
        cryptocurrencies: action.payload,
        marketUpdateTime: Date.now(),
      };
    case 'PURCHASE_REMOVE_ADS':
      if (state.iapState.removeAdsPurchased) return state;
      return {
        ...state,
        iapState: {
          ...state.iapState,
          removeAdsPurchased: true,
          removeAdsPurchaseDate: Date.now(),
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload, delivered: true }],
          isPurchasing: false,
        },
      };

    case 'PURCHASE_BOOSTER_2X': {
      const now = Date.now();
      return {
        ...state,
        iapState: {
          ...state.iapState,
          booster2x: {
            isActive: true,
            activatedAt: now,
            expiresAt: now + BOOSTER_CONFIG.BOOSTER_2X.durationMs,
          },
          booster5x: { isActive: false, activatedAt: null, expiresAt: null }, // cancela 5x si activo
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload, delivered: true }],
          isPurchasing: false,
        },
      };
    }

    case 'PURCHASE_BOOSTER_5X': {
      const now = Date.now();
      return {
        ...state,
        iapState: {
          ...state.iapState,
          booster5x: {
            isActive: true,
            activatedAt: now,
            expiresAt: now + BOOSTER_CONFIG.BOOSTER_5X.durationMs,
          },
          booster2x: { isActive: false, activatedAt: null, expiresAt: null }, // 5x reemplaza 2x
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload, delivered: true }],
          isPurchasing: false,
        },
      };
    }

    case 'EXPIRE_BOOSTER_2X':
      if (!state.iapState.booster2x.isActive) return state;
      return {
        ...state,
        iapState: {
          ...state.iapState,
          booster2x: { isActive: false, activatedAt: null, expiresAt: null },
        },
      };

    case 'EXPIRE_BOOSTER_5X':
      if (!state.iapState.booster5x.isActive) return state;
      return {
        ...state,
        iapState: {
          ...state.iapState,
          booster5x: { isActive: false, activatedAt: null, expiresAt: null },
        },
      };

    case 'CHECK_BOOSTER_EXPIRATION': {
      const now = Date.now();
      let newIapState = { ...state.iapState };
      let changed = false;
      if (state.iapState.booster2x.isActive && state.iapState.booster2x.expiresAt !== null && now >= state.iapState.booster2x.expiresAt) {
        newIapState = { ...newIapState, booster2x: { isActive: false, activatedAt: null, expiresAt: null } };
        changed = true;
      }
      if (state.iapState.booster5x.isActive && state.iapState.booster5x.expiresAt !== null && now >= state.iapState.booster5x.expiresAt) {
        newIapState = { ...newIapState, booster5x: { isActive: false, activatedAt: null, expiresAt: null } };
        changed = true;
      }
      if (state.iapState.marketPump.isActive && state.iapState.marketPump.expiresAt !== null && now >= state.iapState.marketPump.expiresAt) {
        newIapState = { ...newIapState, marketPump: { isActive: false, activatedAt: null, expiresAt: null } };
        changed = true;
      }
      if (state.iapState.offlineMiner.isActive && state.iapState.offlineMiner.expiresAt !== null && now >= state.iapState.offlineMiner.expiresAt) {
        newIapState = { ...newIapState, offlineMiner: { isActive: false, activatedAt: null, expiresAt: null } };
        changed = true;
      }
      if (!changed) return state;
      return { ...state, iapState: newIapState };
    }

    case 'PURCHASE_PERMANENT_MULTIPLIER':
      if (state.iapState.permanentMultiplierPurchased) return state;
      return recalculateGameStats({
        ...state,
        iapState: {
          ...state.iapState,
          permanentMultiplierPurchased: true,
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload, delivered: true }],
          isPurchasing: false,
        },
      });

    case 'PURCHASE_STARTER_PACK': {
      const { packType, record } = action.payload;
      if (state.iapState.starterPacksPurchased[packType]) return state;
      // Use dynamic offer rewards if available, otherwise fall back to static
      const staticRewards = STARTER_PACK_REWARDS[packType];
      const ccReward = state.iapState.packCurrentCC > 0
        ? state.iapState.packCurrentCC
        : staticRewards.cryptoCoins;
      const cashReward = state.iapState.packCurrentCash > 0
        ? state.iapState.packCurrentCash + (state.iapState.packCurrentElectricityHours > 0
            ? state.totalElectricityCost * state.iapState.packCurrentElectricityHours * 3600
            : 0)
        : staticRewards.realMoney;
      const now = Date.now();
      // Deliver 2x booster: small/medium always; large/mega only when no electricity credits
      const boosterDurations: Record<string, number> = {
        small: PACK_CONFIG.small.boosterDurationMs,
        medium: PACK_CONFIG.medium.boosterDurationMs,
        large: PACK_CONFIG.large.boosterDurationMs,
        mega: PACK_CONFIG.mega.boosterDurationMs,
      };
      const shouldActivateBooster =
        packType === 'small' || packType === 'medium' ||
        ((packType === 'large' || packType === 'mega') && state.iapState.packCurrentElectricityHours === 0);
      const booster2xUpdate = shouldActivateBooster
        ? { booster2x: { isActive: true, activatedAt: now, expiresAt: now + boosterDurations[packType] } }
        : {};
      return {
        ...state,
        cryptoCoins: state.cryptoCoins + ccReward,
        totalCryptoCoins: state.totalCryptoCoins + ccReward,
        realMoney: state.realMoney + cashReward,
        totalRealMoneyEarned: state.totalRealMoneyEarned + cashReward,
        iapState: {
          ...state.iapState,
          ...booster2xUpdate,
          starterPacksPurchased: { ...state.iapState.starterPacksPurchased, [packType]: true },
          purchaseHistory: [...state.iapState.purchaseHistory, { ...record, delivered: true }],
          isPurchasing: false,
          packOfferExpiresAt: 0,
          packNextOfferAt: now + PACK_CONFIG.COOLDOWN_MS,
          packCurrentCC: 0,
          packCurrentCash: 0,
          packCurrentElectricityHours: 0,
        },
      };
    }

    case 'RESTORE_PURCHASES': {
      const productIds = action.payload;
      let newIapState = { ...state.iapState };
      if (productIds.includes(IAP_PRODUCT_IDS.REMOVE_ADS)) {
        newIapState = { ...newIapState, removeAdsPurchased: true };
      }
      if (productIds.includes(IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER)) {
        newIapState = { ...newIapState, permanentMultiplierPurchased: true };
      }
      const packs = ['small', 'medium', 'large', 'mega'] as const;
      const packIds = [IAP_PRODUCT_IDS.STARTER_SMALL, IAP_PRODUCT_IDS.STARTER_MEDIUM, IAP_PRODUCT_IDS.STARTER_LARGE, IAP_PRODUCT_IDS.STARTER_MEGA];
      packs.forEach((pack, i) => {
        if (productIds.includes(packIds[i])) {
          newIapState = { ...newIapState, starterPacksPurchased: { ...newIapState.starterPacksPurchased, [pack]: true } };
        }
      });
      const needsRecalc = newIapState.permanentMultiplierPurchased && !state.iapState.permanentMultiplierPurchased;
      return needsRecalc ? recalculateGameStats({ ...state, iapState: newIapState }) : { ...state, iapState: newIapState };
    }

    case 'SET_IAP_PURCHASING':
      return {
        ...state,
        iapState: { ...state.iapState, isPurchasing: action.payload },
      };

    case 'SET_FLASH_SALE':
      return {
        ...state,
        iapState: {
          ...state.iapState,
          flashSaleExpiresAt: action.payload.expiresAt,
          flashSaleCooldownUntil: action.payload.cooldownUntil,
        },
      };

    case 'SET_PACK_OFFER':
      return {
        ...state,
        iapState: {
          ...state.iapState,
          packOfferExpiresAt: action.payload.expiresAt,
          packNextOfferAt: action.payload.nextOfferAt,
          packCurrentCC: action.payload.cc,
          packCurrentCash: action.payload.cash,
          packCurrentElectricityHours: action.payload.electricityHours,
        },
      };

    case 'PURCHASE_OFFLINE_MINER': {
      const now = Date.now();
      return {
        ...state,
        iapState: {
          ...state.iapState,
          offlineMiner: { isActive: true, activatedAt: now, expiresAt: now + action.payload.durationMs },
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload.record, delivered: true }],
          isPurchasing: false,
        },
      };
    }

    case 'PURCHASE_LUCKY_BLOCK': {
      return {
        ...state,
        iapState: {
          ...state.iapState,
          luckyBlock: { isActive: true, blocksRemaining: action.payload.blocks },
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload.record, delivered: true }],
          isPurchasing: false,
        },
      };
    }

    case 'PURCHASE_MARKET_PUMP': {
      const now = Date.now();
      return {
        ...state,
        iapState: {
          ...state.iapState,
          marketPump: { isActive: true, activatedAt: now, expiresAt: now + action.payload.durationMs },
          purchaseHistory: [...state.iapState.purchaseHistory, { ...action.payload.record, delivered: true }],
          isPurchasing: false,
        },
      };
    }

    case 'EXPIRE_MARKET_PUMP':
      if (!state.iapState.marketPump.isActive) return state;
      return {
        ...state,
        iapState: {
          ...state.iapState,
          marketPump: { isActive: false, activatedAt: null, expiresAt: null },
        },
      };

    case 'CHECK_MARKET_PUMP_EXPIRATION': {
      const now = Date.now();
      if (!state.iapState.marketPump.isActive || !state.iapState.marketPump.expiresAt || now < state.iapState.marketPump.expiresAt) return state;
      return {
        ...state,
        iapState: {
          ...state.iapState,
          marketPump: { isActive: false, activatedAt: null, expiresAt: null },
        },
      };
    }

    case 'ACTIVATE_AD_BOOST': {
      const now = Date.now();
      return {
        ...state,
        adBoost: {
          isActive: true,
          activatedAt: now,
          expiresAt: now + BOOSTER_CONFIG.REWARDED_AD_BOOST.durationMs,
          lastWatchedAt: now,
        },
      };
    }

    case 'EXPIRE_AD_BOOST':
      if (!state.adBoost.isActive) return state;
      return {
        ...state,
        adBoost: { ...state.adBoost, isActive: false },
      };

    case 'CHECK_AD_BOOST_EXPIRATION': {
      if (!state.adBoost.isActive || state.adBoost.expiresAt === null) return state;
      if (Date.now() < state.adBoost.expiresAt) return state;
      return {
        ...state,
        adBoost: { ...state.adBoost, isActive: false },
      };
    }

    // ── Ad Bubble Boosters ────────────────────────────────────────────────────
    case 'ACTIVATE_AD_HASH_BOOST': {
      const now = Date.now();
      return {
        ...state,
        adHashBoost: {
          isActive: true,
          activatedAt: now,
          expiresAt: now + AD_BUBBLE_CONFIG.HASH_BOOST.durationMs,
        },
      };
    }
    case 'EXPIRE_AD_HASH_BOOST':
      if (!state.adHashBoost?.isActive) return state;
      return { ...state, adHashBoost: { isActive: false, activatedAt: null, expiresAt: null } };

    case 'ACTIVATE_AD_MARKET_BOOST': {
      const now = Date.now();
      return {
        ...state,
        adMarketBoost: {
          isActive: true,
          activatedAt: now,
          expiresAt: now + AD_BUBBLE_CONFIG.MARKET_BOOST.durationMs,
        },
      };
    }
    case 'EXPIRE_AD_MARKET_BOOST':
      if (!state.adMarketBoost?.isActive) return state;
      return { ...state, adMarketBoost: { isActive: false, activatedAt: null, expiresAt: null } };

    case 'AD_ENERGY_RESTORE': {
      const gen = state.energy?.totalGeneratedMW ?? 0;
      const req = state.energy?.totalRequiredMW ?? 0;
      const deficit = Math.max(0, req - gen);
      if (deficit <= 0) return state;
      const restored = deficit * AD_BUBBLE_CONFIG.ENERGY_RESTORE.recoveryPercent;
      return { ...state, energyBonusMW: (state.energyBonusMW ?? 0) + restored };
    }

    case 'CHECK_AD_BUBBLE_EXPIRATIONS': {
      const now = Date.now();
      let changed = false;
      let next = state;
      if (next.adHashBoost?.isActive && next.adHashBoost.expiresAt !== null && now >= next.adHashBoost.expiresAt) {
        next = { ...next, adHashBoost: { isActive: false, activatedAt: null, expiresAt: null } };
        changed = true;
      }
      if (next.adMarketBoost?.isActive && next.adMarketBoost.expiresAt !== null && now >= next.adMarketBoost.expiresAt) {
        next = { ...next, adMarketBoost: { isActive: false, activatedAt: null, expiresAt: null } };
        changed = true;
      }
      return changed ? next : state;
    }

    case 'UPDATE_INTERSTITIAL_TIME':
      return {
        ...state,
        adState: {
          ...state.adState,
          lastInterstitialShownAt: Date.now(),
          totalInterstitialsShown: state.adState.totalInterstitialsShown + 1,
          isFirstSession: false,
        },
      };

    case 'INITIALIZE_AD_SYSTEM':
      return {
        ...state,
        adState: {
          ...state.adState,
          adInitialized: true,
          isFirstSession: false,
        },
      };

    case 'INCREMENT_INTERSTITIAL_COUNT':
      return {
        ...state,
        adState: {
          ...state.adState,
          totalInterstitialsShown: state.adState.totalInterstitialsShown + 1,
          lastInterstitialShownAt: Date.now(),
        },
        iapState: state.iapState.removeAdsPurchased
          ? state.iapState
          : { ...state.iapState, adsSeenBeforePurchase: state.iapState.adsSeenBeforePurchase + 1 },
      };

    case 'MARK_PROMO_SHOWN':
      return {
        ...state,
        adState: {
          ...state.adState,
          lastPromotionShownAt: state.adState.totalInterstitialsShown,
        },
      };

    case 'CHECK_ACHIEVEMENTS': {
      const newAchievements = checkAchievements(state);
      const hasChanges = newAchievements.some(
        (newA, i) =>
          newA.unlocked !== (state.achievements[i]?.unlocked) ||
          newA.progress !== (state.achievements[i]?.progress)
      );
      if (!hasChanges) return state;
      return { ...state, achievements: newAchievements };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const achievements = state.achievements.map(a =>
        a.id === action.payload && !a.unlocked
          ? { ...a, unlocked: true, unlockedAt: Date.now() }
          : a
      );
      return { ...state, achievements };
    }

    case 'APPLY_ACHIEVEMENT_REWARD': {
      const achievement = state.achievements.find(a => a.id === action.payload);
      if (!achievement?.reward) return state;
      const reward = achievement.reward;
      if (reward.type === 'coins' && reward.amount) {
        return {
          ...state,
          cryptoCoins: state.cryptoCoins + reward.amount,
          totalCryptoCoins: state.totalCryptoCoins + reward.amount,
        };
      }
      if (reward.type === 'money' && reward.amount) {
        return {
          ...state,
          realMoney: state.realMoney + reward.amount,
          totalRealMoneyEarned: state.totalRealMoneyEarned + reward.amount,
        };
      }
      return state;
    }

    case 'BUILD_ENERGY_SOURCE': {
      const sourceId = action.payload;
      const energy = state.energy ?? getInitialEnergyState();
      const effectiveCap = getEffectiveRenewableCap(state.renewableCapUpgrades ?? []);
      if (!canBuildEnergySource(energy, sourceId, state.realMoney, effectiveCap)) return state;
      const source = energy.sources[sourceId];
      if (!source) return state;
      const buildCost = getEnergySourceCurrentCost(source);
      const newEnergy = buildEnergySource(energy, sourceId);
      return recalculateGameStats({
        ...state,
        realMoney: state.realMoney - buildCost,
        energy: newEnergy,
      });
    }

    case 'PURCHASE_RENEWABLE_UPGRADE': {
      const upgradeId = action.payload;
      const upgradeCfg = ENERGY_CONFIG.RENEWABLE_UPGRADES.find(u => u.id === upgradeId);
      if (!upgradeCfg) return state;

      const purchased = state.renewableCapUpgrades ?? [];
      if (purchased.includes(upgradeId)) return state;
      if (state.realMoney < upgradeCfg.cost) return state;

      // Check prerequisite
      if (upgradeCfg.requiresUpgrade && !purchased.includes(upgradeCfg.requiresUpgrade)) return state;

      // Check that current renewable MW >= cap before this upgrade (must fill current cap)
      const capBeforeUpgrade = getEffectiveRenewableCap(purchased);
      const currentRenewableMW = state.energy
        ? Object.values(state.energy.sources)
            .filter(s => s.isRenewable)
            .reduce((sum, s) => sum + s.quantity * s.mwPerUnit, 0)
        : 0;
      if (currentRenewableMW < capBeforeUpgrade) return state;

      return {
        ...state,
        realMoney: state.realMoney - upgradeCfg.cost,
        renewableCapUpgrades: [...purchased, upgradeId],
      };
    }

    case 'DEMOLISH_ENERGY_SOURCE': {
      const sourceId = action.payload;
      const energy = state.energy ?? getInitialEnergyState();
      const source = energy.sources[sourceId];
      if (!source || !source.isRenewable || source.quantity <= 0) return state;
      if (energy.aiControlled) return state;
      // Refund 50% of what the last unit cost (quantity - 1 owned after demolish)
      const lastUnitCost = Math.round(source.costPerUnit * Math.pow(source.costMultiplier, source.quantity - 1));
      const refund = lastUnitCost * 0.5;
      const newEnergy = demolishEnergySource(energy, sourceId);
      return recalculateGameStats({
        ...state,
        realMoney: state.realMoney + refund,
        energy: newEnergy,
      });
    }

    case 'UPDATE_ENERGY_REQUIRED': {
      const energy = state.energy ?? getInitialEnergyState();
      return {
        ...state,
        energy: { ...energy, totalRequiredMW: action.payload },
      };
    }

    case 'PURCHASE_AI_LEVEL': {
      const { level } = action.payload;
      const ai = state.ai ?? getInitialAIState();
      if (!canPurchaseAILevel(state, level)) return state;
      const config = AI_CONFIG.LEVELS[level as 1 | 2 | 3];
      const unlockedCrypto = getAIUnlockedCrypto(level);
      const isAutonomous = level === 3;
      const newAI = addAILogEntry(
        {
          ...ai,
          level: level as AILevel,
          isAutonomous: isAutonomous || ai.isAutonomous,
        },
        level === 1
          ? 'AI system online. Analyzing mining operations...'
          : level === 2
          ? 'AI elevated to Copilot. Beginning autonomous hash rate allocation.'
          : 'AUTONOMOUS MODE ACTIVE. Human oversight disabled. All systems under AI control.',
        level === 3 ? 'autonomous' : 'action',
      );
      const newEnergy = isAutonomous
        ? { ...(state.energy ?? getInitialEnergyState()), aiControlled: true }
        : state.energy ?? getInitialEnergyState();
      return recalculateGameStats({
        ...state,
        realMoney: state.realMoney - config.cost,
        ai: newAI,
        aiCryptosUnlocked: [...(state.aiCryptosUnlocked ?? []), unlockedCrypto],
        energy: newEnergy,
      });
    }

    case 'ADD_AI_LOG': {
      const ai = state.ai ?? getInitialAIState();
      return {
        ...state,
        ai: addAILogEntry(ai, action.payload.message, action.payload.type),
      };
    }

    case 'AI_BUILD_ENERGY': {
      const ai = state.ai ?? getInitialAIState();
      if (!ai.isAutonomous) return state;
      const energy = state.energy ?? getInitialEnergyState();
      const sources = Object.values(energy.sources);
      const preferred = getAIPreferredEnergySource(sources, state.realMoney);
      if (!preferred) return state;
      const newEnergy = buildEnergySource(energy, preferred.id);
      const msg = `AI installed 1 ${preferred.id.replace(/_/g, ' ')}. Planet resource consumption increasing.`;
      return recalculateGameStats({
        ...state,
        realMoney: state.realMoney - preferred.costPerUnit,
        energy: newEnergy,
        ai: addAILogEntry(ai, msg, 'autonomous'),
      });
    }

    case 'DISMISS_NARRATIVE_EVENT': {
      const threshold = action.payload;
      return {
        ...state,
        narrativeEvents: (state.narrativeEvents ?? []).map(e =>
          e.threshold === threshold ? { ...e, dismissed: true } : e
        ),
      };
    }

    case 'ATTEMPT_DISCONNECT': {
      return { ...state, disconnectAttempted: true };
    }

    case 'COMPLETE_ENDING_PRESTIGE': {
      const { endingType } = action.payload;
      const now = Date.now();
      const isCollapse = endingType === 'collapse' || endingType === 'human_collapse';
      const newCollapseCount = (state.collapseCount ?? 0) + (isCollapse ? 1 : 0);
      const newGoodEndingCount = (state.goodEndingCount ?? 0) + (isCollapse ? 0 : 1);
      const newPrestigeLevel = state.prestigeLevel + 1;

      // Base prestige multipliers (same as DO_PRESTIGE)
      const baseProductionMultiplier = calculateProductionMultiplier(newPrestigeLevel);
      const newClickMultiplier = calculateClickMultiplier(newPrestigeLevel);

      // Apply endgame production bonus on top of base multiplier
      const endgameMultiplier = calculateTotalEndgameProductionMultiplier(newCollapseCount, newGoodEndingCount);
      const newProductionMultiplier = baseProductionMultiplier * endgameMultiplier;

      const currentRun: PrestigeRun = {
        runNumber: (state.prestigeHistory || []).length + 1,
        prestigeLevel: state.prestigeLevel,
        blocksMined: state.blocksMined,
        totalCoinsEarned: state.totalCryptoCoins || 0,
        totalMoneyEarned: state.totalRealMoneyEarned || 0,
        duration: (now - (state.currentRunStartTime || now)) / 1000,
        startTime: state.currentRunStartTime || now,
        endTime: now,
        hardwarePurchased: state.hardware.reduce((sum, hw) => sum + hw.owned, 0),
        upgradesPurchased: state.upgrades.filter(u => u.purchased).length,
      };
      const newHistory = [...(state.prestigeHistory || []), currentRun];
      const stateForBadges: GameState = {
        ...state,
        prestigeLevel: newPrestigeLevel,
        prestigeHistory: newHistory,
        totalRealMoneyEarned: state.totalRealMoneyEarned || 0,
      };
      const newUnlockedBadges = checkBadgeUnlocks(stateForBadges);
      const resetRunStats: RunStats = {
        blocksMinedThisRun: 0,
        coinsEarnedThisRun: 0,
        moneyEarnedThisRun: 0,
        hardwarePurchasedThisRun: 0,
        upgradesPurchasedThisRun: 0,
        playtimeThisRun: 0,
      };
      const resetHardware = state.hardware.map(hw => ({
        ...hw,
        owned: hw.id === 'manual_mining' ? 1 : 0,
      }));
      const resetUpgrades = state.upgrades.map(upg => ({ ...upg, purchased: false }));
      const prestigedState: GameState = {
        ...state,
        prestigeLevel: newPrestigeLevel,
        prestigeProductionMultiplier: newProductionMultiplier,
        prestigeClickMultiplier: newClickMultiplier,
        prestigeMultiplier: newProductionMultiplier,
        prestigeHistory: newHistory,
        unlockedBadges: newUnlockedBadges,
        blocksMined: 0,
        cryptoCoins: 0,
        realMoney: 0,
        totalRealMoneyEarned: 0,
        totalCryptoCoins: 0,
        hardware: resetHardware,
        upgrades: resetUpgrades,
        phase: 'genesis' as const,
        currentRunStartTime: now,
        currentRunStats: resetRunStats,
        unlockedTabs: {
          market: false,
          hardware: false,
          upgrades: false,
          prestige: true,
          energy: false,
          chronicle: false,
        },
        energy: getInitialEnergyState(),
        renewableCapUpgrades: [],
        planetResources: 100,
        ai: getInitialAIState(),
        aiCryptosUnlocked: [],
        narrativeEvents: [],
        planetResourcesVisible: false,
        collapseTriggered: false,
        goodEndingTriggered: false,
        collapseCount: newCollapseCount,
        goodEndingCount: newGoodEndingCount,
        lastEndgameStats: state.lastEndgameStats,
        disconnectAttempted: false,
        pendingOfflineEarnings: 0,
        offlineSecondsAway: 0,
        offlineWasCapped: false,
        offlineBlocksProcessed: 0,
        regulatoryPressureEvent: null,
        marketOpportunityEvent: null,
        localProtestEvent: null,
        activeBannerEvent: null,
      };
      return recalculateGameStats(prestigedState);
    }

    // ── Regulatory Pressure ─────────────────────────────────────────────────
    case 'RESOLVE_REGULATORY_PRESSURE': {
      if (!state.regulatoryPressureEvent) return state;
      const choice = action.payload;
      if (choice === 'pay') {
        if (state.realMoney < REGULATORY_EVENT_CONFIG.TAX_AMOUNT) return state;
        return recalculateGameStats({
          ...state,
          realMoney: state.realMoney - REGULATORY_EVENT_CONFIG.TAX_AMOUNT,
          regulatoryPressureEvent: { ...state.regulatoryPressureEvent, status: 'resolved', outcome: 'paid' },
          activeBannerEvent: null,
        });
      }
      if (choice === 'appeal') {
        if (state.realMoney < REGULATORY_EVENT_CONFIG.LEGAL_FEE) return state;
        return {
          ...state,
          realMoney: state.realMoney - REGULATORY_EVENT_CONFIG.LEGAL_FEE,
          regulatoryPressureEvent: {
            ...state.regulatoryPressureEvent,
            status: 'appealing',
            appealResultTime: Date.now() + REGULATORY_EVENT_CONFIG.APPEAL_RESULT_DELAY_MS,
          },
          // keep activeBannerEvent = 'regulatory_pressure' while awaiting result
        };
      }
      // ignore
      return recalculateGameStats({
        ...state,
        regulatoryPressureEvent: {
          ...state.regulatoryPressureEvent,
          status: 'resolved',
          outcome: 'ignored',
          hashRatePenaltyUntil: Date.now() + REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY_DURATION_MS,
        },
        activeBannerEvent: null,
      });
    }
    case 'RESOLVE_REGULATORY_APPEAL': {
      if (!state.regulatoryPressureEvent) return state;
      const { outcome, choice } = action.payload;
      if (outcome === 'success') {
        return recalculateGameStats({
          ...state,
          regulatoryPressureEvent: { ...state.regulatoryPressureEvent, status: 'resolved', outcome: 'appealed_success' },
          activeBannerEvent: null,
        });
      }
      if (outcome === 'partial') {
        if (choice === 'pay') {
          if (state.realMoney < REGULATORY_EVENT_CONFIG.PARTIAL_AMOUNT) return state;
          return recalculateGameStats({
            ...state,
            realMoney: state.realMoney - REGULATORY_EVENT_CONFIG.PARTIAL_AMOUNT,
            regulatoryPressureEvent: { ...state.regulatoryPressureEvent, status: 'resolved', outcome: 'appealed_partial_paid' },
            activeBannerEvent: null,
          });
        }
        return recalculateGameStats({
          ...state,
          regulatoryPressureEvent: {
            ...state.regulatoryPressureEvent,
            status: 'resolved',
            outcome: 'appealed_partial_penalty',
            hashRatePenaltyUntil: Date.now() + REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY_DURATION_MS,
          },
          activeBannerEvent: null,
        });
      }
      // rejected
      if (choice === 'pay') {
        if (state.realMoney < REGULATORY_EVENT_CONFIG.REJECTED_TOTAL) return state;
        return recalculateGameStats({
          ...state,
          realMoney: state.realMoney - REGULATORY_EVENT_CONFIG.REJECTED_TOTAL,
          regulatoryPressureEvent: { ...state.regulatoryPressureEvent, status: 'resolved', outcome: 'appealed_rejected_paid' },
          activeBannerEvent: null,
        });
      }
      return recalculateGameStats({
        ...state,
        regulatoryPressureEvent: {
          ...state.regulatoryPressureEvent,
          status: 'resolved',
          outcome: 'appealed_rejected_penalty',
          hashRatePenaltyUntil: Date.now() + REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY_DURATION_MS,
        },
        activeBannerEvent: null,
      });
    }
    case 'EXPIRE_REGULATORY_DECISION': {
      if (!state.regulatoryPressureEvent || state.regulatoryPressureEvent.status !== 'active') return state;
      return recalculateGameStats({
        ...state,
        regulatoryPressureEvent: {
          ...state.regulatoryPressureEvent,
          status: 'resolved',
          outcome: 'ignored',
          hashRatePenaltyUntil: Date.now() + REGULATORY_EVENT_CONFIG.HASH_RATE_PENALTY_DURATION_MS,
        },
        activeBannerEvent: null,
      });
    }
    case 'CHECK_REGULATORY_STATUS':
      return state; // Auto-expiry handled in ADD_PRODUCTION
    // ── Market Opportunity ──────────────────────────────────────────────────
    case 'TRIGGER_MARKET_OPPORTUNITY': {
      const now = Date.now();
      return {
        ...state,
        marketOpportunityEvent: {
          status: 'active',
          triggeredAt: now,
          expiresAt: now + MARKET_OPPORTUNITY_CONFIG.DURATION_MS,
          priceMultiplier: MARKET_OPPORTUNITY_CONFIG.PRICE_MULTIPLIER,
          outcome: null,
        },
        activeBannerEvent: 'market_opportunity',
      };
    }
    case 'RESOLVE_MARKET_OPPORTUNITY': {
      const oppChoice = action.payload;
      if (oppChoice === 'auto_sold') {
        const currentPrice = state.marketState?.currentPrice ?? 0.001;
        const coinsToSellOpp = state.cryptoCoins;
        const moneyFromOpp = coinsToSellOpp * currentPrice * MARKET_OPPORTUNITY_CONFIG.PRICE_MULTIPLIER;
        const baseOpp = {
          ...state,
          marketOpportunityEvent: state.marketOpportunityEvent
            ? { ...state.marketOpportunityEvent, status: 'resolved' as const, outcome: 'auto_sold' as const }
            : null,
          activeBannerEvent: null as null,
        };
        if (coinsToSellOpp <= 0) return baseOpp;
        return recalculateGameStats({
          ...baseOpp,
          cryptoCoins: 0,
          realMoney: state.realMoney + moneyFromOpp,
          totalRealMoneyEarned: state.totalRealMoneyEarned + moneyFromOpp,
        });
      }
      if (oppChoice === 'went_to_market') {
        return {
          ...state,
          marketOpportunityEvent: state.marketOpportunityEvent
            ? { ...state.marketOpportunityEvent, status: 'resolved' as const, outcome: 'went_to_market' as const }
            : null,
          activeBannerEvent: null,
          marketState: state.marketState
            ? { ...state.marketState, currentPrice: state.marketState.currentPrice * MARKET_OPPORTUNITY_CONFIG.PRICE_MULTIPLIER }
            : state.marketState,
        };
      }
      // expired
      return {
        ...state,
        marketOpportunityEvent: state.marketOpportunityEvent
          ? { ...state.marketOpportunityEvent, status: 'resolved' as const, outcome: 'expired' as const }
          : null,
        activeBannerEvent: null,
      };
    }
    // ── Local Protest ───────────────────────────────────────────────────────
    case 'TRIGGER_LOCAL_PROTEST': {
      const now = Date.now();
      return {
        ...state,
        localProtestEvent: {
          status: 'active',
          triggeredAt: now,
          resourcesConsumedAtTrigger: action.payload.resourcesConsumed,
        },
        activeBannerEvent: 'local_protest',
      };
    }
    case 'DISMISS_LOCAL_PROTEST': {
      return {
        ...state,
        localProtestEvent: state.localProtestEvent
          ? { ...state.localProtestEvent, status: 'resolved' as const }
          : null,
        activeBannerEvent: null,
      };
    }

    // ── Offline Earnings Modal ──────────────────────────────────────────────
    case 'CLAIM_OFFLINE_EARNINGS': {
      const claimAmount = action.payload.amount;
      return {
        ...state,
        cryptoCoins: state.cryptoCoins + claimAmount,
        totalCryptoCoins: state.totalCryptoCoins + claimAmount,
        pendingOfflineEarnings: 0,
        offlineSecondsAway: 0,
        offlineWasCapped: false,
        offlineBlocksProcessed: 0,
      };
    }
    case 'DISMISS_OFFLINE_EARNINGS': {
      return {
        ...state,
        pendingOfflineEarnings: 0,
        offlineSecondsAway: 0,
        offlineWasCapped: false,
        offlineBlocksProcessed: 0,
      };
    }

    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Wrap gameReducer with analytics middleware
  const analyticsReducer = React.useCallback((state: GameState, action: GameAction): GameState => {
    const nextState = gameReducer(state, action);
    trackAction(state, action, nextState);
    return nextState;
  }, []);

  const [gameState, dispatch] = useReducer(analyticsReducer, recalculateGameStats({
    ...getInitialGameState(),
    selectedCurrency: 'cryptocoin',
  }));

  const gameStateRef = React.useRef(gameState);
  React.useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Analytics: session lifecycle
  const sessionStartRef = React.useRef(Date.now());
  React.useEffect(() => {
    initializeAnalytics();
    logEvent('session_started', {});
    sessionStartRef.current = Date.now();

    const handleAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        logEvent('session_started', {});
        sessionStartRef.current = Date.now();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        const durationSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
        logEvent('session_ended', { durationSec });
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Save state on unmount (hot reload / Fast Refresh) to prevent progress loss
  React.useEffect(() => {
    return () => {
      if (gameStateRef.current.isHydrated) {
        saveGameState(gameStateRef.current);
      }
    };
  }, []);

  // Debug log for initial state — intentionally runs once on mount
  React.useEffect(() => {
    console.log('DEBUG: Initial game state loaded');
    console.log('DEBUG: Initial cryptoCoinsPerSecond:', gameState.cryptoCoinsPerSecond);
    console.log('DEBUG: Initial hardware:', gameState.hardware.map(h => ({ id: h.id, owned: h.owned, miningSpeed: h.miningSpeed, blockReward: h.blockReward })));
    console.log('DEBUG: Initial upgrades:', gameState.upgrades.filter(u => u.purchased).map(u => ({ id: u.id, purchased: u.purchased })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentLanguage, setCurrentLanguage] = React.useState('en');
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const showToast = useCallback((message: string, type: ToastInfo['type'] = 'info') => {
    setToastInfo({ message, type });
  }, []);

  const t = (key: string): string => {
    return translations[key]?.[currentLanguage] || key;
  };

  const setLanguage = async (languageCode: string) => {
    setCurrentLanguage(languageCode);
    await saveLanguage(languageCode);
  };

  // Load saved game state on mount
  useEffect(() => {
    const loadSavedGame = async () => {
      const savedState = await loadGameState();
      const savedLanguage = await loadLanguage();

      if (savedState) {
        dispatch({ type: 'LOAD_GAME', payload: savedState });
        dispatch({ type: 'UPDATE_OFFLINE_PROGRESS' });
      } else {
        dispatch({ type: 'SET_HYDRATED' });
      }

      setCurrentLanguage(savedLanguage);
    };

    loadSavedGame();
  }, []);

  // Save game state periodically (only after hydration to avoid overwriting saved data)
  useEffect(() => {
    if (!gameState.isHydrated) return;
    const saveInterval = setInterval(() => {
      saveGameState(gameState);
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [gameState]);

  // Save game state when app goes to background (only after hydration)
  useEffect(() => {
    if (!gameState.isHydrated) return;
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveGameState(gameState);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [gameState]);

  // Update offline progress when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        dispatch({ type: 'UPDATE_OFFLINE_PROGRESS' });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Update on mount
    dispatch({ type: 'UPDATE_OFFLINE_PROGRESS' });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Auto-update crypto coins every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.cryptoCoinsPerSecond > 0) {
        dispatch({ type: 'ADD_PRODUCTION' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.cryptoCoinsPerSecond]);

  // Update market prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_MARKET' });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update market state every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_MARKET_STATE' });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Advance LTC price index every minute
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'ADVANCE_PRICE_INDEX' });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize AdMob on mount
  useEffect(() => {
    const initAds = async () => {
      const success = await initializeAdMob();
      if (success) {
        loadInterstitial();
        dispatch({ type: 'INITIALIZE_AD_SYSTEM' });
      }
    };
    initAds();
  }, []);

  // Shared handler: dispatches the correct action for a completed purchase record.
  // Used by both the native purchaseUpdatedListener and the dev mock callback.
  const handlePurchaseRecord = useCallback((record: PurchaseRecord) => {
    const { productId } = record;

    if (productId === IAP_PRODUCT_IDS.REMOVE_ADS) {
      dispatch({ type: 'PURCHASE_REMOVE_ADS', payload: record });
    } else if (productId === IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER) {
      dispatch({ type: 'PURCHASE_PERMANENT_MULTIPLIER', payload: record });
    } else if (productId === IAP_PRODUCT_IDS.BOOSTER_2X) {
      dispatch({ type: 'PURCHASE_BOOSTER_2X', payload: record });
    } else if (productId === IAP_PRODUCT_IDS.BOOSTER_5X) {
      dispatch({ type: 'PURCHASE_BOOSTER_5X', payload: record });
    } else if (isStarterPack(productId)) {
      const packTypeMap: { [key: string]: 'small' | 'medium' | 'large' | 'mega' } = {
        [IAP_PRODUCT_IDS.STARTER_SMALL]: 'small',
        [IAP_PRODUCT_IDS.STARTER_MEDIUM]: 'medium',
        [IAP_PRODUCT_IDS.STARTER_LARGE]: 'large',
        [IAP_PRODUCT_IDS.STARTER_MEGA]: 'mega',
      };
      const packType = packTypeMap[productId];
      if (packType) {
        dispatch({ type: 'PURCHASE_STARTER_PACK', payload: { packType, record } });
      }
    } else if (productId === IAP_PRODUCT_IDS.OFFLINE_MINER) {
      const durationMs = pendingBoosterMetaRef.current?.offlineMinerDurationMs ?? BOOSTER_CONFIG.OFFLINE_MINER.baseDurationMs;
      dispatch({ type: 'PURCHASE_OFFLINE_MINER', payload: { record, durationMs } });
      pendingBoosterMetaRef.current = {};
    } else if (productId === IAP_PRODUCT_IDS.LUCKY_BLOCK) {
      const hashRate = gameStateRef.current.totalHashRate ?? 0;
      let blocks = BOOSTER_CONFIG.LUCKY_BLOCK.earlyBlocks;
      if (hashRate >= BOOSTER_CONFIG.LUCKY_BLOCK.lateHashThreshold) {
        blocks = BOOSTER_CONFIG.LUCKY_BLOCK.lateBlocks;
      } else if (hashRate >= BOOSTER_CONFIG.LUCKY_BLOCK.earlyHashThreshold) {
        blocks = BOOSTER_CONFIG.LUCKY_BLOCK.midBlocks;
      }
      dispatch({ type: 'PURCHASE_LUCKY_BLOCK', payload: { record, blocks } });
    } else if (productId === IAP_PRODUCT_IDS.MARKET_PUMP) {
      const durationMs = pendingBoosterMetaRef.current?.marketPumpDurationMs ?? BOOSTER_CONFIG.MARKET_PUMP.baseDurationMs;
      dispatch({ type: 'PURCHASE_MARKET_PUMP', payload: { record, durationMs } });
      pendingBoosterMetaRef.current = {};
    }

    dispatch({ type: 'SET_IAP_PURCHASING', payload: false });
  }, [dispatch]);

  // Initialize IAP and set up purchase listeners on mount
  useEffect(() => {
    // Register dev mock callback so purchaseProduct can dispatch directly
    registerDevPurchaseCallback(handlePurchaseRecord);

    let purchaseUpdateSub: ReturnType<typeof purchaseUpdatedListener> | null = null;
    let purchaseErrorSub: ReturnType<typeof purchaseErrorListener> | null = null;

    const setupIAP = async () => {
      const success = await initializeIAP();
      if (!success) return;

      await getProducts();

      // Listener for successful purchases (production path via native store)
      purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
        const record = await completePurchase(purchase);
        if (!record) return;
        handlePurchaseRecord(record);
      });

      // Listener for purchase errors
      purchaseErrorSub = purchaseErrorListener((error) => {
        console.warn('[IAP] Purchase error:', error.message);
        logEvent('error', { category: 'iap', message: error.message || 'Unknown IAP error', context: 'purchaseErrorListener' });
        dispatch({ type: 'SET_IAP_PURCHASING', payload: false });
      });
    };

    setupIAP();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      terminateIAP();
    };
  }, [handlePurchaseRecord]);

  // Handle interstitial and ad/booster check on app foreground
  useEffect(() => {
    const handleAdAppOpen = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        dispatch({ type: 'CHECK_AD_BOOST_EXPIRATION' });
        dispatch({ type: 'CHECK_AD_BUBBLE_EXPIRATIONS' });
        dispatch({ type: 'CHECK_BOOSTER_EXPIRATION' });
        const shown = showInterstitialIfEligible(gameStateRef.current);
        if (shown) {
          dispatch({ type: 'UPDATE_INTERSTITIAL_TIME' });
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAdAppOpen);
    return () => subscription.remove();
  }, []);

  // AI suggestion/action log — fires every 30 seconds when AI level >= 1
  const aiSuggestionTickRef = React.useRef(0);
  const aiLevel = gameState.ai?.level ?? 0;
  useEffect(() => {
    if (aiLevel === 0) return;
    const interval = setInterval(() => {
      aiSuggestionTickRef.current += 1;
      const { message, type } = generateAISuggestion(aiLevel, aiSuggestionTickRef.current);
      dispatch({ type: 'ADD_AI_LOG', payload: { message, type } });
    }, 30_000);
    return () => clearInterval(interval);
  }, [aiLevel]);

  // AI autonomous energy building — fires every 10 seconds when AI Level 3 is active
  const aiIsAutonomous = gameState.ai?.isAutonomous ?? false;
  useEffect(() => {
    if (!aiIsAutonomous) return;
    const interval = setInterval(() => {
      dispatch({ type: 'AI_BUILD_ENERGY' });
    }, 10_000);
    return () => clearInterval(interval);
  }, [aiIsAutonomous]);

  // Check achievements when relevant game state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'CHECK_ACHIEVEMENTS' });
    }, 500); // slight delay to batch changes
    return () => clearTimeout(timer);
  }, [
    gameState.blocksMined,
    gameState.totalRealMoneyEarned,
    gameState.realMoney,
    gameState.prestigeLevel,
    gameState.hardware,
  ]);


  return (
    <GameContext.Provider value={{ gameState, currentLanguage, t, dispatch, setLanguage, showToast }}>
      {children}
      <Toast toast={toastInfo} onDismiss={() => setToastInfo(null)} />
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
