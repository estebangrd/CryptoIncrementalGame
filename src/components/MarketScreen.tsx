import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
} from 'react-native';

import { useGame } from '../contexts/GameContext';
import { getPriceChangeColor } from '../utils/marketLogic';
import {
  getExchangePreview,
  determineExchangeDirection,
  getCurrencyBalance,
  formatCurrencyAmount
} from '../utils/exchangeLogic';
import PriceChart from './PriceChart';

interface MarketScreenProps {
  isActive?: boolean;
}

const MarketScreen: React.FC<MarketScreenProps> = ({ isActive = true }) => {
  const { gameState, dispatch, t } = useGame();
  const [amountPercent, setAmountPercent] = useState(50); // 1-100
  const [priceHistories, setPriceHistories] = useState<{ [key: string]: number[] }>({});
  const [sellConfirming, setSellConfirming] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const sellConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sliderRef = useRef<View>(null);

  const clearSellConfirm = () => {
    setSellConfirming(false);
    if (sellConfirmTimer.current) {
      clearTimeout(sellConfirmTimer.current);
      sellConfirmTimer.current = null;
    }
  };

  // Reset confirmation when slider or currency changes
  useEffect(() => {
    clearSellConfirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountPercent, gameState.selectedCurrency]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (sellConfirmTimer.current) clearTimeout(sellConfirmTimer.current);
    };
  }, []);

  const handleSelectCurrency = (currencyId: string) => {
    // Toggle selection: if already selected, deselect it
    if (gameState.selectedCurrency === currencyId) {
      dispatch({ type: 'SELECT_CURRENCY', payload: null });
    } else {
      dispatch({ type: 'SELECT_CURRENCY', payload: currencyId });
      // Reset slider to 50% when selecting a new currency
      setAmountPercent(50);
    }
  };

  const getSelectedCurrency = () => {
    if (!gameState.selectedCurrency) return null;
    return gameState.cryptocurrencies.find(c => c.id === gameState.selectedCurrency);
  };

  const loadPriceHistory = async (cryptoId: string) => {
    try {
      const { getPriceHistory } = await import('../services/priceHistoryService');
      const history = await getPriceHistory(cryptoId);
      setPriceHistories(prev => ({ ...prev, [cryptoId]: history }));
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  // Cargar historial de precios cuando se selecciona una moneda
  React.useEffect(() => {
    if (gameState.selectedCurrency) {
      loadPriceHistory(gameState.selectedCurrency);
    }
  }, [gameState.selectedCurrency]);

  // Cargar historial inicial para todas las monedas
  React.useEffect(() => {
    const loadAllHistories = async () => {
      try {
        // Verificar que las criptomonedas estén disponibles
        if (!gameState.cryptocurrencies || gameState.cryptocurrencies.length === 0) {
          return;
        }
        
        const { needsHistoryInitialization, initializePriceHistory } = await import('../services/priceHistoryService');
        
        if (await needsHistoryInitialization()) {
          await initializePriceHistory(gameState.cryptocurrencies);
        }
        
        // Cargar historial para cada moneda
        for (const crypto of gameState.cryptocurrencies) {
          await loadPriceHistory(crypto.id);
        }
      } catch (error) {
        console.error('Error initializing price histories:', error);
      }
    };
    
    loadAllHistories();
  }, [gameState.cryptocurrencies]);

  // Auto-refresh prices every second - ONLY when tab is active
  React.useEffect(() => {
    // Solo ejecutar si la pestaña está activa
    if (!isActive) return;
    
    const refreshPrices = async () => {
      // Verificar que las criptomonedas estén disponibles
      if (!gameState.cryptocurrencies || gameState.cryptocurrencies.length === 0) {
        return;
      }
      
      try {
        const { fetchCryptoPrices } = await import('../services/cryptoAPI');
        const { updateAllPriceHistory } = await import('../services/priceHistoryService');
        
        const updatedCryptos = await fetchCryptoPrices(gameState.cryptocurrencies);
        
        // Actualizar historial de precios
        await updateAllPriceHistory(updatedCryptos);
        
        // Recargar historiales para las monedas seleccionadas
        if (gameState.selectedCurrency) {
          await loadPriceHistory(gameState.selectedCurrency);
        }
        
        // Usar la nueva acción que solo actualiza las criptomonedas
        dispatch({
          type: 'UPDATE_CRYPTOCURRENCY_PRICES',
          payload: updatedCryptos,
        });
      } catch (error) {
        console.warn('Failed to refresh prices:', error);
      }
    };

    // Refresh immediately on mount
    refreshPrices();

    // Then refresh every second
    const interval = setInterval(refreshPrices, 1000);

    return () => clearInterval(interval);
  }, [gameState.selectedCurrency, isActive]); // Agregar isActive como dependencia

  const handleExchange = () => {
    const selectedCurrency = getSelectedCurrency();
    if (!selectedCurrency) return;

    const preview = getExchangePreview(gameState, selectedCurrency.id, amountPercent);
    if (!preview) return;

    Alert.alert(
      'Confirm Exchange',
      `Exchange ${formatCurrencyAmount(preview.fromAmount, preview.fromSymbol)} for ${formatCurrencyAmount(
        preview.toAmount,
        preview.toSymbol
      )}?\n\nFee: ${preview.fee.toFixed(1)}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exchange',
          onPress: () => {
            dispatch({
              type: 'EXCHANGE_CURRENCY',
              payload: {
                fromCurrency: preview.fromCurrency,
                toCurrency: preview.toCurrency,
                amount: preview.fromAmount,
              },
            });
          },
        },
      ]
    );
  };

  const handleSellPress = () => {
    const selectedCurrency = getSelectedCurrency();
    if (!selectedCurrency) return;
    const amount = Math.floor((gameState.cryptoCoins * amountPercent) / 100);
    if (amount <= 0 || amount > gameState.cryptoCoins) return;
    const price = selectedCurrency.currentValue;
    if (price <= 0 || !isFinite(price)) return;

    setSellConfirming(true);
    sellConfirmTimer.current = setTimeout(clearSellConfirm, 3000);
  };

  const handleSellConfirm = () => {
    const selectedCurrency = getSelectedCurrency();
    if (!selectedCurrency) { clearSellConfirm(); return; }
    const amount = Math.floor((gameState.cryptoCoins * amountPercent) / 100);
    const price = selectedCurrency.currentValue;
    if (amount <= 0 || price <= 0 || !isFinite(price)) { clearSellConfirm(); return; }

    dispatch({ type: 'SELL_COINS_FOR_MONEY', payload: { amount, price } });
    clearSellConfirm();
  };

  const getLocalExchangePreview = () => {
    const selectedCurrency = getSelectedCurrency();
    if (!selectedCurrency) return null;

    return getExchangePreview(gameState, selectedCurrency.id, amountPercent);
  };

  const getBalance = (currencyId: string) => {
    return getCurrencyBalance(gameState, currencyId);
  };

  const getCurrencyIcon = (currencyId: string) => {
    const crypto = gameState.cryptocurrencies.find(c => c.id === currencyId);
    return crypto ? crypto.icon : '🪙';
  };

  const getCurrencySymbol = (currencyId: string) => {
    const crypto = gameState.cryptocurrencies.find(c => c.id === currencyId);
    return crypto ? crypto.symbol : 'CC';
  };

  const sellPreviewMoney = (() => {
    const cur = getSelectedCurrency();
    if (!cur) return 0;
    const amount = Math.floor((gameState.cryptoCoins * amountPercent) / 100);
    return amount * cur.currentValue;
  })();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminateRequest: () => false,
      onPanResponderGrant: (evt) => {
        setScrollEnabled(false);
        if (sliderRef.current) {
          sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const percentage = Math.max(1, Math.min(100, (touchX / width) * 100));
            setAmountPercent(Math.round(percentage));
          });
        }
      },
      onPanResponderMove: (evt) => {
        if (sliderRef.current) {
          sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const percentage = Math.max(1, Math.min(100, (touchX / width) * 100));
            setAmountPercent(Math.round(percentage));
          });
        }
      },
      onPanResponderRelease: () => {
        setScrollEnabled(true);
      },
      onPanResponderTerminate: () => {
        setScrollEnabled(true);
      },
    })
  ).current;

  const isCryptoUnlocked = (cryptoId: string) => {
    if (cryptoId === 'cryptocoin') {
      return true;
    }
    const purchasedUpgrades = gameState.upgrades.filter(u => u.purchased).length;
    return purchasedUpgrades >= 4;
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>📈 Crypto Market</Text>
      </View>
      <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        {(gameState.cryptocurrencies || []).filter(c => isCryptoUnlocked(c.id)).map((crypto) => {
          const isSelected = crypto.id === gameState.selectedCurrency;
          const priceChange = ((crypto.currentValue - crypto.baseValue) / crypto.baseValue) * 100;
          
          return (
            <View key={crypto.id}>
              <View style={[
                styles.currencyContainer,
                isSelected && styles.selectedCurrencyContainer
              ]}>
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    isSelected && styles.selectedCurrencyItem
                  ]}
                  onPress={() => handleSelectCurrency(crypto.id)}
                >
                  <View style={styles.currencyHeader}>
                    <Text style={styles.currencyIcon}>{crypto.icon}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyName}>{crypto.name}</Text>
                      <Text style={styles.currencySymbol}>{crypto.symbol}</Text>
                    </View>
                    <View style={styles.priceInfo}>
                      <Text style={styles.currentPrice}>
                        {formatCurrencyAmount(crypto.currentValue, crypto.symbol)}
                      </Text>
                      <Text style={[
                        styles.priceChange,
                        { color: getPriceChangeColor(crypto.baseValue, crypto.currentValue) }
                      ]}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {/* Exchange Section - Only show for selected currency */}
                {isSelected && (
                  <View style={styles.expandedSection}>
                    {/* Price Chart - Always show */}
                    <PriceChart
                      cryptocurrency={getSelectedCurrency()!}
                      priceHistory={priceHistories[getSelectedCurrency()!.id] || [1.0]}
                    />
                    
                    {/* CryptoCoin Sell Section */}
                    {crypto.id === 'cryptocoin' && (
                      <>
                        <Text style={styles.exchangeTitle}>💰 Sell Coins</Text>
                        
                        {/* Amount Selection */}
                        <View style={styles.amountSection}>
                          <View style={styles.sliderContainer}>
                            <View
                              ref={sliderRef}
                              style={styles.sliderTrack}
                              {...panResponder.panHandlers}
                            >
                              <View 
                                style={[
                                  styles.sliderFill, 
                                  { width: `${amountPercent}%` }
                                ]} 
                              />
                              <View
                                style={[
                                  styles.sliderThumb,
                                  { left: `${amountPercent}%` }
                                ]}
                              >
                                <Text style={[
                                  styles.thumbLabel,
                                  { transform: [{ translateX: -(amountPercent / 100) * 20 }] },
                                ]}>{amountPercent}%</Text>
                              </View>
                            </View>
                            <View style={styles.sliderLabels}>
                              <Text style={styles.sliderLabel}>1%</Text>
                              <Text style={styles.sliderLabel}>100%</Text>
                            </View>
                          </View>
                        </View>
                        
                        {/* Sell Preview */}
                        {gameState.cryptoCoins > 0 && (
                          <View style={styles.exchangePreview}>
                            <Text style={styles.previewText}>
                              You'll earn: ${((gameState.cryptoCoins * amountPercent) / 100 * getSelectedCurrency()!.currentValue).toFixed(2)}
                            </Text>
                            <Text style={styles.feeText}>
                              Current price: ${getSelectedCurrency()!.currentValue.toFixed(4)} per coin
                            </Text>
                          </View>
                        )}
                        
                        {/* Sell Button */}
                        <View style={styles.buttonContainer}>
                          {sellConfirming ? (
                            <>
                              <TouchableOpacity style={styles.cancelButton} onPress={clearSellConfirm}>
                                <Text style={styles.cancelButtonText}>✕ Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.confirmSellButton} onPress={handleSellConfirm}>
                                <Text style={styles.confirmSellButtonText}>✓ Sell ${sellPreviewMoney.toFixed(2)}</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
                              <Text style={styles.sellButtonText}>Sell for $</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}
                    
                    {/* Exchange Section - Only for non-CryptoCoin currencies */}
                    {crypto.id !== 'cryptocoin' && (
                      <>
                        <Text style={styles.exchangeTitle}>📊 Exchange</Text>
                        
                        {/* Amount Selection */}
                        <View style={styles.amountSection}>
                          <View style={styles.sliderContainer}>
                            <View
                              ref={sliderRef}
                              style={styles.sliderTrack}
                              {...panResponder.panHandlers}
                            >
                              <View 
                                style={[
                                  styles.sliderFill, 
                                  { width: `${amountPercent}%` }
                                ]} 
                              />
                              <View
                                style={[
                                  styles.sliderThumb,
                                  { left: `${amountPercent}%` }
                                ]}
                              >
                                <Text style={[
                                  styles.thumbLabel,
                                  { transform: [{ translateX: -(amountPercent / 100) * 20 }] },
                                ]}>{amountPercent}%</Text>
                              </View>
                            </View>
                            <View style={styles.sliderLabels}>
                              <Text style={styles.sliderLabel}>1%</Text>
                              <Text style={styles.sliderLabel}>100%</Text>
                            </View>
                          </View>
                        </View>
                        
                        {/* Exchange Direction */}
                        {getLocalExchangePreview() && (
                          <View style={styles.exchangeRow}>
                            <View style={styles.currencyDisplay}>
                              <Text style={styles.currencyIconSmall}>
                                {getLocalExchangePreview()!.fromCurrency === 'cryptocoin' ? '🪙' : getSelectedCurrency()!.icon}
                              </Text>
                              <Text style={styles.currencyText}>
                                {getLocalExchangePreview()!.fromCurrency === 'cryptocoin' ? 'CryptoCoin' : t(getSelectedCurrency()!.name)} → {getLocalExchangePreview()!.toCurrency === 'cryptocoin' ? 'CryptoCoin' : t(getSelectedCurrency()!.name)}
                              </Text>
                            </View>
                          </View>
                        )}
                        
                        {/* Exchange Preview */}
                        {getLocalExchangePreview() && (
                          <View style={styles.exchangePreview}>
                            <Text style={styles.previewText}>
                              You'll receive: {formatCurrencyAmount(getLocalExchangePreview()!.toAmount, getLocalExchangePreview()!.toSymbol)}
                            </Text>
                            <Text style={styles.feeText}>
                              Fee: {getLocalExchangePreview()!.fee.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                        
                        {/* Exchange Buttons */}
                        <View style={styles.buttonContainer}>
                          <TouchableOpacity
                            style={styles.exchangeButton}
                            onPress={handleExchange}
                          >
                            <Text style={styles.exchangeButtonText}>Exchange</Text>
                          </TouchableOpacity>
                          
                          {sellConfirming ? (
                            <>
                              <TouchableOpacity style={styles.cancelButton} onPress={clearSellConfirm}>
                                <Text style={styles.cancelButtonText}>✕</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.confirmSellButton} onPress={handleSellConfirm}>
                                <Text style={styles.confirmSellButtonText}>✓ ${sellPreviewMoney.toFixed(2)}</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
                              <Text style={styles.sellButtonText}>Sell for $</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  currencyList: {
    flex: 1,
  },
  currencyContainer: {
    marginBottom: 12,
  },
  currencyItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
  },
  selectedCurrencyItem: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectedCurrencyContainer: {
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  currencySymbol: {
    fontSize: 14,
    color: '#888',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedSection: {
    marginTop: 0,
    paddingTop: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 0,
    padding: 16,
    marginHorizontal: -16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  exchangeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    marginTop: 8,
    marginLeft: 8,
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exchangeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    width: 60,
  },
  currencyDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  currencyIconSmall: {
    fontSize: 20,
    marginRight: 8,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  balanceText: {
    fontSize: 12,
    color: '#888',
  },
  amountSection: {
    marginBottom: 16,
  },
  sliderContainer: {
    marginTop: 8,
    marginHorizontal: 8,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    position: 'absolute',
    top: -6,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00ff88',
    position: 'absolute',
    top: -25,
    left: -10,
    width: 40,
    textAlign: 'center',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#888',
  },
  exchangePreview: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  feeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  exchangeButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  exchangeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sellButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  sellButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    marginRight: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  confirmSellButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 2,
    marginLeft: 4,
    marginRight: 8,
  },
  confirmSellButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default MarketScreen;
