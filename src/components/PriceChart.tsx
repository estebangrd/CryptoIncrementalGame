import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../config/theme';
import { formatNumber, formatUSD } from '../utils/gameLogic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CHART_HEIGHT = 90;
const Y_LABEL_WIDTH = 44;
const PADDING = { top: 8, bottom: 8, left: 0, right: Y_LABEL_WIDTH };

/** Compact price formatter for chart Y-axis labels.
 *  Avoids exponential notation — always shows readable decimals. */
const formatAxisPrice = (price: number): string => {
  if (!isFinite(price) || price === 0) return '$0';
  const abs = Math.abs(price);
  const sign = price < 0 ? '-' : '';
  if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(1) + 'K';
  if (abs >= 1) return sign + '$' + abs.toFixed(2);
  // Sub-dollar: show enough decimals to reach 2 significant figures
  const decimals = Math.min(8, Math.max(2, Math.ceil(-Math.log10(abs)) + 2));
  return sign + '$' + abs.toFixed(decimals);
};

type TimeRange = '5m' | '15m' | '30m';

const RANGE_CONFIG: Record<TimeRange, { points: number; labels: [string, string, string] }> = {
  '5m':  { points: 20,  labels: ['5m ago', '2m ago', 'Now'] },
  '15m': { points: 60,  labels: ['15m ago', '7m ago', 'Now'] },
  '30m': { points: 120, labels: ['30m ago', '15m ago', 'Now'] },
};

interface PriceChartProps {
  priceHistory: number[];
}

const PriceChart: React.FC<PriceChartProps> = ({ priceHistory }) => {
  const [chartWidth, setChartWidth] = useState(300);
  const [timeRange, setTimeRange] = useState<TimeRange>('30m');
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

  // Slice history based on selected time range
  const { points: rangePoints, labels: xLabels } = RANGE_CONFIG[timeRange];
  const visibleHistory = priceHistory.length <= rangePoints
    ? priceHistory
    : priceHistory.slice(-rangePoints);

  const maxPrice = Math.max(...visibleHistory);
  const minPrice = Math.min(...visibleHistory);
  const priceRange = maxPrice - minPrice || maxPrice * 0.01;

  const innerW = chartWidth - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const toX = (i: number) => PADDING.left + (i / (visibleHistory.length - 1)) * innerW;
  const toY = (p: number) => PADDING.top + (1 - (p - minPrice) / priceRange) * innerH;

  const linePath = visibleHistory
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p).toFixed(2)}`)
    .join(' ');

  const lastX = toX(visibleHistory.length - 1);
  const lastY = toY(visibleHistory[visibleHistory.length - 1]);
  const firstX = toX(0).toFixed(2);
  const bottomY = (PADDING.top + innerH).toFixed(2);
  const areaPath = `${linePath} L${lastX.toFixed(2)},${bottomY} L${firstX},${bottomY} Z`;

  const currentPrice = visibleHistory[visibleHistory.length - 1];
  const firstPrice = visibleHistory[0];
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isPositive = priceChange >= 0;
  const accentColor = isPositive ? colors.ng : colors.nr;
  const gradientId = `grad_${isPositive ? 'g' : 'r'}`;

  const pulseR = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [3.5, 8] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  // Y-axis reference lines
  const yLabelX = PADDING.left + innerW + 4;
  const showMid = priceRange > maxPrice * 0.005; // show middle line if range > 0.5%
  const midPrice = (maxPrice + minPrice) / 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.currentPrice}>{formatUSD(currentPrice)}</Text>
        <View style={[styles.badge, isPositive ? styles.badgeUp : styles.badgeDn]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {isPositive ? '▲' : '▼'} {formatNumber(Math.abs(priceChange))}%
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

          {/* Y-axis reference lines */}
          <SvgLine
            x1={PADDING.left} y1={toY(maxPrice)}
            x2={PADDING.left + innerW} y2={toY(maxPrice)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
          <SvgLine
            x1={PADDING.left} y1={toY(minPrice)}
            x2={PADDING.left + innerW} y2={toY(minPrice)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
          {showMid && (
            <SvgLine
              x1={PADDING.left} y1={toY(midPrice)}
              x2={PADDING.left + innerW} y2={toY(midPrice)}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.5}
              strokeDasharray="2,4"
            />
          )}

          {/* Y-axis labels */}
          <SvgText
            x={yLabelX} y={toY(maxPrice) + 3}
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            fontFamily={fonts.mono}
          >
            {formatAxisPrice(maxPrice)}
          </SvgText>
          <SvgText
            x={yLabelX} y={toY(minPrice) + 3}
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
            fontFamily={fonts.mono}
          >
            {formatAxisPrice(minPrice)}
          </SvgText>
          {showMid && (
            <SvgText
              x={yLabelX} y={toY(midPrice) + 3}
              fill="rgba(255,255,255,0.25)"
              fontSize={9}
              fontFamily={fonts.mono}
            >
              {formatAxisPrice(midPrice)}
            </SvgText>
          )}

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

      {/* Time range selector chips */}
      <View style={styles.rangeRow}>
        {(['5m', '15m', '30m'] as TimeRange[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeChip, timeRange === r && styles.rangeChipActive]}
            onPress={() => setTimeRange(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rangeChipText, timeRange === r && styles.rangeChipTextActive]}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.xAxis}>
        {xLabels.map((label, i) => (
          <Text key={i} style={styles.xLabel}>{label}</Text>
        ))}
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
    fontFamily: fonts.orbitronBlack,
    fontSize: 26,
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
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  rangeChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rangeChipActive: {
    borderColor: colors.ng,
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  rangeChipText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.35)',
  },
  rangeChipTextActive: {
    color: colors.ng,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingRight: Y_LABEL_WIDTH,
  },
  xLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
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
