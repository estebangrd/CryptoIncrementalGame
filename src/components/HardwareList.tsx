import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { THEME } from '../styles/theme';
import { useGame } from '../contexts/GameContext';
import { formatNumber, calculateHardwareCost, canAffordHardware, calculateHardwareProduction, calculateHardwareElectricityCost, calculateHardwareMiningSpeed, isHardwareUnlocked } from '../utils/gameLogic';

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
        .filter((hardware) => isHardwareUnlocked(gameState, hardware)) // Solo mostrar hardware desbloqueado
        .map((hardware) => {
        const cost = Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));
        const canAfford = gameState.realMoney >= cost;
        const hashRate = calculateHardwareProduction(hardware, gameState.upgrades);
        const electricityCost = calculateHardwareElectricityCost(hardware);
        const miningSpeed = calculateHardwareMiningSpeed(hardware, gameState.upgrades);
        const coinsPerSecond = miningSpeed * hardware.blockReward;

        const unitHardware = { ...hardware, owned: 1 };
        const deltaHashRate = calculateHardwareProduction(unitHardware, gameState.upgrades);
        const deltaMiningSpeed = calculateHardwareMiningSpeed(unitHardware, gameState.upgrades);
        const deltaCoinsPerSec = deltaMiningSpeed * hardware.blockReward;
        const deltaElectricity = hardware.electricityCost;
        
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
            
            <View style={styles.deltaRow}>
              <Text style={styles.deltaLabel}>+1 adds: </Text>
              <Text style={styles.deltaCoins}>+{formatNumber(deltaCoinsPerSec)} coins/s</Text>
              <Text style={styles.deltaSeparator}> · </Text>
              <Text style={styles.deltaHash}>+{formatNumber(deltaHashRate)} H/s</Text>
              {deltaElectricity > 0 && (
                <>
                  <Text style={styles.deltaSeparator}> · </Text>
                  <Text style={styles.deltaElec}>-{formatNumber(deltaElectricity)} elec</Text>
                </>
              )}
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
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.borderCyan,
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
    color: THEME.textWhite,
    marginBottom: 4,
  },
  hardwareDescription: {
    fontSize: 13,
    color: THEME.textDim,
    lineHeight: 18,
  },
  hardwareStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 7,
  },
  statLabel: {
    fontSize: 11,
    color: THEME.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    color: THEME.neonCyan,
    fontWeight: 'bold',
  },
  cannotAfford: {
    color: THEME.neonRed,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,229,255,0.04)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  deltaLabel: {
    fontSize: 12,
    color: THEME.textDim,
  },
  deltaCoins: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.neonGreen,
  },
  deltaHash: {
    fontSize: 12,
    color: THEME.textBody,
  },
  deltaSeparator: {
    fontSize: 12,
    color: THEME.borderNeutral,
  },
  deltaElec: {
    fontSize: 12,
    color: THEME.neonRed,
  },
  buyButton: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.neonGreen,
  },
  buyButtonDisabled: {
    backgroundColor: 'transparent',
    borderColor: THEME.borderNeutral,
  },
  buyButtonText: {
    color: THEME.neonGreen,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: THEME.textDim,
  },
});

export default HardwareList;
