import { GameState, Cryptocurrency } from '../types/game';

export const calculatePrestigeGain = (gameState: GameState): number => {
  let totalValue = 0;
  
  // Calculate total value of all cryptocurrencies
  (gameState.cryptocurrencies || []).forEach(crypto => {
    const balance = (gameState.currencyBalances && gameState.currencyBalances[crypto.id]) || 0;
    totalValue += balance * crypto.currentValue;
  });
  
  // Add CryptoCoins value
  totalValue += gameState.cryptoCoins || 0;
  
  // Prestige gain is based on total value (simplified formula)
  // You can adjust this formula to make prestige more or less frequent
  const prestigeGain = Math.floor(Math.log10(totalValue / 1000) * 10);
  
  return Math.max(0, prestigeGain);
};

export const canPrestige = (gameState: GameState): boolean => {
  return calculatePrestigeGain(gameState) > 0;
};

export const performPrestige = (gameState: GameState): GameState => {
  const prestigeGain = calculatePrestigeGain(gameState);
  
  if (prestigeGain <= 0) return gameState;
  
  // Calculate new prestige multiplier
  const newPrestigeMultiplier = gameState.prestigeMultiplier + (prestigeGain * 0.1);
  
  return {
    ...gameState,
    // Reset all currencies
    cryptoCoins: 0,
    cryptoCoinsPerSecond: 0,
    cryptoCoinsPerClick: 1,
    currencyBalances: {},
    hardware: gameState.hardware.map(h => ({ ...h, owned: 0 })),
    upgrades: gameState.upgrades.map(u => ({ ...u, purchased: false })),
    // Update prestige stats
    prestigeLevel: gameState.prestigeLevel + 1,
    prestigeMultiplier: newPrestigeMultiplier,
    totalPrestigeGains: gameState.totalPrestigeGains + prestigeGain,
    // Reset other stats
    totalClicks: 0,
    totalCryptoCoins: 0,
    lastSaveTime: Date.now(),
  };
};

export const getPrestigeBonus = (prestigeLevel: number): string => {
  const bonus = prestigeLevel * 10; // 10% per prestige level
  return `+${bonus}% to all production`;
};

export const formatPrestigeGain = (gain: number): string => {
  if (gain < 1000) return gain.toString();
  if (gain < 1000000) return `${(gain / 1000).toFixed(1)}K`;
  if (gain < 1000000000) return `${(gain / 1000000).toFixed(1)}M`;
  return `${(gain / 1000000000).toFixed(1)}B`;
};
