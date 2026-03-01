import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceChartProps {
  priceHistory: number[];
}

const formatPrice = (price: number): string => {
  if (price >= 100) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
};

const PriceChart: React.FC<PriceChartProps> = ({ priceHistory }) => {
  if (!priceHistory || priceHistory.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No price data available</Text>
      </View>
    );
  }

  const maxPrice = Math.max(...priceHistory);
  const minPrice = Math.min(...priceHistory);
  const priceRange = maxPrice - minPrice;

  const getPointY = (price: number) => {
    if (priceRange === 0) return 50; // Middle if no range
    return 100 - ((price - minPrice) / priceRange) * 80; // 80% of height, 10% margin top/bottom
  };

  const currentPrice = priceHistory[priceHistory.length - 1];
  const previousPrice = priceHistory[priceHistory.length - 2];
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const isPositive = priceChange >= 0;

  // Generate price points for visualization
  const pricePoints = priceHistory.map((price, index) => {
    const x = (index / (priceHistory.length - 1)) * 100;
    const y = getPointY(price);
    return { x, y, price };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Price Evolution (24h)</Text>
        <Text style={[styles.priceChange, { color: isPositive ? '#00ff88' : '#ff4444' }]}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </Text>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          <View style={styles.chartBackground}>
            {/* Price trend indicator */}
            <View style={styles.trendLine}>
              {pricePoints.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = pricePoints[index - 1];
                const isUp = point.price > prevPoint.price;
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.trendSegment,
                      {
                        backgroundColor: isUp ? '#00ff88' : '#ff4444',
                        left: `${prevPoint.x}%`,
                        width: `${point.x - prevPoint.x}%`,
                        height: 2,
                        top: '50%',
                      }
                    ]}
                  />
                );
              })}
            </View>
            
            {/* Price points */}
            {pricePoints.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.pricePoint,
                  {
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    backgroundColor: index === pricePoints.length - 1 ? '#00ff88' : '#666',
                  }
                ]}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Current: {formatPrice(currentPrice)}</Text>
          <Text style={styles.priceLabel}>Min: {formatPrice(minPrice)}</Text>
          <Text style={styles.priceLabel}>Max: {formatPrice(maxPrice)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chart: {
    flex: 1,
    height: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBackground: {
    flex: 1,
    position: 'relative',
  },
  trendLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trendSegment: {
    position: 'absolute',
    marginTop: -1,
  },
  pricePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    marginTop: -2,
  },
  priceInfo: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  noDataText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PriceChart;
