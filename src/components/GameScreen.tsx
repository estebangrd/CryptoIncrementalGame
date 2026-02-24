import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
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
import { getNewlyUnlockedAchievements } from '../utils/achievementLogic';
import { getPendingNarrativeEvent } from '../utils/narrativeLogic';
import { Achievement } from '../types/game';

const getPlanetResourceColor = (pct: number): string => {
  if (pct > 59) return '#22c55e';
  if (pct > 39) return '#eab308';
  if (pct > 19) return '#f97316';
  return '#ef4444';
};

const GameScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);
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

  // Achievement toast detection
  useEffect(() => {
    const newlyUnlocked = getNewlyUnlockedAchievements(
      prevAchievementsRef.current || [],
      gameState.achievements || []
    );
    if (newlyUnlocked.length > 0) {
      setToastAchievement(newlyUnlocked[0]);
      dispatch({ type: 'APPLY_ACHIEVEMENT_REWARD', payload: newlyUnlocked[0].id });
    }
    prevAchievementsRef.current = gameState.achievements;
  }, [gameState.achievements, dispatch]);

  // Promotion dialog trigger — after reaching interstitialThreshold
  const promoShownRef = useRef(false);
  useEffect(() => {
    const { removeAdsPurchased } = gameState.iapState;
    const { totalInterstitialsShown, lastPromotionShownAt } = gameState.adState;
    const { enabled, interstitialThreshold, reminderThreshold } = REMOVE_ADS_CONFIG.promotions;

    if (!enabled || removeAdsPurchased || promoShownRef.current) return;

    const adsSinceLastPromo = lastPromotionShownAt !== null
      ? totalInterstitialsShown - lastPromotionShownAt
      : totalInterstitialsShown;

    const shouldShow = lastPromotionShownAt === null
      ? totalInterstitialsShown >= interstitialThreshold
      : adsSinceLastPromo >= reminderThreshold;

    if (shouldShow) {
      promoShownRef.current = true;
      dispatch({ type: 'MARK_PROMO_SHOWN' });
      Alert.alert(
        `You've seen ${totalInterstitialsShown} ads!`,
        'Remove all ads for just $0.99 — support the game and enjoy ad-free gameplay.',
        [
          { text: 'Maybe Later', style: 'cancel', onPress: () => { promoShownRef.current = false; } },
          { text: 'Remove Ads Now', onPress: () => { promoShownRef.current = false; } },
        ],
      );
    }
  }, [gameState.adState.totalInterstitialsShown, gameState.iapState.removeAdsPurchased, dispatch]);

  const handleMineBlock = () => {
    dispatch({ type: 'MINE_BLOCK' });
  };

  const pendingNarrativeEvent = getPendingNarrativeEvent(gameState.narrativeEvents ?? []);

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
        <View style={styles.header}>
          <Text style={styles.title}>{t('game.title')}</Text>
          <IAPBoosterBadges />
          <RewardedAdButton />
          {gameState.unlockedTabs?.energy && gameState.energy && (
            <Text style={
              gameState.energy.totalGeneratedMW >= gameState.energy.totalRequiredMW
                ? styles.energyOk
                : styles.energyWarn
            }>
              ⚡ {gameState.energy.totalGeneratedMW}/{gameState.energy.totalRequiredMW}MW
            </Text>
          )}
          {gameState.iapState.removeAdsPurchased && (
            <Animated.View style={[styles.adFreeBadge, { opacity: adFreeBadgeOpacity }]}>
              <Text style={styles.adFreeBadgeText}>✓ Ad Free</Text>
            </Animated.View>
          )}
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Main Stats Area */}
        <View style={styles.statsArea}>
          <View style={styles.statsContent}>
            <Text style={styles.cryptoCoinsText}>
              {formatNumber(gameState.cryptoCoins)} {t('game.cryptoCoins')}
            </Text>
            <Text style={styles.productionText}>
              {formatNumber(gameState.cryptoCoinsPerSecond)} {t('game.perSecond')}
            </Text>
            <Text style={styles.hashRateText}>
              {formatNumber(gameState.totalHashRate)} H/s
            </Text>
            {gameState.totalElectricityCost > 0 && (
              <Text style={styles.electricityText}>
                -{formatNumber(gameState.totalElectricityCost)}/sec electricity
              </Text>
            )}
          </View>
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

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {t('game.totalCryptoCoins')}: {formatNumber(gameState.totalCryptoCoins)}
          </Text>
          <Text style={styles.statsText}>
            Blocks Mined: {formatNumber(gameState.blocksMined)}
          </Text>
          {gameState.realMoney > 0 && (
            <Text style={styles.moneyText}>
              💰 Real Money: ${formatNumber(gameState.realMoney)}
            </Text>
          )}
          {gameState.totalRealMoneyEarned > 0 && (
            <Text style={styles.moneyText}>
              💵 Total Earned: ${formatNumber(gameState.totalRealMoneyEarned)}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Sheet Tabs - Bottom Half */}
      <BottomSheetTabs onMineBlock={handleMineBlock} t={t} />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onReset={handleReset}
      />

      {/* Ad Banner - bottom of screen */}
      <AdBanner />

      {/* Achievement Toast */}
      <AchievementToast
        achievement={toastAchievement}
        displayName={toastAchievement?.name || toastAchievement?.nameKey || ''}
        onDismiss={() => setToastAchievement(null)}
      />

      {/* Narrative Event Modal */}
      <NarrativeEventModal
        event={pendingNarrativeEvent}
        onDismiss={handleDismissNarrativeEvent}
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
    paddingTop: 30,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  statsContent: {
    alignItems: 'center',
  },
  cryptoCoinsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 5,
  },
  productionText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 5,
  },
  hashRateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  electricityText: {
    fontSize: 14,
    color: '#ff6666',
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    marginBottom: 0,
  },
  statsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  moneyText: {
    fontSize: 14,
    color: '#00ff88',
    marginBottom: 2,
    fontWeight: 'bold',
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
  energyOk: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  energyWarn: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ff4444',
  },
});

export default GameScreen;
