import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
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
import DisconnectModal from './DisconnectModal';
import EndingScreen from './EndingScreen';
import ShopScreen from './ShopScreen';
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
  const [showShop, setShowShop] = useState(false);
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);
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
        <View style={styles.header}>
          <Text style={styles.title}>{t('game.title')}</Text>
          <IAPBoosterBadges />
          {hasPermanentOffers && (
            <TouchableOpacity style={styles.shopButton} onPress={() => setShowShop(true)}>
              <Text style={styles.shopButtonText}>💎</Text>
            </TouchableOpacity>
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
            {gameState.unlockedTabs?.energy && gameState.energy && (() => {
              const { totalGeneratedMW: gen, totalRequiredMW: req } = gameState.energy;
              const balance = gen - req;
              const sign = balance >= 0 ? '+' : '';
              const color =
                balance < 0
                  ? '#ff4444'
                  : req > 0 && balance < req * 0.1
                  ? '#ffaa00'
                  : '#00ff88';
              return (
                <Text style={[styles.energyBalance, { color }]}>
                  ⚡ {sign}{formatNumber(balance)} MW
                </Text>
              );
            })()}
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

        {/* 2x Boost button — above the stats box */}
        {!gameState.iapState.removeAdsPurchased && (
          <View style={styles.boostRow}>
            <RewardedAdButton />
          </View>
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
      <BottomSheetTabs onMineBlock={handleMineBlock} t={t} bottomOffset={adBannerHeight} />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onReset={handleReset}
        onOpenShop={() => setShowShop(true)}
      />

      {/* Ad Banner - bottom of screen */}
      <AdBanner onHeightChange={setAdBannerHeight} />

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
  boostRow: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: 'flex-end',
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
