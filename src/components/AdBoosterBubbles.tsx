/**
 * AdBoosterBubbles — Floating rewarded-ad bubble rotation system.
 *
 * One bubble at a time, randomly picked from an eligible pool:
 *   - Hash Rate (+20% mining speed, 5 min)
 *   - Market (+25% sell price, 3 min)
 *   - Energy Restore (50% of MW deficit, instant)
 *
 * Cooldown escalates when the player ignores / dismisses bubbles.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useGame } from '../contexts/GameContext';
import { showRewardedAd, isRewardedAdReady } from '../services/AdMobService';
import { AD_BUBBLE_CONFIG } from '../config/balanceConfig';
import { colors, fonts } from '../config/theme';
import { logEvent } from '../services/analytics';


// ── Debug: force-spawn a specific bubble (called from SettingsModal) ─────────
export const debugForceSpawnRef: { current: ((type: 'hash' | 'market' | 'energy') => void) | null } = { current: null };

// ── Types ────────────────────────────────────────────────────────────────────
type BubbleType = 'hash' | 'market' | 'energy';

interface BubbleTheme {
  icon: string;
  label: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  ringColor: string;
  labelColorStyle: string;
}

const BUBBLE_THEMES: Record<BubbleType, BubbleTheme> = {
  hash: {
    icon: '🖥',
    label: '+20%',
    color: colors.nc,
    borderColor: 'rgba(0,229,255,0.5)',
    bgGradient: 'rgba(0,229,255,0.12)',
    ringColor: 'rgba(0,229,255,0.7)',
    labelColorStyle: colors.nc,
  },
  market: {
    icon: '📈',
    label: '+25%',
    color: colors.ng,
    borderColor: 'rgba(0,255,136,0.5)',
    bgGradient: 'rgba(0,255,136,0.12)',
    ringColor: 'rgba(0,255,136,0.7)',
    labelColorStyle: colors.ng,
  },
  energy: {
    icon: '⚡',
    label: '50%',
    color: colors.nr,
    borderColor: 'rgba(255,61,90,0.5)',
    bgGradient: 'rgba(255,61,90,0.12)',
    ringColor: 'rgba(255,61,90,0.7)',
    labelColorStyle: colors.nr,
  },
};

// SVG circumference for the countdown ring (2 * PI * 31 ≈ 194.78)
const RING_CIRCUMFERENCE = 2 * Math.PI * 31;


// ── Helpers ──────────────────────────────────────────────────────────────────
const randBetween = (min: number, max: number) => min + Math.random() * (max - min);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Component ────────────────────────────────────────────────────────────────
const AdBoosterBubbles: React.FC = () => {
  const { gameState, dispatch, showToast, t } = useGame();

  // ── Refs for latest state (avoids stale closures) ──
  const gsRef = useRef(gameState);
  gsRef.current = gameState;

  // ── Bubble lifecycle state ──
  const [activeBubble, setActiveBubble] = useState<BubbleType | null>(null);
  const [ghostType, setGhostType] = useState<BubbleType | null>(null);

  // Cooldown / escalation tracking (component-level, resets on unmount)
  const missCountRef = useRef(0);
  const nextSpawnAtRef = useRef(Date.now() + 30_000); // initial 30s delay
  const bubbleStartRef = useRef<number>(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideXAnim = useRef(new Animated.Value(-30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current; // 0→1 as time elapses
  const ghostOpacity = useRef(new Animated.Value(0)).current;

  // Energy urgency pulsing
  const energyGlowAnim = useRef(new Animated.Value(0.25)).current;

  // ── Eligible pool ─────────────────────────────────────────────────────────
  const getEligiblePool = useCallback((): BubbleType[] => {
    const gs = gsRef.current;
    const pool: BubbleType[] = [];

    // Hash: ≥5 total hardware units (excluding manual_mining)
    const totalHw = gs.hardware.reduce((sum, h) => h.id === 'manual_mining' ? sum : sum + h.owned, 0);
    if (totalHw >= AD_BUBBLE_CONFIG.HASH_MIN_HARDWARE_UNITS) {
      pool.push('hash');
    }

    // Market: same condition as narrative market opportunity (basic_gpu ≥ 1),
    // but NOT if narrative market event is active or ad market boost is active
    const hasBasicGpu = (gs.hardware.find(h => h.id === 'basic_gpu')?.owned ?? 0) >= 1;
    const narrativeMarketActive = gs.marketOpportunityEvent?.status === 'active';
    const adMarketActive = gs.adMarketBoost?.isActive ?? false;
    if (hasBasicGpu && !narrativeMarketActive && !adMarketActive) {
      pool.push('market');
    }

    // Energy: planetResources < 90%
    if ((gs.planetResources ?? 100) < AD_BUBBLE_CONFIG.ENERGY_PLANET_THRESHOLD) {
      pool.push('energy');
    }

    return pool;
  }, []);

  // ── Cooldown calculator ───────────────────────────────────────────────────
  const getCooldown = useCallback((watched: boolean): number => {
    if (watched) {
      missCountRef.current = 0;
      return randBetween(
        AD_BUBBLE_CONFIG.COOLDOWN_AFTER_WATCH_MIN_MS,
        AD_BUBBLE_CONFIG.COOLDOWN_AFTER_WATCH_MAX_MS,
      );
    }
    missCountRef.current += 1;
    const escalation = (missCountRef.current - 1) * AD_BUBBLE_CONFIG.MISS_ESCALATION_MS;
    const minMs = Math.min(
      AD_BUBBLE_CONFIG.COOLDOWN_AFTER_MISS_MIN_MS + escalation,
      AD_BUBBLE_CONFIG.MISS_ESCALATION_CAP_MIN_MS,
    );
    const maxMs = Math.min(
      AD_BUBBLE_CONFIG.COOLDOWN_AFTER_MISS_MAX_MS + escalation,
      AD_BUBBLE_CONFIG.MISS_ESCALATION_CAP_MAX_MS,
    );
    return randBetween(minMs, maxMs);
  }, []);

  // ── Show bubble ───────────────────────────────────────────────────────────
  const showBubble = useCallback((type: BubbleType) => {
    setActiveBubble(type);
    bubbleStartRef.current = Date.now();

    // Reset anims
    scaleAnim.setValue(0);
    slideXAnim.setValue(-20);
    ringAnim.setValue(0);

    // Entrance
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.spring(slideXAnim, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();

    // Pulse ring loop — expand outward only (scale 1→1.35, opacity 0.6→0), then reset
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();

    // Energy urgency glow
    if (type === 'energy') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(energyGlowAnim, { toValue: 0.6, duration: 500, useNativeDriver: false }),
          Animated.timing(energyGlowAnim, { toValue: 0.25, duration: 500, useNativeDriver: false }),
        ]),
      ).start();
    }

    // Ring countdown
    const visibleSec = AD_BUBBLE_CONFIG.BUBBLE_VISIBLE_SEC[type];
    Animated.timing(ringAnim, {
      toValue: 1,
      duration: visibleSec * 1000,
      useNativeDriver: false,
    }).start();
  }, [scaleAnim, slideXAnim, pulseAnim, ringAnim, energyGlowAnim]);

  // ── Debug: register force-spawn ref ─────────────────────────────────────────
  useEffect(() => {
    debugForceSpawnRef.current = (type: BubbleType) => {
      if (activeBubble) return; // already showing one
      showBubble(type);
    };
    return () => { debugForceSpawnRef.current = null; };
  }, [activeBubble, showBubble]);

  // ── Remove bubble (with expiry animation) ─────────────────────────────────
  const removeBubble = useCallback((watched: boolean) => {
    const currentType = activeBubble;
    // Expire animation: scale up then down
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.18, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      setActiveBubble(null);
      pulseAnim.stopAnimation();
      energyGlowAnim.stopAnimation();

      // Show ghost trace if expired (not watched/dismissed)
      if (!watched && currentType) {
        setGhostType(currentType);
        ghostOpacity.setValue(0.35);
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(ghostOpacity, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ]).start(() => setGhostType(null));
      }

      // Set next cooldown
      nextSpawnAtRef.current = Date.now() + getCooldown(watched);
    });
  }, [activeBubble, scaleAnim, pulseAnim, energyGlowAnim, ghostOpacity, getCooldown]);

  // ── Dismiss (X button) ────────────────────────────────────────────────────
  const dismissBubble = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideXAnim, { toValue: -30, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setActiveBubble(null);
      pulseAnim.stopAnimation();
      energyGlowAnim.stopAnimation();
      nextSpawnAtRef.current = Date.now() + getCooldown(false);
    });
  }, [scaleAnim, slideXAnim, pulseAnim, energyGlowAnim, getCooldown]);

  // ── Tick: spawn check + auto-expire ────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Auto-expire active bubble
      if (activeBubble) {
        const visibleMs = AD_BUBBLE_CONFIG.BUBBLE_VISIBLE_SEC[activeBubble] * 1000;
        if (now - bubbleStartRef.current >= visibleMs) {
          removeBubble(false);
        }
        return;
      }

      // Try to spawn if cooldown elapsed
      if (now >= nextSpawnAtRef.current) {
        const pool = getEligiblePool();
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          showBubble(pick);
        } else {
          // No eligible type right now — check again in 10s
          nextSpawnAtRef.current = now + 10_000;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBubble, removeBubble, getEligiblePool, showBubble]);

  // ── Also expire time-based ad boosts from game state ──
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_AD_BUBBLE_EXPIRATIONS' });
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // ── Tap bubble → show ad (or instant reward if Remove Ads) → activate ───
  const handleBubbleTap = useCallback((type: BubbleType) => {
    const doActivate = () => {
      logEvent('rewarded_ad_watched', { bubbleType: type });
      switch (type) {
        case 'hash':
          dispatch({ type: 'ACTIVATE_AD_HASH_BOOST' });
          showToast(`🖥 ${t('adBubble.hash.toastText')}`, 'success');
          break;
        case 'market':
          dispatch({ type: 'ACTIVATE_AD_MARKET_BOOST' });
          showToast(`📈 ${t('adBubble.market.toastText')}`, 'success');
          break;
        case 'energy':
          dispatch({ type: 'AD_ENERGY_RESTORE' });
          showToast(`⚡ ${t('adBubble.energy.toastText')}`, 'success');
          break;
      }

      // Remove bubble as watched
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setActiveBubble(null);
        pulseAnim.stopAnimation();
        energyGlowAnim.stopAnimation();
        nextSpawnAtRef.current = Date.now() + getCooldown(true);
      });
    };

    // If player purchased Remove Ads, grant reward immediately
    if (gsRef.current.iapState.removeAdsPurchased) {
      doActivate();
      return;
    }

    if (isRewardedAdReady()) {
      showRewardedAd(doActivate, undefined);
    } else {
      // Ad not ready — activate anyway in dev / fallback
      doActivate();
    }
  }, [dispatch, showToast, t, scaleAnim, pulseAnim, energyGlowAnim, getCooldown]);

  // ── Translated text (memoized) ────────────────────────────────────────────
  // ── Ring dash offset interpolation ────────────────────────────────────────
  const ringDashOffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RING_CIRCUMFERENCE],
  });

  // ── Render bubble ─────────────────────────────────────────────────────────
  const renderBubble = () => {
    if (!activeBubble) return null;
    const theme = BUBBLE_THEMES[activeBubble];

    return (
      <View style={styles.bubbleWrapper}>
        <Animated.View
          style={[
            styles.bubbleInner,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: slideXAnim },
              ],
            },
          ]}
        >
          {/* Pulse ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: theme.color,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.35],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />

          {/* Android glow (no colored box-shadow on Android) */}
          {Platform.OS === 'android' && (
            <View style={[styles.androidGlow, { borderColor: theme.color }]} />
          )}

          {/* Main bubble */}
          <TouchableOpacity
            style={[
              styles.bubble,
              {
                backgroundColor: theme.bgGradient,
                borderColor: theme.borderColor,
                ...(Platform.OS === 'ios' ? { shadowColor: theme.color } : {}),
              },
              activeBubble === 'energy' && styles.bubbleEnergy,
            ]}
            activeOpacity={0.85}
            onPress={() => handleBubbleTap(activeBubble!)}
          >
            <Text style={styles.bubbleIcon}>{theme.icon}</Text>
            <Text style={[styles.bubbleLabel, { color: theme.labelColorStyle }]}>{theme.label}</Text>
          </TouchableOpacity>

          {/* SVG countdown ring — centered in bubbleInner (76x76), above bubble */}
          <View style={styles.timerRingContainer} pointerEvents="none">
            <Svg width={68} height={68} viewBox="0 0 68 68">
              <AnimatedCircle
                cx="34"
                cy="34"
                r="31"
                fill="none"
                stroke={theme.ringColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={`${RING_CIRCUMFERENCE}`}
                strokeDashoffset={ringDashOffset}
                transform="rotate(-90, 34, 34)"
              />
            </Svg>
          </View>

          {/* Close button — on top of everything */}
          <TouchableOpacity
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={(e) => { e.stopPropagation?.(); dismissBubble(); }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // ── Render ghost trace ────────────────────────────────────────────────────
  const renderGhost = () => {
    if (!ghostType) return null;
    const theme = BUBBLE_THEMES[ghostType];

    return (
      <View style={styles.ghostWrap} pointerEvents="none">
        <Animated.View
          style={[
            styles.ghost,
            { opacity: ghostOpacity },
          ]}
        >
          <Text style={styles.ghostIcon}>{theme.icon}</Text>
        </Animated.View>
      </View>
    );
  };

  // ── Render confirmation modal ─────────────────────────────────────────────
  return (
    <>
      {renderBubble()}
      {renderGhost()}
    </>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Bubble ──
  bubbleWrapper: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 20,
  },
  bubbleInner: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
  },
  bubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.nc,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {},
    }),
  },
  // Android glow — ring behind bubble, only visible outside
  androidGlow: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    opacity: 0.4,
    backgroundColor: 'transparent',
  },
  bubbleEnergy: {
    ...Platform.select({
      ios: {
        shadowColor: colors.nr,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 17,
      },
      android: {},
    }),
  },
  bubbleIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  bubbleLabel: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 8,
    letterSpacing: 0.5,
    lineHeight: 10,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(2,8,16,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 10,
  },
  closeBtnText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 10,
  },
  timerRingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Ghost ──
  ghostWrap: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 19,
    width: 64,
  },
  ghost: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostIcon: {
    fontSize: 18,
  },
});

export default AdBoosterBubbles;
