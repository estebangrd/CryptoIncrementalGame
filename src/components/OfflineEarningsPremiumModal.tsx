import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';
import { PendingPremiumOfflineData } from '../types/game';

interface Props {
  visible: boolean;
  data: PendingPremiumOfflineData | null;
  t: (key: string) => string;
  onDismiss: () => void;
}

const GOLD = '#ffd600';
const GOLD_DIM = 'rgba(255,214,0,0.55)';

const formatDuration = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

/**
 * Parse inline color tags (<gold>, <acc>, <neg>) into Text elements.
 */
const renderColoredText = (raw: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const regex = /<(gold|acc|neg)>(.*?)<\/\1>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push(raw.slice(lastIndex, match.index));
    }
    const tag = match[1];
    const content = match[2];
    const color = tag === 'gold' ? GOLD : tag === 'acc' ? colors.ng : colors.nr;
    parts.push(
      <Text key={match.index} style={{ color }}>{content}</Text>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) {
    parts.push(raw.slice(lastIndex));
  }
  return parts;
};

const OfflineEarningsPremiumModal: React.FC<Props> = ({
  visible,
  data,
  t,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Count-up for net value
  const [displayedNet, setDisplayedNet] = React.useState('0');

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [visible, fadeAnim, dotAnim, shimmerAnim]);

  // Count-up animation for net CC value
  useEffect(() => {
    if (!visible || !data || data.netCoins <= 0) return;
    const duration = 900;
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayedNet(formatNumber(data.netCoins * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, data]);

  if (!data) return null;

  // Booster remaining time
  const now = Date.now();
  const boosterTotalMs = data.boosterExpiresAt - data.boosterActivatedAt;
  const boosterRemainingMs = Math.max(0, data.boosterExpiresAt - now);
  const boosterPct = boosterTotalMs > 0 ? (boosterRemainingMs / boosterTotalMs) * 100 : 0;
  const boosterRemainingLabel = data.boosterExpired
    ? t('offlinePremium.expired')
    : `~${formatDuration(boosterRemainingMs / 1000)}`;

  // Log lines with placeholders replaced
  const feeFormatted = formatNumber(data.feeCoins);
  const netFormatted = formatNumber(data.netCoins);
  const blocksFormatted = data.blocksProcessed.toLocaleString();

  const logLines = [
    t('offlinePremium.logLine1'),
    t('offlinePremium.logLine2').replace('{blocks}', blocksFormatted),
    t('offlinePremium.logLine3').replace('{fee}', feeFormatted),
    t('offlinePremium.logLine4').replace('{net}', netFormatted),
  ];

  // Timestamps for log lines
  const baseTime = new Date(now - data.secondsAway * 1000);
  const makeTs = (fraction: number): string => {
    const d = new Date(baseTime.getTime() + data.secondsAway * fraction * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
  };
  const timestamps = [makeTs(0.02), makeTs(0.35), makeTs(0.70), makeTs(0.98)];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim, paddingTop: insets.top }]}>
        {/* Gold grid background */}
        <View style={styles.gridBg} />
        <View style={styles.radialGlow} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>
            BLOCK<Text style={styles.logoChain}>CHAIN</Text> TYCOON
          </Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Miner Status Header */}
          <View style={styles.minerHeader}>
            <View style={styles.minerHeaderTopLine} />
            <View style={styles.mhTop}>
              <View style={styles.mhIcon}>
                <Text style={styles.mhIconText}>⚡</Text>
              </View>
              <View>
                <Text style={styles.mhBadge}>{t('offlinePremium.iapActive')}</Text>
                <Text style={styles.mhTitle}>{t('offlinePremium.title')}</Text>
              </View>
            </View>
            <View style={styles.boosterBarWrap}>
              <View style={styles.boosterBarLabels}>
                <Text style={styles.bblLeft}>
                  {data.boosterExpired ? t('offlinePremium.expired') : t('offlinePremium.timeRemaining')}
                </Text>
                <Text style={[styles.bblRight, data.boosterExpired && styles.bblExpired]}>
                  {boosterRemainingLabel}
                </Text>
              </View>
              <View style={styles.boosterBar}>
                <View style={[styles.boosterFill, { width: `${boosterPct}%` }]} />
              </View>
            </View>
          </View>

          {/* Time Away */}
          <View style={styles.timeAway}>
            <Text style={styles.taIcon}>⏱</Text>
            <Text style={styles.taText}>{t('offlinePremium.timeAway')}</Text>
            <Text style={styles.taTime}>{formatDuration(data.secondsAway)}</Text>
          </View>

          {/* Narrative Log */}
          <View style={styles.narrativeCard}>
            <View style={styles.narrativeTopLine} />
            <View style={styles.logHeader}>
              <Animated.View style={[styles.logDot, { opacity: dotAnim }]} />
              <Text style={styles.logSource}>{t('offlinePremium.logSource')}</Text>
            </View>
            <View style={styles.logLines}>
              {logLines.map((line, i) => (
                <Text key={i} style={styles.logLine}>
                  <Text style={styles.logTs}>{timestamps[i]}</Text>
                  {'  '}{renderColoredText(line)}
                </Text>
              ))}
            </View>
          </View>

          {/* Earnings Breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownTopLine} />
            <Text style={styles.bcLabel}>{t('offlinePremium.breakdownLabel')}</Text>
            <View style={styles.bcRows}>
              <View style={styles.bcRow}>
                <Text style={styles.bcRowLabel}>{t('offlinePremium.grossLabel')}</Text>
                <Text style={[styles.bcRowVal, styles.bcRowPos]}>+{formatNumber(data.grossCoins)} CC</Text>
              </View>
              <View style={styles.bcRow}>
                <Text style={styles.bcRowLabel}>{t('offlinePremium.feeLabel')}</Text>
                <Text style={[styles.bcRowVal, styles.bcRowNeg]}>−{formatNumber(data.feeCoins)} CC</Text>
              </View>
            </View>
            <View style={styles.bcDivider} />
            <View style={styles.bcNetRow}>
              <Text style={styles.bcNetLabel}>{t('offlinePremium.netLabel')}</Text>
              <View style={styles.bcNetValWrap}>
                <Text style={styles.bcNetVal}>{displayedNet}</Text>
                <Text style={styles.bcNetUnit}>CC</Text>
              </View>
            </View>
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>✓  {t('offlinePremium.autoCredited')}</Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer]} pointerEvents="none" />
            <Text style={styles.continueBtnText}>{t('offlinePremium.continueButton')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
    // gold grid via border trick — approximated with background color
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  radialGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,214,0,0.03)',
    opacity: 0.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,214,0,0.12)',
    backgroundColor: 'rgba(2,8,16,0.97)',
  },
  logo: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 12,
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
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 14,
  },

  // ── Miner Status Header ──
  minerHeader: {
    backgroundColor: 'rgba(255,214,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.28)',
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  minerHeaderTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GOLD,
    opacity: 0.6,
  },
  mhTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  mhIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,214,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mhIconText: {
    fontSize: 20,
  },
  mhBadge: {
    fontFamily: fonts.mono,
    fontSize: 7,
    letterSpacing: 3,
    color: GOLD_DIM,
    marginBottom: 3,
  },
  mhTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: GOLD,
  },
  boosterBarWrap: {
    gap: 5,
  },
  boosterBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bblLeft: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.dim,
  },
  bblRight: {
    fontFamily: fonts.orbitron,
    fontSize: 10,
    color: GOLD,
  },
  bblExpired: {
    color: colors.nr,
  },
  boosterBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  boosterFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // ── Time Away ──
  timeAway: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
  },
  taIcon: {
    fontSize: 16,
  },
  taText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
    letterSpacing: 2,
  },
  taTime: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    color: '#fff',
  },

  // ── Narrative Log ──
  narrativeCard: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  narrativeTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GOLD,
    opacity: 0.4,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  logDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  logSource: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(255,214,0,0.5)',
    textTransform: 'uppercase',
  },
  logLines: {
    gap: 5,
  },
  logLine: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  logTs: {
    color: 'rgba(255,214,0,0.28)',
  },

  // ── Earnings Breakdown ──
  breakdownCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
    borderRadius: 16,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  breakdownTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.ng,
  },
  bcLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 4,
    color: colors.dim,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  bcRows: {
    gap: 8,
    marginBottom: 14,
  },
  bcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  bcRowLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.dim,
  },
  bcRowVal: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
  },
  bcRowPos: {
    color: colors.ng,
  },
  bcRowNeg: {
    color: colors.nr,
  },
  bcDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 2,
  },
  bcNetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 2,
  },
  bcNetLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(0,255,136,0.6)',
  },
  bcNetValWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bcNetVal: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 24,
    color: colors.ng,
    textShadowColor: 'rgba(0,255,136,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  bcNetUnit: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: 'rgba(0,255,136,0.5)',
    letterSpacing: 2,
    marginLeft: 4,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,214,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.18)',
    borderRadius: 8,
  },
  autoBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: 'rgba(255,214,0,0.6)',
    letterSpacing: 1,
  },

  // ── Continue Button ──
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.45)',
    backgroundColor: 'rgba(255,214,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  shimmer: {
    backgroundColor: 'rgba(255,214,0,0.04)',
  },
  continueBtnText: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: GOLD,
    letterSpacing: 3,
  },
});

export default OfflineEarningsPremiumModal;
