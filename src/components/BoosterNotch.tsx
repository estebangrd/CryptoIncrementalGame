import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useGame } from '../contexts/GameContext';
import {
  getActiveBoostersList,
  getTotalProductionMultiplier,
  ActiveBooster,
} from '../utils/boosterNotchLogic';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatTimer = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── BoosterDrawerItem ──────────────────────────────────────────────────────

const BoosterDrawerItem: React.FC<{
  booster: ActiveBooster;
  now: number;
  t: (key: string) => string;
}> = ({ booster, now, t }) => {
  const remaining = booster.expiresAt ? Math.max(0, booster.expiresAt - now) : 0;
  const progress =
    booster.expiresAt && booster.totalDurationMs
      ? Math.min(1, remaining / booster.totalDurationMs)
      : booster.isPermanent
        ? 1
        : 0;

  return (
    <View style={drawerStyles.item}>
      <View style={drawerStyles.itemTop}>
        <Text style={drawerStyles.itemName}>
          {booster.icon} {booster.label}
        </Text>
        <Text style={[drawerStyles.itemMult, { color: booster.color }]}>
          ×{booster.multiplier}
        </Text>
      </View>

      {/* Progress bar (only for time-based) */}
      {booster.expiresAt && booster.totalDurationMs && (
        <View style={drawerStyles.bar}>
          <View
            style={[
              drawerStyles.barFill,
              { width: `${Math.round(progress * 100)}%` as any, backgroundColor: booster.color },
            ]}
          />
        </View>
      )}

      {/* Timer / status text */}
      <Text style={drawerStyles.time}>
        {booster.isPermanent
          ? t('boosterNotch.permanent')
          : booster.blocksRemaining != null
            ? `${booster.blocksRemaining.toLocaleString()} ${t('boosterNotch.blocksLeft')}`
            : `${formatTimer(remaining)} ${t('boosterNotch.remaining')}`}
      </Text>
    </View>
  );
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BoosterNotchProps {
  onOpenShop: () => void;
}

// ─── BoosterNotch ───────────────────────────────────────────────────────────

const BoosterNotch: React.FC<BoosterNotchProps> = ({ onOpenShop }) => {
  const { gameState, dispatch, t } = useGame();
  const [now, setNow] = useState(Date.now());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Tick every second
  useEffect(() => {
    const iv = setInterval(() => {
      setNow(Date.now());
      dispatch({ type: 'CHECK_BOOSTER_EXPIRATION' });
    }, 1000);
    return () => clearInterval(iv);
  }, [dispatch]);

  // Pulse animation for the notch
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const activeBoosters = getActiveBoostersList(gameState.iapState, gameState.adBoost, now);
  const totalMult = getTotalProductionMultiplier(activeBoosters);

  // Compute impact stats
  const baseProduction = totalMult > 0 ? gameState.cryptoCoinsPerSecond / totalMult : 0;
  const extraPerSec = gameState.cryptoCoinsPerSecond - baseProduction;

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [slideAnim]);

  const closeDrawer = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setDrawerOpen(false));
  }, [slideAnim]);

  const handleOpenShop = useCallback(() => {
    closeDrawer();
    // Small delay so the drawer closes before shop opens
    setTimeout(() => onOpenShop(), 300);
  }, [closeDrawer, onOpenShop]);

  if (activeBoosters.length === 0) {
    return null;
  }

  const shadowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
  });

  const drawerWidth = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 230],
  });

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <>
      {/* ── Notch Tab ── */}
      <Animated.View style={[notchStyles.wrap, { shadowOpacity }]}>
        <TouchableOpacity onPress={openDrawer} activeOpacity={0.7}>
          <LinearGradient
            colors={['rgba(255,214,0,0.18)', 'rgba(160,64,255,0.12)']}
            style={notchStyles.tab}
          >
            <Text style={notchStyles.icon}>⚡</Text>
            <Text style={notchStyles.mult}>{totalMult}x</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Side Drawer (Modal) ── */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
        statusBarTranslucent
      >
        {/* Overlay */}
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[drawerStyles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Drawer */}
        <Animated.View style={[drawerStyles.drawer, { width: drawerWidth }]}>
          <LinearGradient
            colors={['#0a1220', '#060d18']}
            style={StyleSheet.absoluteFill}
          />
          <ScrollView
            style={drawerStyles.inner}
            contentContainerStyle={drawerStyles.innerContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={drawerStyles.header}>
              <Text style={drawerStyles.title}>{t('boosterNotch.title')}</Text>
              <TouchableOpacity onPress={closeDrawer} style={drawerStyles.closeBtn}>
                <Text style={drawerStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Total multiplier */}
            <View style={drawerStyles.totalBox}>
              <Text style={drawerStyles.totalLabel}>{t('boosterNotch.totalMultiplier')}: </Text>
              <Text style={drawerStyles.totalValue}>×{totalMult}x</Text>
            </View>

            {/* Items */}
            {activeBoosters.map(b => (
              <BoosterDrawerItem key={b.id} booster={b} now={now} t={t} />
            ))}

            {/* Impact stats */}
            <View style={drawerStyles.impactCard}>
              <Text style={drawerStyles.impactHeader}>{t('boosterNotch.activeImpact')}</Text>
              <View style={drawerStyles.impactRow}>
                <Text style={drawerStyles.impactLabel}>{t('boosterNotch.extraPerSec')}</Text>
                <Text style={drawerStyles.impactValue}>+{formatNumber(extraPerSec)}</Text>
              </View>
            </View>

            {/* Shop CTA */}
            <View style={drawerStyles.ctaSection}>
              <Text style={drawerStyles.ctaHint}>{t('boosterNotch.stackHint')}</Text>
              <TouchableOpacity onPress={handleOpenShop} activeOpacity={0.7}>
                <LinearGradient
                  colors={['rgba(255,214,0,0.12)', 'rgba(255,140,0,0.07)']}
                  style={drawerStyles.ctaButton}
                >
                  <Text style={drawerStyles.ctaButtonText}>⚡ {t('boosterNotch.addBooster')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
};

// ─── Notch Styles ───────────────────────────────────────────────────────────

const notchStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: colors.ny,
    shadowOffset: { width: -3, height: 0 },
    shadowRadius: 14,
    elevation: 8,
  },
  tab: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255,214,0,0.35)',
    paddingVertical: 13,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 14,
  },
  mult: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 9,
    color: colors.ny,
    letterSpacing: 1,
  },
});

// ─── Drawer Styles ──────────────────────────────────────────────────────────

const drawerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,255,136,0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  inner: {
    flex: 1,
  },
  innerContent: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: colors.ng,
    letterSpacing: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: colors.dim,
    lineHeight: 20,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    marginBottom: 2,
  },
  totalLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.dim,
  },
  totalValue: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    color: colors.ny,
  },
  // ── Item ──
  item: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemName: {
    fontFamily: fonts.rajdhaniSemi,
    fontSize: 14,
    color: '#fff',
  },
  itemMult: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
  },
  bar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 5,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
    letterSpacing: 0.5,
  },
  // ── Impact stats ──
  impactCard: {
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.12)',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  impactHeader: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.dim,
    marginBottom: 8,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  impactLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 13,
    color: colors.dim,
  },
  impactValue: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: colors.ng,
  },
  // ── Shop CTA ──
  ctaSection: {
    marginTop: 4,
  },
  ctaHint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.dim,
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ctaButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.ny,
    letterSpacing: 2,
  },
});

export default BoosterNotch;
