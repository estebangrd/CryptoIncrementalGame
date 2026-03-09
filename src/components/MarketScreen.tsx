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
import { colors, fonts } from '../config/theme';
import { getPriceChangeColor } from '../utils/marketLogic';
import {
  getExchangePreview,
  formatCurrencyAmount
} from '../utils/exchangeLogic';
import { formatNumber } from '../utils/gameLogic';
import PriceChart from './PriceChart';

const formatUSD = (amount: number): string => `$${formatNumber(amount)}`;

const MarketScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [amountPercent, setAmountPercent] = useState(50); // 1-100
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

  const getPriceHistoryForChart = (cryptoId: string): number[] =>
    gameState.priceHistory?.[cryptoId]?.prices ?? [1.0];

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
          sliderRef.current.measure((x, y, width, height, pageX, _pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const percentage = Math.max(1, Math.min(100, (touchX / width) * 100));
            setAmountPercent(Math.round(percentage));
          });
        }
      },
      onPanResponderMove: (evt) => {
        if (sliderRef.current) {
          sliderRef.current.measure((x, y, width, height, pageX, _pageY) => {
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
                      priceHistory={getPriceHistoryForChart(getSelectedCurrency()!.id)}
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
                              You'll earn: {formatUSD((gameState.cryptoCoins * amountPercent) / 100 * getSelectedCurrency()!.currentValue)}
                            </Text>
                            <Text style={styles.feeText}>
                              Current price: {formatUSD(getSelectedCurrency()!.currentValue)} per coin
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
                                <Text style={styles.confirmSellButtonText}>✓ Sell {formatUSD(sellPreviewMoney)}</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
                              <Text style={styles.sellButtonText}>Sell</Text>
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
                                <Text style={styles.confirmSellButtonText}>✓ {formatUSD(sellPreviewMoney)}</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
                              <Text style={styles.sellButtonText}>Sell</Text>
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
    backgroundColor: colors.bg,
    padding: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.ng,
    textAlign: 'center',
    flex: 1,
    letterSpacing: 1,
  },
  currencyList: {
    flex: 1,
  },
  currencyContainer: {
    marginBottom: 8,
  },
  currencyItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 0,
  },
  selectedCurrencyItem: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectedCurrencyContainer: {
    borderWidth: 1.5,
    borderColor: colors.ng,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  currencySymbol: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  priceChange: {
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  expandedSection: {
    backgroundColor: colors.card,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exchangeTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: colors.ng,
    marginBottom: 12,
    letterSpacing: 1,
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exchangeLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 14,
    color: '#fff',
    width: 50,
  },
  currencyDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: 6,
    padding: 10,
  },
  currencyIconSmall: {
    fontSize: 18,
    marginRight: 8,
  },
  currencyText: {
    fontFamily: fonts.rajdhani,
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  balanceText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
  },
  amountSection: {
    marginBottom: 12,
  },
  sliderContainer: {
    marginTop: 8,
    marginHorizontal: 4,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 6,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.ng,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 18,
    height: 18,
    backgroundColor: colors.bg,
    borderRadius: 9,
    position: 'absolute',
    top: -6,
    marginLeft: -9,
    borderWidth: 2,
    borderColor: colors.ng,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.ng,
    position: 'absolute',
    top: -20,
    left: -10,
    width: 38,
    textAlign: 'center',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
  },
  exchangePreview: {
    backgroundColor: colors.bg2,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  previewText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ng,
  },
  feeText: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
    color: colors.dim,
    marginTop: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  exchangeButton: {
    borderWidth: 1.5,
    borderColor: colors.nc,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  exchangeButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.nc,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sellButton: {
    borderWidth: 1.5,
    borderColor: colors.ny,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  sellButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.ny,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  cancelButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.dim,
  },
  confirmSellButton: {
    borderWidth: 1.5,
    borderColor: colors.ng,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    flex: 2,
  },
  confirmSellButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.ng,
    fontWeight: 'bold',
  },
});

export default MarketScreen;
