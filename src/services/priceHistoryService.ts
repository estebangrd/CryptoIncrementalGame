import { Cryptocurrency } from '../types/game';
import { loadGameState, saveGameState } from '../utils/storage';

// Constantes
const MAX_HISTORY_POINTS = 30; // 30 puntos = últimos 30 minutos
const HISTORY_UPDATE_INTERVAL = 60000; // 1 minuto entre puntos

/**
 * Inicializa el historial de precios para todas las criptomonedas.
 * Genera 30 puntos simulados alrededor del precio actual como seed inicial.
 * Solo inicializa si no existe historial previo.
 */
export const initializePriceHistory = async (cryptocurrencies: Cryptocurrency[]): Promise<void> => {
  try {
    const gameState = await loadGameState();
    if (!gameState) return;

    if (!gameState.priceHistory) {
      gameState.priceHistory = {};
    }

    for (const crypto of cryptocurrencies) {
      if (!gameState.priceHistory[crypto.id]) {
        gameState.priceHistory[crypto.id] = {
          prices: generateSimulatedHistory(crypto.currentValue, crypto.volatility ?? 0.05),
          lastUpdate: Date.now(),
        };
      }
    }

    await saveGameState(gameState);
  } catch (error) {
    console.error('Error initializing price history:', error);
  }
};

/**
 * Actualiza el historial de precios con el nuevo valor de una criptomoneda.
 * Agrega un nuevo punto cada minuto; entre minutos actualiza el último punto.
 */
export const updatePriceHistory = async (cryptoId: string, newPrice: number): Promise<void> => {
  try {
    const gameState = await loadGameState();
    if (!gameState) return;

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

      if (now - history.lastUpdate >= HISTORY_UPDATE_INTERVAL) {
        history.prices.push(newPrice);
        if (history.prices.length > MAX_HISTORY_POINTS) {
          history.prices.shift();
        }
        history.lastUpdate = now;
      } else {
        history.prices[history.prices.length - 1] = newPrice;
      }
    }

    await saveGameState(gameState);
  } catch (error) {
    console.error('Error updating price history:', error);
  }
};

/**
 * Obtiene el historial de precios de una criptomoneda específica.
 */
export const getPriceHistory = async (cryptoId: string): Promise<number[]> => {
  try {
    const gameState = await loadGameState();
    if (!gameState?.priceHistory?.[cryptoId]) {
      return Array(MAX_HISTORY_POINTS).fill(1.0);
    }
    return gameState.priceHistory[cryptoId].prices;
  } catch (error) {
    console.error('Error getting price history:', error);
    return Array(MAX_HISTORY_POINTS).fill(1.0);
  }
};

/**
 * Actualiza el historial de precios para todas las criptomonedas.
 */
export const updateAllPriceHistory = async (cryptocurrencies: Cryptocurrency[]): Promise<void> => {
  for (const crypto of cryptocurrencies) {
    await updatePriceHistory(crypto.id, crypto.currentValue);
  }
};

/**
 * Genera datos de historial simulados. Usado como fallback si la API falla.
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
