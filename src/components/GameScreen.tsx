import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Alert,
  Dimensions,
  Easing,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Hex helpers ────────────────────────────────────────────────────
const HEX = '0123456789abcdef';
const randomHex = () => {
  let s = '0x';
  for (let i = 0; i < 8; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s + '…';
};

const buildHashLine = (blocksMined: number) =>
  [randomHex(), randomHex(), `BLOCK #${blocksMined.toLocaleString()} MINED ✓`, randomHex(), randomHex(), randomHex()].join(' · ');

// ── AnimatedGrid ───────────────────────────────────────────────────
const GRID_SIZE = 40;
const H_LINES = Math.ceil(SCREEN_HEIGHT / GRID_SIZE) + 2;
const V_LINES = Math.ceil(SCREEN_WIDTH / GRID_SIZE) + 1;

const AnimatedGrid: React.FC = () => {
  const shiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shiftAnim, {
        toValue: GRID_SIZE,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [shiftAnim]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { transform: [{ translateY: shiftAnim }] }]}
      pointerEvents="none"
    >
      {/* Horizontal lines */}
      {Array.from({ length: H_LINES }, (_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i * GRID_SIZE,
            height: 1,
            backgroundColor: 'rgba(0,255,136,0.025)',
          }}
        />
      ))}
      {/* Vertical lines */}
      {Array.from({ length: V_LINES }, (_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: i * GRID_SIZE,
            width: 1,
            backgroundColor: 'rgba(0,255,136,0.025)',
          }}
        />
      ))}
    </Animated.View>
  );
};

// ── Scanline ───────────────────────────────────────────────────────
const Scanline: React.FC = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [scanAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.scanline,
        { transform: [{ translateY: scanAnim }] },
      ]}
    />
  );
};

// ── Particle ───────────────────────────────────────────────────────
const PARTICLES = [
  { left: '8%', duration: 9000, delay: 0, color: colors.ng },
  { left: '22%', duration: 13000, delay: 2000, color: colors.nc },
  { left: '48%', duration: 10000, delay: 5000, color: colors.ng },
  { left: '72%', duration: 15000, delay: 1000, color: colors.nc },
  { left: '88%', duration: 11000, delay: 7000, color: colors.ng },
];

const Particle: React.FC<{ left: string; duration: number; delay: number; color: string }> = ({
  left, duration, delay, color,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatAnim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, delay, duration]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, -20],
  });
  const opacity = floatAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.5, 0.25, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { left: left as any, backgroundColor: color, transform: [{ translateY }], opacity },
      ]}
    />
  );
};

// ── HashStream ─────────────────────────────────────────────────────
const HashStream: React.FC<{ blocksMined: number }> = ({ blocksMined }) => {
  const scrollAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const hashText = useRef(buildHashLine(blocksMined));

  useEffect(() => {
    hashText.current = buildHashLine(blocksMined);
  }, [blocksMined]);

  useEffect(() => {
    const start = () => {
      scrollAnim.setValue(SCREEN_WIDTH);
      Animated.timing(scrollAnim, {
        toValue: -1400,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          hashText.current = buildHashLine(blocksMined);
          start();
        }
      });
    };
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.hashStream} pointerEvents="none">
      <Text style={styles.hashStreamLive}>LIVE</Text>
      <Animated.Text
        style={[styles.hashStreamText, { transform: [{ translateX: scrollAnim }] }]}
        numberOfLines={1}
      >
        {hashText.current}
      </Animated.Text>
    </View>
  );
};

// ── Boost time formatter ───────────────────────────────────────────
const fmtBoostTime = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ── Boost Pill ─────────────────────────────────────────────────────
const BoostPill: React.FC<{ expiresAt: number }> = ({ expiresAt }) => {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, [glowAnim]);

  const shadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [7, 14] });

  return (
    <Animated.View style={[styles.boostPill, { shadowRadius }]}>
      <Text style={styles.boostPillText}>⚡ 2x {fmtBoostTime(remaining)}</Text>
    </Animated.View>
  );
};

// ── Planet resource color helper ───────────────────────────────────
const getPlanetResourceColor = (pct: number): string => {
  if (pct > 59) return colors.ng;
  if (pct > 39) return colors.ny;
  if (pct > 19) return '#f97316';
  return colors.nr;
};

