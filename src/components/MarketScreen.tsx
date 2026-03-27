import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useGame } from '../contexts/GameContext';
import { colors, fonts } from '../config/theme';
import {
  getExchangePreview,
  formatCurrencyAmount
} from '../utils/exchangeLogic';
import { formatNumber } from '../utils/gameLogic';
import PriceChart from './PriceChart';

const formatUSD = (amount: number): string => `$${formatNumber(amount)}`;

// Precise price formatter — matches PriceChart display (2 decimals for small values)
const formatPriceUSD = (price: number): string => {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 100) return `$${price.toFixed(0)}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
};


const MarketScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [amountPercent, setAmountPercent] = useState(50);
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

  useEffect(() => {
    clearSellConfirm();
  }, [amountPercent, gameState.selectedCurrency]);

  useEffect(() => {
    return () => {
      if (sellConfirmTimer.current) clearTimeout(sellConfirmTimer.current);
    };
  }, []);

  const handleSelectCurrency = (currencyId: string) => {
    // CryptoCoin is always expanded — ignore toggle
    if (currencyId === 'cryptocoin') return;
    if (gameState.selectedCurrency === currencyId) {
      dispatch({ type: 'SELECT_CURRENCY', payload: null });
    } else {
      dispatch({ type: 'SELECT_CURRENCY', payload: currencyId });
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
      onPanResponderRelease: () => setScrollEnabled(true),
      onPanResponderTerminate: () => setScrollEnabled(true),
    })
  ).current;

  const isCryptoUnlocked = (cryptoId: string) => {
    if (cryptoId === 'cryptocoin') return true;
    const purchasedUpgrades = gameState.upgrades.filter(u => u.purchased).length;
    return purchasedUpgrades >= 4;
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.secHdr}>
        <Text style={styles.secHdrText}>Live Market</Text>
        <LinearGradient
          colors={['rgba(0,255,136,0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.secHdrLine}
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        {(gameState.cryptocurrencies || []).filter(c => isCryptoUnlocked(c.id)).map((crypto) => {
          const isCryptoCoin = crypto.id === 'cryptocoin';
          const isSelected = isCryptoCoin || crypto.id === gameState.selectedCurrency;

          return (
            <View key={crypto.id} style={styles.cryptoBlock}>
              {/* Coin row */}
              <TouchableOpacity
                style={[styles.coinRow, isSelected && styles.coinRowSelected]}
                onPress={() => handleSelectCurrency(crypto.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ffd600', '#ff8c00']}
                  start={{ x: 0.14, y: 0.14 }}
                  end={{ x: 0.86, y: 0.86 }}
                  style={styles.coinAvatar}
                >
                  <Text style={styles.coinAvatarIcon}>{crypto.icon}</Text>
                </LinearGradient>

                <View style={styles.coinInfo}>
                  <Text style={styles.coinName}>{crypto.name}</Text>
                  <Text style={styles.coinTicker}>
                    {crypto.symbol}{crypto.id === 'cryptocoin' ? ' · GENESIS CHAIN' : ''}
                  </Text>
                </View>

              </TouchableOpacity>

              {/* Expanded section */}
              {isSelected && (
                <View style={styles.expandedContent}>
                  <PriceChart priceHistory={getPriceHistoryForChart(crypto.id)} />

                  {/* Sell section — CryptoCoin */}
                  {crypto.id === 'cryptocoin' && (
                    <View style={styles.sellCard}>
                      <Text style={styles.sellTitle}>💰 SELL COINS</Text>

                      <Text style={styles.sliderPct}>{amountPercent}%</Text>

                      <View style={styles.sliderContainer}>
                        <View
                          ref={sliderRef}
                          style={styles.sliderTrack}
                          {...panResponder.panHandlers}
                        >
                          <View style={[styles.sliderFill, { width: `${amountPercent}%` }]} />
                          <View style={[styles.sliderThumb, { left: `${amountPercent}%`, marginLeft: -(amountPercent / 100) * 18 }]} />
                        </View>
                        <View style={styles.sliderLabels}>
                          <Text style={styles.sliderLabel}>1%</Text>
                          <Text style={styles.sliderLabel}>100%</Text>
                        </View>
                      </View>

                      <View style={styles.earnBox}>
                        <Text style={styles.earnAmount}>{formatUSD(sellPreviewMoney)}</Text>
                        <Text style={styles.earnSub}>
                          YOU'LL EARN · PRICE {formatPriceUSD(getSelectedCurrency()!.currentValue)} PER CC
                        </Text>
                      </View>

                      {sellConfirming ? (
                        <View style={styles.confirmRow}>
                          <TouchableOpacity style={styles.cancelButton} onPress={clearSellConfirm}>
                            <Text style={styles.cancelButtonText}>✕ Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.confirmSellButton} onPress={handleSellConfirm}>
                            <Text style={styles.confirmSellButtonText}>
                              ✓ Sell {formatUSD(sellPreviewMoney)}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={handleSellPress} activeOpacity={0.82}>
                          <LinearGradient
                            colors={['#ff6b2b', '#ff3d5a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.sellButton}
                          >
                            <Text style={styles.sellButtonText}>⚡ EXECUTE SELL ORDER</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Exchange section — other currencies */}
                  {crypto.id !== 'cryptocoin' && (
                    <View style={styles.sellCard}>
                      <Text style={styles.sellTitle}>📊 EXCHANGE</Text>

                      <Text style={styles.sliderPct}>{amountPercent}%</Text>

                      <View style={styles.sliderContainer}>
                        <View
                          ref={sliderRef}
                          style={styles.sliderTrack}
                          {...panResponder.panHandlers}
                        >
                          <View style={[styles.sliderFill, { width: `${amountPercent}%` }]} />
                          <View style={[styles.sliderThumb, { left: `${amountPercent}%`, marginLeft: -(amountPercent / 100) * 18 }]} />
                        </View>
                        <View style={styles.sliderLabels}>
                          <Text style={styles.sliderLabel}>1%</Text>
                          <Text style={styles.sliderLabel}>100%</Text>
                        </View>
                      </View>

                      {getLocalExchangePreview() && (
                        <View style={styles.exchangeRow}>
                          <View style={styles.currencyDisplay}>
                            <Text style={styles.currencyIconSmall}>
                              {getLocalExchangePreview()!.fromCurrency === 'cryptocoin'
                                ? '🪙'
                                : getSelectedCurrency()!.icon}
                            </Text>
                            <Text style={styles.currencyText}>
                              {getLocalExchangePreview()!.fromCurrency === 'cryptocoin'
                                ? 'CryptoCoin'
                                : t(getSelectedCurrency()!.name)}
                              {' → '}
                              {getLocalExchangePreview()!.toCurrency === 'cryptocoin'
                                ? 'CryptoCoin'
                                : t(getSelectedCurrency()!.name)}
                            </Text>
                          </View>
                        </View>
                      )}

                      {getLocalExchangePreview() && (
                        <View style={styles.earnBox}>
                          <Text style={styles.earnAmount}>
                            {formatCurrencyAmount(
                              getLocalExchangePreview()!.toAmount,
                              getLocalExchangePreview()!.toSymbol
                            )}
                          </Text>
                          <Text style={styles.earnSub}>
                            YOU'LL RECEIVE · FEE {getLocalExchangePreview()!.fee.toFixed(1)}%
                          </Text>
                        </View>
                      )}

                      <View style={styles.confirmRow}>
                        <TouchableOpacity style={styles.exchangeButton} onPress={handleExchange}>
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
                          <TouchableOpacity style={styles.sellOutlineButton} onPress={handleSellPress}>
                            <Text style={styles.sellOutlineButtonText}>Sell</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
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
    backgroundColor: 'transparent',
    padding: 12,
  },

  /* Section header */
  secHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  secHdrText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 4,
    color: colors.dim,
    textTransform: 'uppercase',
  },
  secHdrLine: {
    flex: 1,
    height: 1,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },

  cryptoBlock: {
    marginBottom: 12,
  },

  /* Coin row */
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    marginBottom: 4,
  },
  coinRowSelected: {},

  coinAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinAvatarIcon: {
    fontSize: 20,
  },

  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: '#fff',
    marginBottom: 2,
  },
  coinTicker: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
    letterSpacing: 2,
  },

  /* Expanded */
  expandedContent: {
    gap: 8,
  },

  /* Sell card */
  sellCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.bng,
    borderRadius: 12,
    padding: 14,
  },
  sellTitle: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 11,
    color: colors.ng,
    letterSpacing: 2,
    marginBottom: 12,
  },

  /* Slider */
  sliderPct: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 20,
    color: colors.ny,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(255,214,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  sliderContainer: {
    marginBottom: 10,
  },
  sliderTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 14,
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
    backgroundColor: colors.ng,
    borderRadius: 9,
    position: 'absolute',
    top: -6,
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.dim,
  },

  /* Earn box */
  earnBox: {
    backgroundColor: 'rgba(255,214,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginVertical: 10,
  },
  earnAmount: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 20,
    color: colors.ny,
    textShadowColor: 'rgba(255,214,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  earnSub: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.dim,
    marginTop: 3,
    letterSpacing: 1,
  },

  /* Sell button (gradient) */
  sellButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButtonText: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 3,
  },

  /* Confirm/cancel row */
  confirmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.dim,
  },
  confirmSellButton: {
    flex: 2,
    borderWidth: 1.5,
    borderColor: colors.ng,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmSellButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.ng,
    fontWeight: '700',
  },

  /* Sell outline (for non-CC exchange row) */
  sellOutlineButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.ny,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sellOutlineButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.ny,
    fontWeight: '700',
  },

  /* Exchange button */
  exchangeButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.nc,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exchangeButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.nc,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Exchange row (direction display) */
  exchangeRow: {
    marginBottom: 10,
  },
  currencyDisplay: {
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
});

export default MarketScreen;
