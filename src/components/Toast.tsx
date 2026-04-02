import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../config/theme';

export interface MarketEventToastData {
  tag: string;           // "MARKET" | "CHAIN" | "NET"
  headline: string;      // translated event name
  delta: string;         // "+25%" / "−15%"
  durationLabel: string; // "10 MIN" / "PERMANENT"
  polarity: 'pos' | 'neg';
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  marketEvent?: MarketEventToastData;
}

interface ToastProps {
  toast: ToastInfo | null;
  onDismiss: () => void;
}

const BG: Record<string, string> = {
  success: '#0d2e1a',
  error: '#2e0d0d',
  info: '#1a1a2e',
  warning: '#2e2a0d',
};
const BORDER: Record<string, string> = {
  success: '#00ff88',
  error: '#ff4444',
  info: '#4a9eff',
  warning: '#ffd600',
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(1)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!toast) return;
    translateY.setValue(-80);
    opacity.setValue(0);

    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.delay(3500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    anim.start(() => onDismissRef.current());

    // LIVE badge pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.4, duration: 500, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    if (toast.marketEvent) {
      pulse.start();
    }

    return () => { anim.stop(); pulse.stop(); };
  }, [toast, translateY, opacity, livePulse]);

  if (!toast) return null;

  // ── Market event broadcast bar ──
  if (toast.marketEvent) {
    const me = toast.marketEvent;
    const isPos = me.polarity === 'pos';
    const accentColor = isPos ? colors.ng : '#ff3b3b';
    const accentBg = isPos ? 'rgba(0,255,136,0.13)' : 'rgba(255,59,59,0.13)';
    const borderColor = isPos ? 'rgba(0,255,136,0.18)' : 'rgba(255,59,59,0.18)';
    const subText = `${me.delta} PRICE · ${me.durationLabel}`;

    return (
      <Animated.View style={[
        bStyles.outer,
        { top: insets.top + 44, transform: [{ translateY }], opacity },
      ]}>
        <View style={bStyles.inner}>
          {/* Left color stripe */}
          <View style={[bStyles.stripe, { backgroundColor: accentColor }]} />

          {/* Alert tag */}
          <View style={[bStyles.tagBox, { backgroundColor: accentBg }]}>
            <Text style={[bStyles.tagText, { color: accentColor }]}>{me.tag}</Text>
          </View>

          {/* Content */}
          <View style={[bStyles.content, { borderTopColor: borderColor, borderBottomColor: borderColor }]}>
            <Text style={bStyles.headline} numberOfLines={1}>{me.headline}</Text>
            <Text style={bStyles.sub}>{subText}</Text>
          </View>

          {/* Right delta + LIVE */}
          <View style={[bStyles.right, { borderTopColor: borderColor, borderBottomColor: borderColor }]}>
            <Text style={[bStyles.delta, { color: accentColor }]}>{me.delta}</Text>
            <Animated.View style={[bStyles.liveBadge, { backgroundColor: accentBg, opacity: livePulse }]}>
              <Text style={[bStyles.liveText, { color: accentColor }]}>LIVE</Text>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── Simple toast (existing style) ──
  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: BG[toast.type],
        borderColor: BORDER[toast.type],
        transform: [{ translateY }],
        opacity,
      },
    ]}>
      <Text style={[styles.text, { color: BORDER[toast.type] }]}>{toast.message}</Text>
    </Animated.View>
  );
};

// ── Broadcast bar styles (Design 7) ──
const bStyles = StyleSheet.create({
  outer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    elevation: 10,
  },
  inner: {
    flexDirection: 'row',
    height: 52,
  },
  stripe: {
    width: 5,
  },
  tagBox: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tagText: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 7,
    letterSpacing: 2,
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#0a0f0d',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  headline: {
    fontFamily: fonts.rajdhaniBold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: '#e8f5ee',
  },
  sub: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: colors.dim,
    marginTop: 1,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#0a0f0d',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 2,
  },
  delta: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 15,
  },
  liveBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  liveText: {
    fontFamily: fonts.mono,
    fontSize: 7,
    letterSpacing: 2,
  },
});

// ── Simple toast styles ──
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 9998,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Toast;
