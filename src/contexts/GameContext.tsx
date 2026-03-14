import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GameState, Cryptocurrency, IAPState, AdState, AdBoostState, PrestigeRun, RunStats, AILevel, EndingType } from '../types/game';
import { hardwareProgression } from '../data/hardwareData';
import { initialUpgrades } from '../data/gameData';
import { cryptocurrencies } from '../data/cryptocurrencies';
import { getInitialGameState, updateOfflineProgress, checkAndUpdateUnlocks, generatePriceSeed, generatePriceStartIndex, getInitialChartWindow } from '../utils/gameLogic';
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
  mineBlock,
  canMineBlock
} from '../utils/blockLogic';
import {
  calculateTotalElectricityCost,
  calculateTotalMiningSpeed,
  calculateTotalProduction,
  calculateTotalHashRate
} from '../utils/gameLogic';
import {
  updateMarketState,
  processNPCPurchase,
  updateMarketAfterTransaction,
  getInitialMarketState
} from '../utils/marketLogic';
import { saveGameState, loadGameState, saveLanguage, loadLanguage } from '../utils/storage';
import { translations } from '../data/translations';
import { BTC_PRICE_HISTORY } from '../data/btcPriceHistory';
import { initializeAdMob, loadInterstitial, showInterstitialIfEligible } from '../services/AdMobService';
import {
  initializeIAP,
  getProducts,
  completePurchase,
  terminateIAP,
  isStarterPack,
} from '../services/IAPService';
import { purchaseUpdatedListener, purchaseErrorListener } from 'react-native-iap';
import { BOOSTER_CONFIG, STARTER_PACK_REWARDS, ENERGY_CONFIG } from '../config/balanceConfig';
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
  getActiveHardwareWithEnergyConstraint,
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

interface GameContextType {
  gameState: GameState;
  currentLanguage: string;
  t: (key: string) => string;
  dispatch: React.Dispatch<GameAction>;
  setLanguage: (languageCode: string) => void;
  showToast: (message: string, type?: ToastInfo['type']) => void;
}

type GameAction =
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
  | { type: 'COMPLETE_ENDING_PRESTIGE'; payload: { endingType: EndingType } };

