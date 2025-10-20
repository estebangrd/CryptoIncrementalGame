import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { formatNumber, calculateHardwareCost, canAffordHardware, calculateHardwareProduction, calculateHardwareElectricityCost, calculateHardwareMiningSpeed } from '../utils/gameLogic';

const HardwareList: React.FC = () => {
  const { gameState, dispatch, t } = useGame();

  const handleBuyHardware = (hardwareId: string) => {
    const hardware = gameState.hardware.find(h => h.id === hardwareId);
    if (!hardware) return;
    
    const cost = Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));
    
    if (gameState.realMoney >= cost) {
      dispatch({ type: 'BUY_HARDWARE_WITH_MONEY', payload: hardwareId });
    }
  };

  const getHardwareIcon = (iconName: string) => {
    // Return the icon directly since it's already an emoji in the new system
    return iconName;
  };

  return (
    <View style={styles.container}>
      {gameState.hardware
        .filter((hardware) => hardware.id !== 'manual_mining') // Ocultar manual mining permanentemente
        .map((hardware) => {
        const cost = Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));
        const canAfford = gameState.realMoney >= cost;
        const hashRate = calculateHardwareProduction(hardware, gameState.upgrades);
        const electricityCost = calculateHardwareElectricityCost(hardware);
        const miningSpeed = calculateHardwareMiningSpeed(hardware, gameState.upgrades);
        const coinsPerSecond = miningSpeed * hardware.blockReward;
        
        return (
          <View key={hardware.id} style={styles.hardwareItem}>
            <View style={styles.hardwareHeader}>
              <Text style={styles.hardwareIcon}>{getHardwareIcon(hardware.icon)}</Text>
              <View style={styles.hardwareInfo}>
                <Text style={styles.hardwareName}>{t(hardware.nameKey)}</Text>
                <Text style={styles.hardwareDescription}>{t(hardware.descriptionKey)}</Text>
              </View>
            </View>
            
            <View style={styles.hardwareStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Level {hardware.level}:</Text>
                <Text style={styles.statValue}>{hardware.owned} owned</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Hash Rate:</Text>
                <Text style={styles.statValue}>{formatNumber(hashRate)} H/s</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Mining Speed:</Text>
                <Text style={styles.statValue}>{formatNumber(miningSpeed)} blocks/sec</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Block Reward:</Text>
                <Text style={styles.statValue}>{formatNumber(hardware.blockReward)} coins</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Coins/sec:</Text>
                <Text style={styles.statValue}>{formatNumber(coinsPerSecond)}</Text>
              </View>
              {electricityCost > 0 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Electricity:</Text>
                  <Text style={styles.statValue}>-{formatNumber(electricityCost)}/sec</Text>
                </View>
              )}
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Cost:</Text>
                <Text style={[styles.statValue, !canAfford && styles.cannotAfford]}>
                  ${formatNumber(cost)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
              onPress={() => handleBuyHardware(hardware.id)}
              disabled={!canAfford}
            >
              <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDisabled]}>
                {t('ui.buy')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  hardwareItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hardwareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hardwareIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  hardwareInfo: {
    flex: 1,
  },
  hardwareName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  hardwareDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  hardwareStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '500',
  },
  cannotAfford: {
    color: '#ff4444',
  },
  buyButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#444',
  },
  buyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: '#888',
  },
});

export default HardwareList;
