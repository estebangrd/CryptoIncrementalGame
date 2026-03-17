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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { EndingType, EndgameStats } from '../types/game';
import { calculateEndingBonus, calculateRenewableDiscount } from '../utils/endgameLogic';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

const { width: SW, height: SH } = Dimensions.get('window');

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

// ── Aurora blob ────────────────────────────────────────────────────
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
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width, height,
        top, bottom, left, right,
        borderRadius: width / 2,
        backgroundColor: color,
        transform: [{ translateX: tx }, { translateY: ty }],
        opacity: 0.18,
      }}
    />
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
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        width: w, height: h,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: ty }, { rotate: rot }],
      }}
    />
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
    Animated.loop(
      Animated.timing(spin1, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(spin2, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
    ).start();
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
      {/* Outer ring */}
      <Animated.View style={[orbitStyles.ring, orbitStyles.ring2, { transform: [{ rotate: rot2 }] }]}>
        <View style={[orbitStyles.dot, orbitStyles.dotCyan]} />
      </Animated.View>
      {/* Inner ring */}
      <Animated.View style={[orbitStyles.ring, orbitStyles.ring1, { transform: [{ rotate: rot1 }] }]}>
        <View style={orbitStyles.dot} />
      </Animated.View>
      {/* Globe */}
      <Animated.Text style={[orbitStyles.globe, { transform: [{ translateY: globeY }] }]}>🌍</Animated.Text>
    </View>
  );
};

const orbitStyles = StyleSheet.create({
  wrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    top: '50%', left: '50%',
  },
  ring1: {
    width: 140, height: 140,
    marginTop: -70, marginLeft: -70,
    borderColor: 'rgba(0,255,136,0.28)',
  },
  ring2: {
    width: 170, height: 170,
    marginTop: -85, marginLeft: -85,
    borderColor: 'rgba(0,229,255,0.18)',
  },
  dot: {
    position: 'absolute',
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: colors.ng,
    top: -3, left: '50%',
    marginLeft: -3,
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  dotCyan: { backgroundColor: colors.nc, shadowColor: colors.nc },
  globe: { fontSize: 72, position: 'absolute' },
});

