import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement } from '../types/game';

interface AchievementToastProps {
  achievement: Achievement | null;
  displayName: string;
  onDismiss: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  rare: '#4a9eff',
  epic: '#a855f7',
  legendary: '#FFD700',
};

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, displayName, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;

    // Reset values before animating
    translateY.setValue(-100);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(3000),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => onDismiss());
  }, [achievement, translateY, opacity, onDismiss]);

  if (!achievement) return null;

  const rarityColor = RARITY_COLORS[achievement.rarity] ?? '#888';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity, borderColor: rarityColor }]}>
      <TouchableOpacity onPress={onDismiss} style={styles.inner}>
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Achievement Unlocked!</Text>
          <Text style={[styles.name, { color: rarityColor }]} numberOfLines={1}>{displayName}</Text>
          {achievement.reward && (
            <Text style={styles.reward}>
              {achievement.reward.type === 'coins' ? `+${achievement.reward.amount} CryptoCoins` :
               achievement.reward.type === 'money' ? `+$${achievement.reward.amount}` :
               achievement.reward.type === 'multiplier' ? `${achievement.reward.multiplier}x production boost!` : ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reward: {
    fontSize: 12,
    color: '#00ff88',
  },
});

export default AchievementToast;
