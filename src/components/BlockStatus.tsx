import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { GameState } from '../types/game';
import { formatBlockInfo } from '../utils/blockLogic';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

const CLICK_WINDOW_MS = 1000;

interface BlockStatusProps {
  gameState: GameState;
  onMineBlock: () => void;
  t: (key: string) => string;
}

// ── Section Header ─────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <View style={hdrStyles.row}>
    <Text style={hdrStyles.text}>{label}</Text>
    <View style={hdrStyles.line} />
  </View>
);

const hdrStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,255,136,0.2)',
  },
});

// ── NodeStat Card ──────────────────────────────────────────────────
interface NodeStatProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  variant?: 'green' | 'cyan' | 'red' | 'yellow';
}

const NodeStat: React.FC<NodeStatProps> = ({ icon, label, value, sub, variant = 'green' }) => {
  const cardStyle = variant === 'cyan' ? statStyles.cardCyan
    : variant === 'red' ? statStyles.cardRed
    : variant === 'yellow' ? statStyles.cardYellow
    : statStyles.card;
  const valStyle = variant === 'cyan' ? statStyles.valCyan
    : variant === 'red' ? statStyles.valRed
    : variant === 'yellow' ? statStyles.valYellow
    : statStyles.valGreen;
  return (
    <View style={[statStyles.card, cardStyle]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, valStyle]}>{value}</Text>
      {sub && <Text style={statStyles.sub}>{sub}</Text>}
    </View>
  );
};

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.22)',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardCyan: {
    backgroundColor: 'rgba(0,229,255,0.04)',
    borderColor: 'rgba(0,229,255,0.18)',
  },
  cardRed: {
    backgroundColor: 'rgba(255,61,90,0.04)',
    borderColor: 'rgba(255,61,90,0.22)',
  },
  cardYellow: {
    backgroundColor: 'rgba(255,214,0,0.04)',
    borderColor: 'rgba(255,214,0,0.22)',
  },
  icon: {
    fontSize: 19,
    marginBottom: 5,
    color: 'rgba(255,255,255,0.7)',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: {
    fontFamily: fonts.orbitron,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  valGreen: {
    color: colors.ng,
    textShadowColor: 'rgba(0,255,136,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  valCyan: {
    color: colors.nc,
    textShadowColor: 'rgba(0,229,255,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  valRed: {
    color: colors.nr,
    textShadowColor: 'rgba(255,61,90,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  valYellow: {
    color: colors.ny,
    textShadowColor: 'rgba(255,214,0,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  sub: {
    fontFamily: fonts.rajdhani,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
});

// ── BlockStatus ────────────────────────────────────────────────────
export const BlockStatus: React.FC<BlockStatusProps> = ({ gameState, onMineBlock, t: _t }) => {
  const blockInfo = formatBlockInfo(gameState);
  const [clickBoost, setClickBoost] = useState(0);
  const clickTimestamps = useRef<number[]>([]);
  const boostPerClickRef = useRef(10);
  const decayInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-300)).current;
  const hammerAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    return () => {
      if (decayInterval.current) clearInterval(decayInterval.current);
    };
  }, []);

  useEffect(() => {
    if (isComplete) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: -300, duration: 0, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 500, duration: 3000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isComplete, shimmerAnim]);

  useEffect(() => {
    if (isComplete) return;
    const swing = Animated.loop(
      Animated.sequence([
        Animated.timing(hammerAnim, { toValue: 10, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(hammerAnim, { toValue: -10, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    swing.start();
    return () => swing.stop();
  }, [isComplete, hammerAnim]);

  const handleMineClick = useCallback(() => {
    const clickMultiplier = gameState.upgrades
      .filter(u => u.purchased && u.effect.type === 'clickPower')
      .reduce((acc: number, u) => acc * u.effect.value, 1);
    boostPerClickRef.current = Math.max(10, blockInfo.currentReward * clickMultiplier * 10);

    const now = Date.now();
    clickTimestamps.current.push(now);
    setClickBoost(clickTimestamps.current.length * boostPerClickRef.current);

    if (!decayInterval.current) {
      decayInterval.current = setInterval(() => {
        const t2 = Date.now();
        clickTimestamps.current = clickTimestamps.current.filter(ts => t2 - ts < CLICK_WINDOW_MS);

        if (clickTimestamps.current.length === 0) {
          setClickBoost(0);
          clearInterval(decayInterval.current!);
          decayInterval.current = null;
        } else {
          setClickBoost(clickTimestamps.current.length * boostPerClickRef.current);
        }
      }, 100);
    }

    // Scale button down then back up
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    // Full-screen flash overlay
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();

    onMineBlock();
  }, [gameState.upgrades, blockInfo.currentReward, onMineBlock, scaleAnim, flashAnim]);

  const displayHashRate = blockInfo.totalHashRate + clickBoost;
  const hasClickBoost = clickBoost > 0;
  const isComplete = blockInfo.blocksMined >= blockInfo.totalBlocks;
  const progressPct = blockInfo.phaseProgress;

  const hasElectricity = gameState.totalElectricityCost > 0;
  const netProduction = gameState.cryptoCoinsPerSecond - gameState.totalElectricityCost;

  return (
    <View style={styles.wrapper}>
    <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── NODE STATUS ── */}
      <SectionHeader label="Node Status" />

      {/* Row 1: Cash Balance + Total Earned */}
      <View style={styles.statRow}>
        <NodeStat
          icon="💰"
          label="Cash Balance"
          value={`$${formatNumber(gameState.realMoney)}`}
          sub="Available"
          variant="yellow"
        />
        <NodeStat
          icon="💵"
          label="Total Earned"
          value={`$${formatNumber(gameState.totalRealMoneyEarned)}`}
          sub="All time"
          variant="yellow"
        />
      </View>

      {/* Row 2: Hash Rate + Blocks Mined */}
      <View style={styles.statRow}>
        <NodeStat
          icon="🖥"
          label="Hash Rate"
          value={formatNumber(displayHashRate)}
          sub={hasClickBoost ? `+${formatNumber(clickBoost)} click` : 'H/s — Active'}
          variant={hasClickBoost ? 'green' : 'cyan'}
        />
        <NodeStat
          icon="🏦"
          label="Blocks Mined"
          value={formatNumber(gameState.blocksMined)}
          sub="all time"
          variant="cyan"
        />
      </View>

      {/* Row 3: Net Income + Net Power */}
      <View style={styles.statRow}>
        <NodeStat
          icon="◈"
          label="Net Income"
          value={`+${formatNumber(hasElectricity ? netProduction : gameState.cryptoCoinsPerSecond)}`}
          sub="CC/sec"
          variant="green"
        />
        <NodeStat
          icon="🔌"
          label="Net Power"
          value={hasElectricity ? `-${formatNumber(gameState.totalElectricityCost)}` : '0'}
          sub="units/sec"
          variant={hasElectricity ? 'red' : 'cyan'}
        />
      </View>

      {/* ── CURRENT PHASE ── */}
      <SectionHeader label="Current Phase" />

      {/* Phase Card */}
      <View style={styles.phaseCard}>
        <View style={styles.phaseRow}>
          <View>
            <Text style={styles.phaseSublabel}>ACTIVE CHAIN</Text>
            <Text style={styles.phaseTitle}>⬡ GENESIS</Text>
          </View>
          <View style={styles.phaseCountGroup}>
            <Text style={styles.phaseCountValue}>{formatNumber(blockInfo.blocksMined)}</Text>
            <Text style={styles.phaseCountSub}>/ {formatNumber(blockInfo.totalBlocks)} blocks</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
        </View>
        <View style={styles.phaseStats}>
          <View style={styles.phaseStat}>
            <Text style={styles.phaseStatLabel}>Reward</Text>
            <Text style={[styles.phaseStatValue, { color: colors.ny }]}>{formatNumber(blockInfo.currentReward)}</Text>
          </View>
          <View style={styles.phaseStat}>
            <Text style={styles.phaseStatLabel}>Hash Rate</Text>
            <Text style={[styles.phaseStatValue, { color: colors.nc }]}>{formatNumber(displayHashRate)}</Text>
          </View>
          <View style={styles.phaseStat}>
            <Text style={styles.phaseStatLabel}>Halving At</Text>
            <Text style={[styles.phaseStatValue, { color: colors.nr }]}>{formatNumber(blockInfo.blocksUntilHalving)}</Text>
          </View>
        </View>
      </View>

      {/* Mine Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.mineButton, isComplete && styles.mineButtonDone]}
          onPress={handleMineClick}
          disabled={isComplete}
          activeOpacity={0.85}
        >
          <Animated.View
            style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]}
            pointerEvents="none"
          >
            <Svg width={300} height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="shimmerGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#00ff88" stopOpacity="0" />
                  <Stop offset="40%" stopColor="#00ff88" stopOpacity="0.12" />
                  <Stop offset="60%" stopColor="#00ff88" stopOpacity="0.12" />
                  <Stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="300" height="100%" fill="url(#shimmerGrad)" />
            </Svg>
          </Animated.View>
          <Animated.Text style={[styles.mineHammer, { transform: [{ rotate: hammerAnim.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }] }]}>⛏</Animated.Text>
          <Text style={[styles.mineButtonText, isComplete && styles.mineButtonTextDone]}>
            {isComplete ? 'Phase Complete' : 'Mine Block'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,255,136,0.07)',
    zIndex: 10,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 12,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  // ── Phase Card ──
  phaseCard: {
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.22)',
    borderRadius: 12,
    padding: 14,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  phaseSublabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 3,
  },
  phaseTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    fontWeight: '700',
    color: colors.ng,
    letterSpacing: 2,
  },
  phaseCountGroup: {
    alignItems: 'flex-end',
  },
  phaseCountValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.nc,
    fontWeight: 'bold',
  },
  phaseCountSub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.ng,
    borderRadius: 3,
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  phaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseStat: {
    flex: 1,
    alignItems: 'center',
  },
  phaseStatLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  phaseStatValue: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  blockTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  blockTimeLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
  },
  blockTimeValue: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  // ── Mine Button ──
  mineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,255,136,0.06)',
    borderWidth: 1,
    borderColor: colors.ng,
    borderRadius: 13,
    paddingVertical: 16,
    overflow: 'hidden',
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 300,
  },
  mineButtonDone: {
    borderColor: colors.dim,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
  },
  mineHammer: {
    fontSize: 18,
    color: colors.dim,
  },
  mineButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ng,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  mineButtonTextDone: {
    color: colors.dim,
  },
});
