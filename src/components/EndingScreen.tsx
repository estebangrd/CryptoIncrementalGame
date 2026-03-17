/**
 * EndingScreen — Fullscreen ending screen for Collapse and Good Ending.
 * Non-dismissible. Player must press the prestige button to continue.
 * Based on spec: specs/game-mechanics/endgame-collapse.md
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { EndingType, EndgameStats } from '../types/game';
import { calculateEndingBonus, calculateRenewableDiscount } from '../utils/endgameLogic';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const GRID_SIZE = 40;
const H_LINES = Math.ceil(SH / GRID_SIZE) + 2;
const V_LINES = Math.ceil(SW / GRID_SIZE) + 1;

interface EndingScreenProps {
  visible: boolean;
  endingType: EndingType;
  stats: EndgameStats | null;
  collapseCount: number;
  goodEndingCount: number;
  onPrestige: () => void;
}

const AI_LEVEL_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Assistant',
  2: 'Copilot',
  3: 'Autonomous',
};

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ── AnimatedGrid (same as GameScreen) ─────────────────────────────
const AnimatedGrid: React.FC = () => {
  const shiftAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shiftAnim, { toValue: GRID_SIZE, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [shiftAnim]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: shiftAnim }] }]} pointerEvents="none">
      {Array.from({ length: H_LINES }, (_, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * GRID_SIZE, height: 1, backgroundColor: 'rgba(0,255,136,0.025)' }} />
      ))}
      {Array.from({ length: V_LINES }, (_, i) => (
        <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * GRID_SIZE, width: 1, backgroundColor: 'rgba(0,255,136,0.025)' }} />
      ))}
    </Animated.View>
  );
};

// ── Scanline (same as GameScreen) ─────────────────────────────────
const Scanline: React.FC = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, { toValue: SH, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [scanAnim]);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateY: scanAnim }] }]}>
      <View style={{ height: 2, backgroundColor: 'rgba(0,255,136,0.06)', left: 0, right: 0 }} />
    </Animated.View>
  );
};

// ── Aurora glow blob (multi-layer to simulate CSS blur) ────────────
interface AuroraProps {
  width: number; height: number;
  top?: number; bottom?: number; left?: number; right?: number;
  color: string; duration: number; delay: number;
}
const AuroraBlob: React.FC<AuroraProps> = ({ width, height, top, bottom, left, right, color, duration, delay }) => {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(drift, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [drift, duration, delay]);
  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const ty = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  // 3 concentric layers to simulate blur falloff
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, bottom, left, right, transform: [{ translateX: tx }, { translateY: ty }], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width, height, borderRadius: width / 2, backgroundColor: color, opacity: 0.07, position: 'absolute' }} />
      <View style={{ width: width * 0.65, height: height * 0.65, borderRadius: width * 0.325, backgroundColor: color, opacity: 0.12, position: 'absolute' }} />
      <View style={{ width: width * 0.35, height: height * 0.35, borderRadius: width * 0.175, backgroundColor: color, opacity: 0.22, position: 'absolute' }} />
    </Animated.View>
  );
};

// ── Confetti piece ─────────────────────────────────────────────────
interface ConfettiProps { x: number; color: string; duration: number; delay: number; w: number; h: number }
const ConfettiPiece: React.FC<ConfettiProps> = ({ x, color, duration, delay, w, h }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [anim, delay, duration]);
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, SH + 50] });
  const rot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
  const opacity = anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x, width: w, height: h, borderRadius: 2, backgroundColor: color, opacity, transform: [{ translateY: ty }, { rotate: rot }] }} />
  );
};

// ── Victory particles (20, bigger, like HTML) ──────────────────────
const PARTICLE_COLORS = [colors.ng, colors.nc, '#ffd600'];
const VICTORY_PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const s = Math.random() * 4 + 2;
  return {
    id: i,
    left: `${Math.random() * 100}%` as any,
    size: s,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    duration: Math.round(Math.random() * 10000 + 8000),
    delay: Math.round(Math.random() * 8000),
  };
});

const VictoryParticle: React.FC<{ left: any; size: number; color: string; duration: number; delay: number }> = ({ left, size, color, duration, delay }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      floatAnim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatAnim, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
    return () => floatAnim.stopAnimation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [SH, -50] });
  const translateX = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const opacity = floatAnim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 0.5, 0] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity, transform: [{ translateY }, { translateX }] }} />
  );
};

const CONFETTI_COLORS = [colors.ng, colors.nc, '#ffd600', '#ff3d5a', '#ffffff'];
const CONFETTI_PIECES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * SW,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  duration: 2200 + Math.random() * 2200,
  delay: Math.random() * 1500,
  w: 3 + Math.random() * 6,
  h: 5 + Math.random() * 10,
}));

// ── Orbit globe ────────────────────────────────────────────────────
const OrbitGlobe: React.FC = () => {
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin1, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [spin1, spin2, floatY]);
  const rot1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const globeY = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <View style={orbitStyles.wrap}>
      <Animated.View style={[orbitStyles.ring, orbitStyles.ring2, { transform: [{ rotate: rot2 }] }]}>
        <View style={[orbitStyles.dot, orbitStyles.dotCyan]} />
      </Animated.View>
      <Animated.View style={[orbitStyles.ring, orbitStyles.ring1, { transform: [{ rotate: rot1 }] }]}>
        <View style={orbitStyles.dot} />
      </Animated.View>
      <Animated.Text style={[orbitStyles.globe, { transform: [{ translateY: globeY }] }]}>🌍</Animated.Text>
    </View>
  );
};

const orbitStyles = StyleSheet.create({
  wrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, top: '50%', left: '50%' },
  ring1: { width: 140, height: 140, marginTop: -70, marginLeft: -70, borderColor: 'rgba(0,255,136,0.28)' },
  ring2: { width: 170, height: 170, marginTop: -85, marginLeft: -85, borderColor: 'rgba(0,229,255,0.18)' },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ng, top: -3, left: '50%', marginLeft: -3, shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  dotCyan: { backgroundColor: colors.nc, shadowColor: colors.nc },
  globe: { fontSize: 72, position: 'absolute' },
});

// ── NodeStat card (exact copy from BlockStatus) ────────────────────
type Variant = 'green' | 'cyan' | 'yellow' | 'red';

const VARIANT_COLOR: Record<Variant, string> = {
  green: colors.ng,
  cyan: colors.nc,
  yellow: '#ffd600',
  red: '#ff3d5a',
};

interface NodeStatProps {
  icon: string; label: string; value: string; sub?: string;
  variant?: Variant; wide?: boolean; delay?: number;
}

const NodeStat: React.FC<NodeStatProps> = ({ icon, label, value, sub, variant = 'green', wide, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const topColor = VARIANT_COLOR[variant];
  const cardVariantStyle = variant === 'cyan' ? nsStyles.cardCyan : variant === 'yellow' ? nsStyles.cardYellow : variant === 'red' ? nsStyles.cardRed : nsStyles.card;
  const valVariantStyle = variant === 'cyan' ? nsStyles.valCyan : variant === 'yellow' ? nsStyles.valYellow : variant === 'red' ? nsStyles.valRed : nsStyles.valGreen;
  return (
    <Animated.View style={[nsStyles.card, cardVariantStyle, wide && nsStyles.wide, { opacity: slideAnim, transform: [{ translateY: ty }] }]}>
      <Svg width="100%" height={2} style={nsStyles.topBorder}>
        <Defs>
          <LinearGradient id={`es_${variant}_${label}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={topColor} stopOpacity="0" />
            <Stop offset="50%" stopColor={topColor} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={topColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill={`url(#es_${variant}_${label})`} />
      </Svg>
      <Text style={nsStyles.icon}>{icon}</Text>
      <Text style={nsStyles.label}>{label}</Text>
      <Text style={[nsStyles.value, valVariantStyle]}>{value}</Text>
      {sub && <Text style={nsStyles.sub}>{sub}</Text>}
    </Animated.View>
  );
};

const nsStyles = StyleSheet.create({
  card: {
    width: '48%', backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.22)',
    borderRadius: 12, padding: 13, alignItems: 'center',
    overflow: 'hidden', marginBottom: 8,
  },
  wide: { width: '100%' },
  cardCyan: { backgroundColor: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.18)' },
  cardYellow: { backgroundColor: 'rgba(255,214,0,0.04)', borderColor: 'rgba(255,214,0,0.22)' },
  cardRed: { backgroundColor: 'rgba(255,61,90,0.04)', borderColor: 'rgba(255,61,90,0.22)' },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0 },
  icon: { fontSize: 22, marginBottom: 5, color: 'rgba(255,255,255,0.7)' },
  label: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3, textAlign: 'center' },
  value: { fontFamily: fonts.orbitron, fontSize: 18, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  valGreen: { color: colors.ng, textShadowColor: 'rgba(0,255,136,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valCyan: { color: colors.nc, textShadowColor: 'rgba(0,229,255,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valYellow: { color: '#ffd600', textShadowColor: 'rgba(255,214,0,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valRed: { color: '#ff3d5a', textShadowColor: 'rgba(255,61,90,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  sub: { fontFamily: fonts.rajdhani, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textAlign: 'center' },
});

// ── AI Level card ──────────────────────────────────────────────────
const AILevelCard: React.FC<{ level: number; delay?: number }> = ({ level, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const MAX_LEVEL = 3;
  return (
    <Animated.View style={[nsStyles.card, nsStyles.cardCyan, nsStyles.wide, { opacity: slideAnim, transform: [{ translateY: ty }] }]}>
      <Svg width="100%" height={2} style={nsStyles.topBorder}>
        <Defs>
          <LinearGradient id="es_ai" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.nc} stopOpacity="0" />
            <Stop offset="50%" stopColor={colors.nc} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={colors.nc} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#es_ai)" />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <View>
          <Text style={nsStyles.icon}>🤖</Text>
          <Text style={nsStyles.label}>AI LEVEL REACHED</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={[nsStyles.value, nsStyles.valCyan, { fontSize: 16 }]}>Level {level}</Text>
            <Text style={{ fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(0,229,255,0.7)' }}>{AI_LEVEL_LABELS[level] ?? ''}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[nsStyles.label, { marginBottom: 6 }]}>PROGRESS</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => (
              <View key={i} style={[aiStyles.pip, i < level && aiStyles.pipActive]}>
                <Text style={[aiStyles.pipText, i < level && aiStyles.pipTextActive]}>{i < level ? '✓' : String(i + 1)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const aiStyles = StyleSheet.create({
  pip: { width: 22, height: 22, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  pipActive: { backgroundColor: colors.nc, borderColor: colors.nc, shadowColor: colors.nc, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  pipText: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)' },
  pipTextActive: { color: '#000', fontWeight: '900' },
});

// ── Resources bar ──────────────────────────────────────────────────
const ResourcesBar: React.FC<{ pct: number }> = ({ pct }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct / 100, duration: 1800, delay: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [widthAnim, pct]);
  return (
    <View style={[nsStyles.card, nsStyles.wide, { alignItems: 'flex-start', marginBottom: 8 }]}>
      <Svg width="100%" height={2} style={nsStyles.topBorder}>
        <Defs>
          <LinearGradient id="es_res" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.ng} stopOpacity="0" />
            <Stop offset="50%" stopColor={colors.ng} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={colors.ng} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#es_res)" />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 10 }}>
        <View>
          <Text style={nsStyles.label}>🌍  RESOURCES AT END</Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.ng, letterSpacing: 1 }}>Planet survived — sustainable run</Text>
        </View>
        <Text style={[nsStyles.value, nsStyles.valGreen, { fontSize: 22 }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={resStyles.track}>
        <Animated.View style={[resStyles.fill, { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
        <Text style={nsStyles.label}>DEPLETED</Text>
        <Text style={nsStyles.label}>OPTIMAL</Text>
      </View>
    </View>
  );
};

const resStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 4, width: '100%' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.ng, shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
});

// ── Section label with gradient lines ─────────────────────────────
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
    <View style={{ flex: 1, height: 1 }}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id={`sl_${label}_l`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="100%" stopColor={colors.ng} stopOpacity="0.25" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="1" fill={`url(#sl_${label}_l)`} />
      </Svg>
    </View>
    <Text style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: 5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{label}</Text>
    <View style={{ flex: 1, height: 1 }}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id={`sl_${label}_r`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.ng} stopOpacity="0.25" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="1" fill={`url(#sl_${label}_r)`} />
      </Svg>
    </View>
  </View>
);

// ── Main component ─────────────────────────────────────────────────
const EndingScreen: React.FC<EndingScreenProps> = ({
  visible, endingType, stats, collapseCount, goodEndingCount, onPrestige,
}) => {
  const { t } = useGame();
  const insets = useSafeAreaInsets();
  const isCollapse = endingType === 'collapse';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setStatsVisible(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => setStatsVisible(true));
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.94, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim, pulseAnim]);

  if (!visible || !endingType) return null;

  const bonus = calculateEndingBonus(endingType, collapseCount, goodEndingCount);
  const collapseProductionPct = Math.round((bonus.productionMultiplier - 1) * 100);
  const renewableDiscountPct = Math.round(calculateRenewableDiscount(goodEndingCount) * 100);
  const prestigeRunNumber = collapseCount + goodEndingCount + 1;

  // ── Collapse ending ────────────────────────────────────────────────
  if (isCollapse) {
    return (
      <Modal transparent={false} animationType="none" visible={visible} onRequestClose={() => {}}>
        <View style={[legacyStyles.container, legacyStyles.containerCollapse]}>
          <ScrollView contentContainerStyle={[legacyStyles.scrollContent, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
              <Text style={legacyStyles.icon}>🌍💀</Text>
              <Text style={[legacyStyles.title, legacyStyles.titleCollapse]}>{t('endgame.collapse.title')}</Text>
              <Text style={legacyStyles.quote}>
                {t(stats?.aiLevelReached === 3 ? 'endgame.collapse.quote' : 'endgame.collapse.quoteNoAI')}
              </Text>
              {statsVisible && stats && (
                <View style={legacyStyles.section}>
                  <View style={legacyStyles.sectionDivider} />
                  <Text style={legacyStyles.sectionTitle}>{t('endgame.stats.title')}</Text>
                  <View style={legacyStyles.sectionDivider} />
                  {[
                    { icon: '⛏️', label: t('endgame.stats.blocksMined'), value: formatNumber(stats.blocksMined) },
                    { icon: '💰', label: t('endgame.stats.coinsEarned'), value: formatNumber(stats.totalCryptoCoinsEarned) },
                    { icon: '💵', label: t('endgame.stats.moneyEarned'), value: `$${formatNumber(stats.totalMoneyEarned)}` },
                    { icon: '🌍', label: t('endgame.stats.resourcesAtEnd'), value: '0%', red: true },
                    { icon: '🤖', label: t('endgame.stats.aiLevel'), value: AI_LEVEL_LABELS[stats.aiLevelReached] ?? String(stats.aiLevelReached) },
                    { icon: '⏱️', label: t('endgame.stats.duration'), value: formatDuration(stats.runDurationMs) },
                  ].map((row, i) => (
                    <View key={i} style={legacyStyles.statRow}>
                      <Text style={legacyStyles.statIcon}>{row.icon}</Text>
                      <Text style={legacyStyles.statLabel}>{row.label}:</Text>
                      <Text style={[legacyStyles.statValue, row.red && legacyStyles.statValueRed]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              )}
              {statsVisible && (
                <View style={legacyStyles.section}>
                  <View style={legacyStyles.sectionDivider} />
                  <Text style={legacyStyles.sectionTitle}>{t('endgame.collapse.bonusTitle')}</Text>
                  <View style={legacyStyles.sectionDivider} />
                  {collapseProductionPct > 0 && (
                    <Text style={legacyStyles.bonusText}>
                      {t('endgame.bonus.production').replace('{{pct}}', String(collapseProductionPct))}
                    </Text>
                  )}
                  <Text style={legacyStyles.bonusSubtext}>
                    {t('endgame.bonus.runLabel').replace('{{n}}', String(prestigeRunNumber))}
                  </Text>
                </View>
              )}
              <Animated.View style={[legacyStyles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity style={[legacyStyles.prestigeButton, legacyStyles.buttonCollapse]} onPress={onPrestige} activeOpacity={0.8}>
                  <Text style={legacyStyles.prestigeButtonText}>{t('endgame.collapse.button')}</Text>
                </TouchableOpacity>
              </Animated.View>
              <View style={{ height: 24 }} />
            </Animated.View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // ── Good ending ────────────────────────────────────────────────────
  return (
    <Modal transparent={false} animationType="none" visible={visible} onRequestClose={() => {}}>
      <View style={goodStyles.container}>

        {/* Grid + Aurora + Scanline + Particles — fixed background */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <AnimatedGrid />
          <AuroraBlob width={500} height={400} top={-100} left={-100} color={colors.ng} duration={8000} delay={0} />
          <AuroraBlob width={400} height={500} top={-80} right={-80} color={colors.nc} duration={11000} delay={0} />
          <AuroraBlob width={600} height={300} bottom={100} left={-150} color={colors.ng} duration={14000} delay={0} />
          <Scanline />
          {VICTORY_PARTICLES.map(p => (
            <VictoryParticle key={p.id} left={p.left} size={p.size} color={p.color} duration={p.duration} delay={p.delay} />
          ))}
        </View>

        {/* Confetti — one-shot, above everything */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {CONFETTI_PIECES.map(p => (
            <ConfettiPiece key={p.id} x={p.x} color={p.color} duration={p.duration} delay={p.delay} w={p.w} h={p.h} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView contentContainerStyle={[goodStyles.scrollContent, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>

            {/* Topbar */}
            <View style={goodStyles.topbar}>
              <Text style={goodStyles.logo}>BLOCK<Text style={{ color: colors.nc }}>CHAIN</Text> TYCOON</Text>
              <Text style={goodStyles.runInfo}>RUN #{prestigeRunNumber}{stats ? ` · ${formatDuration(stats.runDurationMs)}` : ''}</Text>
            </View>

            {/* Hero */}
            <View style={goodStyles.heroSection}>
              <OrbitGlobe />
              <Text style={goodStyles.victorySub}>Mission Complete · Genesis Chain</Text>
              <Text style={goodStyles.victoryTitle}>{t('endgame.good.title')}</Text>
              <View style={goodStyles.quoteBox}>
                <Text style={goodStyles.quoteText}>{t('endgame.good.quote')}</Text>
              </View>
            </View>

            {/* Stats */}
            {statsVisible && stats && (
              <View style={goodStyles.section}>
                <SectionLabel label="YOUR LEGACY" />
                <View style={goodStyles.cardGrid}>
                  <NodeStat icon="⛏" label="Blocks Mined" value={`${formatNumber(stats.blocksMined)} ✓`} sub="100% Complete" variant="green" delay={200} />
                  <NodeStat icon="◈" label="CC Earned" value={formatNumber(stats.totalCryptoCoinsEarned)} sub="CryptoCoins" variant="cyan" delay={350} />
                  <NodeStat icon="💰" label="Money Accumulated" value={`$${formatNumber(stats.totalMoneyEarned)}`} sub="Total Cash" variant="yellow" delay={500} />
                  <NodeStat icon="⏱" label="Run Duration" value={formatDuration(stats.runDurationMs)} sub="Real time" delay={650} />
                </View>
                <AILevelCard level={stats.aiLevelReached} delay={800} />
                <ResourcesBar pct={Math.round(stats.planetResourcesAtEnd)} />
              </View>
            )}

            {/* Bonus */}
            {statsVisible && (
              <View style={goodStyles.section}>
                <View style={goodStyles.bonusCard}>
                  <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                    <Defs>
                      <LinearGradient id="es_bonus_top" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0%" stopColor={colors.nc} stopOpacity="1" />
                        <Stop offset="100%" stopColor={colors.ng} stopOpacity="1" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="2" fill="url(#es_bonus_top)" />
                  </Svg>
                  <Text style={goodStyles.bonusStar}>⭐</Text>
                  <Text style={goodStyles.bonusTitle}>{t('endgame.good.bonusTitle')}</Text>
                  <Text style={goodStyles.bonusRun}>Run #{prestigeRunNumber} · Accumulated rewards unlocked</Text>
                  {collapseProductionPct > 0 && (
                    <Text style={goodStyles.bonusLine}>{t('endgame.bonus.production').replace('{{pct}}', String(collapseProductionPct))}</Text>
                  )}
                  {renewableDiscountPct > 0 && (
                    <Text style={goodStyles.bonusLine}>{t('endgame.bonus.renewable').replace('{{pct}}', String(renewableDiscountPct))}</Text>
                  )}
                  <View style={goodStyles.bonusQuoteBox}>
                    <Text style={goodStyles.bonusQuote}>{t('endgame.good.narrative')}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action button */}
            <View style={goodStyles.actions}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity style={goodStyles.startBtn} onPress={onPrestige} activeOpacity={0.85}>
                  <Text style={goodStyles.startBtnText}>↺  {t('endgame.good.button')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ── Good ending styles ─────────────────────────────────────────────
const goodStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  scrollContent: { flexGrow: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.08)', backgroundColor: 'rgba(2,8,16,0.95)' },
  logo: { fontFamily: fonts.orbitron, fontSize: 11, fontWeight: '900', letterSpacing: 2, color: colors.ng, textShadowColor: 'rgba(0,255,136,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  runInfo: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 },
  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  victorySub: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 4, color: colors.nc, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, opacity: 0.75 },
  victoryTitle: { fontFamily: fonts.orbitron, fontSize: 22, fontWeight: '900', letterSpacing: 3, color: colors.ng, textShadowColor: 'rgba(0,255,136,0.45)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18, textTransform: 'uppercase', textAlign: 'center', lineHeight: 30, marginBottom: 16 },
  quoteBox: { borderLeftWidth: 2, borderLeftColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.03)', borderTopRightRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 14, paddingVertical: 12, maxWidth: 320 },
  quoteText: { fontFamily: fonts.rajdhani, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, fontStyle: 'italic' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bonusCard: { borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', backgroundColor: 'rgba(0,229,255,0.04)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' },
  bonusStar: { position: 'absolute', top: 14, right: 14, fontSize: 24 },
  bonusTitle: { fontFamily: fonts.orbitron, fontSize: 10, fontWeight: '700', letterSpacing: 3, color: colors.nc, marginBottom: 6, marginTop: 2 },
  bonusRun: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 10 },
  bonusLine: { fontFamily: fonts.rajdhani, fontSize: 13, color: colors.ng, fontWeight: '600', marginBottom: 4 },
  bonusQuoteBox: { backgroundColor: 'rgba(0,229,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)', borderRadius: 8, padding: 12 },
  bonusQuote: { fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20, fontStyle: 'italic' },
  actions: { paddingHorizontal: 16, paddingTop: 8 },
  startBtn: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: colors.ng, backgroundColor: 'rgba(0,255,136,0.08)', alignItems: 'center', justifyContent: 'center', shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  startBtnText: { fontFamily: fonts.orbitron, fontSize: 14, fontWeight: '700', letterSpacing: 4, color: colors.ng, textTransform: 'uppercase' },
});

// ── Legacy collapse styles ─────────────────────────────────────────
const legacyStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  containerCollapse: { backgroundColor: '#0d0505' },
  scrollContent: { flexGrow: 1, padding: 22, alignItems: 'center' },
  icon: { fontSize: 44, marginBottom: 10, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2, marginBottom: 12 },
  titleCollapse: { color: '#ff4444' },
  quote: { fontSize: 15, color: '#aaaaaa', textAlign: 'center', lineHeight: 20, fontStyle: 'italic', marginBottom: 16, paddingHorizontal: 8 },
  section: { width: '100%', marginBottom: 14 },
  sectionDivider: { height: 1, backgroundColor: '#333', marginVertical: 6 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', letterSpacing: 2, textAlign: 'center', marginBottom: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  statIcon: { fontSize: 15, width: 26 },
  statLabel: { flex: 1, fontSize: 14, color: '#888' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#cccccc', textAlign: 'right' },
  statValueRed: { color: '#ff4444' },
  bonusText: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
  bonusSubtext: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 3 },
  buttonWrapper: { width: '100%', marginTop: 6 },
  prestigeButton: { paddingVertical: 15, paddingHorizontal: 24, borderRadius: 10, alignItems: 'center', borderWidth: 2 },
  buttonCollapse: { backgroundColor: '#1a0505', borderColor: '#ff4444' },
  prestigeButtonText: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },
});

export default EndingScreen;
