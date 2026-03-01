import { Cryptocurrency } from '../types/game';
import { loadGameState, saveGameState } from '../utils/storage';

// Interfaz para el historial de precios por moneda
interface PriceHistoryData {
  [cryptoId: string]: {
    prices: number[];
    lastUpdate: number;
  };
}

// Constantes
const MAX_HISTORY_POINTS = 24; // 24 puntos de historial
const HISTORY_UPDATE_INTERVAL = 60000; // 1 minuto entre puntos

/**
 * Inicializa el historial de precios para todas las criptomonedas
 */
export const initializePriceHistory = async (cryptocurrencies: Cryptocurrency[]): Promise<void> => {
  try {
    console.log('[DEBUG] initializePriceHistory called with', cryptocurrencies.length, 'cryptocurrencies');
    const gameState = await loadGameState();
    
    console.log('[DEBUG] loadGameState result:', gameState ? 'State loaded' : 'State is NULL');
    
    if (!gameState) {
      console.error('[ERROR] Game state is null, cannot initialize price history');
      console.error('[ERROR] This usually happens when initializePriceHistory is called before the game state is saved');
      return;
    }
    
    if (!gameState.priceHistory) {
      gameState.priceHistory = {};
    }
    
    // Inicializar historial para cada criptomoneda si no existe
    cryptocurrencies.forEach(crypto => {
      if (!gameState.priceHistory![crypto.id]) {
        gameState.priceHistory![crypto.id] = {
          prices: generateSimulatedHistory(crypto.currentValue, 0.05),
          lastUpdate: Date.now(),
        };
      }
    });
    
    await saveGameState(gameState);
  } catch (error) {
    console.error('Error initializing price history:', error);
  }
};

/**
 * Actualiza el historial de precios con el nuevo valor de una criptomoneda
 */
export const updatePriceHistory = async (cryptoId: string, newPrice: number): Promise<void> => {
  try {
    const gameState = await loadGameState();
    
    if (!gameState) {
      console.error('Game state is null, cannot update price history');
      return;
    }
    
    if (!gameState.priceHistory) {
      gameState.priceHistory = {};
    }
    
    if (!gameState.priceHistory[cryptoId]) {
      gameState.priceHistory[cryptoId] = {
        prices: Array(MAX_HISTORY_POINTS).fill(newPrice),
        lastUpdate: Date.now(),
      };
    } else {
      const history = gameState.priceHistory[cryptoId];
      const now = Date.now();
      
      // Verificar si ha pasado suficiente tiempo desde la última actualización
      if (now - history.lastUpdate >= HISTORY_UPDATE_INTERVAL) {
        // Agregar nuevo precio y eliminar el más antiguo
        history.prices.push(newPrice);
        if (history.prices.length > MAX_HISTORY_POINTS) {
          history.prices.shift();
        }
        history.lastUpdate = now;
      } else {
        // Actualizar el último precio si no ha pasado suficiente tiempo
        history.prices[history.prices.length - 1] = newPrice;
      }
    }
    
    await saveGameState(gameState);
  } catch (error) {
    console.error('Error updating price history:', error);
  }
};

/**
 * Obtiene el historial de precios de una criptomoneda específica
 */
export const getPriceHistory = async (cryptoId: string): Promise<number[]> => {
  try {
    const gameState = await loadGameState();
    
    if (!gameState || !gameState.priceHistory || !gameState.priceHistory[cryptoId]) {
      // Retornar historial por defecto si no existe
      return Array(MAX_HISTORY_POINTS).fill(1.0);
    }
    
    return gameState.priceHistory[cryptoId].prices;
  } catch (error) {
    console.error('Error getting price history:', error);
    return Array(MAX_HISTORY_POINTS).fill(1.0);
  }
};

/**
 * Actualiza el historial de precios para todas las criptomonedas
 */
export const updateAllPriceHistory = async (cryptocurrencies: Cryptocurrency[]): Promise<void> => {
  for (const crypto of cryptocurrencies) {
    await updatePriceHistory(crypto.id, crypto.currentValue);
  }
};

/**
 * Genera datos de historial simulados para pruebas (usado solo si no hay datos reales)
 */
export const generateSimulatedHistory = (basePrice: number, volatility: number = 0.1): number[] => {
  const history: number[] = [basePrice];
  
  for (let i = 1; i < MAX_HISTORY_POINTS; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = Math.max(0.01, history[i - 1] * (1 + change));
    history.push(newPrice);
  }
  
  return history;
};

/**
 * Verifica si el historial necesita ser inicializado
 */
export const needsHistoryInitialization = async (): Promise<boolean> => {
  try {
    const gameState = await loadGameState();
    return !gameState || !gameState.priceHistory || Object.keys(gameState.priceHistory).length === 0;
  } catch (error) {
    return true;
  }
};