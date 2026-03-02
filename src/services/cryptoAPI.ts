// Servicio para obtener precios reales de criptomonedas
import { Cryptocurrency } from '../types/game';

// Interfaz para la respuesta de la API de CoinGecko
interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

// Mapeo de IDs de nuestras criptomonedas a IDs de CoinGecko
const COINGECKO_IDS: { [key: string]: string } = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  dogecoin: 'dogecoin',
  cardano: 'cardano',
  // CryptoCoin se basará en Litecoin para simulación
  litecoin: 'litecoin',
};

// Precios de respaldo si la API falla
const FALLBACK_PRICES: { [key: string]: number } = {
  cryptocoin: 1.0,
  bitcoin: 45000,
  ethereum: 2500,
  dogecoin: 0.08,
  cardano: 0.45,
};

// Cache para evitar demasiadas llamadas a la API
let priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Obtiene los precios actualizados de las criptomonedas desde CoinGecko API
 * @param cryptocurrencies - Lista de criptomonedas del juego
 * @returns Promise con las criptomonedas actualizadas con precios reales
 */
// CryptoCoin price is now derived from local LTC history — see GameContext ADVANCE_PRICE_INDEX
export const fetchCryptoPrices = async (cryptocurrencies: Cryptocurrency[]): Promise<Cryptocurrency[]> => {
  try {
    const realCryptos = cryptocurrencies.filter(
      crypto => crypto.id !== 'cryptocoin' && COINGECKO_IDS[crypto.id]
    );

    if (realCryptos.length === 0) return cryptocurrencies;

    const coinIds = realCryptos.map(crypto => COINGECKO_IDS[crypto.id]).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data: CoinGeckoPrice = await response.json();
    const now = Date.now();

    return cryptocurrencies.map(crypto => {
      if (crypto.id === 'cryptocoin') return crypto; // managed by local LTC history

      const coinGeckoId = COINGECKO_IDS[crypto.id];
      const priceData = data[coinGeckoId];

      if (priceData?.usd) {
        priceCache[crypto.id] = { price: priceData.usd, timestamp: now };
        const changePercent = priceData.usd_24h_change || 0;
        return {
          ...crypto,
          currentValue: priceData.usd,
          baseValue: priceData.usd / (1 + changePercent / 100),
        };
      }

      const cached = priceCache[crypto.id];
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return { ...crypto, currentValue: cached.price };
      }

      return { ...crypto, currentValue: FALLBACK_PRICES[crypto.id] || crypto.currentValue };
    });

  } catch (error) {
    console.warn('Error fetching crypto prices:', error);
    const now = Date.now();
    return cryptocurrencies.map(crypto => {
      if (crypto.id === 'cryptocoin') return crypto;
      const cached = priceCache[crypto.id];
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return { ...crypto, currentValue: cached.price };
      }
      return { ...crypto, currentValue: FALLBACK_PRICES[crypto.id] || crypto.currentValue };
    });
  }
};

/**
 * Verifica si los precios necesitan ser actualizados
 * @param lastUpdate - Última vez que se actualizaron los precios
 * @returns true si es necesario actualizar
 */
export const shouldUpdatePrices = (lastUpdate: number): boolean => {
  const now = Date.now();
  return (now - lastUpdate) > CACHE_DURATION;
};

/**
 * Limpia el cache de precios
 */
export const clearPriceCache = (): void => {
  priceCache = {};
};