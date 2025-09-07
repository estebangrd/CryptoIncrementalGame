import { Cryptocurrency } from '../types/game';

export const updateMarketPrices = (cryptocurrencies: Cryptocurrency[]): Cryptocurrency[] => {
  return cryptocurrencies.map(crypto => {
    // Generate a random price change based on volatility
    const changePercent = (Math.random() - 0.5) * 2 * crypto.volatility; // -volatility to +volatility
    const newPrice = crypto.currentValue * (1 + changePercent);
    
    // Ensure price doesn't go below 10% of base value
    const minPrice = crypto.baseValue * 0.1;
    const finalPrice = Math.max(newPrice, minPrice);
    
    return {
      ...crypto,
      currentValue: finalPrice,
    };
  });
};

export const getCurrencyBalance = (
  cryptocurrencies: Cryptocurrency[],
  hardware: any[],
  upgrades: any[],
  selectedCurrency: string
): number => {
  // This will be implemented when we add individual currency balances
  // For now, return 0 as placeholder
  return 0;
};

export const getCurrencyProduction = (
  cryptocurrencies: Cryptocurrency[],
  hardware: any[],
  upgrades: any[],
  selectedCurrency: string
): number => {
  let totalProduction = 0;
  
  hardware.forEach(h => {
    if (h.currencyId === selectedCurrency) {
      let production = h.baseProduction * h.owned;
      
      // Apply upgrades that affect this hardware
      upgrades.forEach(upgrade => {
        if (upgrade.purchased && upgrade.effect.type === 'production' && upgrade.effect.target === h.id) {
          production *= upgrade.effect.value;
        }
      });
      
      totalProduction += production;
    }
  });
  
  return totalProduction;
};

export const formatCurrency = (amount: number, symbol: string): string => {
  if (amount < 1000) return `${amount.toFixed(2)} ${symbol}`;
  if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K ${symbol}`;
  if (amount < 1000000000) return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
  return `${(amount / 1000000000).toFixed(2)}B ${symbol}`;
};

export const getPriceChangeColor = (oldPrice: number, newPrice: number): string => {
  if (newPrice > oldPrice) return '#00ff88'; // Green for increase
  if (newPrice < oldPrice) return '#ff4444'; // Red for decrease
  return '#888'; // Gray for no change
};