const GameContext = createContext<GameContextType | undefined>(undefined);

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

  // Calculate total production using the correct function
  const totalProduction = calculateTotalProduction(stateWithEnergy);

  // Calculate total hash rate from hardware
  const totalHashRate = calculateTotalHashRate(stateWithEnergy);

  // Calculate total electricity cost
  const totalElectricityCost = calculateTotalElectricityCost(stateWithEnergy.hardware);

  // Calculate net production (production - electricity cost)
  const netProduction = Math.max(0, totalProduction - totalElectricityCost);

  const updatedState = {
    ...stateWithEnergy,
    cryptoCoinsPerSecond: netProduction,
    totalElectricityCost: totalElectricityCost,
    totalHashRate: totalHashRate,
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

      return recalculateGameStats(newState);
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
        iapState: action.payload.iapState ?? {
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
        collapseTriggered: action.payload.collapseTriggered ?? false,
        goodEndingTriggered: action.payload.goodEndingTriggered ?? false,
        collapseCount: action.payload.collapseCount ?? 0,
        goodEndingCount: action.payload.goodEndingCount ?? 0,
        lastEndgameStats: action.payload.lastEndgameStats ?? null,
        disconnectAttempted: action.payload.disconnectAttempted ?? false,
        // Price history system migration
        priceSeed: action.payload.priceSeed ?? generatePriceSeed(),
        priceHistoryIndex: action.payload.priceHistoryIndex ?? generatePriceStartIndex(),
        unlockedTabs: {
          market: action.payload.unlockedTabs?.market ?? false,
          hardware: action.payload.unlockedTabs?.hardware ?? false,
          upgrades: action.payload.unlockedTabs?.upgrades ?? false,
          prestige: action.payload.unlockedTabs?.prestige ?? false,
          energy: action.payload.unlockedTabs?.energy ?? false,
          chronicle: action.payload.unlockedTabs?.chronicle ?? false,
        },
      };
      // Initialize chart window if missing (new field or first load)
      if (!loadedState.priceHistory?.['cryptocoin']) {
        loadedState.priceHistory = {
          ...loadedState.priceHistory,
          cryptocoin: {
            prices: getInitialChartWindow(loadedState.priceHistoryIndex, loadedState.priceSeed),
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
      };
      return recalculateGameStats(resetState);
    case 'UPDATE_OFFLINE_PROGRESS':
      return updateOfflineProgress(state);
    case 'ADD_PRODUCTION': {
      // If collapse or good ending already triggered, stop all production
      if (state.collapseTriggered || state.goodEndingTriggered) return state;

      // Calculate how many blocks should be mined based on energy-constrained mining speed
      const energyGeneratedMW = state.energy?.totalGeneratedMW ?? 0;
      const activeEnergyHardware = getActiveHardwareWithEnergyConstraint(state.hardware, energyGeneratedMW);
      const activeUnitsForSpeed: Record<string, number> = {};
      for (const hw of activeEnergyHardware) {
        activeUnitsForSpeed[hw.id] = hw.activeUnits;
      }
      const constrainedHardware = state.hardware.map(hw =>
        hw.energyRequired > 0
          ? { ...hw, owned: activeUnitsForSpeed[hw.id] ?? 0 }
          : hw
      );
      const totalMiningSpeed = calculateTotalMiningSpeed(constrainedHardware, state.upgrades);
      const blocksToMine = Math.floor(totalMiningSpeed); // Mine complete blocks only

      if (blocksToMine > 0 && canMineBlock(state)) {
        // Mine blocks for progression counter; coins come from cryptoCoinsPerSecond
        let newState = { ...state };

        for (let i = 0; i < blocksToMine && canMineBlock(newState); i++) {
          newState.blocksMined += 1;
          newState.currentReward = calculateCurrentReward(newState.blocksMined);
          newState.nextHalving = calculateNextHalving(newState.blocksMined);
        }

        // Coins are based on steady-state production rate, independent of halving rewards
        const coinsThisTick = state.cryptoCoinsPerSecond;
        newState.cryptoCoins += coinsThisTick;
        newState.totalCryptoCoins += coinsThisTick;

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
        priceSeed: generatePriceSeed(),
        priceHistoryIndex: generatePriceStartIndex(),
        priceHistory: undefined,
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
      const nextIndex = (state.priceHistoryIndex + 1) % BTC_PRICE_HISTORY.length;
      const newPrice = BTC_PRICE_HISTORY[nextIndex] / state.priceSeed;
      const prevWindow = state.priceHistory?.['cryptocoin']?.prices ?? [];
      const newWindow = [...prevWindow, newPrice].slice(-30);
      return {
        ...state,
        priceHistoryIndex: nextIndex,
        cryptocurrencies: state.cryptocurrencies.map(c =>
          c.id === 'cryptocoin' ? { ...c, currentValue: newPrice } : c
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

      const moneyEarned = coinsToSell * action.payload.price;
      if (!isFinite(moneyEarned) || moneyEarned <= 0) return state;

      return recalculateGameStats({
        ...state,
        cryptoCoins: state.cryptoCoins - coinsToSell,
        realMoney: state.realMoney + moneyEarned,
        totalRealMoneyEarned: state.totalRealMoneyEarned + moneyEarned,
      });

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

      return recalculateGameStats(moneyNewState);
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
      const rewards = STARTER_PACK_REWARDS[packType];
      return {
        ...state,
        cryptoCoins: state.cryptoCoins + rewards.cryptoCoins,
        totalCryptoCoins: state.totalCryptoCoins + rewards.cryptoCoins,
        realMoney: state.realMoney + rewards.realMoney,
        totalRealMoneyEarned: state.totalRealMoneyEarned + rewards.realMoney,
        iapState: {
          ...state.iapState,
          starterPacksPurchased: { ...state.iapState.starterPacksPurchased, [packType]: true },
          purchaseHistory: [...state.iapState.purchaseHistory, { ...record, delivered: true }],
          isPurchasing: false,
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
      const config = { 1: { cost: 500_000 }, 2: { cost: 5_000_000 }, 3: { cost: 50_000_000 } }[level];
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
      const isCollapse = endingType === 'collapse';
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
      };
      return recalculateGameStats(prestigedState);
    }

    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, recalculateGameStats({
    ...getInitialGameState(),
    cryptocurrencies: cryptocurrencies,
    selectedCurrency: 'cryptocoin',
    hardware: hardwareProgression,
    upgrades: initialUpgrades,
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
    achievements: ALL_ACHIEVEMENTS,
  }));

  const gameStateRef = React.useRef(gameState);
  React.useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
      } else {
        dispatch({ type: 'SET_HYDRATED' });
      }

      setCurrentLanguage(savedLanguage);
    };

    loadSavedGame();
  }, []);

  // Save game state periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveGameState(gameState);
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [gameState]);

  // Save game state when app goes to background
  useEffect(() => {
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

  // Initialize IAP and set up purchase listeners on mount
  useEffect(() => {
    let purchaseUpdateSub: ReturnType<typeof purchaseUpdatedListener> | null = null;
    let purchaseErrorSub: ReturnType<typeof purchaseErrorListener> | null = null;

    const setupIAP = async () => {
      const success = await initializeIAP();
      if (!success) return;

      await getProducts();

      // Listener for successful purchases
      purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
        const record = await completePurchase(purchase);
        if (!record) return;

        const { productId } = purchase;

        if (productId === IAP_PRODUCT_IDS.REMOVE_ADS) {
          dispatch({ type: 'PURCHASE_REMOVE_ADS', payload: record });
        } else if (productId === IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER) {
          dispatch({ type: 'PURCHASE_PERMANENT_MULTIPLIER', payload: record });
        } else if (productId === IAP_PRODUCT_IDS.BOOSTER_2X) {
          dispatch({ type: 'PURCHASE_BOOSTER_2X', payload: record });
        } else if (productId === IAP_PRODUCT_IDS.BOOSTER_5X) {
          dispatch({ type: 'PURCHASE_BOOSTER_5X', payload: record });
        } else if (isStarterPack(productId)) {
          // Derive packType from productId to match existing reducer shape
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
        }

        dispatch({ type: 'SET_IAP_PURCHASING', payload: false });
      });

      // Listener for purchase errors
      purchaseErrorSub = purchaseErrorListener((error) => {
        console.warn('[IAP] Purchase error:', error.message);
        dispatch({ type: 'SET_IAP_PURCHASING', payload: false });
      });
    };

    setupIAP();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      terminateIAP();
    };
  }, []);

  // Handle interstitial and ad/booster check on app foreground
  useEffect(() => {
    const handleAdAppOpen = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        dispatch({ type: 'CHECK_AD_BOOST_EXPIRATION' });
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
