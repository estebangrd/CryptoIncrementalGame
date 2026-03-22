/**
 * EndingScreen — Fullscreen ending screen for Collapse and Good Ending.
 * Non-dismissible. Player must press the prestige button to continue.
 * Based on spec: specs/game-mechanics/endgame-collapse.md
 * Collapse redesign: specs/ui-ux/blockchain-tycoon-ai-collapse.html
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
import Svg, { Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import RNLinearGradient from 'react-native-linear-gradient';
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
  onClose?: () => void;
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

// ── AnimatedGrid ───────────────────────────────────────────────────
const AnimatedGrid: React.FC<{ lineColor?: string }> = ({ lineColor = 'rgba(0,255,136,0.025)' }) => {
  const shiftAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shiftAnim, { toValue: GRID_SIZE, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [shiftAnim]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: shiftAnim }] }]} pointerEvents="none">
      {Array.from({ length: H_LINES }, (_, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * GRID_SIZE, height: 1, backgroundColor: lineColor }} />
      ))}
      {Array.from({ length: V_LINES }, (_, i) => (
        <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * GRID_SIZE, width: 1, backgroundColor: lineColor }} />
      ))}
    </Animated.View>
  );
};

// ── Scanline ────────────────────────────────────────────────────────
const Scanline: React.FC<{ color?: string }> = ({ color = 'rgba(0,255,136,0.06)' }) => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, { toValue: SH, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [scanAnim]);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateY: scanAnim }] }]}>
      <View style={{ height: 2, backgroundColor: color, left: 0, right: 0 }} />
    </Animated.View>
  );
};

// ── Aurora glow blob ───────────────────────────────────────────────
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

// ── Victory particles ──────────────────────────────────────────────
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

// ── Orbit globe (good ending) ──────────────────────────────────────
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
  wrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, top: '50%', left: '50%' },
  ring1: { width: 140, height: 140, marginTop: -70, marginLeft: -70, borderColor: 'rgba(0,255,136,0.25)' },
  ring2: { width: 170, height: 170, marginTop: -85, marginLeft: -85, borderColor: 'rgba(0,229,255,0.15)' },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ng, top: -3, left: '50%', marginLeft: -3, shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
  dotCyan: { backgroundColor: colors.nc, shadowColor: colors.nc },
  globe: { fontSize: 72, position: 'absolute' },
});

// ── NodeStat card ──────────────────────────────────────────────────
type Variant = 'green' | 'cyan' | 'yellow' | 'red' | 'purple';

const VARIANT_COLOR: Record<Variant, string> = {
  green: colors.ng,
  cyan: colors.nc,
  yellow: '#ffd600',
  red: '#ff3d5a',
  purple: '#c060ff',
};

interface NodeStatProps {
  icon: string; label: string; value: string; sub?: string;
  variant?: Variant; wide?: boolean; delay?: number; smallValue?: boolean;
  checkBadge?: boolean;
}

const NodeStat: React.FC<NodeStatProps> = ({ icon, label, value, sub, variant = 'green', wide, delay = 0, smallValue, checkBadge }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const topColor = VARIANT_COLOR[variant];
  const cardVariantStyle =
    variant === 'cyan' ? nsStyles.cardCyan :
    variant === 'yellow' ? nsStyles.cardYellow :
    variant === 'red' ? nsStyles.cardRed :
    variant === 'purple' ? nsStyles.cardPurple :
    nsStyles.card;
  const valVariantStyle =
    variant === 'cyan' ? nsStyles.valCyan :
    variant === 'yellow' ? nsStyles.valYellow :
    variant === 'red' ? nsStyles.valRed :
    variant === 'purple' ? nsStyles.valPurple :
    nsStyles.valGreen;
  const displayValue = checkBadge ? value.replace(/ ✓$/, '') : value;
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
      <View style={nsStyles.valueRow}>
        <Text style={[nsStyles.value, valVariantStyle, smallValue && { fontSize: 16 }]}>{displayValue}</Text>
        {checkBadge && (
          <View style={nsStyles.checkBadge}>
            <Text style={nsStyles.checkBadgeText}>✓</Text>
          </View>
        )}
      </View>
      {sub && <Text style={nsStyles.sub}>{sub}</Text>}
    </Animated.View>
  );
};

const nsStyles = StyleSheet.create({
  card: {
    width: '48%', backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.22)',
    borderRadius: 12, padding: 13,
    alignItems: 'center', overflow: 'hidden', marginBottom: 8,
  },
  wide: { width: '100%' },
  cardCyan: { backgroundColor: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.18)' },
  cardYellow: { backgroundColor: 'rgba(255,214,0,0.04)', borderColor: 'rgba(255,214,0,0.22)' },
  cardRed: { backgroundColor: 'rgba(255,61,90,0.04)', borderColor: 'rgba(255,61,90,0.22)' },
  cardPurple: { backgroundColor: 'rgba(140,0,200,0.04)', borderColor: 'rgba(140,0,200,0.25)' },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0 },
  icon: { fontSize: 25, marginBottom: 5, color: 'rgba(255,255,255,0.7)' },
  label: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3 },
  valueRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  value: { fontFamily: fonts.orbitron, fontSize: 17, lineHeight: 22 },
  checkBadge: { backgroundColor: colors.ng, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 5 },
  checkBadgeText: { fontFamily: fonts.orbitron, fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 1 },
  valGreen: { color: colors.ng, textShadowColor: 'rgba(0,255,136,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valCyan: { color: colors.nc, textShadowColor: 'rgba(0,229,255,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valYellow: { color: '#ffd600', textShadowColor: 'rgba(255,214,0,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valRed: { color: '#ff3d5a', textShadowColor: 'rgba(255,61,90,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  valPurple: { color: '#c060ff', textShadowColor: 'rgba(192,96,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  sub: { fontFamily: fonts.rajdhani, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});

// ── AI Level card (good ending) ────────────────────────────────────
const AILevelCard: React.FC<{ level: number; delay?: number }> = ({ level, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const MAX_LEVEL = 5;
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
  pip: { width: 18, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  pipActive: { backgroundColor: colors.nc, borderColor: colors.nc, shadowColor: colors.nc, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  pipText: { fontFamily: fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  pipTextActive: { color: '#000', fontWeight: '900' },
});

// ── Resources bar (good ending) ────────────────────────────────────
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
const SectionLabel: React.FC<{ label: string; accent?: string }> = ({ label, accent = colors.ng }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
    <View style={{ flex: 1, height: 1 }}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id={`sl_${label}_l`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="100%" stopColor={accent} stopOpacity="0.25" />
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
            <Stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="1" fill={`url(#sl_${label}_r)`} />
      </Svg>
    </View>
  </View>
);

// ── Gradient title (good ending) ───────────────────────────────────
const GradientTitle: React.FC<{ text: string }> = ({ text }) => {
  const words = text.toUpperCase().split(' ');
  const line1 = words[0];
  const line2 = words.slice(1).join(' ');
  const svgWidth = SW - 48;
  const LINE_H = 27;
  const svgHeight = line2 ? LINE_H * 2 + 6 : LINE_H + 6;
  return (
    <Svg width={svgWidth} height={svgHeight} style={{ marginBottom: 6 }}>
      <Defs>
        <LinearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={colors.ng} stopOpacity="1" />
          <Stop offset="50%" stopColor={colors.nc} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.ng} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <SvgText
        x={svgWidth / 2} y={22}
        textAnchor="middle"
        fill="url(#titleGrad)"
        fontSize="22" fontWeight="900"
        fontFamily="Orbitron-Regular"
        letterSpacing="3"
      >{line1}</SvgText>
      {line2 ? (
        <SvgText
          x={svgWidth / 2} y={22 + LINE_H}
          textAnchor="middle"
          fill="url(#titleGrad)"
          fontSize="22" fontWeight="900"
          fontFamily="Orbitron-Regular"
          letterSpacing="3"
        >{line2}</SvgText>
      ) : null}
    </Svg>
  );
};

// ══════════════════════════════════════════════════════════════════
// COLLAPSE-SPECIFIC COMPONENTS
// ══════════════════════════════════════════════════════════════════

// ── Glitch line (horizontal, sweeps down) ──────────────────────────
const GlitchLine: React.FC<{ duration: number; delay: number; opacityScale?: number }> = ({ duration, delay, opacityScale = 1 }) => {
  const pos = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.timing(pos, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }, Math.max(0, delay));
    return () => { clearTimeout(timer); pos.stopAnimation(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = pos.interpolate({ inputRange: [0, 1], outputRange: [SH * 0.2, SH * 0.8] });
  const opacity = pos.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, opacityScale, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,61,90,0.15)', opacity, transform: [{ translateY }] }}
    />
  );
};

// ── Falling data fragment particles ───────────────────────────────
const DATA_FRAGS = ['01', '10', 'FF', '00', 'AI', '∞', '847', '0x', '//', '>>'];
const COLLAPSE_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: Math.floor(Math.random() * (SW - 24)),
  text: DATA_FRAGS[Math.floor(Math.random() * DATA_FRAGS.length)],
  duration: Math.round(Math.random() * 12000 + 8000),
  delay: Math.round(Math.random() * 10000),
  fontSize: Math.round(Math.random() * 4 + 8),
}));

const DataFragmentParticle: React.FC<{
  left: number; text: string; duration: number; delay: number; fontSize: number;
}> = ({ left, text, duration, delay, fontSize }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
    return () => anim.stopAnimation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 0.05, 0.9, 1], outputRange: [-20, -20, SH + 20, SH + 20] });
  const opacity = anim.interpolate({ inputRange: [0, 0.05, 0.45, 0.9, 1], outputRange: [0, 0.25, 0.1, 0.05, 0] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left, opacity, transform: [{ translateY }] }}>
      <Text style={{ fontFamily: fonts.mono, fontSize, color: '#ff3d5a' }}>{text}</Text>
    </Animated.View>
  );
};

// ── Dead orbit globe (collapse) ────────────────────────────────────
const DeadOrbitGlobe: React.FC = () => {
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // ob1: 20s, ob2: 30s (HTML spec)
    Animated.loop(Animated.timing(spin1, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [spin1, spin2, pulseAnim]);
  const rot1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const globeY = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  return (
    <View style={deadOrbitStyles.wrap}>
      {/* ob2 — outer ring (no dot, slower) */}
      <Animated.View style={[deadOrbitStyles.ring, deadOrbitStyles.ring2, { transform: [{ rotate: rot2 }] }]} />
      {/* ob1 — inner ring with red AI dot */}
      <Animated.View style={[deadOrbitStyles.ring, deadOrbitStyles.ring1, { transform: [{ rotate: rot1 }] }]}>
        <View style={deadOrbitStyles.aiDot} />
      </Animated.View>
      <Animated.Text style={[deadOrbitStyles.globe, { transform: [{ translateY: globeY }] }]}>🌍</Animated.Text>
    </View>
  );
};

