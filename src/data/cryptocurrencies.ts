import { Cryptocurrency } from '../types/game';
import { CRYPTO_CONFIG, AI_CONFIG } from '../config/balanceConfig';

export const cryptocurrencies: Cryptocurrency[] = [
  {
    id: 'cryptocoin',
    name: 'CryptoCoin',
    nameKey: 'cryptocoin',
    symbol: 'CC',
    baseValue: CRYPTO_CONFIG.cryptocoin.baseValue,
    currentValue: CRYPTO_CONFIG.cryptocoin.baseValue,
    volatility: CRYPTO_CONFIG.cryptocoin.volatility,
    color: '#00ff88',
    icon: '🪙',
  },
  // AI-exclusive cryptocurrencies (Phase 5) — hidden until AI level is reached
  {
    id: 'neural_coin',
    name: 'NeuralCoin',
    nameKey: 'neural_coin',
    symbol: AI_CONFIG.AI_CRYPTOS.neural_coin.symbol,
    baseValue: AI_CONFIG.AI_CRYPTOS.neural_coin.baseValue,
    currentValue: AI_CONFIG.AI_CRYPTOS.neural_coin.baseValue,
    volatility: AI_CONFIG.AI_CRYPTOS.neural_coin.volatility,
    color: '#a855f7',
    icon: AI_CONFIG.AI_CRYPTOS.neural_coin.icon,
    aiLevelRequired: 1,
  },
  {
    id: 'quantum_bit',
    name: 'QuantumBit',
    nameKey: 'quantum_bit',
    symbol: AI_CONFIG.AI_CRYPTOS.quantum_bit.symbol,
    baseValue: AI_CONFIG.AI_CRYPTOS.quantum_bit.baseValue,
    currentValue: AI_CONFIG.AI_CRYPTOS.quantum_bit.baseValue,
    volatility: AI_CONFIG.AI_CRYPTOS.quantum_bit.volatility,
    color: '#06b6d4',
    icon: AI_CONFIG.AI_CRYPTOS.quantum_bit.icon,
    aiLevelRequired: 2,
  },
  {
    id: 'singularity_coin',
    name: 'SingularityCoin',
    nameKey: 'singularity_coin',
    symbol: AI_CONFIG.AI_CRYPTOS.singularity_coin.symbol,
    baseValue: AI_CONFIG.AI_CRYPTOS.singularity_coin.baseValue,
    currentValue: AI_CONFIG.AI_CRYPTOS.singularity_coin.baseValue,
    volatility: AI_CONFIG.AI_CRYPTOS.singularity_coin.volatility,
    color: '#ec4899',
    icon: AI_CONFIG.AI_CRYPTOS.singularity_coin.icon,
    aiLevelRequired: 3,
  },
];

