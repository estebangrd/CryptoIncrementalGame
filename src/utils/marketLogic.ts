import { MarketState, NPC, MarketEvent, GameState } from '../types/game';
import { genesisNPCs } from '../data/npcData';
import { genesisMarketEvents, getAvailableEvents, calculateEventProbability } from '../data/marketEvents';

// Market constants
export const MARKET_CONSTANTS = {
  BASE_PRICE: 0.01, // Base price of the coin
  PRICE_VOLATILITY: 0.1, // 10% volatility
  LIQUIDITY_DECAY: 0.95, // Liquidity decays 5% per update
  FEAR_GREED_DECAY: 0.98, // Fear/greed index decays 2% per update
  MAX_PRICE_HISTORY: 100, // Keep last 100 price points
  UPDATE_INTERVAL: 30000, // Update every 30 seconds
};

// Initialize market state
export const getInitialMarketState = (): MarketState => {
  return {
    basePrice: MARKET_CONSTANTS.BASE_PRICE,
    currentPrice: MARKET_CONSTANTS.BASE_PRICE,
    priceHistory: [MARKET_CONSTANTS.BASE_PRICE],
    totalVolume: 0,
    dailyVolume: 0,
    liquidity: 0.1, // Start with low liquidity
    fearGreedIndex: 0, // Neutral sentiment
    lastUpdate: Date.now(),
    activeEvents: [],
    npcs: [...genesisNPCs],
  };
};

// Calculate current market price based on supply and demand
export const calculateMarketPrice = (marketState: MarketState): number => {
  let price = marketState.basePrice;
  
  // Apply active events
  marketState.activeEvents.forEach(event => {
    price *= event.priceMultiplier;
  });
  
  // Apply liquidity factor
  price *= (1 + marketState.liquidity * 0.5);
  
  // Apply fear/greed index
  price *= (1 + marketState.fearGreedIndex * 0.3);
  
  // Add some random volatility
  const volatility = (Math.random() - 0.5) * MARKET_CONSTANTS.PRICE_VOLATILITY;
  price *= (1 + volatility);
  
  return Math.max(0.001, price); // Minimum price of 0.001
};

// Update market state
export const updateMarketState = (marketState: MarketState): MarketState => {
  // Safety check: if marketState is undefined, return initial state
  if (!marketState) {
    return getInitialMarketState();
  }
  
  const now = Date.now();
  const timeDiff = now - marketState.lastUpdate;
  
  // Don't update too frequently
  if (timeDiff < MARKET_CONSTANTS.UPDATE_INTERVAL) {
    return marketState;
  }
  
  const newMarketState = { ...marketState };
  
  // Update price
  newMarketState.currentPrice = calculateMarketPrice(marketState);
  
  // Add to price history
  newMarketState.priceHistory.push(newMarketState.currentPrice);
  if (newMarketState.priceHistory.length > MARKET_CONSTANTS.MAX_PRICE_HISTORY) {
    newMarketState.priceHistory.shift();
  }
  
  // Update liquidity (decay over time)
  newMarketState.liquidity *= MARKET_CONSTANTS.LIQUIDITY_DECAY;
  newMarketState.liquidity = Math.max(0.01, newMarketState.liquidity);
  
  // Update fear/greed index (decay over time)
  newMarketState.fearGreedIndex *= MARKET_CONSTANTS.FEAR_GREED_DECAY;
  
  // Check for new events
  const newEvents = checkForNewEvents(marketState);
  newMarketState.activeEvents.push(...newEvents);
  
  // Remove expired events
  newMarketState.activeEvents = newMarketState.activeEvents.filter(event => {
    return now - event.lastOccurred < event.duration;
  });
  
  // Update NPCs
  newMarketState.npcs = updateNPCs(marketState.npcs, newMarketState);
  
  newMarketState.lastUpdate = now;
  
  return newMarketState;
};

// Check for new market events
export const checkForNewEvents = (marketState: MarketState): MarketEvent[] => {
  const now = Date.now();
  const newEvents: MarketEvent[] = [];
  
  const availableEvents = getAvailableEvents(genesisMarketEvents);
  
  availableEvents.forEach(event => {
    const timeSinceLastOccurred = now - event.lastOccurred;
    const probability = calculateEventProbability(event, timeSinceLastOccurred);
    
    if (Math.random() < probability) {
      const newEvent = { ...event, lastOccurred: now };
      newEvents.push(newEvent);
    }
  });
  
  return newEvents;
};

