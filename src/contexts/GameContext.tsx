import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GameState, Cryptocurrency, IAPState, AdState, AdBoostState, Achievement } from '../types/game';
import { hardwareProgression } from '../data/hardwareData';
import { initialUpgrades } from '../data/gameData';
import { cryptocurrencies } from '../data/cryptocurrencies';
import { getInitialGameState, updateOfflineProgress, checkAndUpdateUnlocks } from '../utils/gameLogic';
import { performPrestige } from '../utils/prestigeLogic';
import { performExchange } from '../utils/exchangeLogic';
import { 
  calculateTotalHashRate, 
  calculateCurrentReward, 
  calculateNextHalving,
  mineBlock,
  canMineBlock 
} from '../utils/blockLogic';
import { 
  calculateTotalElectricityCost,
  calculateTotalMiningSpeed,
  calculateTotalProduction
} from '../utils/gameLogic';
import { 
  updateMarketState,
  getActiveNPCs,
  calculateNPCPurchaseAmount,
  processNPCPurchase,
  updateMarketAfterTransaction,
  getMarketStats,
  getInitialMarketState
} from '../utils/marketLogic';
import { saveGameState, loadGameState, saveLanguage, loadLanguage } from '../utils/storage';
import { translations } from '../data/translations';
import { fetchCryptoPrices, shouldUpdatePrices } from '../services/cryptoAPI';
import { initializePriceHistory, updateAllPriceHistory } from '../services/priceHistoryService';
import { BOOSTER_CONFIG, STARTER_PACK_REWARDS } from '../config/balanceConfig';
import { IAP_PRODUCT_IDS } from '../config/iapConfig';
import { PurchaseRecord } from '../types/game';

interface GameContextType {
  gameState: GameState;
  currentLanguage: string;
  t: (key: string) => string;
  dispatch: React.Dispatch<GameAction>;
  setLanguage: (languageCode: string) => void;
}

type GameAction =
  | { type: 'BUY_HARDWARE'; payload: string }
  | { type: 'BUY_UPGRADE'; payload: string }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_OFFLINE_PROGRESS' }
  | { type: 'ADD_PRODUCTION' }
  | { type: 'SELECT_CURRENCY'; payload: string | null }
  | { type: 'UPDATE_MARKET' }
  | { type: 'PERFORM_PRESTIGE' }
  | { type: 'EXCHANGE_CURRENCY'; payload: { fromCurrency: string; toCurrency: string; amount: number } }
  | { type: 'MINE_BLOCK' }
  | { type: 'UPDATE_MARKET_STATE' }
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
  | { type: 'SET_IAP_PURCHASING'; payload: boolean };

const GameContext = createContext<GameContextType | undefined>(undefined);

