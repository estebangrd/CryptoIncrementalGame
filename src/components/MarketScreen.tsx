import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useGame } from '../contexts/GameContext';
import { colors, fonts } from '../config/theme';
import { formatUSD } from '../utils/gameLogic';
import { getCompositeMultiplier } from '../utils/marketEventLogic';
import PriceChart from './PriceChart';


const MarketScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [amountPercent, setAmountPercent] = useState(100);
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
  }, [amountPercent]);

  useEffect(() => {
    return () => {
      if (sellConfirmTimer.current) clearTimeout(sellConfirmTimer.current);
    };
  }, []);

  const getCryptoCoin = () =>
    gameState.cryptocurrencies.find(c => c.id === 'cryptocoin') ?? null;

  const getPriceHistoryForChart = (cryptoId: string): number[] =>
    gameState.priceHistory?.[cryptoId]?.prices ?? [1.0];

  const handleSellPress = () => {
    const cc = getCryptoCoin();
    if (!cc) return;
    const amount = Math.floor((gameState.cryptoCoins * amountPercent) / 100);
    if (amount <= 0 || amount > gameState.cryptoCoins) return;
    const price = cc.currentValue;
    if (price <= 0 || !isFinite(price)) return;

    setSellConfirming(true);
    sellConfirmTimer.current = setTimeout(clearSellConfirm, 3000);
  };

  const handleSellConfirm = () => {
    const cc = getCryptoCoin();
    if (!cc) { clearSellConfirm(); return; }
    const amount = Math.floor((gameState.cryptoCoins * amountPercent) / 100);
    const price = cc.currentValue;
    if (amount <= 0 || price <= 0 || !isFinite(price)) { clearSellConfirm(); return; }

    dispatch({ type: 'SELL_COINS_FOR_MONEY', payload: { amount, price } });
    clearSellConfirm();
  };

  const sellPreviewMoney = (() => {
    const cc = getCryptoCoin();
    if (!cc) return 0;
    const amount = Math.floor((gameState.cryptoCoins * amountPercent) / 100);
    return amount * cc.currentValue;
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
        {(gameState.cryptocurrencies || []).filter(c => c.id === 'cryptocoin').map((crypto) => {
          return (
            <View key={crypto.id} style={styles.cryptoBlock}>
              {/* Coin row */}
              <View style={[styles.coinRow, styles.coinRowSelected]}>
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

              </View>

              {/* Expanded section — always open for CC */}
              <View style={styles.expandedContent}>
                <PriceChart priceHistory={getPriceHistoryForChart(crypto.id)} />

                {/* Market event labels */}
                {(gameState.activeMarketEvents ?? []).length > 0 && (
                  <View style={styles.eventLabelsRow}>
                    {(gameState.activeMarketEvents ?? []).slice(0, 2).map(evt => {
                      const isPositive = evt.multiplier >= 1;
                      return (
                        <View key={evt.id} style={[styles.eventLabel, isPositive ? styles.eventLabelGreen : styles.eventLabelRed]}>
                          <Text style={[styles.eventLabelText, isPositive ? styles.eventLabelTextGreen : styles.eventLabelTextRed]}>
                            {t(evt.labelKey)}
                          </Text>
                        </View>
                      );
                    })}
                    {(() => {
                      const net = getCompositeMultiplier(gameState.activeMarketEvents ?? []);
                      const pct = Math.round((net - 1) * 100);
                      const sign = pct >= 0 ? '+' : '';
                      const isPositive = pct >= 0;
                      return (
                        <Text style={[styles.netMultiplier, isPositive ? styles.eventLabelTextGreen : styles.eventLabelTextRed]}>
                          {t('marketEvent.netMultiplier')} {sign}{pct}%
                        </Text>
                      );
                    })()}
                  </View>
                )}

                {/* Market Opportunity +25% active indicator */}
                {gameState.marketOpportunityEvent?.status === 'active' && (
                  <View style={styles.eventLabelsRow}>
                    <View style={[styles.eventLabel, styles.eventLabelGreen]}>
                      <Text style={[styles.eventLabelText, styles.eventLabelTextGreen]}>
                        {t('marketOpportunity.activeLabel')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Sell section */}
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
                      <View style={[styles.sliderThumb, { left: `${amountPercent}%`, marginLeft: -13 }]} />
                    </View>
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabel}>1%</Text>
                      <Text style={styles.sliderLabel}>100%</Text>
                    </View>
                  </View>
                  <View style={styles.quickRow}>
                    {[25, 50, 75, 100].map(v => {
                      const isActive = amountPercent === v;
                      return (
                        <TouchableOpacity
                          key={v}
                          style={[styles.qBtn, isActive && styles.qBtnActive]}
                          onPress={() => setAmountPercent(v)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.qBtnText, isActive && styles.qBtnActiveText]}>
                            {v === 100 ? 'MAX' : `${v}%`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.earnBox}>
                    <Text style={styles.earnAmount}>{formatUSD(sellPreviewMoney)}</Text>
                    <Text style={styles.earnSub}>
                      YOU'LL EARN · PRICE {formatUSD(getCryptoCoin()?.currentValue ?? 0)} PER CC
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

  /* Event labels */
  eventLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 2,
  },
  eventLabel: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventLabelGreen: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderColor: 'rgba(0,255,136,0.25)',
  },
  eventLabelRed: {
    backgroundColor: 'rgba(255,61,90,0.08)',
    borderColor: 'rgba(255,61,90,0.25)',
  },
  eventLabelText: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
  },
  eventLabelTextGreen: {
    color: colors.ng,
  },
  eventLabelTextRed: {
    color: '#ff3d5a',
  },
  netMultiplier: {
    fontFamily: fonts.rajdhaniBold,
    fontSize: 11,
    marginLeft: 'auto',
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
    fontSize: 48,
    color: colors.ny,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255,214,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 48,
  },
  sliderContainer: {
    marginBottom: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
    marginLeft: 4,
    marginRight: 7,
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
    width: 26,
    height: 26,
    backgroundColor: colors.ng,
    borderRadius: 13,
    position: 'absolute',
    top: -10,
    borderWidth: 2,
    borderColor: 'rgba(2,8,16,0.8)',
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.6,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginLeft: 3,
  },
  sliderLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.dim,
    textAlign: 'center',
  },

  /* Quick buttons */
  quickRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  qBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  qBtnText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.dim,
  },
  qBtnActive: {
    borderColor: 'rgba(255,214,0,0.4)',
    backgroundColor: 'rgba(255,214,0,0.08)',
  },
  qBtnActiveText: {
    color: colors.ny,
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