// Update NPCs
export const updateNPCs = (npcs: NPC[], marketState: MarketState): NPC[] => {
  const now = Date.now();
  
  return npcs.map(npc => {
    // Check if NPC should be active
    if (now - npc.lastActivity >= npc.cooldown) {
      // NPC becomes active (will be handled by market interactions)
      return { ...npc, lastActivity: now };
    }
    return npc;
  });
};

// Get active NPCs that can make offers
export const getActiveNPCs = (marketState: MarketState): NPC[] => {
  if (!marketState || !marketState.npcs) {
    return [];
  }
  
  const now = Date.now();
  return marketState.npcs.filter(npc => 
    npc.type === 'buyer' && 
    now - npc.lastActivity >= npc.cooldown
  );
};

// Calculate NPC offer price
export const calculateNPCOfferPrice = (npc: NPC, marketPrice: number): number => {
  return marketPrice * npc.priceMultiplier;
};

// Calculate NPC purchase amount
export const calculateNPCPurchaseAmount = (npc: NPC, marketPrice: number, playerCoins: number): number => {
  // Base demand affected by price sensitivity
  const priceFactor = 1 - (npc.priceSensitivity * (marketPrice - MARKET_CONSTANTS.BASE_PRICE) / MARKET_CONSTANTS.BASE_PRICE);
  const demand = npc.baseDemand * priceFactor;
  
  // Calculate amount based on demand and available coins
  const maxAmount = Math.min(npc.maxPurchaseAmount, playerCoins);
  const minAmount = npc.minPurchaseAmount;
  
  const amount = Math.floor(demand * maxAmount);
  return Math.max(minAmount, Math.min(maxAmount, amount));
};

// Process NPC purchase
export const processNPCPurchase = (npc: NPC, amount: number, marketPrice: number): { coinsSold: number; coinsReceived: number } => {
  const offerPrice = calculateNPCOfferPrice(npc, marketPrice);
  const coinsReceived = amount * offerPrice;
  
  return {
    coinsSold: amount,
    coinsReceived: coinsReceived,
  };
};

// Update market after transaction
export const updateMarketAfterTransaction = (marketState: MarketState, volume: number): MarketState => {
  const newMarketState = { ...marketState };
  
  // Update volume
  newMarketState.totalVolume += volume;
  newMarketState.dailyVolume += volume;
  
  // Increase liquidity based on transaction volume
  const liquidityIncrease = Math.min(0.1, volume / 10000);
  newMarketState.liquidity = Math.min(1.0, newMarketState.liquidity + liquidityIncrease);
  
  // Update fear/greed index based on transaction
  const sentimentChange = volume > 1000 ? 0.1 : -0.05;
  newMarketState.fearGreedIndex = Math.max(-1, Math.min(1, newMarketState.fearGreedIndex + sentimentChange));
  
  return newMarketState;
};

// Get market statistics
export const getMarketStats = (marketState: MarketState) => {
  if (!marketState) {
    const initialState = getInitialMarketState();
    return {
      currentPrice: initialState.currentPrice,
      priceChange: 0,
      priceChangePercent: 0,
      totalVolume: initialState.totalVolume,
      dailyVolume: initialState.dailyVolume,
      liquidity: initialState.liquidity,
      fearGreedIndex: initialState.fearGreedIndex,
      activeEvents: initialState.activeEvents,
      activeNPCs: [],
    };
  }
  
  const priceChange = marketState.priceHistory.length > 1 
    ? marketState.priceHistory[marketState.priceHistory.length - 1] - marketState.priceHistory[marketState.priceHistory.length - 2]
    : 0;
  
  const priceChangePercent = marketState.priceHistory.length > 1
    ? (priceChange / marketState.priceHistory[marketState.priceHistory.length - 2]) * 100
    : 0;
  
  return {
    currentPrice: marketState.currentPrice,
    priceChange: priceChange,
    priceChangePercent: priceChangePercent,
    totalVolume: marketState.totalVolume,
    dailyVolume: marketState.dailyVolume,
    liquidity: marketState.liquidity,
    fearGreedIndex: marketState.fearGreedIndex,
    activeEvents: marketState.activeEvents,
    activeNPCs: getActiveNPCs(marketState),
  };
};

export const getPriceChangeColor = (baseValue: number, currentValue: number): string => {
  if (currentValue > baseValue) {
    return '#00ff88'; // Green for positive change
  } else if (currentValue < baseValue) {
    return '#ff6666'; // Red for negative change
  } else {
    return '#888'; // Gray for no change
  }
};