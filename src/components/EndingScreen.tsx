/**
 * EndingScreen — Fullscreen ending screen for Collapse and Good Ending (Phase 7).
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
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { EndingType, EndgameStats } from '../types/game';
import { calculateEndingBonus, calculateRenewableDiscount } from '../utils/endgameLogic';
import { formatNumber } from '../utils/gameLogic';

interface EndingScreenProps {
  visible: boolean;
  endingType: EndingType;
  stats: EndgameStats | null;
  collapseCount: number;
  goodEndingCount: number;
  onPrestige: () => void;
}

const AI_LEVEL_LABELS: Record<number, string> = {
  0: '0 (None)',
  1: '1 (Assistant)',
  2: '2 (Copilot)',
  3: '3 (Autonomous)',
};

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const EndingScreen: React.FC<EndingScreenProps> = ({
  visible,
  endingType,
  stats,
  collapseCount,
  goodEndingCount,
  onPrestige,
}) => {
  const { t } = useGame();
  const isCollapse = endingType === 'collapse';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [statsVisible, setStatsVisible] = useState(false);
  const [narrativeVisible, setNarrativeVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setStatsVisible(false);
      setNarrativeVisible(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setStatsVisible(true);
        // Narrative text appears 2s after stats
        setTimeout(() => setNarrativeVisible(true), 2000);
      });
      // Pulse button
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.85, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
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
  const prestigeRunNumber = collapseCount + goodEndingCount;

  return (
    <Modal
      transparent={false}
      animationType="none"
      visible={visible}
      onRequestClose={() => {}} // intentionally no-op — not dismissible
    >
      <Animated.View
        style={[
          styles.container,
          isCollapse ? styles.containerCollapse : styles.containerGood,
          { opacity: fadeAnim },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.icon}>{isCollapse ? '🌍💀' : '🌍✅'}</Text>
          <Text style={[styles.title, isCollapse ? styles.titleCollapse : styles.titleGood]}>
            {t(isCollapse ? 'endgame.collapse.title' : 'endgame.good.title')}
          </Text>

          {/* Quote */}
          <Text style={styles.quote}>
            {t(isCollapse ? 'endgame.collapse.quote' : 'endgame.good.quote')}
          </Text>

          {/* Stats section */}
          {statsVisible && stats && (
            <View style={styles.section}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>{t('endgame.stats.title')}</Text>
              <View style={styles.sectionDivider} />

              <View style={styles.statRow}>
                <Text style={styles.statIcon}>⛏️</Text>
                <Text style={styles.statLabel}>{t('endgame.stats.blocksMined')}:</Text>
                <Text style={styles.statValue}>
                  {formatNumber(stats.blocksMined)}
                  {!isCollapse ? ' ✓' : ''}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statLabel}>{t('endgame.stats.coinsEarned')}:</Text>
                <Text style={styles.statValue}>{formatNumber(stats.totalCryptoCoinsEarned)}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statIcon}>💵</Text>
                <Text style={styles.statLabel}>{t('endgame.stats.moneyEarned')}:</Text>
                <Text style={styles.statValue}>${formatNumber(stats.totalMoneyEarned)}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statIcon}>🌍</Text>
                <Text style={styles.statLabel}>{t('endgame.stats.resourcesAtEnd')}:</Text>
                <Text style={[styles.statValue, isCollapse ? styles.statValueRed : styles.statValueGreen]}>
                  {isCollapse ? '0%' : `${Math.round(stats.planetResourcesAtEnd)}%`}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statIcon}>🤖</Text>
                <Text style={styles.statLabel}>{t('endgame.stats.aiLevel')}:</Text>
                <Text style={styles.statValue}>{AI_LEVEL_LABELS[stats.aiLevelReached] ?? stats.aiLevelReached}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statLabel}>{t('endgame.stats.duration')}:</Text>
                <Text style={styles.statValue}>{formatDuration(stats.runDurationMs)}</Text>
              </View>
            </View>
          )}

          {/* Bonus section */}
          {statsVisible && (
            <View style={styles.section}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>
                {t(isCollapse ? 'endgame.collapse.bonusTitle' : 'endgame.good.bonusTitle')}
              </Text>
              <View style={styles.sectionDivider} />

              {collapseProductionPct > 0 && (
                <Text style={styles.bonusText}>
                  +{collapseProductionPct}% {isCollapse ? 'producción permanente' : 'producción permanente'}
                </Text>
              )}
              {!isCollapse && renewableDiscountPct > 0 && (
                <Text style={styles.bonusText}>
                  -{renewableDiscountPct}% costo de energía renovable
                </Text>
              )}
              <Text style={styles.bonusSubtext}>
                (run #{prestigeRunNumber} — acumulado)
              </Text>
            </View>
          )}

          {/* Narrative text — appears after 2s delay */}
          {narrativeVisible && (
            <View style={styles.narrativeBox}>
              <View style={styles.narrativeDivider} />
              <Text style={styles.narrativeText}>
                {t(isCollapse ? 'endgame.collapse.narrative' : 'endgame.good.narrative')}
              </Text>
              <View style={styles.narrativeDivider} />
            </View>
          )}

          {/* Prestige button */}
          <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[styles.prestigeButton, isCollapse ? styles.buttonCollapse : styles.buttonGood]}
              onPress={onPrestige}
              activeOpacity={0.8}
            >
              <Text style={styles.prestigeButtonText}>
                {t(isCollapse ? 'endgame.collapse.button' : 'endgame.good.button')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  containerCollapse: {
    backgroundColor: '#0d0505',
  },
  containerGood: {
    backgroundColor: '#050d05',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  titleCollapse: {
    color: '#ff4444',
  },
  titleGood: {
    color: '#00ff88',
  },
  quote: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  statIcon: {
    fontSize: 16,
    width: 28,
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    color: '#888',
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#cccccc',
    textAlign: 'right',
  },
  statValueRed: {
    color: '#ff4444',
  },
  statValueGreen: {
    color: '#00ff88',
  },
  bonusText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  bonusSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  narrativeBox: {
    width: '100%',
    marginBottom: 24,
  },
  narrativeDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 10,
  },
  narrativeText: {
    fontSize: 13,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 21,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 8,
  },
  prestigeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonCollapse: {
    backgroundColor: '#1a0505',
    borderColor: '#ff4444',
  },
  buttonGood: {
    backgroundColor: '#051a05',
    borderColor: '#00ff88',
  },
  prestigeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default EndingScreen;
