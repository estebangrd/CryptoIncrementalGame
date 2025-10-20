import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GameState } from '../types/game';
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
  | { type: 'UPDATE_CRYPTO_PRICES' };

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
      if (upgrade.purchased || state.cryptoCoins < upgrade.cost) return state;
      
      const newUpgrades = [...state.upgrades];
      newUpgrades[upgradeIndex] = { ...upgrade, purchased: true };
      
      const updatedState = {
        ...state,
        cryptoCoins: state.cryptoCoins - upgrade.cost,
        upgrades: newUpgrades,
      };
      
      return recalculateGameStats(updatedState);
    case 'LOAD_GAME':
      // Ensure cryptocurrencies are initialized when loading old saves
      const loadedState = {
        ...action.payload,
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
      return {
        ...state,
        cryptoCoins: state.cryptoCoins + state.cryptoCoinsPerSecond,
        totalCryptoCoins: state.totalCryptoCoins + state.cryptoCoinsPerSecond,
      };
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
      
      return {
        ...state,
        cryptoCoins: state.cryptoCoins - coinsToSell,
        realMoney: state.realMoney + moneyEarned,
        totalRealMoneyEarned: state.totalRealMoneyEarned + moneyEarned,
      };
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

  // Update crypto prices when user enters market view
  useEffect(() => {
    const updateCryptoPrices = async () => {
      const now = Date.now();
      const lastUpdate = gameState.marketUpdateTime || 0;
      
      // Solo actualizar si ha pasado suficiente tiempo o si es la primera vez
      if (shouldUpdatePrices(lastUpdate) || lastUpdate === 0) {
        try {
          const updatedCryptos = await fetchCryptoPrices(gameState.cryptocurrencies);
          
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
  }, []);

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