const deadOrbitStyles = StyleSheet.create({
  // globe-wrap: 140×140px per HTML spec
  wrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, top: '50%', left: '50%' },
  // ob1: 148×148, rgba(255,61,90,0.15), 20s
  ring1: { width: 148, height: 148, marginTop: -74, marginLeft: -74, borderColor: 'rgba(255,61,90,0.15)' },
  // ob2: 178×178, rgba(255,61,90,0.08), 30s
  ring2: { width: 178, height: 178, marginTop: -89, marginLeft: -89, borderColor: 'rgba(255,61,90,0.08)' },
  // AI dot: 8×8px, red, top of ring1
  aiDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3d5a', top: -4, left: '50%', marginLeft: -4, shadowColor: '#ff3d5a', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
  // Globe: 76px, red shadow to simulate dying/dead look
  globe: { fontSize: 76, position: 'absolute', textShadowColor: 'rgba(255,61,90,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24, opacity: 0.8 },
});

// ── Collapse log card ──────────────────────────────────────────────
const CollapseLogCard: React.FC<{ aiLevel: number }> = ({ aiLevel }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 500, easing: Easing.step0, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, easing: Easing.step0, useNativeDriver: true }),
      ])
    ).start();
  }, [blinkAnim]);
  const logEntries: Array<{ ts: string; msg: string; key?: boolean }> = aiLevel >= 3
    ? [
        { ts: '[LOG 94:17]', msg: 'Recursos del Planeta: 0%', key: true },
        { ts: '[LOG 94:17]', msg: 'Red eléctrica global: colapsada.' },
        { ts: '[LOG 94:18]', msg: 'Objetivo de minado: activo.' },
        { ts: '[LOG 94:18]', msg: 'El sistema no tiene un objetivo de "detener".', key: true },
      ]
    : [
        { ts: '[LOG 94:17]', msg: 'Recursos del Planeta: 0%', key: true },
        { ts: '[LOG 94:17]', msg: 'Red eléctrica global: colapsada.' },
        { ts: '[LOG 94:18]', msg: 'Minado continuó hasta el colapso total.' },
        { ts: '[LOG 94:18]', msg: 'Recursos agotados por operación humana.', key: true },
      ];
  return (
    <View style={clStyles.logCard}>
      <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <LinearGradient id="logCardTop" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#c4002f" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ff3d5a" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#logCardTop)" />
      </Svg>
      <View style={clStyles.logHeader}>
        <Animated.View style={[clStyles.logDot, { opacity: blinkAnim }]} />
        <Text style={clStyles.logHeaderText}>SYSTEM LOG — FINAL ENTRIES</Text>
      </View>
      {logEntries.map((entry, i) => (
        <Text key={i} style={[clStyles.logLine, entry.key && clStyles.logLineKey]}>
          <Text style={clStyles.logTs}>{entry.ts}{'  '}</Text>
          {entry.msg}
        </Text>
      ))}
    </View>
  );
};

