import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../contexts/GameContext';
import { BOOSTER_CONFIG } from '../config/balanceConfig';

const formatTimer = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};

const IAPBoosterBadges: React.FC = () => {
  const { gameState, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      dispatch({ type: 'CHECK_BOOSTER_EXPIRATION' });
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const { booster2x, booster5x, permanentMultiplierPurchased } = gameState.iapState;

  const b5xActive = booster5x.isActive && booster5x.expiresAt !== null && now < booster5x.expiresAt;
  const b2xActive = booster2x.isActive && booster2x.expiresAt !== null && now < booster2x.expiresAt;

  const b5xRemaining = b5xActive ? booster5x.expiresAt! - now : 0;
  const b2xRemaining = b2xActive ? booster2x.expiresAt! - now : 0;

  if (!permanentMultiplierPurchased && !b5xActive && !b2xActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      {permanentMultiplierPurchased && (
        <View style={[styles.badge, styles.badgePermanent]}>
          <Text style={styles.badgeText}>♾️ 2x</Text>
        </View>
      )}
      {b5xActive && (
        <View style={[styles.badge, styles.badge5x]}>
          <Text style={styles.badgeText}>🚀 5x</Text>
          <Text style={styles.timerText}>{formatTimer(b5xRemaining)}</Text>
        </View>
      )}
      {b2xActive && !b5xActive && (
        <View style={[styles.badge, styles.badge2x]}>
          <Text style={styles.badgeText}>⚡ 2x</Text>
          <Text style={styles.timerText}>{formatTimer(b2xRemaining)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgePermanent: {
    backgroundColor: '#1a3a28',
    borderColor: '#00ff88',
  },
  badge5x: {
    backgroundColor: '#2d1a4a',
    borderColor: '#a855f7',
  },
  badge2x: {
    backgroundColor: '#3a2e00',
    borderColor: '#FFD700',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timerText: {
    color: '#FFD700',
    fontSize: 10,
    marginTop: 1,
  },
});

export default IAPBoosterBadges;
