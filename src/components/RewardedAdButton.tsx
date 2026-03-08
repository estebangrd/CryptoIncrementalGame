import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { showRewardedAd, isRewardedAdReady } from '../services/AdMobService';
import { BOOSTER_CONFIG } from '../config/balanceConfig';

const OFFER_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between offers
const OFFER_WINDOW_MS = 20_000;           // 20 seconds visible

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Must match GameScreen constants
const SHEET_DEFAULT_TOP = SCREEN_HEIGHT * 0.5;
const SHEET_EXPANDED_TOP = SCREEN_HEIGHT * 0.18;
// Approx height of bottom sheet header + tabs row
const SHEET_TABS_OFFSET = 135;

const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface Props {
  sheetTopAnim: Animated.Value;
}

const RewardedAdButton: React.FC<Props> = ({ sheetTopAnim }) => {
  const { gameState, dispatch, showToast } = useGame();
  const insets = useSafeAreaInsets();

  // Badge top tracks the sheet: below the tab row when expanded, below stats when collapsed
  const badgeTop = sheetTopAnim.interpolate({
    inputRange: [SHEET_EXPANDED_TOP, SHEET_DEFAULT_TOP],
    outputRange: [
      SHEET_EXPANDED_TOP + SHEET_TABS_OFFSET,
      insets.top + SCREEN_HEIGHT * 0.22,
    ],
    extrapolate: 'clamp',
  });
  const cooldownMs = BOOSTER_CONFIG.REWARDED_AD_BOOST.cooldownMs;

  const [now, setNow] = useState(Date.now());
  const [offerVisible, setOfferVisible] = useState(false);

  // Slides in from the right
  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const lastOfferEndRef = useRef(Date.now());
  const offerStartRef = useRef<number | null>(null);

  const adBoostRef = useRef(gameState.adBoost);
  adBoostRef.current = gameState.adBoost;

  useEffect(() => {
    if (offerVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 120, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [offerVisible, slideAnim, fadeAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nowTs = Date.now();
      setNow(nowTs);

      const adBoost = adBoostRef.current;

      if (adBoost.isActive && adBoost.expiresAt && nowTs >= adBoost.expiresAt) {
        dispatch({ type: 'EXPIRE_AD_BOOST' });
      }

      const inCooldown = adBoost.lastWatchedAt
        ? nowTs - adBoost.lastWatchedAt < cooldownMs
        : false;
      const isActive = !!(adBoost.isActive && adBoost.expiresAt && nowTs < adBoost.expiresAt);

      if (offerStartRef.current !== null) {
        const elapsed = nowTs - offerStartRef.current;
        if (elapsed >= OFFER_WINDOW_MS || inCooldown || isActive) {
          offerStartRef.current = null;
          lastOfferEndRef.current = nowTs;
          setOfferVisible(false);
        }
      } else {
        if (!inCooldown && !isActive && nowTs - lastOfferEndRef.current >= OFFER_INTERVAL_MS) {
          offerStartRef.current = nowTs;
          setOfferVisible(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownMs, dispatch]);

  const boostRemaining = (): number => {
    if (!gameState.adBoost.expiresAt) return 0;
    return Math.max(0, gameState.adBoost.expiresAt - now);
  };

  const offerSecondsLeft = (): number => {
    if (!offerStartRef.current) return 0;
    return Math.max(0, Math.ceil((OFFER_WINDOW_MS - (now - offerStartRef.current)) / 1000));
  };

  const dismissOffer = useCallback(() => {
    offerStartRef.current = null;
    lastOfferEndRef.current = Date.now();
    setOfferVisible(false);
  }, []);

  const handleWatchAd = useCallback(() => {
    const doShowAd = () => {
      if (!isRewardedAdReady()) return;
      showRewardedAd(
        () => {
          dispatch({ type: 'ACTIVATE_AD_BOOST' });
          showToast('⚡ Boost 2x activado por 4 horas', 'success');
          offerStartRef.current = null;
          lastOfferEndRef.current = Date.now();
          setOfferVisible(false);
        },
        undefined,
      );
    };

    if (gameState.adBoost.isActive) {
      const boostLeft = Math.max(0, (gameState.adBoost.expiresAt ?? 0) - Date.now());
      Alert.alert(
        'Boost ya activo',
        `Ya tienes un boost 2x activo (${formatTime(boostLeft)} restantes).\n\nVer otro ad REEMPLAZARÁ el boost actual, no se sumará.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver ad de todas formas', onPress: doShowAd },
        ],
      );
    } else {
      doShowAd();
    }
  }, [gameState.adBoost, dispatch, showToast]);

  // Small pill badge while boost is active — follows sheet position
  const isBoostActive = gameState.adBoost.isActive && boostRemaining() > 0;
  if (isBoostActive) {
    return (
      <Animated.View style={[styles.activeBadge, { top: badgeTop }]}>
        <Text style={styles.activeBadgeText}>⚡ 2x · {formatTime(boostRemaining())}</Text>
      </Animated.View>
    );
  }

  if (!offerVisible) {
    return null;
  }

  // ~35% from top of screen
  const buttonTop = insets.top + SCREEN_HEIGHT * 0.33;
  const sLeft = offerSecondsLeft();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: buttonTop,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bubble}
        onPress={handleWatchAd}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>📺</Text>
        <Text style={styles.label}>2x GRATIS</Text>
      </TouchableOpacity>

      {/* Countdown badge */}
      <View style={styles.countdownBadge}>
        <Text style={styles.countdownText}>{sLeft}</Text>
      </View>

      {/* Dismiss tap area */}
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={dismissOffer}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 12,
    zIndex: 100,
    alignItems: 'center',
  },
  bubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0d2b0d',
    borderWidth: 1.5,
    borderColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  icon: {
    fontSize: 28,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#00ff88',
    letterSpacing: 0.5,
  },
  countdownBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 9,
    color: '#aaa',
    fontWeight: 'bold',
  },
  dismissBtn: {
    marginTop: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 9,
    color: '#666',
    fontWeight: 'bold',
  },
  activeBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#7a5c00',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 50,
  },
  activeBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default RewardedAdButton;
