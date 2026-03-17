import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { colors, fonts } from '../config/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CHART_HEIGHT = 90;
const PADDING = { top: 8, bottom: 8, left: 0, right: 0 };

interface PriceChartProps {
  priceHistory: number[];
}

const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 100) return `$${price.toFixed(0)}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
};

const PriceChart: React.FC<PriceChartProps> = ({ priceHistory }) => {
  const [chartWidth, setChartWidth] = useState(300);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (!priceHistory || priceHistory.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Waiting for price data...</Text>
      </View>
    );
  }

  const maxPrice = Math.max(...priceHistory);
  const minPrice = Math.min(...priceHistory);
  const priceRange = maxPrice - minPrice || maxPrice * 0.01;

  const innerW = chartWidth - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const toX = (i: number) => PADDING.left + (i / (priceHistory.length - 1)) * innerW;
  const toY = (p: number) => PADDING.top + (1 - (p - minPrice) / priceRange) * innerH;

  const linePath = priceHistory
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p).toFixed(2)}`)
    .join(' ');

  const lastX = toX(priceHistory.length - 1);
  const lastY = toY(priceHistory[priceHistory.length - 1]);
  const firstX = toX(0).toFixed(2);
  const bottomY = (PADDING.top + innerH).toFixed(2);
  const areaPath = `${linePath} L${lastX.toFixed(2)},${bottomY} L${firstX},${bottomY} Z`;

  const currentPrice = priceHistory[priceHistory.length - 1];
  const firstPrice = priceHistory[0];
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isPositive = priceChange >= 0;
  const accentColor = isPositive ? colors.ng : colors.nr;
  const gradientId = `grad_${isPositive ? 'g' : 'r'}`;

  const pulseR = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [3.5, 8] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.currentPrice}>{formatPrice(currentPrice)}</Text>
        <View style={[styles.badge, isPositive ? styles.badgeUp : styles.badgeDn]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
          </Text>
        </View>
      </View>

      <View
        style={styles.chartWrap}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill={`url(#${gradientId})`} />
          <Path
            d={linePath}
            stroke={accentColor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedCircle
            cx={lastX}
            cy={lastY}
            r={pulseR}
            fill="none"
            stroke={accentColor}
            strokeWidth={1.5}
            opacity={pulseOpacity}
          />
          <Circle cx={lastX} cy={lastY} r={3.5} fill={accentColor} />
        </Svg>
      </View>

      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>30m ago</Text>
        <Text style={styles.xLabel}>15m ago</Text>
        <Text style={styles.xLabel}>Now</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  currentPrice: {
    fontFamily: fonts.orbitron,
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeUp: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderColor: 'rgba(0,255,136,0.22)',
  },
  badgeDn: {
    backgroundColor: 'rgba(255,61,90,0.1)',
    borderColor: 'rgba(255,61,90,0.22)',
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  chartWrap: {
    width: '100%',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.dim,
    letterSpacing: 1,
  },
  noDataText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.dim,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default PriceChart;
