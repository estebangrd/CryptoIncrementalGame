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
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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
  const countAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    countAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(countAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
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
  }, [visible, fadeAnim, countAnim, shimmerAnim, dotAnim]);

  const fadeOut = useCallback((callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => callback());
  }, [fadeAnim]);

  const handleWatchAd = useCallback(async () => {
    const pct = OFFLINE_SCREEN_CONFIG.REWARD_MIN_PCT +
      Math.floor(Math.random() * (OFFLINE_SCREEN_CONFIG.REWARD_MAX_PCT - OFFLINE_SCREEN_CONFIG.REWARD_MIN_PCT + 1));
    const claimAmount = Math.round(pendingEarnings * pct / 100);

    const grantReward = () => {
      fadeOut(() => {
        onClaim(claimAmount);
        const toastMsg = t('offline.toast').replace('{amount}', formatNumber(claimAmount));
        showToast(toastMsg, 'success');
      });
    };

    if (removeAdsPurchased) {
      grantReward();
      return;
    }

    if (!isRewardedAdReady()) {
      // Fallback: grant immediately if ad not ready
      grantReward();
      return;
    }

    await showRewardedAd(
      () => grantReward(),
      () => {
        // Ad dismissed without reward — do nothing, modal stays
      },
    );
  }, [pendingEarnings, removeAdsPurchased, t, onClaim, showToast, fadeOut]);

  const handleSkip = useCallback(() => {
    fadeOut(() => onDismiss());
  }, [fadeOut, onDismiss]);

  const displayedAmount = countAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pendingEarnings],
  });

  const logLines = [
    { ts: '[--:--:01]', text: t('offline.logLine1') },
    { ts: '[--:--:02]', text: t('offline.logLine2').replace('{blocks}', blocksProcessed.toLocaleString()) },
    { ts: '[--:--:03]', text: t('offline.logLine3') },
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
              <AnimatedNumber value={displayedAmount} />
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

// Animated number display component
const AnimatedNumber: React.FC<{ value: Animated.AnimatedInterpolation<number> }> = ({ value }) => {
  const [displayText, setDisplayText] = React.useState('0');

  useEffect(() => {
    const id = value.addListener(({ value: v }) => {
      setDisplayText(formatNumber(v));
    });
    return () => value.removeListener(id);
  }, [value]);

  return <Text style={styles.ecAmount}>{displayText}</Text>;
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
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(0,229,255,0.6)',
    textTransform: 'uppercase',
  },
  logLine: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 5,
  },
  logTs: {
    color: 'rgba(0,229,255,0.35)',
  },
  // Time away
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
    fontSize: 8,
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
    fontSize: 14,
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
    fontSize: 9,
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
    fontSize: 12,
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aoSub: {
    fontFamily: fonts.rajdhani,
    fontSize: 13,
    color: colors.dim,
    lineHeight: 20,
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
    fontSize: 13,
    color: colors.ng,
    letterSpacing: 3,
  },
  skipBtn: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.18)',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default OfflineEarningsModal;
