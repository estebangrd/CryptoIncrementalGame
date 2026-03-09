import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { formatNumber, calculateHardwareProduction, calculateHardwareElectricityCost, calculateHardwareMiningSpeed, isHardwareUnlocked } from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

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

  return (
    <View style={styles.container}>
      {gameState.hardware
        .filter((hardware) => isHardwareUnlocked(gameState, hardware))
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
            <View key={hardware.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{hardware.icon}</Text>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardName}>{t(hardware.nameKey)}</Text>
                  <Text style={styles.cardDesc}>{t(hardware.descriptionKey)}</Text>
                </View>
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedNum}>{hardware.owned}</Text>
                  <Text style={styles.ownedLabel}>owned</Text>
                </View>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statsCell}>
                  <Text style={styles.statLabel}>HASH RATE</Text>
                  <Text style={[styles.statVal, styles.valGreen]}>{formatNumber(hashRate)}</Text>
                  <Text style={styles.statUnit}>H/s</Text>
                </View>
                <View style={styles.statsCell}>
                  <Text style={styles.statLabel}>COINS/SEC</Text>
                  <Text style={[styles.statVal, styles.valCyan]}>{formatNumber(coinsPerSecond)}</Text>
                  <Text style={styles.statUnit}>CC/s</Text>
                </View>
                <View style={styles.statsCell}>
                  <Text style={styles.statLabel}>SPEED</Text>
                  <Text style={styles.statVal}>{formatNumber(miningSpeed)}</Text>
                  <Text style={styles.statUnit}>blk/s</Text>
                </View>
                {electricityCost > 0 && (
                  <View style={styles.statsCell}>
                    <Text style={styles.statLabel}>POWER</Text>
                    <Text style={[styles.statVal, styles.valRed]}>-{formatNumber(electricityCost)}</Text>
                    <Text style={styles.statUnit}>/s</Text>
                  </View>
                )}
              </View>

              {/* Delta row */}
              <View style={styles.deltaRow}>
                <Text style={styles.deltaPrefix}>+1 unit → </Text>
                <Text style={styles.deltaGreen}>+{formatNumber(deltaCoinsPerSec)} CC/s</Text>
                <Text style={styles.deltaDim}> · </Text>
                <Text style={styles.deltaDim}>+{formatNumber(deltaHashRate)} H/s</Text>
                {deltaElectricity > 0 && (
                  <>
                    <Text style={styles.deltaDim}> · </Text>
                    <Text style={styles.deltaRed}>-{formatNumber(deltaElectricity)} pwr</Text>
                  </>
                )}
              </View>

              {/* Buy button */}
              <TouchableOpacity
                style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                onPress={() => handleBuyHardware(hardware.id)}
                disabled={!canAfford}
                activeOpacity={0.7}
              >
                <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDim]}>
                  {canAfford ? `BUY  $${formatNumber(cost)}` : `NEED  $${formatNumber(cost)}`}
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
    padding: 12,
    gap: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardName: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
    color: colors.dim,
    lineHeight: 15,
  },
  ownedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownedNum: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.ng,
    lineHeight: 22,
  },
  ownedLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 9,
    color: colors.dim,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  statsCell: {
    flex: 1,
    backgroundColor: colors.bg2,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.rajdhani,
    fontSize: 8,
    color: colors.dim,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statVal: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: '#fff',
  },
  valGreen: { color: colors.ng },
  valCyan: { color: colors.nc },
  valRed: { color: colors.nr },
  statUnit: {
    fontFamily: fonts.rajdhani,
    fontSize: 8,
    color: colors.dim,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: colors.bg2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
  },
  deltaPrefix: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
    color: colors.dim,
  },
  deltaGreen: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ng,
  },
  deltaDim: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.dim,
  },
  deltaRed: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.nr,
  },
  buyButton: {
    borderWidth: 1.5,
    borderColor: colors.ng,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buyButtonDisabled: {
    borderColor: colors.borderDim,
  },
  buyButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: colors.ng,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buyButtonTextDim: {
    color: colors.dim,
  },
});

export default HardwareList;
