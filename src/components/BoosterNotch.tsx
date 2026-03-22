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

const BoosterDrawerItem: React.FC<{ booster: ActiveBooster; now: number }> = ({ booster, now }) => {
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
          ? 'Permanente · survives prestige'
          : booster.blocksRemaining != null
            ? `${booster.blocksRemaining.toLocaleString()} blocks left`
            : `${formatTimer(remaining)} restantes`}
      </Text>
    </View>
  );
};

// ─── BoosterNotch ───────────────────────────────────────────────────────────

const BoosterNotch: React.FC = () => {
  const { gameState, dispatch } = useGame();
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
  const count = activeBoosters.length;

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

  if (count === 0) {
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
            <Text style={notchStyles.mult}>×{totalMult}x</Text>
            <View style={notchStyles.countBadge}>
              <Text style={notchStyles.countText}>{count}</Text>
            </View>
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
              <Text style={drawerStyles.title}>BOOSTERS</Text>
              <TouchableOpacity onPress={closeDrawer} style={drawerStyles.closeBtn}>
                <Text style={drawerStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Total multiplier */}
            <View style={drawerStyles.totalBox}>
              <Text style={drawerStyles.totalLabel}>Multiplicador total: </Text>
              <Text style={drawerStyles.totalValue}>×{totalMult}x</Text>
            </View>

            {/* Items */}
            {activeBoosters.map(b => (
              <BoosterDrawerItem key={b.id} booster={b} now={now} />
            ))}
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
    top: '50%',
    transform: [{ translateY: -30 }],
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
    paddingVertical: 10,
    paddingHorizontal: 7,
    alignItems: 'center',
    gap: 4,
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
  countBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.nr,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.nr,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  countText: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 7,
    color: '#fff',
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
    fontSize: 11,
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
    fontSize: 9,
    letterSpacing: 2,
    color: colors.dim,
  },
  totalValue: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
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
    fontSize: 13,
    color: '#fff',
  },
  itemMult: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
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
    fontSize: 8,
    color: colors.dim,
    letterSpacing: 0.5,
  },
});

export default BoosterNotch;
