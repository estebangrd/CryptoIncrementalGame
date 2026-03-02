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
  litecoin: 70, // Precio base para referencia de CryptoCoin
};

// Cache para evitar demasiadas llamadas a la API
let priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Obtiene los precios actualizados de las criptomonedas desde CoinGecko API
 * @param cryptocurrencies - Lista de criptomonedas del juego
 * @returns Promise con las criptomonedas actualizadas con precios reales
 */
export const fetchCryptoPrices = async (cryptocurrencies: Cryptocurrency[]): Promise<Cryptocurrency[]> => {
  try {
    // Filtrar solo las criptomonedas que tienen equivalente en CoinGecko (excluir cryptocoin)
    const realCryptos = cryptocurrencies.filter(crypto => crypto.id !== 'cryptocoin' && COINGECKO_IDS[crypto.id]);
    
    // También obtener Litecoin para simular CryptoCoin
    const litecoinData = await fetchLitecoinPrice();
    
    if (realCryptos.length === 0 && !litecoinData) {
      return cryptocurrencies;
    }

    let coinIds = realCryptos.map(crypto => COINGECKO_IDS[crypto.id]).join(',');
    if (litecoinData && !coinIds.includes('litecoin')) {
      coinIds = coinIds ? `${coinIds},litecoin` : 'litecoin';
    }
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data: CoinGeckoPrice = await response.json();
    const now = Date.now();
    
    // Actualizar las criptomonedas con los precios reales
    return cryptocurrencies.map(crypto => {
      if (crypto.id === 'cryptocoin') {
        // Simular precio de CryptoCoin basado en Litecoin
        const litecoinPrice = data.litecoin?.usd || litecoinData || FALLBACK_PRICES.litecoin;
        const simulatedPrice = simulateCryptoCoinPrice(litecoinPrice, crypto.currentValue);
        
        return {
          ...crypto,
          currentValue: simulatedPrice,
        };
      }
      
      const coinGeckoId = COINGECKO_IDS[crypto.id];
      const priceData = data[coinGeckoId];
      
      if (priceData && priceData.usd) {
        // Actualizar cache
        priceCache[crypto.id] = {
          price: priceData.usd,
          timestamp: now
        };
        
        // Calcular el cambio porcentual si está disponible
        const changePercent = priceData.usd_24h_change || 0;
        
        return {
          ...crypto,
          currentValue: priceData.usd,
          baseValue: priceData.usd / (1 + changePercent / 100), // Estimar valor base de hace 24h
        };
      } else {
        // Usar precio en cache si existe y no ha expirado
        const cached = priceCache[crypto.id];
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          return {
            ...crypto,
            currentValue: cached.price,
          };
        }
        
        // Usar precio de respaldo
        return {
          ...crypto,
          currentValue: FALLBACK_PRICES[crypto.id] || crypto.currentValue,
        };
      }
    });
    
  } catch (error) {
    console.warn('Error fetching crypto prices:', error);
    
    // En caso de error, intentar usar precios cacheados o de respaldo
    const now = Date.now();
    return cryptocurrencies.map(crypto => {
      if (crypto.id === 'cryptocoin') {
        // Simular precio incluso en caso de error
        const simulatedPrice = simulateCryptoCoinPrice(FALLBACK_PRICES.litecoin, crypto.currentValue);
        return {
          ...crypto,
          currentValue: simulatedPrice,
        };
      }
      
      const cached = priceCache[crypto.id];
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return {
          ...crypto,
          currentValue: cached.price,
        };
      }
      
      return {
        ...crypto,
        currentValue: FALLBACK_PRICES[crypto.id] || crypto.currentValue,
      };
    });
  }
};

// Función para obtener el precio de Litecoin (usado como referencia para CryptoCoin)
const fetchLitecoinPrice = async (): Promise<number | null> => {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd';
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.litecoin?.usd || null;
  } catch (error) {
    return null;
  }
};

// Algoritmo de simulación para CryptoCoin basado en Litecoin
const simulateCryptoCoinPrice = (litecoinPrice: number, currentCryptoCoinPrice: number): number => {
  // Factor base: CryptoCoin vale aproximadamente 1/70 del valor de Litecoin
  const baseFactor = 1 / 70;
  const targetPrice = litecoinPrice * baseFactor;
  
  // Agregar volatilidad controlada (±5%)
  const volatility = 0.05;
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * volatility;
  
  // Suavizar la transición hacia el nuevo precio (80% nuevo, 20% anterior)
  const smoothingFactor = 0.8;
  const newPrice = targetPrice * randomFactor * smoothingFactor + currentCryptoCoinPrice * (1 - smoothingFactor);
  
  // Asegurar que el precio no sea negativo y tenga un mínimo razonable
  return Math.max(0.01, newPrice);
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