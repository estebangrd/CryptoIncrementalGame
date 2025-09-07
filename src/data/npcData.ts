import { NPC } from '../types/game';

// NPCs for Phase 1: Genesis - Early adopters and enthusiasts
export const genesisNPCs: NPC[] = [
  // Early adopters - conservative buyers
  {
    id: 'early_adopter_1',
    name: 'Satoshi Enthusiast',
    nameKey: 'npc.satoshiEnthusiast',
    type: 'buyer',
    behavior: 'conservative',
    baseDemand: 0.1, // Low base demand
    priceSensitivity: 0.8, // Very price sensitive
    maxPurchaseAmount: 1000, // Small purchases
    minPurchaseAmount: 10,
    priceMultiplier: 0.95, // Offers 5% below market
    lastActivity: 0,
    cooldown: 300000, // 5 minutes
  },
  
  {
    id: 'early_adopter_2',
    name: 'Tech Pioneer',
    nameKey: 'npc.techPioneer',
    type: 'buyer',
    behavior: 'conservative',
    baseDemand: 0.15,
    priceSensitivity: 0.7,
    maxPurchaseAmount: 2000,
    minPurchaseAmount: 50,
    priceMultiplier: 0.98, // Offers 2% below market
    lastActivity: 0,
    cooldown: 600000, // 10 minutes
  },
  
  // Speculators - medium buyers
  {
    id: 'speculator_1',
    name: 'Crypto Speculator',
    nameKey: 'npc.cryptoSpeculator',
    type: 'buyer',
    behavior: 'speculative',
    baseDemand: 0.3,
    priceSensitivity: 0.5,
    maxPurchaseAmount: 5000,
    minPurchaseAmount: 100,
    priceMultiplier: 1.02, // Offers 2% above market
    lastActivity: 0,
    cooldown: 180000, // 3 minutes
  },
  
  {
    id: 'speculator_2',
    name: 'Market Trader',
    nameKey: 'npc.marketTrader',
    type: 'trader',
    behavior: 'speculative',
    baseDemand: 0.25,
    priceSensitivity: 0.4,
    maxPurchaseAmount: 8000,
    minPurchaseAmount: 200,
    priceMultiplier: 1.0, // Market price
    lastActivity: 0,
    cooldown: 120000, // 2 minutes
  },
  
  // Aggressive buyers - whale-like behavior
  {
    id: 'whale_1',
    name: 'Early Whale',
    nameKey: 'npc.earlyWhale',
    type: 'buyer',
    behavior: 'aggressive',
    baseDemand: 0.5,
    priceSensitivity: 0.3,
    maxPurchaseAmount: 50000,
    minPurchaseAmount: 1000,
    priceMultiplier: 1.05, // Offers 5% above market
    lastActivity: 0,
    cooldown: 1800000, // 30 minutes
  },
  
  // Hardware sellers
  {
    id: 'hardware_seller_1',
    name: 'Hardware Vendor',
    nameKey: 'npc.hardwareVendor',
    type: 'seller',
    behavior: 'conservative',
    baseDemand: 0.0, // Sells hardware, not coins
    priceSensitivity: 0.6,
    maxPurchaseAmount: 0,
    minPurchaseAmount: 0,
    priceMultiplier: 1.0, // Sells at market price
    lastActivity: 0,
    cooldown: 600000, // 10 minutes
  },
];

// Helper functions
export const getNPCById = (id: string): NPC | undefined => {
  return genesisNPCs.find(npc => npc.id === id);
};

export const getNPCsByType = (type: 'buyer' | 'seller' | 'trader'): NPC[] => {
  return genesisNPCs.filter(npc => npc.type === type);
};

export const getNPCsByBehavior = (behavior: 'conservative' | 'aggressive' | 'speculative'): NPC[] => {
  return genesisNPCs.filter(npc => npc.behavior === behavior);
};

export const getActiveNPCs = (npcs: NPC[]): NPC[] => {
  const now = Date.now();
  return npcs.filter(npc => now - npc.lastActivity >= npc.cooldown);
};