// ── Stat card ──────────────────────────────────────────────────────
interface StatCardProps {
  icon: string; label: string; value: string; sub: string;
  variant?: 'green' | 'cyan' | 'yellow'; wide?: boolean;
  delay?: number;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, variant = 'green', wide, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, delay]);

  const ty = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const variantColor = variant === 'cyan' ? colors.nc : variant === 'yellow' ? '#ffd600' : colors.ng;
  const borderColor = variant === 'cyan' ? 'rgba(0,229,255,0.18)' : variant === 'yellow' ? 'rgba(255,214,0,0.2)' : 'rgba(0,255,136,0.18)';
  const bgColor = variant === 'cyan' ? 'rgba(0,229,255,0.04)' : variant === 'yellow' ? 'rgba(255,214,0,0.04)' : 'rgba(0,255,136,0.04)';
  const topBarColor = variant === 'cyan' ? colors.nc : variant === 'yellow' ? '#ffd600' : colors.ng;

  return (
    <Animated.View style={[
      cardStyles.card,
      { borderColor, backgroundColor: bgColor, opacity: slideAnim, transform: [{ translateY: ty }] },
      wide && cardStyles.wide,
    ]}>
      <View style={[cardStyles.topBar, { backgroundColor: topBarColor }]} />
      <Text style={cardStyles.icon}>{icon}</Text>
      <Text style={cardStyles.label}>{label}</Text>
      <Text style={[cardStyles.value, { color: variantColor, textShadowColor: variantColor }]}>{value}</Text>
      <Text style={cardStyles.sub}>{sub}</Text>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  wide: { width: '100%' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.6 },
  icon: { fontSize: 18, marginBottom: 6 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 8, letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', marginBottom: 4,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 20, fontWeight: '900',
    lineHeight: 22,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sub: { fontFamily: fonts.rajdhani, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
});

// ── Resources bar ──────────────────────────────────────────────────
const ResourcesBar: React.FC<{ pct: number }> = ({ pct }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct / 100,
      duration: 1800,
      delay: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [widthAnim, pct]);

  return (
    <View style={resStyles.card}>
      <View style={resStyles.topBar} />
      <View style={resStyles.row}>
        <View>
          <Text style={resStyles.label}>🌍  RESOURCES AT END</Text>
          <Text style={resStyles.caption}>Planet survived — sustainable run</Text>
        </View>
        <Text style={resStyles.pct}>{Math.round(pct)}%</Text>
      </View>
      <View style={resStyles.track}>
        <Animated.View style={[resStyles.fill, { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={resStyles.ends}>
        <Text style={resStyles.endLabel}>DEPLETED</Text>
        <Text style={resStyles.endLabel}>OPTIMAL</Text>
      </View>
    </View>
  );
};

const resStyles = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.18)',
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderRadius: 14, padding: 14, marginBottom: 8,
    position: 'relative', overflow: 'hidden',
  },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.ng, opacity: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  label: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 4 },
  caption: { fontFamily: fonts.mono, fontSize: 9, color: colors.ng, letterSpacing: 1 },
  pct: { fontFamily: fonts.display, fontSize: 22, fontWeight: '900', color: colors.ng, textShadowColor: 'rgba(0,255,136,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.ng, shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  endLabel: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
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
    <Animated.View style={[cardStyles.card, cardStyles.wide, {
      borderColor: 'rgba(0,229,255,0.18)',
      backgroundColor: 'rgba(0,229,255,0.04)',
      opacity: slideAnim, transform: [{ translateY: ty }],
    }]}>
      <View style={[cardStyles.topBar, { backgroundColor: colors.nc }]} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={cardStyles.icon}>🤖</Text>
          <Text style={cardStyles.label}>AI LEVEL REACHED</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={[cardStyles.value, { color: colors.nc, textShadowColor: colors.nc, fontSize: 16 }]}>
              Level {level}
            </Text>
            <Text style={{ fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(0,229,255,0.7)' }}>
              {AI_LEVEL_LABELS[level] ?? ''}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[cardStyles.label, { marginBottom: 6 }]}>PROGRESS</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => (
              <View key={i} style={[aiStyles.pip, i < level && aiStyles.pipActive]} >
                <Text style={[aiStyles.pipText, i < level && aiStyles.pipTextActive]}>
                  {i < level ? '✓' : String(i + 1)}
                </Text>
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

// ── Main component ─────────────────────────────────────────────────
const EndingScreen: React.FC<EndingScreenProps> = ({
  visible,
  endingType,
  stats,
  collapseCount,
  goodEndingCount,
  onPrestige,
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
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }).start(() => setStatsVisible(true));
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

  // ── Collapse ending (unchanged visual) ───────────────────────────
  if (isCollapse) {
    return (
      <Modal transparent={false} animationType="none" visible={visible} onRequestClose={() => {}}>
        <View style={[legacyStyles.container, legacyStyles.containerCollapse]}>
          <ScrollView
            contentContainerStyle={[legacyStyles.scrollContent, { paddingTop: insets.top }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
              <Text style={legacyStyles.icon}>🌍💀</Text>
              <Text style={[legacyStyles.title, legacyStyles.titleCollapse]}>
                {t('endgame.collapse.title')}
              </Text>
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
                <TouchableOpacity
                  style={[legacyStyles.prestigeButton, legacyStyles.buttonCollapse]}
                  onPress={onPrestige} activeOpacity={0.8}
                >
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

        {/* Aurora background */}
        <AuroraBlob width={500} height={400} top={-100} left={-100} color="rgba(0,255,136,0.18)" duration={8000} delay={0} />
        <AuroraBlob width={400} height={500} top={-80} right={-80} color="rgba(0,229,255,0.14)" duration={11000} delay={0} />
        <AuroraBlob width={600} height={300} bottom={100} left={-150} color="rgba(0,255,136,0.1)" duration={14000} delay={0} />

        {/* Confetti */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {CONFETTI_PIECES.map(p => (
            <ConfettiPiece key={p.id} x={p.x} color={p.color} duration={p.duration} delay={p.delay} w={p.w} h={p.h} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            contentContainerStyle={[goodStyles.scrollContent, { paddingTop: insets.top }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Topbar */}
            <View style={goodStyles.topbar}>
              <Text style={goodStyles.logo}>BLOCK<Text style={{ color: colors.nc }}>CHAIN</Text> TYCOON</Text>
              <Text style={goodStyles.runInfo}>
                RUN #{prestigeRunNumber}{stats ? ` · ${formatDuration(stats.runDurationMs)}` : ''}
              </Text>
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
                <View style={goodStyles.secLabelRow}>
                  <View style={goodStyles.secLine} />
                  <Text style={goodStyles.secLabel}>YOUR LEGACY</Text>
                  <View style={goodStyles.secLine} />
                </View>
                <View style={goodStyles.cardGrid}>
                  <StatCard icon="⛏" label="Blocks Mined" value={`${formatNumber(stats.blocksMined)} ✓`} sub="100% Complete" variant="green" delay={200} />
                  <StatCard icon="◈" label="CC Earned" value={formatNumber(stats.totalCryptoCoinsEarned)} sub="CryptoCoins" variant="cyan" delay={350} />
                  <StatCard icon="💰" label="Money Accumulated" value={`$${formatNumber(stats.totalMoneyEarned)}`} sub="Total Cash" variant="yellow" delay={500} />
                  <StatCard icon="⏱" label="Run Duration" value={formatDuration(stats.runDurationMs)} sub="Real time" delay={650} />
                </View>
                <AILevelCard level={stats.aiLevelReached} delay={800} />
                <ResourcesBar pct={Math.round(stats.planetResourcesAtEnd)} />
              </View>
            )}

            {/* Bonus */}
            {statsVisible && (
              <View style={goodStyles.section}>
                <View style={goodStyles.bonusCard}>
                  <View style={goodStyles.bonusCardTopBar} />
                  <Text style={goodStyles.bonusStar}>⭐</Text>
                  <Text style={goodStyles.bonusTitle}>{t('endgame.good.bonusTitle')}</Text>
                  <Text style={goodStyles.bonusRun}>
                    Run #{prestigeRunNumber} · Accumulated rewards unlocked
                  </Text>
                  {collapseProductionPct > 0 && (
                    <Text style={goodStyles.bonusLine}>
                      {t('endgame.bonus.production').replace('{{pct}}', String(collapseProductionPct))}
                    </Text>
                  )}
                  {renewableDiscountPct > 0 && (
                    <Text style={goodStyles.bonusLine}>
                      {t('endgame.bonus.renewable').replace('{{pct}}', String(renewableDiscountPct))}
                    </Text>
                  )}
                  <View style={goodStyles.bonusQuoteBox}>
                    <Text style={goodStyles.bonusQuote}>{t('endgame.good.narrative')}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
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
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.08)',
    backgroundColor: 'rgba(2,8,16,0.95)',
  },
  logo: { fontFamily: fonts.display, fontSize: 11, fontWeight: '900', letterSpacing: 2, color: colors.ng, textShadowColor: 'rgba(0,255,136,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  runInfo: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 },
  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  victorySub: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 4, color: colors.nc, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, opacity: 0.75 },
  victoryTitle: { fontFamily: fonts.display, fontSize: 24, fontWeight: '900', letterSpacing: 3, color: colors.ng, textShadowColor: 'rgba(0,255,136,0.45)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16, textTransform: 'uppercase', textAlign: 'center', lineHeight: 30, marginBottom: 16 },
  quoteBox: { borderLeftWidth: 2, borderLeftColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.03)', borderRadius: 0, borderTopRightRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 14, paddingVertical: 12, maxWidth: 320 },
  quoteText: { fontFamily: fonts.rajdhani, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, fontStyle: 'italic' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  secLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  secLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,255,136,0.2)' },
  secLabel: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bonusCard: { borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', backgroundColor: 'rgba(0,229,255,0.04)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' },
  bonusCardTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.nc },
  bonusStar: { position: 'absolute', top: 16, right: 16, fontSize: 24 },
  bonusTitle: { fontFamily: fonts.display, fontSize: 10, fontWeight: '700', letterSpacing: 3, color: colors.nc, marginBottom: 6, marginTop: 2 },
  bonusRun: { fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 10 },
  bonusLine: { fontFamily: fonts.rajdhani, fontSize: 13, color: colors.ng, fontWeight: '600', marginBottom: 4 },
  bonusQuoteBox: { backgroundColor: 'rgba(0,229,255,0.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)', borderRadius: 8, padding: 12 },
  bonusQuote: { fontFamily: fonts.rajdhani, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20, fontStyle: 'italic' },
  actions: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  startBtn: {
    padding: 18, borderRadius: 14,
    borderWidth: 1, borderColor: colors.ng,
    backgroundColor: 'rgba(0,255,136,0.08)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ng, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  startBtnText: { fontFamily: fonts.display, fontSize: 14, fontWeight: '700', letterSpacing: 4, color: colors.ng, textTransform: 'uppercase' },
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
