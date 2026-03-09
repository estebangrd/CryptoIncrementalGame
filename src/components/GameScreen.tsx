import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { formatNumber } from '../utils/gameLogic';
import { clearGameData } from '../utils/storage';
import HorizontalTabs from './HorizontalTabs';
import SettingsModal from './SettingsModal';
import AdBanner from './AdBanner';
import RewardedAdButton from './RewardedAdButton';
import IAPBoosterBadges from './IAPBoosterBadges';
import { REMOVE_ADS_CONFIG } from '../config/iapConfig';
import AchievementToast from './AchievementToast';
import NarrativeEventModal from './NarrativeEventModal';
import DisconnectModal from './DisconnectModal';
import EndingScreen from './EndingScreen';
import ShopScreen from './ShopScreen';
import { getNewlyUnlockedAchievements } from '../utils/achievementLogic';
import { getPendingNarrativeEvent } from '../utils/narrativeLogic';
import { Achievement } from '../types/game';
import { colors, fonts } from '../config/theme';

const getPlanetResourceColor = (pct: number): string => {
  if (pct > 59) return colors.ng;
  if (pct > 39) return colors.ny;
  if (pct > 19) return '#f97316';
  return colors.nr;
};

const GameScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [adBannerHeight, setAdBannerHeight] = useState(0);
  const prevAchievementsRef = useRef(gameState.achievements);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for critical resource level (<5%)
  useEffect(() => {
    if (gameState.planetResourcesVisible && gameState.planetResources < 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [gameState.planetResourcesVisible, gameState.planetResources, pulseAnim]);

  // "Ad Free" badge — shown 10s after Remove Ads purchase
  const adFreeBadgeOpacity = useRef(new Animated.Value(0)).current;
  const prevRemoveAds = useRef(gameState.iapState.removeAdsPurchased);
  useEffect(() => {
    if (!prevRemoveAds.current && gameState.iapState.removeAdsPurchased) {
      Animated.sequence([
        Animated.timing(adFreeBadgeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(REMOVE_ADS_CONFIG.badges.adFreeIndicatorDurationMs),
        Animated.timing(adFreeBadgeOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    prevRemoveAds.current = gameState.iapState.removeAdsPurchased;
  }, [gameState.iapState.removeAdsPurchased, adFreeBadgeOpacity]);

  // Achievement toast queue
  useEffect(() => {
    const newlyUnlocked = getNewlyUnlockedAchievements(
      prevAchievementsRef.current || [],
      gameState.achievements || []
    );
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(a =>
        dispatch({ type: 'APPLY_ACHIEVEMENT_REWARD', payload: a.id })
      );
      setToastQueue(prev => [...prev, ...newlyUnlocked]);
    }
    prevAchievementsRef.current = gameState.achievements;
  }, [gameState.achievements, dispatch]);

  const handleDismissToast = useCallback(() => {
    setToastQueue(prev => prev.slice(1));
  }, []);

  const handleMineBlock = () => {
    dispatch({ type: 'MINE_BLOCK' });
  };

  const hasPermanentOffers =
    !gameState.iapState.removeAdsPurchased ||
    !gameState.iapState.permanentMultiplierPurchased ||
    !gameState.iapState.starterPacksPurchased.small ||
    !gameState.iapState.starterPacksPurchased.medium ||
    !gameState.iapState.starterPacksPurchased.large ||
    !gameState.iapState.starterPacksPurchased.mega;

  const isGameOver = gameState.collapseTriggered || gameState.goodEndingTriggered;
  const showDisconnect = !!(
    gameState.ai?.isAutonomous &&
    !gameState.disconnectAttempted &&
    (gameState.planetResources ?? 100) <= 70 &&
    !isGameOver
  );
  const pendingNarrativeEvent = isGameOver
    ? null
    : getPendingNarrativeEvent(gameState.narrativeEvents ?? []);

  const handleDismissNarrativeEvent = () => {
    if (pendingNarrativeEvent) {
      dispatch({ type: 'DISMISS_NARRATIVE_EVENT', payload: pendingNarrativeEvent.threshold });
    }
  };

  const handleReset = () => {
    Alert.alert(
      t('ui.reset'),
      t('ui.resetConfirm'),
      [
        { text: t('ui.cancel'), style: 'cancel' },
        {
          text: t('ui.confirm'),
          style: 'destructive',
          onPress: async () => {
            await clearGameData();
            dispatch({ type: 'RESET_GAME' });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.title}>{t('game.title')}</Text>
        <IAPBoosterBadges />
        <View style={styles.rightGroup}>
          {gameState.iapState.removeAdsPurchased && (
            <Animated.View style={[styles.adFreeBadge, { opacity: adFreeBadgeOpacity }]}>
              <Text style={styles.adFreeBadgeText}>✓ Ad Free</Text>
            </Animated.View>
          )}
          {hasPermanentOffers && (
            <TouchableOpacity style={styles.shopButton} onPress={() => setShowShop(true)}>
              <Text style={styles.shopButtonText}>💎</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero: CryptoCoins ── */}
      <View style={styles.heroArea}>
        <Text style={styles.heroLabel}>{t('game.cryptoCoins')}</Text>
        <Text style={styles.heroValue}>{formatNumber(gameState.cryptoCoins)}</Text>

        {/* Stats rows */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>⚡ {t('game.stats.production')}</Text>
            <Text style={styles.statValue}>
              +{formatNumber(gameState.cryptoCoinsPerSecond)}{t('game.perSecond')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🖥 {t('game.stats.hashRate')}</Text>
            <Text style={styles.statValue}>{formatNumber(gameState.totalHashRate)} H/s</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>⛏ {t('game.stats.blocks')}</Text>
            <Text style={styles.statValue}>{formatNumber(gameState.blocksMined)}</Text>
          </View>
        </View>

        {/* Net production row (only when electricity > 0) */}
        {gameState.totalElectricityCost > 0 && (() => {
          const net = gameState.cryptoCoinsPerSecond - gameState.totalElectricityCost;
          return (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>🔌 {t('game.stats.power')}</Text>
                <Text style={[styles.statValue, styles.statNegative]}>
                  -{formatNumber(gameState.totalElectricityCost)}{t('game.perSecond')}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>✦ {t('game.stats.net')}</Text>
                <Text style={[styles.statValue, net >= 0 ? styles.statPositive : styles.statNegative]}>
                  {net >= 0 ? '+' : ''}{formatNumber(net)}{t('game.perSecond')}
                </Text>
              </View>
              {gameState.realMoney > 0 && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>💰 {t('game.stats.money')}</Text>
                    <Text style={[styles.statValue, styles.moneyValue]}>${formatNumber(gameState.realMoney)}</Text>
                  </View>
                </>
              )}
            </View>
          );
        })()}

        {/* Money row when no electricity yet */}
        {gameState.totalElectricityCost === 0 && gameState.realMoney > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 {t('game.stats.money')}</Text>
              <Text style={[styles.statValue, styles.moneyValue]}>${formatNumber(gameState.realMoney)}</Text>
            </View>
            {gameState.totalRealMoneyEarned > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>💵 {t('game.stats.totalEarned')}</Text>
                  <Text style={[styles.statValue, styles.moneyValue]}>${formatNumber(gameState.totalRealMoneyEarned)}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Energy balance */}
        {gameState.unlockedTabs?.energy && gameState.energy && (() => {
          const { totalGeneratedMW: gen, totalRequiredMW: req } = gameState.energy;
          const balance = gen - req;
          const sign = balance >= 0 ? '+' : '';
          const color = balance < 0 ? colors.nr : req > 0 && balance < req * 0.1 ? colors.ny : colors.ng;
          return (
            <Text style={[styles.energyBalance, { color }]}>
              ⚡ {sign}{formatNumber(balance)} MW
            </Text>
          );
        })()}
      </View>

      {/* ── Planet Resources Meter ── */}
      {gameState.planetResourcesVisible && (
        <Animated.View style={[styles.planetMeter, { opacity: pulseAnim }]}>
          <View style={styles.planetMeterRow}>
            <Text style={styles.planetMeterLabel}>{t('narrative.planetMeter.label')}:</Text>
            <Text style={[styles.planetMeterPct, { color: getPlanetResourceColor(gameState.planetResources) }]}>
              {Math.round(gameState.planetResources)}%
            </Text>
          </View>
          <View style={styles.planetMeterBarBg}>
            <View style={[
              styles.planetMeterBarFill,
              {
                width: `${Math.max(0, Math.round(gameState.planetResources))}%` as any,
                backgroundColor: getPlanetResourceColor(gameState.planetResources),
              },
            ]} />
          </View>
        </Animated.View>
      )}

      {/* ── HorizontalTabs (fills remaining space) ── */}
      <HorizontalTabs
        onMineBlock={handleMineBlock}
        t={t}
        bottomOffset={adBannerHeight}
      />

      {/* ── Modals & Overlays ── */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onReset={handleReset}
        onOpenShop={() => setShowShop(true)}
      />

      <AdBanner onHeightChange={setAdBannerHeight} />

      {!gameState.iapState.removeAdsPurchased && <RewardedAdButton sheetTopAnim={null} />}

      <AchievementToast
        achievement={toastQueue[0] ?? null}
        displayName={toastQueue[0]?.name || toastQueue[0]?.nameKey || ''}
        onDismiss={handleDismissToast}
      />

      <NarrativeEventModal
        event={pendingNarrativeEvent}
        onDismiss={handleDismissNarrativeEvent}
      />

      <Modal
        visible={showShop}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowShop(false)}
      >
        <View style={styles.shopModal}>
          <View style={styles.shopModalHeader}>
            <Text style={styles.shopModalTitle}>💎 Shop</Text>
            <TouchableOpacity onPress={() => setShowShop(false)} style={styles.shopModalClose}>
              <Text style={styles.shopModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ShopScreen />
        </View>
      </Modal>

      <DisconnectModal
        visible={showDisconnect}
        onClose={() => dispatch({ type: 'ATTEMPT_DISCONNECT' })}
      />

      <EndingScreen
        visible={gameState.collapseTriggered || gameState.goodEndingTriggered}
        endingType={
          gameState.collapseTriggered ? 'collapse'
          : gameState.goodEndingTriggered ? 'good_ending'
          : null
        }
        stats={gameState.lastEndgameStats ?? null}
        collapseCount={gameState.collapseCount ?? 0}
        goodEndingCount={gameState.goodEndingCount ?? 0}
        onPrestige={() => {
          const endingType = gameState.collapseTriggered ? 'collapse' : 'good_ending';
          dispatch({ type: 'COMPLETE_ENDING_PRESTIGE', payload: { endingType } });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.orbitron,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.ng,
    letterSpacing: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adFreeBadge: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderWidth: 1,
    borderColor: colors.ng,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adFreeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.ng,
  },
  shopButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  shopButtonText: {
    fontSize: 16,
  },
  settingsButton: {
    padding: 6,
  },
  settingsButtonText: {
    fontSize: 22,
  },
  heroArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  heroLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
    color: colors.dim,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroValue: {
    fontFamily: fonts.mono,
    fontSize: 32,
    color: colors.ng,
    textAlign: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 10,
    color: colors.dim,
    marginBottom: 1,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  statPositive: {
    color: colors.ng,
  },
  statNegative: {
    color: colors.nr,
  },
  moneyValue: {
    color: colors.ny,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderDim,
  },
  energyBalance: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  planetMeter: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,255,136,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planetMeterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planetMeterLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
    color: colors.dim,
  },
  planetMeterPct: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: 'bold',
  },
  planetMeterBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  planetMeterBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  shopModal: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 50,
  },
  shopModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shopModalTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 18,
    color: colors.ng,
  },
  shopModalClose: {
    padding: 4,
  },
  shopModalCloseText: {
    fontSize: 20,
    color: colors.dim,
  },
});

export default GameScreen;
