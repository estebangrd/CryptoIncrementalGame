import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { formatNumber } from '../utils/gameLogic';
import { clearGameData } from '../utils/storage';
import BottomSheetTabs from './BottomSheetTabs';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_DEFAULT_TOP = SCREEN_HEIGHT * 0.5;
const SHEET_EXPANDED_TOP = SCREEN_HEIGHT * 0.18;

const getPlanetResourceColor = (pct: number): string => {
  if (pct > 59) return '#22c55e';
  if (pct > 39) return '#eab308';
  if (pct > 19) return '#f97316';
  return '#ef4444';
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
  const splitAnim = useRef(new Animated.Value(SHEET_DEFAULT_TOP)).current;

  const handleTabChange = useCallback((tab: string) => {
    Animated.timing(splitAnim, {
      toValue: tab === 'mining' ? SHEET_DEFAULT_TOP : SHEET_EXPANDED_TOP,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [splitAnim]);

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

  // Show shop button when there are un-purchased one-time offers
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
    <View style={styles.container}>
      {/* Main Content Area - Top Half */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
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

        {/* Unified Stats Panel */}
        <View style={styles.statsArea}>
          {/* Hero: CryptoCoins */}
          <Text style={styles.cryptoCoinsText}>
            {formatNumber(gameState.cryptoCoins)} {t('game.cryptoCoins')}
          </Text>

          {/* Row 1: Prod/s + Hash Rate */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>⚡ {t('game.stats.production')}</Text>
              <Text style={styles.statValue}>
                +{formatNumber(gameState.cryptoCoinsPerSecond)}{t('game.perSecond')}
              </Text>
            </View>
            <View style={styles.statDividerV} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🖥 {t('game.stats.hashRate')}</Text>
              <Text style={styles.statValue}>{formatNumber(gameState.totalHashRate)} H/s</Text>
            </View>
          </View>

          {/* Row 2: Power + Net (only when electricity > 0) */}
          {gameState.totalElectricityCost > 0 && (() => {
            const net = gameState.cryptoCoinsPerSecond - gameState.totalElectricityCost;
            return (
              <>
                <View style={styles.statsRowDivider} />
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>🔌 {t('game.stats.power')}</Text>
                    <Text style={[styles.statValue, styles.statNegative]}>
                      -{formatNumber(gameState.totalElectricityCost)}{t('game.perSecond')}
                    </Text>
                  </View>
                  <View style={styles.statDividerV} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>✦ {t('game.stats.net')}</Text>
                    <Text style={[styles.statValue, net >= 0 ? styles.statPositive : styles.statNegative]}>
                      {net >= 0 ? '+' : ''}{formatNumber(net)}{t('game.perSecond')}
                    </Text>
                  </View>
                </View>
              </>
            );
          })()}

          {/* Energy balance (only when energy tab unlocked) */}
          {gameState.unlockedTabs?.energy && gameState.energy && (() => {
            const { totalGeneratedMW: gen, totalRequiredMW: req } = gameState.energy;
            const balance = gen - req;
            const sign = balance >= 0 ? '+' : '';
            const color = balance < 0 ? '#ff4444' : req > 0 && balance < req * 0.1 ? '#ffaa00' : '#00ff88';
            return (
              <>
                <View style={styles.statsRowDivider} />
                <Text style={[styles.energyBalance, { color }]}>
                  ⚡ {sign}{formatNumber(balance)} MW
                </Text>
              </>
            );
          })()}

          {/* Divider before totals */}
          <View style={styles.statsRowDivider} />

          {/* Totals Row 1: Total CC + Blocks */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📊 {t('game.stats.total')}</Text>
              <Text style={styles.statValue}>{formatNumber(gameState.totalCryptoCoins)}</Text>
            </View>
            <View style={styles.statDividerV} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>⛏ {t('game.stats.blocks')}</Text>
              <Text style={styles.statValue}>{formatNumber(gameState.blocksMined)}</Text>
            </View>
          </View>

          {/* Totals Row 2: Money (only when > 0) */}
          {gameState.realMoney > 0 && (
            <>
              <View style={styles.statsRowDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>💰 {t('game.stats.money')}</Text>
                  <Text style={[styles.statValue, styles.moneyValue]}>${formatNumber(gameState.realMoney)}</Text>
                </View>
                {gameState.totalRealMoneyEarned > 0 && (
                  <>
                    <View style={styles.statDividerV} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>💵 {t('game.stats.totalEarned')}</Text>
                      <Text style={[styles.statValue, styles.moneyValue]}>${formatNumber(gameState.totalRealMoneyEarned)}</Text>
                    </View>
                  </>
                )}
              </View>
            </>
          )}
        </View>

        {/* Planet Resources Meter — only visible after first non-renewable activated */}
        {gameState.planetResourcesVisible && (
          <Animated.View style={[styles.planetMeterContainer, { opacity: pulseAnim }]}>
            <View style={styles.planetMeterRow}>
              <Text style={styles.planetMeterLabel}>
                {t('narrative.planetMeter.label')}:
              </Text>
              <Text style={[
                styles.planetMeterPct,
                { color: getPlanetResourceColor(gameState.planetResources) },
              ]}>
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

      </View>

      {/* Bottom Sheet Tabs - Bottom Half */}
      <BottomSheetTabs onMineBlock={handleMineBlock} t={t} bottomOffset={adBannerHeight} onTabChange={handleTabChange} topAnim={splitAnim} />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onReset={handleReset}
        onOpenShop={() => setShowShop(true)}
      />

      {/* Ad Banner - bottom of screen */}
      <AdBanner onHeightChange={setAdBannerHeight} />

      {/* Floating Rewarded Ad Offer - absolute overlay */}
      {!gameState.iapState.removeAdsPurchased && <RewardedAdButton sheetTopAnim={splitAnim} />}

      {/* Achievement Toast */}
      <AchievementToast
        achievement={toastQueue[0] ?? null}
        displayName={toastQueue[0]?.name || toastQueue[0]?.nameKey || ''}
        onDismiss={handleDismissToast}
      />

      {/* Narrative Event Modal */}
      <NarrativeEventModal
        event={pendingNarrativeEvent}
        onDismiss={handleDismissNarrativeEvent}
      />

      {/* Shop Modal */}
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

      {/* Disconnect Modal — shown at ≤70% planet resources with AI Level 3 */}
      <DisconnectModal
        visible={showDisconnect}
        onClose={() => dispatch({ type: 'ATTEMPT_DISCONNECT' })}
      />

      {/* Ending Screen (Collapse / Good Ending) — fullscreen, not dismissible */}
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
    backgroundColor: '#1a1a1a',
  },
  mainContent: {
    height: '45%',
    backgroundColor: '#1a1a1a',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  statsArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  cryptoCoinsText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '600',
  },
  statPositive: {
    color: '#00ff88',
  },
  statNegative: {
    color: '#ff6666',
  },
  moneyValue: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  statDividerV: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 2,
  },
  statsRowDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  planetMeterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#111a11',
  },
  planetMeterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planetMeterLabel: {
    fontSize: 12,
    color: '#888',
  },
  planetMeterPct: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  planetMeterBarBg: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  planetMeterBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  adFreeBadge: {
    backgroundColor: '#1a6b3a',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adFreeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  shopButtonText: {
    fontSize: 16,
  },
  shopModal: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  shopModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  shopModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopModalClose: {
    padding: 4,
  },
  shopModalCloseText: {
    fontSize: 20,
    color: '#888',
  },
  energyBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GameScreen;
