import { Cryptocurrency } from '../types/game';

export const cryptocurrencies: Cryptocurrency[] = [
  {
    id: 'cryptocoin',
    name: 'CryptoCoin',
    nameKey: 'cryptocoin',
    symbol: 'CC',
    baseValue: 1,
    currentValue: 1,
    volatility: 0.1, // 10% volatility
    color: '#00ff88',
    icon: '🪙',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    nameKey: 'bitcoin',
    symbol: 'BTC',
    baseValue: 100,
    currentValue: 100,
    volatility: 0.15, // 15% volatility
    color: '#f7931a',
    icon: '₿',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    nameKey: 'ethereum',
    symbol: 'ETH',
    baseValue: 50,
    currentValue: 50,
    volatility: 0.2, // 20% volatility
    color: '#627eea',
    icon: 'Ξ',
  },
  {
    id: 'dogecoin',
    name: 'Dogecoin',
    nameKey: 'dogecoin',
    symbol: 'DOGE',
    baseValue: 0.1,
    currentValue: 0.1,
    volatility: 0.3, // 30% volatility
    color: '#c2a633',
    icon: '🐕',
  },
  {
    id: 'cardano',
    name: 'Cardano',
    nameKey: 'cardano',
    symbol: 'ADA',
    baseValue: 0.5,
    currentValue: 0.5,
    volatility: 0.25, // 25% volatility
    color: '#0033ad',
    icon: '₳',
  },
];