// ── GameScreen ─────────────────────────────────────────────────────
const GameScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [adBannerHeight, setAdBannerHeight] = useState(0);
  const prevAchievementsRef = useRef(gameState.achievements);

  // Planet meter pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  // Hero flicker
  const flickerAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(4700),
        Animated.timing(flickerAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.delay(100),
        Animated.timing(flickerAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ])
    ).start();
  }, [flickerAnim]);

  // Ticker dot blink
  const dotAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [dotAnim]);

  // "Ad Free" badge
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

  const mineFlashAnim = useRef(new Animated.Value(0)).current;

  const handleMineBlock = () => {
    dispatch({ type: 'MINE_BLOCK' });
    mineFlashAnim.setValue(1);
    Animated.timing(mineFlashAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
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

      {/* ── Background Effects ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedGrid />
        {PARTICLES.map((p, i) => (
          <Particle key={i} left={p.left} duration={p.duration} delay={p.delay} color={p.color} />
        ))}
        <Scanline />
      </View>

      {/* ── Mine flash overlay (full screen) ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,255,136,0.07)', opacity: mineFlashAnim, zIndex: 5 }]}
      />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          BLOCK<Text style={styles.logoChain}>CHAIN</Text> TYCOON
        </Text>
        <IAPBoosterBadges />
        <View style={styles.rightGroup}>
          {gameState.adBoost?.isActive && gameState.adBoost?.expiresAt && (
            <BoostPill expiresAt={gameState.adBoost.expiresAt} />
          )}
          {gameState.iapState.removeAdsPurchased && (
            <Animated.View style={[styles.adFreeBadge, { opacity: adFreeBadgeOpacity }]}>
              <Text style={styles.adFreeBadgeText}>✓ Ad Free</Text>
            </Animated.View>
          )}
          {hasPermanentOffers && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowShop(true)}>
              <Text style={styles.iconBtnText}>💎</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(true)}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero ── */}
      <View style={styles.heroArea}>
        <Text style={styles.heroLabel}>{t('game.cryptoCoins')}</Text>
        <Animated.Text style={[styles.heroValue, { opacity: flickerAnim }]}>
          {formatNumber(gameState.cryptoCoins)}
        </Animated.Text>
        <Text style={styles.heroUnit}>CC</Text>

        {/* Production ticker pill */}
        <View style={styles.tickerPill}>
          <Animated.View style={[styles.tickerDot, { opacity: dotAnim }]} />
          <Text style={styles.tickerText}>
            +{formatNumber(gameState.cryptoCoinsPerSecond)}/sec
          </Text>
        </View>
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

      {/* ── Hash Stream ── */}
      <HashStream blocksMined={gameState.blocksMined} />

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
  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,136,0.1)',
    backgroundColor: 'rgba(2,8,16,0.95)',
  },
  logo: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    fontWeight: '900',
    color: colors.ng,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,255,136,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  logoChain: {
    color: colors.nc,
    textShadowColor: 'rgba(0,229,255,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
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
  boostPill: {
    backgroundColor: '#ffd600',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ffd600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    elevation: 6,
  },
  boostPillText: {
    fontFamily: fonts.orbitron,
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.22)',
    backgroundColor: 'rgba(0,255,136,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 15,
  },
  // ── Hero ──
  heroArea: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,136,0.07)',
    backgroundColor: 'rgba(2,8,16,0.6)',
  },
  heroLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroValue: {
    fontFamily: fonts.orbitron,
    fontSize: 36,
    fontWeight: '900',
    color: colors.ng,
    textShadowColor: 'rgba(0,255,136,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    lineHeight: 44,
  },
  heroUnit: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: 'rgba(0,255,136,0.55)',
    letterSpacing: 3,
    marginTop: 2,
    marginBottom: 8,
  },
  tickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,136,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tickerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.ng,
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  tickerText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.ng,
  },
  // ── Planet Meter ──
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
  // ── Hash Stream ──
  hashStream: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    marginHorizontal: 14,
    marginVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    paddingLeft: 8,
  },
  hashStreamLive: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: 'rgba(0,255,136,0.55)',
    letterSpacing: 2,
    backgroundColor: 'rgba(2,8,16,0.85)',
    paddingRight: 6,
    zIndex: 1,
  },
  hashStreamText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: 'rgba(0,255,136,0.35)',
    letterSpacing: 1,
  },
  // ── Background FX ──
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,255,136,0.05)',
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  // ── Shop Modal ──
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
