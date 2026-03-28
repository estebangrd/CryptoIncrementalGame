import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { formatNumber } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

interface EarningsToastProps {
  amount: number | null;
  label: string;
  onDismiss: () => void;
}

const TOAST_DURATION = 3000;

const EarningsToast: React.FC<EarningsToastProps> = ({ amount, label, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(-20)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (amount == null) return;

    opacity.setValue(0);
    slideY.setValue(-20);
    shimmerX.setValue(-1);

    // Fade + slide in
    const enter = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(slideY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]);

    // Shimmer sweep
    const shimmer = Animated.timing(shimmerX, {
      toValue: 1,
      duration: 800,
      delay: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    // Fade out
    const exit = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: -20,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([
      Animated.parallel([enter, shimmer]),
      Animated.delay(TOAST_DURATION),
      exit,
    ]).start(() => onDismiss());
  }, [amount, opacity, slideY, shimmerX, onDismiss]);

  if (amount == null) return null;

  const shimmerTranslate = shimmerX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 46,
          opacity,
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Top accent line — faded edges */}
        <View style={styles.accentBar}>
          <Svg width="100%" height={1} preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="etAccent" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={colors.ng} stopOpacity="0" />
                <Stop offset="50%" stopColor={colors.ng} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={colors.ng} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="1" fill="url(#etAccent)" />
          </Svg>
        </View>

        <Text style={styles.icon}>{'\u26CF\uFE0E'}</Text>

        <View style={styles.textRow}>
          <Text style={styles.amount}>{formatNumber(amount)} CC</Text>
          <Text style={styles.label}>{label}</Text>
        </View>

        {/* Shimmer sweep */}
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
          pointerEvents="none"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9998,
    elevation: 9,
    alignItems: 'center',
  },
  inner: {
    backgroundColor: 'rgba(8,16,28,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.35)',
    borderRadius: 40,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
    color: '#fff',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  amount: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 15,
    color: colors.ng,
    textShadowColor: 'rgba(0,255,136,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.dim,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(0,255,136,0.08)',
  },
});

export default EarningsToast;