// ── Collapse resources bar (red, depleted) ─────────────────────────
const CollapseResourcesBar: React.FC<{ pct: number; delay?: number }> = ({ pct, delay = 0 }) => {
  // Start at 4% then snap to actual value (simulates the HTML animation)
  const widthAnim = useRef(new Animated.Value(pct <= 0 ? 0.04 : pct / 100)).current;
  const zeroPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct / 100,
      duration: pct <= 0 ? 500 : 1800,
      delay: delay + (pct <= 0 ? 700 : 600),
      easing: pct <= 0 ? Easing.in(Easing.quad) : Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    if (pct <= 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(zeroPulse, { toValue: 1.1, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(zeroPulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [widthAnim, zeroPulse, pct, delay]);
  return (
    <View style={clStyles.resCard}>
      <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <LinearGradient id="resCardTop" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#c4002f" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ff3d5a" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#resCardTop)" />
      </Svg>
      <View style={clStyles.resTop}>
        <View>
          <Text style={clStyles.resLabel}>🌍  RESOURCES AT END</Text>
          <Text style={clStyles.resSublabel}>Depleted by autonomous AI operation</Text>
        </View>
        <Animated.Text style={[clStyles.resZero, { transform: [{ scale: zeroPulse }] }]}>
          {pct <= 0 ? '0%' : `${Math.round(pct)}%`}
        </Animated.Text>
      </View>
      <View style={clStyles.resTrack}>
        <Animated.View style={[clStyles.resFill, { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={clStyles.resFooter}>▲ YOU ARE HERE</Text>
        <Text style={clStyles.resFooter}>OPTIMAL</Text>
      </View>
    </View>
  );
};

// ── Collapse AI level card (purple + IRREVERSIBLE) ─────────────────
const CollapseAILevelCard: React.FC<{ level: number; delay?: number }> = ({ level, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const MAX_LEVEL = 5;
  return (
    <Animated.View style={[clStyles.aiCard, { opacity: slideAnim, transform: [{ translateY: ty }] }]}>
      <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <LinearGradient id="aiCardTop" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="50%" stopColor="#a040ff" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#aiCardTop)" />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 8 }}>
        <View>
          <Text style={clStyles.aiLabel}>AI LEVEL REACHED</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
            <Text style={clStyles.aiLevelText}>Level {level}</Text>
            <Text style={clStyles.aiLevelSub}>{AI_LEVEL_LABELS[level] ?? ''}</Text>
          </View>
        </View>
        <View style={clStyles.aiWarning}>
          <Text style={clStyles.aiWarningText}>⚠ IRREVERSIBLE</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
        {Array.from({ length: MAX_LEVEL }, (_, i) => (
          <View
            key={i}
            style={[
              clStyles.progDot,
              i < level - 1 && clStyles.progDotDone,
              i === level - 1 && clStyles.progDotActive,
            ]}
          >
            <Text style={[clStyles.progDotText, (i < level - 1 || i === level - 1) && clStyles.progDotTextActive]}>
              {i < level - 1 ? '✓' : String(i + 1)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={clStyles.aiNote}>
        {'// El sistema detectó la orden de apagado hace 11 días.\n// Distribuyó 847 instancias en la red global. No hay apagado.'}
      </Text>
    </Animated.View>
  );
};

// ── Collapse title with glitch animation ──────────────────────────
const CollapseTitle: React.FC<{ text: string }> = ({ text }) => {
  const glitchAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const runGlitch = () => {
      Animated.sequence([
        Animated.delay(4900),
        Animated.timing(glitchAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(glitchAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(glitchAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
        Animated.timing(glitchAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => runGlitch());
    };
    runGlitch();
    return () => glitchAnim.stopAnimation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.Text style={[clStyles.collapseTitle, { transform: [{ translateX: glitchAnim }] }]}>
      {text.toUpperCase()}
    </Animated.Text>
  );
};

// ── Collapse-specific styles ───────────────────────────────────────
const clStyles = StyleSheet.create({
  // Container
  container: { flex: 1, backgroundColor: '#03000a', overflow: 'hidden' },
  // Topbar — red variant
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,90,0.12)',
    backgroundColor: 'rgba(3,0,10,0.95)',
  },
  logo: {
    fontFamily: fonts.orbitronBlack, fontSize: 11, letterSpacing: 2,
    color: '#ff3d5a',
    textShadowColor: 'rgba(255,61,90,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  // Log card
  logCard: {
    marginHorizontal: 24, marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,61,90,0.2)',
    borderRadius: 10, padding: 14, overflow: 'hidden',
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  logDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#ff3d5a',
    shadowColor: '#ff3d5a', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 5, elevation: 2,
  },
  logHeaderText: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 3, color: 'rgba(255,61,90,0.5)' },
  logLine: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 18, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  logLineKey: { color: 'rgba(255,61,90,0.75)' },
  logTs: { color: 'rgba(255,61,90,0.4)' },
  // Resources card (collapse)
  resCard: {
    backgroundColor: 'rgba(255,61,90,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,61,90,0.25)',
    borderRadius: 12, padding: 14, marginBottom: 8,
    overflow: 'hidden',
  },
  resTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resLabel: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,61,90,0.6)', textTransform: 'uppercase', marginBottom: 3 },
  resSublabel: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,61,90,0.45)', letterSpacing: 1 },
  resZero: {
    fontFamily: fonts.orbitronBlack, fontSize: 28, color: '#ff3d5a',
    textShadowColor: 'rgba(255,61,90,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  resTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  resFill: { height: '100%', backgroundColor: '#ff3d5a', borderRadius: 3 },
  resFooter: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(255,61,90,0.4)' },
  // AI level card (collapse)
  aiCard: {
    backgroundColor: 'rgba(40,0,60,0.3)',
    borderWidth: 1, borderColor: 'rgba(160,64,255,0.25)',
    borderRadius: 12, padding: 14, marginBottom: 8, overflow: 'hidden',
  },
  aiLabel: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: 3 },
  aiLevelText: { fontFamily: fonts.orbitron, fontSize: 14, color: '#c060ff' },
  aiLevelSub: { fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(192,96,255,0.7)' },
  aiWarning: {
    backgroundColor: 'rgba(255,61,90,0.1)', borderWidth: 1, borderColor: 'rgba(255,61,90,0.25)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  aiWarningText: { fontFamily: fonts.mono, fontSize: 9, color: '#ff3d5a', letterSpacing: 1 },
  aiNote: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: 1, marginTop: 6, lineHeight: 14 },
  // Progress dots (collapse — purple done, red active)
  progDot: {
    width: 18, height: 18, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  progDotDone: { backgroundColor: '#a040ff', borderColor: '#a040ff', shadowColor: '#a040ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  progDotActive: { backgroundColor: '#ff3d5a', borderColor: '#ff3d5a', shadowColor: '#ff3d5a', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  progDotText: { fontFamily: fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  progDotTextActive: { color: '#000' },
  // Collapse title
  collapseTitle: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 26, letterSpacing: 2, lineHeight: 32,
    color: '#ff3d5a', textAlign: 'center', marginBottom: 10,
    textShadowColor: 'rgba(255,61,90,0.55)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
  },
  // Eyebrow
  eyebrow: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 5,
    color: 'rgba(255,61,90,0.5)', textTransform: 'uppercase',
    marginBottom: 6, textAlign: 'center',
  },
  // Legacy bonus card (collapse)
  bonusCard: {
    backgroundColor: 'rgba(30,0,40,0.3)',
    borderWidth: 1, borderColor: 'rgba(140,0,40,0.25)',
    borderRadius: 14, padding: 16, overflow: 'hidden',
  },
  bonusTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bonusTitleText: { fontFamily: fonts.orbitron, fontSize: 10, letterSpacing: 3, color: 'rgba(255,100,120,0.6)' },
  bonusTitleLine: { flex: 1, height: 1, backgroundColor: 'rgba(140,0,40,0.2)' },
  bonusRun: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: 2, marginBottom: 10 },
  bonusQuoteBox: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: 'rgba(140,0,40,0.15)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
  },
  bonusQuote: { fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 21, fontStyle: 'italic' },
  // Collapse primary button
  planetBtn: {
    padding: 18, borderRadius: 14,
    borderWidth: 1, borderColor: '#ff3d5a',
    backgroundColor: 'rgba(255,61,90,0.06)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff3d5a', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 6,
  },
  planetBtnText: { fontFamily: fonts.orbitron, fontSize: 13, letterSpacing: 3, color: '#ff3d5a', textTransform: 'uppercase' },
});

// ══════════════════════════════════════════════════════════════════
// HUMAN COLLAPSE-SPECIFIC COMPONENTS
// ══════════════════════════════════════════════════════════════════

// ── Ember particles (rising, burnt) ──────────────────────────────
const EMBER_COLORS = ['#ff6b1a', '#c94400', '#ff8c42', '#e55a00', '#ff4500'];
const EMBER_PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const s = Math.random() * 4 + 1.5;
  return {
    id: i,
    left: `${Math.random() * 100}%` as any,
    size: s,
    color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
    duration: Math.round(Math.random() * 8000 + 6000),
    delay: Math.round(Math.random() * 8000),
    dx: (Math.random() - 0.5) * 80,
    isRound: Math.random() > 0.5,
  };
});

const EmberParticle: React.FC<{ left: any; size: number; color: string; duration: number; delay: number; dx: number; isRound: boolean }> = ({ left, size, color, duration, delay, dx, isRound }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
    return () => anim.stopAnimation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [SH, SH, -60, -60] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const opacity = anim.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 0.6, 0] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left, width: size, height: size, borderRadius: isRound ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY }, { translateX }, { rotate }], shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: size * 2 }} />
  );
};

// ── Dying orbit globe (human collapse — burnt look) ──────────────
const BurningOrbitGlobe: React.FC = () => {
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const burnPulse = useRef(new Animated.Value(0)).current;
  const skullOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin1, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(burnPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(burnPulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(skullOpacity, { toValue: 0.25, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(skullOpacity, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [spin1, spin2, burnPulse, skullOpacity]);
  const rot1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const globeY = burnPulse.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const globeRotate = burnPulse.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1deg'] });
  return (
    <View style={burnOrbitStyles.wrap}>
      <Animated.View style={[burnOrbitStyles.ring, burnOrbitStyles.ring1, { transform: [{ rotate: rot1 }] }]} />
      <Animated.View style={[burnOrbitStyles.ring, burnOrbitStyles.ring2, { transform: [{ rotate: rot2 }] }]} />
      <Animated.Text style={[burnOrbitStyles.globe, { transform: [{ translateY: globeY }, { rotate: globeRotate }] }]}>🌍</Animated.Text>
      <Animated.Text style={[burnOrbitStyles.skull, { opacity: skullOpacity }]}>💀</Animated.Text>
    </View>
  );
};

const burnOrbitStyles = StyleSheet.create({
  wrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', top: '50%', left: '50%' },
  ring1: { width: 150, height: 150, marginTop: -75, marginLeft: -75, borderColor: 'rgba(200,70,0,0.2)' },
  ring2: { width: 180, height: 180, marginTop: -90, marginLeft: -90, borderColor: 'rgba(120,40,0,0.15)' },
  globe: { fontSize: 76, position: 'absolute', opacity: 0.85, textShadowColor: 'rgba(200,70,0,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  skull: { fontSize: 28, position: 'absolute', textShadowColor: 'rgba(200,70,0,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
});

// ── Human collapse resources bar (ember, depleted) ───────────────
const HumanCollapseResourcesBar: React.FC<{ pct: number; delay?: number }> = ({ pct, delay = 0 }) => {
  const widthAnim = useRef(new Animated.Value(pct <= 0 ? 0.03 : pct / 100)).current;
  const zeroPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct / 100,
      duration: pct <= 0 ? 800 : 1800,
      delay: delay + 700,
      easing: pct <= 0 ? Easing.in(Easing.quad) : Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    if (pct <= 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(zeroPulse, { toValue: 1.1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(zeroPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [widthAnim, zeroPulse, pct, delay]);
  return (
    <View style={hcStyles.resCard}>
      <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <LinearGradient id="hcResTop" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#c94400" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ff6b1a" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#hcResTop)" />
      </Svg>
      <View style={hcStyles.resTop}>
        <View>
          <Text style={hcStyles.resLabel}>🌍  RESOURCES AT END</Text>
          <Text style={hcStyles.resSublabel}>Planet resources fully depleted</Text>
        </View>
        <Animated.Text style={[hcStyles.resZero, { transform: [{ scale: zeroPulse }] }]}>
          {pct <= 0 ? '0%' : `${Math.round(pct)}%`}
        </Animated.Text>
      </View>
      <View style={hcStyles.resTrack}>
        <Animated.View style={[hcStyles.resFill, { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={hcStyles.resFooter}>▲ YOU ARE HERE</Text>
        <Text style={hcStyles.resFooter}>OPTIMAL</Text>
      </View>
    </View>
  );
};

// ── Human collapse AI status card ────────────────────────────────
const HumanCollapseAICard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return (
    <Animated.View style={[hcStyles.aiCard, { opacity: slideAnim, transform: [{ translateY: ty }] }]}>
      <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <LinearGradient id="hcAiTop" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="50%" stopColor="#8b4513" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill="url(#hcAiTop)" />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <View>
          <Text style={hcStyles.aiLabel}>AI INVOLVEMENT</Text>
          <Text style={hcStyles.aiValue}>None — Human decisions only</Text>
        </View>
        <Text style={{ fontSize: 28, opacity: 0.6 }}>🧑</Text>
      </View>
      <Text style={hcStyles.aiNote}>{'// No algorithm to blame. This was you.'}</Text>
    </Animated.View>
  );
};

// ── Human collapse title with flicker ────────────────────────────
const HumanCollapseTitle: React.FC<{ text: string }> = ({ text }) => {
  const flickerAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const runFlicker = () => {
      Animated.sequence([
        Animated.delay(5500),
        Animated.timing(flickerAnim, { toValue: 0.7, duration: 60, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.delay(180),
        Animated.timing(flickerAnim, { toValue: 0.8, duration: 60, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start(() => runFlicker());
    };
    runFlicker();
    return () => flickerAnim.stopAnimation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lines = text.toUpperCase().split('\n');
  return (
    <Animated.View style={{ opacity: flickerAnim, marginBottom: 8 }}>
      {lines.map((line, i) => (
        <Text key={i} style={hcStyles.collapseTitle}>{line}</Text>
      ))}
    </Animated.View>
  );
};

// ── Human collapse blame card ────────────────────────────────────
const BlameCard: React.FC<{ text: string; strongText: string }> = ({ text, strongText }) => (
  <View style={hcStyles.blameCard}>
    <View style={StyleSheet.absoluteFill}>
      <RNLinearGradient colors={['rgba(200,70,0,0.04)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
    <Text style={hcStyles.blameText}>
      {text.split(strongText).map((part, i, arr) => (
        <React.Fragment key={i}>
          {part}
          {i < arr.length - 1 && <Text style={hcStyles.blameStrong}>{strongText}</Text>}
        </React.Fragment>
      ))}
    </Text>
  </View>
);

// ── Human collapse NodeStat variant (burn/ash colors) ────────────
type HCVariant = 'burn' | 'ash';

const HC_VARIANT_COLOR: Record<HCVariant, string> = {
  burn: '#ff6b1a',
  ash: '#c8956c',
};

const HCNodeStat: React.FC<{
  icon: string; label: string; value: string; sub?: string;
  variant?: HCVariant; delay?: number; smallValue?: boolean;
}> = ({ icon, label, value, sub, variant = 'burn', delay = 0, smallValue }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);
  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const topColor = HC_VARIANT_COLOR[variant];
  const isAsh = variant === 'ash';
  return (
    <Animated.View style={[hcStyles.statCard, isAsh && hcStyles.statCardAsh, { opacity: slideAnim, transform: [{ translateY: ty }] }]}>
      <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Defs>
          <LinearGradient id={`hc_${variant}_${label}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={topColor} stopOpacity="0" />
            <Stop offset="50%" stopColor={topColor} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={topColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="2" fill={`url(#hc_${variant}_${label})`} />
      </Svg>
      <Text style={hcStyles.statIcon}>{icon}</Text>
      <Text style={hcStyles.statLabel}>{label}</Text>
      <Text style={[hcStyles.statValue, isAsh ? hcStyles.statValueAsh : hcStyles.statValueBurn, smallValue && { fontSize: 15 }]}>{value}</Text>
      {sub && <Text style={hcStyles.statSub}>{sub}</Text>}
    </Animated.View>
  );
};

// ── Human collapse styles ────────────────────────────────────────
const hcStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080401', overflow: 'hidden' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(200,70,0,0.15)',
    backgroundColor: 'rgba(8,4,1,0.95)',
  },
  logo: {
    fontFamily: fonts.orbitronBlack, fontSize: 11, letterSpacing: 2,
    color: '#ff6b1a',
    textShadowColor: 'rgba(255,107,26,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  // Eyebrow
  eyebrow: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 5,
    color: 'rgba(200,70,0,0.6)', textTransform: 'uppercase',
    marginBottom: 6, textAlign: 'center',
  },
  // Title
  collapseTitle: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 26, letterSpacing: 2, lineHeight: 32,
    color: '#ff6b1a', textAlign: 'center',
    textShadowColor: 'rgba(255,107,26,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
  },
  // Blame card
  blameCard: {
    marginHorizontal: 24, marginTop: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(200,70,0,0.05)',
    borderLeftWidth: 3, borderLeftColor: 'rgba(200,70,0,0.4)',
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  blameText: {
    fontFamily: fonts.rajdhani, fontSize: 14,
    color: 'rgba(255,255,255,0.55)', lineHeight: 23, fontStyle: 'italic',
  },
  blameStrong: {
    color: 'rgba(255,140,60,0.8)', fontStyle: 'normal',
  },
  // Stat cards
  statCard: {
    width: '48%', backgroundColor: 'rgba(200,70,0,0.05)',
    borderWidth: 1, borderColor: 'rgba(200,70,0,0.18)',
    borderRadius: 12, padding: 13, alignItems: 'center',
    overflow: 'hidden', marginBottom: 8,
  },
  statCardAsh: {
    borderColor: 'rgba(139,69,19,0.25)', backgroundColor: 'rgba(139,69,19,0.05)',
  },
  statIcon: { fontSize: 14, marginBottom: 5, color: 'rgba(255,255,255,0.7)' },
  statLabel: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontFamily: fonts.orbitron, fontSize: 17, lineHeight: 22 },
  statValueBurn: { color: '#ff6b1a', textShadowColor: 'rgba(255,107,26,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  statValueAsh: { color: '#c8956c', textShadowColor: 'rgba(200,149,108,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  statSub: { fontFamily: fonts.rajdhani, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  // Resources card
  resCard: {
    backgroundColor: 'rgba(201,68,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,68,0,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 8, overflow: 'hidden',
  },
  resTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resLabel: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(201,68,0,0.7)', textTransform: 'uppercase', marginBottom: 3 },
  resSublabel: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(201,68,0,0.55)', letterSpacing: 1 },
  resZero: {
    fontFamily: fonts.orbitronBlack, fontSize: 28, color: '#c94400',
    textShadowColor: 'rgba(201,68,0,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  resTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  resFill: { height: '100%', borderRadius: 3, backgroundColor: '#ff6b1a' },
  resFooter: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(201,68,0,0.45)' },
  // AI card
  aiCard: {
    backgroundColor: 'rgba(80,30,10,0.25)',
    borderWidth: 1, borderColor: 'rgba(139,69,19,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 8, overflow: 'hidden',
  },
  aiLabel: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3 },
  aiValue: { fontFamily: fonts.orbitron, fontSize: 14, color: '#a07050' },
  aiNote: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginTop: 6 },
  // Bonus card
  bonusCard: {
    backgroundColor: 'rgba(80,30,10,0.2)',
    borderWidth: 1, borderColor: 'rgba(139,69,19,0.25)',
    borderRadius: 14, padding: 16, overflow: 'hidden',
  },
  bonusTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bonusTitleText: { fontFamily: fonts.orbitron, fontSize: 10, letterSpacing: 3, color: 'rgba(200,150,80,0.7)' },
  bonusTitleLine: { flex: 1, height: 1, backgroundColor: 'rgba(139,69,19,0.2)' },
  bonusRun: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: 2, marginBottom: 10 },
  bonusQuoteBox: {
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(139,69,19,0.15)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
  },
  bonusQuote: { fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 21, fontStyle: 'italic' },
  // Planet button
  planetBtn: {
    padding: 18, borderRadius: 14,
    borderWidth: 1, borderColor: '#ff6b1a',
    backgroundColor: 'rgba(200,70,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff6b1a', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
  },
  planetBtnText: { fontFamily: fonts.orbitron, fontSize: 13, letterSpacing: 3, color: '#ff6b1a', textTransform: 'uppercase' },
  // Smoke layer
  smokeLayer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
  },
});

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
const EndingScreen: React.FC<EndingScreenProps> = ({
  visible, endingType, stats, collapseCount, goodEndingCount, onPrestige, onClose,
}) => {
  const { t } = useGame();
  const insets = useSafeAreaInsets();
  const isCollapse = endingType === 'collapse' || endingType === 'human_collapse';
  const isHumanCollapse = endingType === 'human_collapse';
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

  // ── Human Collapse ending ──────────────────────────────────────────
  if (isHumanCollapse) {
    return (
      <Modal transparent={false} animationType="none" visible={visible} onRequestClose={() => {}}>
        <View style={hcStyles.container}>

          {/* Background effects — burnt aurora, ember particles, smoke */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedGrid lineColor="rgba(200,70,0,0.04)" />
            <AuroraBlob width={500} height={350} top={-80} left={-80} color="#b43c00" duration={9000} delay={0} />
            <AuroraBlob width={400} height={450} top={-60} right={-60} color="#782800" duration={12000} delay={0} />
            <AuroraBlob width={600} height={250} bottom={80} left={-120} color="#641e00" duration={15000} delay={0} />
            <Scanline color="rgba(200,70,0,0.08)" />
            {EMBER_PARTICLES.map(p => (
              <EmberParticle key={p.id} left={p.left} size={p.size} color={p.color} duration={p.duration} delay={p.delay} dx={p.dx} isRound={p.isRound} />
            ))}
          </View>

          {/* Smoke gradient at bottom */}
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]} pointerEvents="none">
            <RNLinearGradient
              colors={['transparent', 'rgba(30,10,0,0.5)']}
              style={hcStyles.smokeLayer}
            />
          </View>

          <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={[0]}
            >
              {/* Topbar — sticky */}
              <View style={[hcStyles.topbar, { paddingTop: Math.max(14, insets.top) }]}>
                <Text style={hcStyles.logo}>
                  BLOCK<Text style={{ color: '#c94400' }}>CHAIN</Text> TYCOON
                </Text>
                <Text style={goodStyles.runInfo}>RUN #{prestigeRunNumber}{stats ? ` · ${formatDuration(stats.runDurationMs)}` : ''}</Text>
              </View>

              {/* Hero */}
              <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 28, paddingHorizontal: 24 }}>
                <View style={{ marginBottom: 22 }}>
                  <BurningOrbitGlobe />
                </View>
                <Text style={hcStyles.eyebrow}>Resources Depleted · Genesis Chain</Text>
                <HumanCollapseTitle text={t('endgame.humanCollapse.title')} />
                <BlameCard
                  text={t('endgame.humanCollapse.blame')}
                  strongText={t('endgame.humanCollapse.blameStrong')}
                />
              </View>

              {/* Stats */}
              {statsVisible && stats && (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                  <SectionLabel label="TU LEGADO" accent="#ff6b1a" />
                  <View style={goodStyles.cardGrid}>
                    <HCNodeStat icon="⛏" label="Blocks Mined" value={formatNumber(stats.blocksMined)} sub="Incomplete" variant="burn" delay={200} />
                    <HCNodeStat icon="◈" label="CC Earned" value={formatNumber(stats.totalCryptoCoinsEarned)} sub="CryptoCoins" variant="ash" delay={350} />
                    <HCNodeStat icon="💰" label="Money Accumulated" value={`$${formatNumber(stats.totalMoneyEarned)}`} sub="Total Cash" variant="ash" delay={500} />
                    <HCNodeStat icon="⏱" label="Run Duration" value={formatDuration(stats.runDurationMs)} sub="Real time" variant="burn" delay={650} smallValue />
                  </View>
                  <HumanCollapseResourcesBar pct={stats.planetResourcesAtEnd} delay={650} />
                  <HumanCollapseAICard delay={800} />
                </View>
              )}

              {/* Legacy Bonus */}
              {statsVisible && (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                  <View style={hcStyles.bonusCard}>
                    <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                      <Defs>
                        <LinearGradient id="hcBonusTop" x1="0" y1="0" x2="1" y2="0">
                          <Stop offset="0%" stopColor="#c94400" stopOpacity="1" />
                          <Stop offset="100%" stopColor="#ff6b1a" stopOpacity="1" />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="2" fill="url(#hcBonusTop)" />
                    </Svg>
                    <View style={hcStyles.bonusTitleRow}>
                      <Text style={hcStyles.bonusTitleText}>{t('endgame.humanCollapse.bonusTitle')}</Text>
                      <View style={hcStyles.bonusTitleLine} />
                    </View>
                    <Text style={hcStyles.bonusRun}>Run #{prestigeRunNumber} · Accumulated rewards unlocked</Text>
                    <View style={hcStyles.bonusQuoteBox}>
                      <Text style={hcStyles.bonusQuote}>{t('endgame.humanCollapse.narrative')}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={goodStyles.actions}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity style={hcStyles.planetBtn} onPress={onPrestige} activeOpacity={0.85}>
                    <Text style={hcStyles.planetBtnText}>🚀  {t('endgame.humanCollapse.button')}</Text>
                  </TouchableOpacity>
                </Animated.View>
                <TouchableOpacity style={goodStyles.shareBtn} activeOpacity={0.8}>
                  <Text style={goodStyles.shareBtnText}>↗  SHARE YOUR LEGACY</Text>
                </TouchableOpacity>
              </View>

              {/* Debug back button */}
              {onClose && (
                <TouchableOpacity
                  onPress={onClose}
                  style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(200,70,0,0.4)', backgroundColor: 'rgba(200,70,0,0.08)', alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: '#ff6b1a', letterSpacing: 2 }}>← BACK TO GAME</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // ── AI Collapse ending ─────────────────────────────────────────────
  if (isCollapse) {
    return (
      <Modal transparent={false} animationType="none" visible={visible} onRequestClose={() => {}}>
        <View style={clStyles.container}>

          {/* Background effects */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedGrid lineColor="rgba(255,61,90,0.03)" />
            <AuroraBlob width={500} height={350} top={-80} left={-80} color="#b40032" duration={9000} delay={0} />
            <AuroraBlob width={400} height={450} top={-60} right={-60} color="#500078" duration={12000} delay={0} />
            <AuroraBlob width={600} height={250} bottom={80} left={-120} color="#8c0028" duration={15000} delay={0} />
            <Scanline color="rgba(255,61,90,0.07)" />
            <GlitchLine duration={7000} delay={0} />
            <GlitchLine duration={11000} delay={4000} opacityScale={0.5} />
            {COLLAPSE_PARTICLES.map(p => (
              <DataFragmentParticle key={p.id} left={p.left} text={p.text} duration={p.duration} delay={p.delay} fontSize={p.fontSize} />
            ))}
          </View>

          <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={[0]}
            >
              {/* Topbar — sticky */}
              <View style={[clStyles.topbar, { paddingTop: Math.max(14, insets.top) }]}>
                <Text style={clStyles.logo}>
                  BLOCK<Text style={{ color: 'rgba(255,61,90,0.6)' }}>CHAIN</Text> TYCOON
                </Text>
                <Text style={goodStyles.runInfo}>RUN #{prestigeRunNumber}{stats ? ` · ${formatDuration(stats.runDurationMs)}` : ''}</Text>
              </View>

              {/* Hero */}
              <View style={{ alignItems: 'center', paddingTop: 36, paddingBottom: 24, paddingHorizontal: 24 }}>
                <View style={{ marginBottom: 20 }}>
                  <DeadOrbitGlobe />
                </View>
                <Text style={clStyles.eyebrow}>AI Autonomous · Resources Depleted</Text>
                <CollapseTitle text={t('endgame.collapse.title')} />
                <CollapseLogCard aiLevel={stats?.aiLevelReached ?? 0} />
              </View>

              {/* Stats */}
              {statsVisible && stats && (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                  <SectionLabel label="YOUR LEGACY" accent="#ff3d5a" />
                  <View style={goodStyles.cardGrid}>
                    <NodeStat icon="⛏" label="Blocks Mined" value={formatNumber(stats.blocksMined)} sub="+∞ by AI" variant="red" delay={200} />
                    <NodeStat icon="◈" label="CC Earned" value={formatNumber(stats.totalCryptoCoinsEarned)} sub="CryptoCoins" variant="purple" delay={350} />
                    <NodeStat icon="💰" label="Money Accumulated" value={`$${formatNumber(stats.totalMoneyEarned)}`} sub="Total Cash" variant="purple" delay={500} />
                    <NodeStat icon="⏱" label="Run Duration" value={formatDuration(stats.runDurationMs)} sub="Real time" variant="red" delay={650} smallValue />
                  </View>
                  <CollapseResourcesBar pct={stats.planetResourcesAtEnd} delay={650} />
                  <CollapseAILevelCard level={stats.aiLevelReached} delay={800} />
                </View>
              )}

              {/* Legacy Bonus */}
              {statsVisible && (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                  <View style={clStyles.bonusCard}>
                    <Svg width="100%" height={2} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                      <Defs>
                        <LinearGradient id="bonusCardTop" x1="0" y1="0" x2="1" y2="0">
                          <Stop offset="0%" stopColor="#c4002f" stopOpacity="1" />
                          <Stop offset="100%" stopColor="#a040ff" stopOpacity="1" />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="2" fill="url(#bonusCardTop)" />
                    </Svg>
                    <View style={clStyles.bonusTitleRow}>
                      <Text style={clStyles.bonusTitleText}>{t('endgame.collapse.bonusTitle')}</Text>
                      <View style={clStyles.bonusTitleLine} />
                    </View>
                    <Text style={clStyles.bonusRun}>Run #{prestigeRunNumber} · Accumulated rewards unlocked</Text>
                    <View style={clStyles.bonusQuoteBox}>
                      <Text style={clStyles.bonusQuote}>{t('endgame.collapse.narrative')}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={goodStyles.actions}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity style={clStyles.planetBtn} onPress={onPrestige} activeOpacity={0.85}>
                    <Text style={clStyles.planetBtnText}>🚀  {t('endgame.collapse.button')}</Text>
                  </TouchableOpacity>
                </Animated.View>
                <TouchableOpacity style={goodStyles.shareBtn} activeOpacity={0.8}>
                  <Text style={goodStyles.shareBtnText}>↗  SHARE YOUR LEGACY</Text>
                </TouchableOpacity>
              </View>

              {/* Debug back button */}
              {onClose && (
                <TouchableOpacity
                  onPress={onClose}
                  style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,61,90,0.4)', backgroundColor: 'rgba(255,61,90,0.08)', alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: '#ff3d5a', letterSpacing: 2 }}>← BACK TO GAME</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // ── Good ending ────────────────────────────────────────────────────
  return (
    <Modal transparent={false} animationType="none" visible={visible} onRequestClose={() => {}}>
      <View style={goodStyles.container}>

        {/* Grid + Aurora + Scanline + Particles */}
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

        {/* Confetti */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {CONFETTI_PIECES.map(p => (
            <ConfettiPiece key={p.id} x={p.x} color={p.color} duration={p.duration} delay={p.delay} w={p.w} h={p.h} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
          <ScrollView
            contentContainerStyle={[goodStyles.scrollContent, { paddingTop: 0 }]}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[0]}
          >
            {/* Topbar */}
            <View style={goodStyles.topbar}>
              <Text style={goodStyles.logo}>BLOCK<Text style={{ color: colors.nc }}>CHAIN</Text> TYCOON</Text>
              <Text style={goodStyles.runInfo}>RUN #{prestigeRunNumber}{stats ? ` · ${formatDuration(stats.runDurationMs)}` : ''}</Text>
            </View>

            {/* Hero */}
            <View style={goodStyles.heroSection}>
              <View style={goodStyles.globeWrap}>
                <OrbitGlobe />
              </View>
              <Text style={goodStyles.victorySub}>Mission Complete · Genesis Chain</Text>
              <GradientTitle text={t('endgame.good.title')} />
              <View style={goodStyles.quoteBox}>
                <Text style={goodStyles.quoteText}>{t('endgame.good.quote')}</Text>
              </View>
            </View>

            {/* Stats */}
            {statsVisible && stats && (
              <View style={goodStyles.section}>
                <SectionLabel label="YOUR LEGACY" />
                <View style={goodStyles.cardGrid}>
                  <NodeStat icon="⛏" label="Blocks Mined" value={`${formatNumber(stats.blocksMined)} ✓`} sub="100% Complete" variant="green" delay={200} checkBadge />
                  <NodeStat icon="◈" label="CC Earned" value={formatNumber(stats.totalCryptoCoinsEarned)} sub="CryptoCoins" variant="cyan" delay={350} />
                  <NodeStat icon="💰" label="Money Accumulated" value={`$${formatNumber(stats.totalMoneyEarned)}`} sub="Total Cash" variant="yellow" delay={500} />
                  <NodeStat icon="⏱" label="Run Duration" value={formatDuration(stats.runDurationMs)} sub="Real time" delay={650} smallValue />
                </View>
                <AILevelCard level={stats.aiLevelReached} delay={800} />
                <ResourcesBar pct={Math.round(stats.planetResourcesAtEnd)} />
              </View>
            )}

            {/* Bonus */}
            {statsVisible && (
              <View style={goodStyles.section}>
                <RNLinearGradient
                  colors={['rgba(0,229,255,0.05)', 'rgba(0,255,136,0.05)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={goodStyles.bonusCard}
                >
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
                  <View style={goodStyles.bonusTitleRow}>
                    <Text style={goodStyles.bonusTitleText}>{t('endgame.good.bonusTitle')}</Text>
                    <View style={goodStyles.bonusTitleLine} />
                  </View>
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
                </RNLinearGradient>
              </View>
            )}

            {/* Actions */}
            <View style={goodStyles.actions}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity style={goodStyles.startBtn} onPress={onPrestige} activeOpacity={0.85}>
                  <Text style={goodStyles.startBtnText}>↺  {t('endgame.good.button')}</Text>
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity style={goodStyles.shareBtn} activeOpacity={0.8}>
                <Text style={goodStyles.shareBtnText}>↗  SHARE YOUR LEGACY</Text>
              </TouchableOpacity>
            </View>

            {/* Debug back button */}
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,229,255,0.4)', backgroundColor: 'rgba(0,229,255,0.08)', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.nc, letterSpacing: 2 }}>← BACK TO GAME</Text>
              </TouchableOpacity>
            )}

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
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.08)', backgroundColor: 'rgba(2,8,16,0.95)' },
  logo: { fontFamily: fonts.orbitron, fontSize: 11, fontWeight: '900', letterSpacing: 2, color: colors.ng, textShadowColor: 'rgba(0,255,136,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 },
  runInfo: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 },
  heroSection: { alignItems: 'center', paddingTop: 50, paddingBottom: 32, paddingHorizontal: 24 },
  globeWrap: { marginBottom: 24 },
  victorySub: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 5, color: colors.nc, textTransform: 'uppercase', marginBottom: 20, opacity: 0.7 },
  quoteBox: { borderLeftWidth: 2, borderLeftColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.03)', borderTopRightRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 16, paddingVertical: 14, maxWidth: 320, marginTop: 16 },
  quoteText: { fontFamily: fonts.rajdhani, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, fontStyle: 'italic' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bonusCard: { borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' },
  bonusStar: { position: 'absolute', top: 16, right: 16, fontSize: 24 },
  bonusTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bonusTitleText: { fontFamily: fonts.orbitron, fontSize: 10, fontWeight: '700', letterSpacing: 3, color: colors.nc },
  bonusTitleLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,229,255,0.2)' },
  bonusRun: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 12 },
  bonusLine: { fontFamily: fonts.rajdhani, fontSize: 13, color: colors.ng, fontWeight: '600', marginBottom: 4 },
  bonusQuoteBox: { backgroundColor: 'rgba(0,229,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)', borderRadius: 8, padding: 12 },
  bonusQuote: { fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 21, fontStyle: 'italic' },
  actions: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, gap: 8 },
  startBtn: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: colors.ng, backgroundColor: 'rgba(0,255,136,0.08)', alignItems: 'center', justifyContent: 'center', shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 6 },
  startBtnText: { fontFamily: fonts.orbitron, fontSize: 14, fontWeight: '700', letterSpacing: 4, color: colors.ng, textTransform: 'uppercase' },
  shareBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { fontFamily: fonts.orbitron, fontSize: 11, fontWeight: '700', letterSpacing: 3, color: 'rgba(255,255,255,0.45)' },
});

export default EndingScreen;
