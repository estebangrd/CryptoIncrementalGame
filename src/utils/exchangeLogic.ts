import { GameState, Cryptocurrency } from '../types/game';

export const calculateExchangeRate = (
  fromCurrency: Cryptocurrency,
  toCurrency: Cryptocurrency
): number => {
  // Exchange rate is based on current market values
  return fromCurrency.currentValue / toCurrency.currentValue;
};

export const calculateExchangeFee = (currency: Cryptocurrency): number => {
  // Fixed 1% fee for all currencies
  return 0.01; // 1%
};

export const calculateExchangeAmount = (
  fromAmount: number,
  fromCurrency: Cryptocurrency,
  toCurrency: Cryptocurrency
): number => {
  const rate = calculateExchangeRate(fromCurrency, toCurrency);
  const fee = calculateExchangeFee(fromCurrency);
  const amountAfterFee = fromAmount * (1 - fee);
  return amountAfterFee * rate;
};

export const canExchange = (
  gameState: GameState,
  fromCurrencyId: string,
  amount: number
): boolean => {
  if (fromCurrencyId === 'cryptocoin') {
    return gameState.cryptoCoins >= amount;
  }
  
  const balance = gameState.currencyBalances[fromCurrencyId] || 0;
  return balance >= amount;
};

export const determineExchangeDirection = (
  gameState: GameState,
  selectedCurrencyId: string
): { fromCurrency: string; toCurrency: string } => {
  const selectedBalance = getCurrencyBalance(gameState, selectedCurrencyId);
  const cryptocoinBalance = gameState.cryptoCoins;
  
  // If user has more of the selected currency, exchange it for CryptoCoins
  // If user has more CryptoCoins, exchange them for the selected currency
  if (selectedBalance > cryptocoinBalance) {
    return { fromCurrency: selectedCurrencyId, toCurrency: 'cryptocoin' };
  } else {
    return { fromCurrency: 'cryptocoin', toCurrency: selectedCurrencyId };
  }
};

export const performExchange = (
  gameState: GameState,
  fromCurrencyId: string,
  toCurrencyId: string,
  amount: number
): GameState => {
  if (!canExchange(gameState, fromCurrencyId, amount)) {
    return gameState;
  }

  const fromCurrency = gameState.cryptocurrencies.find(c => c.id === fromCurrencyId);
  const toCurrency = gameState.cryptocurrencies.find(c => c.id === toCurrencyId);

  if (!fromCurrency || !toCurrency) {
    return gameState;
  }

  const exchangeAmount = calculateExchangeAmount(amount, fromCurrency, toCurrency);

  const newState = { ...gameState };

  // Remove from source currency
  if (fromCurrencyId === 'cryptocoin') {
    newState.cryptoCoins -= amount;
  } else {
    newState.currencyBalances = {
      ...newState.currencyBalances,
      [fromCurrencyId]: (newState.currencyBalances[fromCurrencyId] || 0) - amount,
    };
  }

  // Add to target currency
  if (toCurrencyId === 'cryptocoin') {
    newState.cryptoCoins += exchangeAmount;
  } else {
    newState.currencyBalances = {
      ...newState.currencyBalances,
      [toCurrencyId]: (newState.currencyBalances[toCurrencyId] || 0) + exchangeAmount,
    };
  }

  return newState;
};

export const getCurrencyBalance = (gameState: GameState, currencyId: string): number => {
  if (currencyId === 'cryptocoin') {
    return gameState.cryptoCoins;
  }
  return gameState.currencyBalances[currencyId] || 0;
};

export const formatCurrencyAmount = (amount: number, symbol: string): string => {
  if (amount < 0.01) return `${amount.toFixed(4)} ${symbol}`;
  if (amount < 1) return `${amount.toFixed(3)} ${symbol}`;
  if (amount < 1000) return `${amount.toFixed(2)} ${symbol}`;
  if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K ${symbol}`;
  if (amount < 1000000000) return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
  return `${(amount / 1000000000).toFixed(2)}B ${symbol}`;
};

export const getExchangePreview = (
  gameState: GameState,
  selectedCurrencyId: string,
  amountPercent: number
) => {
  const direction = determineExchangeDirection(gameState, selectedCurrencyId);
  const fromCurrency = gameState.cryptocurrencies.find(c => c.id === direction.fromCurrency);
  const toCurrency = gameState.cryptocurrencies.find(c => c.id === direction.toCurrency);
  
  if (!fromCurrency || !toCurrency) return null;
  
  const fromBalance = getCurrencyBalance(gameState, direction.fromCurrency);
  const exchangeAmount = (fromBalance * amountPercent) / 100;
  const receiveAmount = calculateExchangeAmount(exchangeAmount, fromCurrency, toCurrency);
  const fee = calculateExchangeFee(fromCurrency);
  
  return {
    fromCurrency: direction.fromCurrency,
    toCurrency: direction.toCurrency,
    fromAmount: exchangeAmount,
    toAmount: receiveAmount,
    fee: fee * 100, // Convert to percentage
    fromSymbol: fromCurrency.symbol,
    toSymbol: toCurrency.symbol,
  };
};
