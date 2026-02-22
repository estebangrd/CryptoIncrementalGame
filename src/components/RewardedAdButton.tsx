import React, { useEffect, useState, useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { useGame } from '../contexts/GameContext';
import { showRewardedAd, isRewardedAdReady } from '../services/AdMobService';
import { BOOSTER_CONFIG } from '../config/balanceConfig';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const RewardedAdButton: React.FC = () => {
  const { gameState, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      // Check if boost expired
      if (
        gameState.adBoost.isActive &&
        gameState.adBoost.expiresAt !== null &&
        Date.now() >= gameState.adBoost.expiresAt
      ) {
        dispatch({ type: 'EXPIRE_AD_BOOST' });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.adBoost, dispatch]);

  const cooldownMs = BOOSTER_CONFIG.REWARDED_AD_BOOST.cooldownMs;

  const isInCooldown = (): boolean => {
    if (!gameState.adBoost.lastWatchedAt) return false;
    return now - gameState.adBoost.lastWatchedAt < cooldownMs;
  };

  const cooldownRemaining = (): number => {
    if (!gameState.adBoost.lastWatchedAt) return 0;
    return Math.max(0, cooldownMs - (now - gameState.adBoost.lastWatchedAt));
  };

  const boostRemaining = (): number => {
    if (!gameState.adBoost.expiresAt) return 0;
    return Math.max(0, gameState.adBoost.expiresAt - now);
  };

  const handleWatchAd = useCallback(() => {
    const inCooldown = gameState.adBoost.lastWatchedAt
      ? now - gameState.adBoost.lastWatchedAt < cooldownMs
      : false;
    const cooldownLeft = gameState.adBoost.lastWatchedAt
      ? Math.max(0, cooldownMs - (now - gameState.adBoost.lastWatchedAt))
      : 0;
    const boostLeft = gameState.adBoost.expiresAt
      ? Math.max(0, gameState.adBoost.expiresAt - now)
      : 0;

    if (inCooldown) {
      Alert.alert('Cooldown activo', `Próximo ad disponible en ${formatTime(cooldownLeft)}`);
      return;
    }

    const doShowAd = () => {
      if (!isRewardedAdReady()) {
        Alert.alert('Ad no disponible', 'Intenta de nuevo en un momento.');
        return;
      }
      showRewardedAd(
        () => {
          dispatch({ type: 'ACTIVATE_AD_BOOST' });
          Alert.alert('¡Boost activado!', 'Producción 2x por 4 horas.');
        },
        undefined,
      );
    };

    if (gameState.adBoost.isActive) {
      Alert.alert(
        'Boost ya activo',
        `Ya tienes un boost 2x activo (${formatTime(boostLeft)} restantes).\n\nVer otro ad REEMPLAZARÁ el boost actual, no se sumará.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver ad de todas formas', onPress: doShowAd },
        ],
      );
    } else {
      doShowAd();
    }
  }, [gameState.adBoost, cooldownMs, now, dispatch]);

  const getButtonStyle = () => {
    if (gameState.adBoost.isActive) return [styles.button, styles.buttonActive];
    if (isInCooldown()) return [styles.button, styles.buttonCooldown];
    return [styles.button, styles.buttonAvailable];
  };

  const renderContent = () => {
    if (gameState.adBoost.isActive) {
      return (
        <View style={styles.content}>
          <Text style={styles.label}>⚡ 2x Boost</Text>
          <Text style={styles.timer}>{formatTime(boostRemaining())}</Text>
        </View>
      );
    }
    if (isInCooldown()) {
      return (
        <View style={styles.content}>
          <Text style={styles.label}>🎬 Next ad in</Text>
          <Text style={styles.timer}>{formatTime(cooldownRemaining())}</Text>
        </View>
      );
    }
    return <Text style={styles.label}>🎬 2x Boost (Watch Ad)</Text>;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleWatchAd}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonAvailable: {
    backgroundColor: '#1a6b3a',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  buttonActive: {
    backgroundColor: '#7a5c00',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  buttonCooldown: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  content: {
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timer: {
    color: '#FFD700',
    fontSize: 11,
    marginTop: 1,
  },
});

export default RewardedAdButton;
