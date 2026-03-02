import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const CHART_WIDTH = 280;
const CHART_HEIGHT = 110;
const PADDING = { top: 10, bottom: 10, left: 8, right: 8 };

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

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const toX = (i: number) => PADDING.left + (i / (priceHistory.length - 1)) * innerW;
  const toY = (p: number) => PADDING.top + (1 - (p - minPrice) / priceRange) * innerH;

  // Build smooth SVG path (linear segments)
  const linePath = priceHistory
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p).toFixed(2)}`)
    .join(' ');

  // Closed area path for gradient fill
  const lastX = toX(priceHistory.length - 1).toFixed(2);
  const firstX = toX(0).toFixed(2);
  const bottomY = (PADDING.top + innerH).toFixed(2);
  const areaPath = `${linePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;

  const currentPrice = priceHistory[priceHistory.length - 1];
  const firstPrice = priceHistory[0];
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isPositive = priceChange >= 0;
  const accentColor = isPositive ? '#00e676' : '#ff5252';
  const gradientId = isPositive ? 'greenGrad' : 'redGrad';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.currentPrice}>{formatPrice(currentPrice)}</Text>
        <View style={[styles.badge, { backgroundColor: isPositive ? '#00e67622' : '#ff525222' }]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Chart + Y labels */}
      <View style={styles.chartRow}>
        {/* SVG chart */}
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Gradient fill */}
          <Path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line */}
          <Path
            d={linePath}
            stroke={accentColor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{formatPrice(maxPrice)}</Text>
          <Text style={styles.yLabel}>{formatPrice((maxPrice + minPrice) / 2)}</Text>
          <Text style={styles.yLabel}>{formatPrice(minPrice)}</Text>
        </View>
      </View>

      {/* X-axis labels */}
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
    backgroundColor: '#1a1e2e',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxis: {
    marginLeft: 6,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: PADDING.top,
  },
  yLabel: {
    fontSize: 10,
    color: '#556',
    textAlign: 'right',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: PADDING.left,
  },
  xLabel: {
    fontSize: 10,
    color: '#556',
  },
  noDataText: {
    fontSize: 12,
    color: '#556',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default PriceChart;
