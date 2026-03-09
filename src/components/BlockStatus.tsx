import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GameState } from '../types/game';
import { formatBlockInfo, calculateBlockTime } from '../utils/blockLogic';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

const CLICK_WINDOW_MS = 1000;

interface BlockStatusProps {
  gameState: GameState;
  onMineBlock: () => void;
  t: (key: string) => string;
}

export const BlockStatus: React.FC<BlockStatusProps> = ({ gameState, onMineBlock, t: _t }) => {
  const blockInfo = formatBlockInfo(gameState);
  const blockTime = calculateBlockTime(gameState.difficulty, gameState.totalHashRate);
  const [clickBoost, setClickBoost] = useState(0);
  const clickTimestamps = useRef<number[]>([]);
  const boostPerClickRef = useRef(10);
  const decayInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (decayInterval.current) clearInterval(decayInterval.current);
    };
  }, []);

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

    onMineBlock();
  }, [gameState.upgrades, blockInfo.currentReward, onMineBlock]);

  const displayHashRate = blockInfo.totalHashRate + clickBoost;
  const hasClickBoost = clickBoost > 0;
  const isComplete = blockInfo.blocksMined >= blockInfo.totalBlocks;
  const progressPct = blockInfo.phaseProgress;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Phase Card */}
      <View style={styles.phaseCard}>
        <View style={styles.phaseRow}>
          <Text style={styles.phaseTitle}>Phase 1: Genesis</Text>
          <Text style={styles.phaseBlocks}>
            {formatNumber(blockInfo.blocksMined)} / {formatNumber(blockInfo.totalBlocks)}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{progressPct.toFixed(1)}% complete</Text>
      </View>

      {/* Stat Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>REWARD</Text>
          <Text style={styles.statCardValue}>{formatNumber(blockInfo.currentReward)}</Text>
          <Text style={styles.statCardSub}>CC / block</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCyan]}>
          <Text style={[styles.statCardLabel, styles.labelCyan]}>HASH RATE</Text>
          <Text style={[styles.statCardValue, hasClickBoost && styles.valueBoosted]}>
            {formatNumber(displayHashRate)}
          </Text>
          <Text style={styles.statCardSub}>
            {hasClickBoost ? `+${formatNumber(clickBoost)} click` : 'H/s'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>NEXT HALVING</Text>
          <Text style={styles.statCardValue}>{formatNumber(blockInfo.blocksUntilHalving)}</Text>
          <Text style={styles.statCardSub}>blocks</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCyan]}>
          <Text style={[styles.statCardLabel, styles.labelCyan]}>BLOCK TIME</Text>
          <Text style={styles.statCardValue}>{blockTime.toFixed(1)}s</Text>
          <Text style={styles.statCardSub}>avg</Text>
        </View>
      </View>

      {/* Mine Button */}
      <TouchableOpacity
        style={[styles.mineButton, isComplete && styles.mineButtonDone]}
        onPress={handleMineClick}
        disabled={isComplete}
        activeOpacity={0.75}
      >
        <Text style={[styles.mineButtonText, isComplete && styles.mineButtonTextDone]}>
          {isComplete ? '✓ Phase Complete' : '⛏ Mine Block'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 12,
    gap: 10,
  },
  phaseCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: colors.ng,
    fontWeight: 'bold',
  },
  phaseBlocks: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
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
  progressLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statCardCyan: {
    backgroundColor: colors.card2,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  statCardLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 10,
    color: colors.ng,
    letterSpacing: 1,
    marginBottom: 4,
  },
  labelCyan: {
    color: colors.nc,
  },
  statCardValue: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: '#fff',
    marginBottom: 2,
  },
  valueBoosted: {
    color: colors.ng,
  },
  statCardSub: {
    fontFamily: fonts.rajdhani,
    fontSize: 10,
    color: colors.dim,
  },
  mineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.ng,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mineButtonDone: {
    borderColor: colors.dim,
    shadowOpacity: 0,
  },
  mineButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.ng,
    letterSpacing: 1,
  },
  mineButtonTextDone: {
    color: colors.dim,
  },
});