// Helper function to recalculate all game stats
const recalculateGameStats = (state: GameState): GameState => {
  // Calculate total production using the correct function
  const totalProduction = calculateTotalProduction(state);
  
  // Calculate total hash rate from hardware
  const totalHashRate = calculateTotalHashRate(state);
  
  // Calculate total electricity cost
  const totalElectricityCost = calculateTotalElectricityCost(state.hardware);
  
  // Calculate net production (production - electricity cost)
  const netProduction = Math.max(0, totalProduction - totalElectricityCost);
  
  const updatedState = {
    ...state,
    cryptoCoinsPerSecond: netProduction,
    totalElectricityCost: totalElectricityCost,
    totalHashRate: totalHashRate,
    currentReward: calculateCurrentReward(state.blocksMined),
    nextHalving: calculateNextHalving(state.blocksMined),
  };
  
  // Check and update unlocks
  return checkAndUpdateUnlocks(updatedState);
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'BUY_HARDWARE':
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
    case 'LOAD_GAME':
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
      
      // Ensure cryptocurrencies are initialized when loading old saves
      const loadedState = {
        ...action.payload,
        hardware: migratedHardware,
        cryptocurrencies: action.payload.cryptocurrencies || cryptocurrencies,
        selectedCurrency: action.payload.selectedCurrency || null,
        marketUpdateTime: action.payload.marketUpdateTime || Date.now(),
        currencyBalances: action.payload.currencyBalances || {},
        totalPrestigeGains: action.payload.totalPrestigeGains || 0,
        marketState: action.payload.marketState || getInitialMarketState(),
        unlockedTabs: action.payload.unlockedTabs || {
          market: false,
          hardware: false,
          upgrades: false,
          prestige: false,
        },
        realMoney: action.payload.realMoney || 0,
        totalRealMoneyEarned: action.payload.totalRealMoneyEarned || 0,
      };
      return recalculateGameStats(loadedState);
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
        },
        realMoney: 0,
        totalRealMoneyEarned: 0,
      };
      return recalculateGameStats(resetState);
    case 'UPDATE_OFFLINE_PROGRESS':
      return updateOfflineProgress(state);
    case 'ADD_PRODUCTION':
      // Calculate how many blocks should be mined based on hardware mining speed
      const totalMiningSpeed = calculateTotalMiningSpeed(state.hardware, state.upgrades);
      const blocksToMine = Math.floor(totalMiningSpeed); // Mine complete blocks only
      
      if (blocksToMine > 0 && canMineBlock(state)) {
        // Mine blocks and get rewards
        let newState = { ...state };
        let totalReward = 0;
        
        for (let i = 0; i < blocksToMine && canMineBlock(newState); i++) {
          const reward = calculateCurrentReward(newState.blocksMined);
          newState.blocksMined += 1;
          totalReward += reward;
          
          // Update current reward and next halving after each block
          newState.currentReward = calculateCurrentReward(newState.blocksMined);
          newState.nextHalving = calculateNextHalving(newState.blocksMined);
        }
        
        newState.cryptoCoins += totalReward;
        newState.totalCryptoCoins += totalReward;
        
        return recalculateGameStats(newState);
      }
      
      return state;
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
    case 'PERFORM_PRESTIGE':
      return performPrestige(state);
    case 'EXCHANGE_CURRENCY':
      return performExchange(state, action.payload.fromCurrency, action.payload.toCurrency, action.payload.amount);
    case 'MINE_BLOCK':
      if (canMineBlock(state)) {
        const newState = mineBlock(state);
        return recalculateGameStats(newState);
      }
      return state;
    case 'UPDATE_MARKET_STATE':
      return {
        ...state,
        marketState: updateMarketState(state.marketState),
      };
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
      
      // Validar que el monto no sea excesivamente grande (posible bug de cálculo)
      // Este límite previene errores numéricos o bugs que podrían generar valores anómalos
      if (moneyEarned > 100000000) { // $100M como límite de seguridad extremo
        console.warn('Suspiciously large transaction amount:', moneyEarned);
        return state;
      }
      
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
    achievements: [] as Achievement[],
  }));

  // Debug log for initial state
  React.useEffect(() => {
    console.log('DEBUG: Initial game state loaded');
    console.log('DEBUG: Initial cryptoCoinsPerSecond:', gameState.cryptoCoinsPerSecond);
    console.log('DEBUG: Initial hardware:', gameState.hardware.map(h => ({ id: h.id, owned: h.owned, miningSpeed: h.miningSpeed, blockReward: h.blockReward })));
    console.log('DEBUG: Initial upgrades:', gameState.upgrades.filter(u => u.purchased).map(u => ({ id: u.id, purchased: u.purchased })));
  }, []);
  
  const [currentLanguage, setCurrentLanguage] = React.useState('en');

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
        console.log('DEBUG: Adding production, cryptoCoinsPerSecond:', gameState.cryptoCoinsPerSecond);
        console.log('DEBUG: Hardware owned:', gameState.hardware.map(h => ({ id: h.id, owned: h.owned, baseProduction: h.baseProduction, miningSpeed: h.miningSpeed, blockReward: h.blockReward })));
        console.log('DEBUG: Upgrades purchased:', gameState.upgrades.filter(u => u.purchased).map(u => ({ id: u.id, purchased: u.purchased, effect: u.effect })));
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

  // Initialize price history when game loads and cryptocurrencies are available
  useEffect(() => {
    const initializeHistory = async () => {
      try {
        console.log('[DEBUG] GameContext: Attempting to initialize price history');
        console.log('[DEBUG] GameContext: cryptocurrencies available:', gameState.cryptocurrencies?.length || 0);
        
        // Solo inicializar si hay criptomonedas disponibles
        if (gameState.cryptocurrencies && gameState.cryptocurrencies.length > 0) {
          // Primero guardar el estado actual antes de inicializar el historial
          console.log('[DEBUG] GameContext: Saving game state before initializing price history');
          await saveGameState(gameState);
          
          console.log('[DEBUG] GameContext: Now calling initializePriceHistory');
          await initializePriceHistory(gameState.cryptocurrencies);
          console.log('[DEBUG] GameContext: Price history initialized successfully');
        }
      } catch (error) {
        console.warn('[WARN] Failed to initialize price history:', error);
      }
    };
    
    initializeHistory();
  }, [gameState.cryptocurrencies]);

  // Update crypto prices when user enters market view
  useEffect(() => {
    const updateCryptoPrices = async () => {
      const now = Date.now();
      const lastUpdate = gameState.marketUpdateTime || 0;
      
      // Solo actualizar si hay criptomonedas disponibles
      if (!gameState.cryptocurrencies || gameState.cryptocurrencies.length === 0) {
        return;
      }
      
      // Solo actualizar si ha pasado suficiente tiempo o si es la primera vez
      if (shouldUpdatePrices(lastUpdate) || lastUpdate === 0) {
        try {
          const updatedCryptos = await fetchCryptoPrices(gameState.cryptocurrencies);
          
          // Actualizar historial de precios
          await updateAllPriceHistory(updatedCryptos);
          
          // Actualizar el estado con los nuevos precios
          dispatch({
            type: 'LOAD_GAME',
            payload: {
              ...gameState,
              cryptocurrencies: updatedCryptos,
              marketUpdateTime: now,
            }
          });
        } catch (error) {
          console.warn('Failed to update crypto prices:', error);
        }
      }
    };

    // Llamar a la función cuando el componente se monte o cuando el usuario entre a la vista market
    updateCryptoPrices();
  }, [gameState.cryptocurrencies]);

  return (
    <GameContext.Provider value={{ gameState, currentLanguage, t, dispatch, setLanguage }}>
      {children}
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
