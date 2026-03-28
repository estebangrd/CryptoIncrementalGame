import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Achievement } from '../types/game';
import { colors, fonts } from '../config/theme';

interface AchievementToastProps {
  achievement: Achievement | null;
  displayName: string;
  onDismiss: () => void;
}

const TOAST_DURATION = 4000;

// Category → semantic color
const CATEGORY_COLORS: Record<string, string> = {
  mining: colors.ng,    // green
  economy: colors.nc,   // cyan
  hardware: colors.ny,  // yellow
  prestige: colors.np,  // purple
  secret: colors.nr,    // red
};

const getThemeColor = (a: Achievement) => CATEGORY_COLORS[a.category] ?? colors.ng;

const withAlpha = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, displayName, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(-140)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const starScale = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(-0.5)).current; // -180deg in turns

  useEffect(() => {
    if (!achievement) return;

    // Reset all values
    slideY.setValue(-140);
    progress.setValue(1);
    shimmerX.setValue(-1);
    starScale.setValue(0);
    starRotate.setValue(-0.5);

    // Slide in
    const slideIn = Animated.spring(slideY, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    });

    // Progress bar drain
    const drain = Animated.timing(progress, {
      toValue: 0,
      duration: TOAST_DURATION,
      easing: Easing.linear,
      useNativeDriver: false, // width interpolation needs layout
    });

    // Icon shimmer
    const shimmer = Animated.timing(shimmerX, {
      toValue: 1,
      duration: 800,
      delay: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    // Star burst
    const starBurst = Animated.parallel([
      Animated.spring(starScale, {
        toValue: 1,
        tension: 80,
        friction: 6,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(starRotate, {
        toValue: 0,
        duration: 600,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Slide out after duration
    const slideOut = Animated.timing(slideY, {
      toValue: -140,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    });

    Animated.parallel([slideIn, drain, shimmer, starBurst]).start(() => {
      slideOut.start(() => onDismiss());
    });
  }, [achievement, slideY, progress, shimmerX, starScale, starRotate, onDismiss]);

  if (!achievement) return null;

  const themeColor = getThemeColor(achievement);
  const rewardText = achievement.reward
    ? achievement.reward.type === 'coins' ? `+${achievement.reward.amount} CryptoCoins`
    : achievement.reward.type === 'money' ? `+$${achievement.reward.amount}`
    : achievement.reward.type === 'multiplier' ? `${achievement.reward.multiplier}x production boost!`
    : ''
    : '';

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslate = shimmerX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-60, 60],
  });

  const starRotateStr = starRotate.interpolate({
    inputRange: [-0.5, 0],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 6, transform: [{ translateY: slideY }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onDismiss}
        style={[
          styles.inner,
          {
            borderColor: withAlpha(themeColor, 0.3),
            shadowColor: themeColor,
          },
        ]}
      >
        {/* Top accent bar — fades to transparent at edges */}
        <View style={styles.accentBar}>
          <Svg width="100%" height={2} preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={themeColor} stopOpacity="0" />
                <Stop offset="50%" stopColor={themeColor} stopOpacity="0.7" />
                <Stop offset="100%" stopColor={themeColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="2" fill="url(#accentGrad)" />
          </Svg>
        </View>

        {/* Icon with shimmer */}
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(themeColor, 0.1), borderColor: withAlpha(themeColor, 0.25) }]}>
          <Text style={styles.iconText}>{achievement.icon}</Text>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>

        {/* Text content */}
        <View style={styles.textWrap}>
          <Text style={styles.label}>ACHIEVEMENT UNLOCKED</Text>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {rewardText !== '' && (
            <Text style={[styles.reward, { color: themeColor }]}>{rewardText}</Text>
          )}
        </View>

        {/* Star burst */}
        <Animated.Text
          style={[
            styles.star,
            {
              transform: [
                { scale: starScale },
                { rotate: starRotateStr },
              ],
            },
          ]}
        >
          ⭐
        </Animated.Text>

        {/* Progress bar drain */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: themeColor,
              width: progressWidth,
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    paddingHorizontal: 12,
  },
  inner: {
    backgroundColor: 'rgba(8,16,28,0.97)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconText: {
    fontSize: 22,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.18)',
    marginBottom: 2,
  },
  name: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  reward: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  star: {
    fontSize: 22,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderBottomLeftRadius: 14,
  },
});

export default AchievementToast;
