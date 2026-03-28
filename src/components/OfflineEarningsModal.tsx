import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNumber } from '../utils/gameLogic';
import { showRewardedAd, isRewardedAdReady } from '../services/AdMobService';
import { OFFLINE_SCREEN_CONFIG } from '../config/balanceConfig';
import { colors, fonts } from '../config/theme';

interface OfflineEarningsModalProps {
  visible: boolean;
  pendingEarnings: number;
  secondsAway: number;
  wasCapped: boolean;
  blocksProcessed: number;
  removeAdsPurchased: boolean;
  t: (key: string) => string;
  onClaim: (amount: number) => void;
  onDismiss: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const formatDuration = (totalSec: number): string => {
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const pad2 = (n: number) => n.toString().padStart(2, '0');

const formatLogTimestamp = (secondsAway: number, fraction: number): string => {
  const eventTime = new Date(Date.now() - (secondsAway * 1000) + (secondsAway * fraction * 1000));
  return `[${pad2(eventTime.getHours())}:${pad2(eventTime.getMinutes())}:${pad2(eventTime.getSeconds())}]`;
};

const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  visible,
  pendingEarnings,
  secondsAway,
  wasCapped,
  blocksProcessed,
  removeAdsPurchased,
  t,
  onClaim,
  onDismiss,
  showToast,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;
  const [claiming, setClaiming] = React.useState(false);

  useEffect(() => {
    if (!visible) return;
    setClaiming(false);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }, [visible, fadeAnim, shimmerAnim, dotAnim]);

  const handleWatchAd = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);

    const pct = OFFLINE_SCREEN_CONFIG.REWARD_MIN_PCT +
      Math.floor(Math.random() * (OFFLINE_SCREEN_CONFIG.REWARD_MAX_PCT - OFFLINE_SCREEN_CONFIG.REWARD_MIN_PCT + 1));
    const claimAmount = Math.round(pendingEarnings * pct / 100);

    const grantReward = () => {
      onClaim(claimAmount);
      const toastMsg = t('offline.toast').replace('{amount}', formatNumber(claimAmount));
      showToast(toastMsg, 'success');
    };

    if (removeAdsPurchased || !isRewardedAdReady()) {
      grantReward();
      return;
    }

    await showRewardedAd(
      () => grantReward(),
      () => setClaiming(false),
    );
  }, [claiming, pendingEarnings, removeAdsPurchased, t, onClaim, showToast]);

  const handleSkip = useCallback(() => {
    if (claiming) return;
    setClaiming(true);
    onDismiss();
  }, [claiming, onDismiss]);

  // JS-driven count-up (addListener on interpolated values is unreliable in RN 0.81)
  const [displayedAmount, setDisplayedAmount] = React.useState('0');
  useEffect(() => {
    if (!visible || pendingEarnings <= 0) return;
    const duration = 800;
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayedAmount(formatNumber(pendingEarnings * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, pendingEarnings]);

  const logLines = [
    { ts: formatLogTimestamp(secondsAway, 0.02), text: t('offline.logLine1') },
    { ts: formatLogTimestamp(secondsAway, 0.55), text: t('offline.logLine2').replace('{blocks}', blocksProcessed.toLocaleString()) },
    { ts: formatLogTimestamp(secondsAway, 0.98), text: t('offline.logLine3') },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim, paddingTop: insets.top }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>
            BLOCK<Text style={styles.logoChain}>CHAIN</Text> TYCOON
          </Text>
        </View>

        <View style={styles.content}>
          {/* Narrative log card */}
          <View style={styles.narrativeCard}>
            <View style={styles.narrativeTopLine} />
            <View style={styles.logHeader}>
              <Animated.View style={[styles.logDot, { opacity: dotAnim }]} />
              <Text style={styles.logSource}>{t('offline.logTitle')}</Text>
            </View>
            {logLines.map((line, i) => (
              <Text key={i} style={styles.logLine}>
                <Text style={styles.logTs}>{line.ts}</Text>
                {'  '}{line.text}
              </Text>
            ))}
          </View>

          {/* Time away */}
          <View style={styles.timeAway}>
            <Text style={styles.taIcon}>⏱</Text>
            <Text style={styles.taText}>{t('offline.timeAway')}</Text>
            <Text style={styles.taTime}>{formatDuration(secondsAway)}</Text>
          </View>

          {/* Earnings card */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsTopLine} />
            <Text style={styles.ecLabel}>{t('offline.accumulated')}</Text>
            <View style={styles.ecAmountRow}>
              <Text style={styles.ecAmount}>{displayedAmount}</Text>
              <Text style={styles.ecUnit}>CC</Text>
            </View>
            {wasCapped && (
              <View style={styles.capNote}>
                <Text style={styles.capNoteText}>⚠ {t('offline.capWarning')}</Text>
              </View>
            )}
          </View>

          {/* Ad offer block */}
          <View style={styles.adOffer}>
            <Text style={styles.aoTitle}>📺 {t('offline.claimTitle')}</Text>
            <Text style={styles.aoSub}>{t('offline.claimBody')}</Text>

            <TouchableOpacity style={styles.watchBtn} onPress={handleWatchAd} activeOpacity={0.85}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer]} pointerEvents="none" />
              <Text style={styles.watchBtnText}>
                {removeAdsPurchased
                  ? `📺 ${t('offline.claim')}`
                  : `📺 ${t('offline.watchAd')}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipBtn}>{t('offline.skip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,136,0.1)',
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
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    gap: 16,
  },
  // Narrative card
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
    backgroundColor: colors.nc,
    opacity: 0.5,
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
    backgroundColor: colors.nc,
    shadowColor: colors.nc,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  logSource: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(0,229,255,0.6)',
    textTransform: 'uppercase',
  },
  logLine: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 5,
  },
  logTs: {
    color: 'rgba(0,229,255,0.35)',
  },
  // Time away
  timeAway: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
  },
  taIcon: {
    fontSize: 15,
  },
  taText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
    letterSpacing: 2,
  },
  taTime: {
    fontFamily: fonts.orbitron,
    fontSize: 15,
    color: '#fff',
  },
  // Earnings card
  earningsCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.22)',
    borderRadius: 16,
    padding: 20,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  earningsTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.ng,
  },
  ecLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 4,
    color: colors.dim,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  ecAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  ecAmount: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 40,
    color: colors.ng,
    textShadowColor: 'rgba(0,255,136,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    lineHeight: 48,
  },
  ecUnit: {
    fontFamily: fonts.mono,
    fontSize: 15,
    color: 'rgba(0,255,136,0.65)',
    letterSpacing: 3,
  },
  capNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,214,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.15)',
    borderRadius: 8,
    marginTop: 10,
  },
  capNoteText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: 'rgba(255,214,0,0.6)',
    letterSpacing: 1,
  },
  // Ad offer
  adOffer: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  aoTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aoSub: {
    fontFamily: fonts.rajdhani,
    fontSize: 14,
    color: colors.dim,
    lineHeight: 21,
    marginBottom: 14,
  },
  watchBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ng,
    backgroundColor: 'rgba(0,255,136,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  shimmer: {
    backgroundColor: 'rgba(0,255,136,0.04)',
  },
  watchBtnText: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    color: colors.ng,
    letterSpacing: 3,
  },
  skipBtn: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default OfflineEarningsModal;
