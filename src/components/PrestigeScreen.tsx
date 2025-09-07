import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { canPrestige, calculatePrestigeGain, performPrestige, getPrestigeBonus, formatPrestigeGain } from '../utils/prestigeLogic';

const PrestigeScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();

  const handlePrestige = () => {
    const prestigeGain = calculatePrestigeGain(gameState);
    
    Alert.alert(
      'Prestige',
      `Are you sure you want to prestige?\n\nYou will gain ${formatPrestigeGain(prestigeGain)} prestige points.\n\nThis will reset all your progress but give you a permanent bonus!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Prestige',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'PERFORM_PRESTIGE' });
          },
        },
      ]
    );
  };

  const prestigeGain = calculatePrestigeGain(gameState);
  const canPerformPrestige = canPrestige(gameState);

  return (
    <View style={styles.container}>
      
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current Prestige Level:</Text>
          <Text style={styles.statValue}>{gameState.prestigeLevel}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Prestige Multiplier:</Text>
          <Text style={styles.statValue}>x{gameState.prestigeMultiplier.toFixed(2)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Prestige Gains:</Text>
          <Text style={styles.statValue}>{formatPrestigeGain(gameState.totalPrestigeGains || 0)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current Bonus:</Text>
          <Text style={styles.statValue}>{getPrestigeBonus(gameState.prestigeLevel)}</Text>
        </View>
      </View>

      <View style={styles.prestigeInfo}>
        <Text style={styles.infoTitle}>Prestige Gain</Text>
        <Text style={styles.prestigeGainText}>
          {formatPrestigeGain(prestigeGain)} points
        </Text>
        
        {prestigeGain > 0 && (
          <Text style={styles.infoText}>
            Prestiging will give you a permanent +{prestigeGain * 0.1}% bonus to all production!
          </Text>
        )}
        
        {prestigeGain === 0 && (
          <Text style={styles.infoText}>
            You need more total value to prestige. Keep mining and investing!
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.prestigeButton, !canPerformPrestige && styles.prestigeButtonDisabled]}
        onPress={handlePrestige}
        disabled={!canPerformPrestige}
      >
        <Text style={[styles.prestigeButtonText, !canPerformPrestige && styles.prestigeButtonTextDisabled]}>
          {canPerformPrestige ? 'PRESTIGE' : 'Not Available'}
        </Text>
      </TouchableOpacity>

      <View style={styles.warningContainer}>
        <Text style={styles.warningTitle}>⚠️ Warning</Text>
        <Text style={styles.warningText}>
          Prestiging will reset all your progress (currencies, hardware, upgrades) but give you permanent bonuses that make future progress faster.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },

  statsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  prestigeInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  prestigeGainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  prestigeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  prestigeButtonDisabled: {
    backgroundColor: '#444',
  },
  prestigeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prestigeButtonTextDisabled: {
    color: '#888',
  },
  warningContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffaa00',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffaa00',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});

export default PrestigeScreen;
