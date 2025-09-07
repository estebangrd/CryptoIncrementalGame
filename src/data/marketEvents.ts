import { MarketEvent } from '../types/game';

// Market events for Phase 1: Genesis - Early market events
export const genesisMarketEvents: MarketEvent[] = [
  // The famous "Pizza Event" - First real-world transaction
  {
    id: 'pizza_event',
    name: 'The Pizza Purchase',
    nameKey: 'event.pizzaEvent',
    description: 'Someone offers to buy a large amount of coins for pizza!',
    descriptionKey: 'event.pizzaEventDesc',
    type: 'pizza',
    duration: 300000, // 5 minutes
    priceMultiplier: 1.2, // 20% price increase
    demandMultiplier: 2.0, // Double demand
    probability: 0.1, // 10% chance per hour
    lastOccurred: 0,
    cooldown: 3600000, // 1 hour cooldown
  },
  
  // Early adoption events
  {
    id: 'early_adoption',
    name: 'Early Adoption',
    nameKey: 'event.earlyAdoption',
    description: 'A tech company announces they will accept the coin!',
    descriptionKey: 'event.earlyAdoptionDesc',
    type: 'adoption',
    duration: 600000, // 10 minutes
    priceMultiplier: 1.15, // 15% price increase
    demandMultiplier: 1.5, // 50% demand increase
    probability: 0.05, // 5% chance per hour
    lastOccurred: 0,
    cooldown: 7200000, // 2 hours cooldown
  },
  
  // Market crashes - early volatility
  {
    id: 'market_crash',
    name: 'Market Crash',
    nameKey: 'event.marketCrash',
    description: 'Panic selling causes prices to drop!',
    descriptionKey: 'event.marketCrashDesc',
    type: 'crash',
    duration: 900000, // 15 minutes
    priceMultiplier: 0.7, // 30% price decrease
    demandMultiplier: 0.5, // 50% demand decrease
    probability: 0.08, // 8% chance per hour
    lastOccurred: 0,
    cooldown: 5400000, // 1.5 hours cooldown
  },
  
  // Bull runs - early excitement
  {
    id: 'bull_run',
    name: 'Bull Run',
    nameKey: 'event.bullRun',
    description: 'Excitement drives prices up!',
    descriptionKey: 'event.bullRunDesc',
    type: 'boom',
    duration: 1200000, // 20 minutes
    priceMultiplier: 1.3, // 30% price increase
    demandMultiplier: 1.8, // 80% demand increase
    probability: 0.06, // 6% chance per hour
    lastOccurred: 0,
    cooldown: 7200000, // 2 hours cooldown
  },
  
  // Regulatory concerns - early uncertainty
  {
    id: 'regulation_fear',
    name: 'Regulatory Concerns',
    nameKey: 'event.regulationFear',
    description: 'Government officials express concerns about the coin!',
    descriptionKey: 'event.regulationFearDesc',
    type: 'regulation',
    duration: 1800000, // 30 minutes
    priceMultiplier: 0.85, // 15% price decrease
    demandMultiplier: 0.7, // 30% demand decrease
    probability: 0.04, // 4% chance per hour
    lastOccurred: 0,
    cooldown: 10800000, // 3 hours cooldown
  },
  
  // Technical breakthrough
  {
    id: 'tech_breakthrough',
    name: 'Technical Breakthrough',
    nameKey: 'event.techBreakthrough',
    description: 'A major technical improvement is announced!',
    descriptionKey: 'event.techBreakthroughDesc',
    type: 'adoption',
    duration: 2400000, // 40 minutes
    priceMultiplier: 1.25, // 25% price increase
    demandMultiplier: 1.6, // 60% demand increase
    probability: 0.03, // 3% chance per hour
    lastOccurred: 0,
    cooldown: 14400000, // 4 hours cooldown
  },
];

// Helper functions
export const getEventById = (id: string): MarketEvent | undefined => {
  return genesisMarketEvents.find(event => event.id === id);
};

export const getEventsByType = (type: 'pizza' | 'regulation' | 'adoption' | 'crash' | 'boom'): MarketEvent[] => {
  return genesisMarketEvents.filter(event => event.type === type);
};

export const getAvailableEvents = (events: MarketEvent[]): MarketEvent[] => {
  const now = Date.now();
  return events.filter(event => 
    now - event.lastOccurred >= event.cooldown
  );
};

export const calculateEventProbability = (event: MarketEvent, timeSinceLastOccurred: number): number => {
  // Increase probability over time
  const timeFactor = Math.min(timeSinceLastOccurred / event.cooldown, 2.0);
  return event.probability * timeFactor;
};
