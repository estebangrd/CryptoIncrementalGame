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

// ── Section Header ─────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <View style={hdrStyles.row}>
    <Text style={hdrStyles.text}>{label}</Text>
    <View style={hdrStyles.line} />
  </View>
);

const hdrStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.2)',
  },
});

// ── HardwareList ───────────────────────────────────────────────────
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
      <SectionHeader label="Mining Rigs" />

      {gameState.hardware
        .filter((hardware) => isHardwareUnlocked(gameState, hardware))
        .map((hardware) => {
          const cost = Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned));
          const canAfford = gameState.realMoney >= cost;
          const hasUnits = hardware.owned > 0;
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
            <View key={hardware.id} style={[styles.card, hasUnits && styles.cardOwned]}>
              {/* Top accent line */}
              <View style={[styles.cardAccent, hasUnits && styles.cardAccentOwned]} />

              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, hasUnits && styles.cardIconWrapOwned]}>
                  <Text style={styles.cardIcon}>{hardware.icon}</Text>
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardName}>{t(hardware.nameKey)}</Text>
                  <Text style={styles.cardDesc}>{t(hardware.descriptionKey)}</Text>
                </View>
                <View style={[styles.ownedBadge, hasUnits && styles.ownedBadgeActive]}>
                  <Text style={[styles.ownedNum, hasUnits && styles.ownedNumActive]}>{hardware.owned}</Text>
                  <Text style={styles.ownedLabel}>OWNED</Text>
                </View>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <View style={styles.statsCell}>
                    <Text style={styles.statLabel}>HASH RATE</Text>
                    <Text style={[styles.statVal, styles.valCyan]}>{formatNumber(hashRate)}</Text>
                    <Text style={styles.statUnit}>H/s</Text>
                  </View>
                  <View style={styles.statsCell}>
                    <Text style={styles.statLabel}>MINE SPEED</Text>
                    <Text style={[styles.statVal, styles.valGreen]}>{formatNumber(miningSpeed)}</Text>
                    <Text style={styles.statUnit}>blk/s</Text>
                  </View>
                  <View style={styles.statsCell}>
                    <Text style={styles.statLabel}>REWARD</Text>
                    <Text style={[styles.statVal, styles.valGreen]}>{formatNumber(hardware.blockReward)}</Text>
                    <Text style={styles.statUnit}>CC/blk</Text>
                  </View>
                  <View style={styles.statsCell}>
                    <Text style={styles.statLabel}>COINS/SEC</Text>
                    <Text style={[styles.statVal, styles.valGreen]}>{formatNumber(coinsPerSecond)}</Text>
                    <Text style={styles.statUnit}>CC/s</Text>
                  </View>
                  {electricityCost > 0 && (
                    <View style={styles.statsCell}>
                      <Text style={styles.statLabel}>ELECTRICITY</Text>
                      <Text style={[styles.statVal, styles.valRed]}>-{formatNumber(electricityCost)}</Text>
                      <Text style={styles.statUnit}>/s</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Preview row */}
              <View style={styles.previewRow}>
                <Text style={styles.previewPrefix}>+1 ADDS: </Text>
                <Text style={styles.previewGreen}>+{formatNumber(deltaCoinsPerSec)} CC/s</Text>
                <Text style={styles.previewDim}> · </Text>
                <Text style={styles.previewCyan}>+{formatNumber(deltaHashRate)} H/s</Text>
                {deltaElectricity > 0 && (
                  <>
                    <Text style={styles.previewDim}> · </Text>
                    <Text style={styles.previewRed}>-{formatNumber(deltaElectricity)} elec</Text>
                  </>
                )}
              </View>

              {/* Cost + Buy */}
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>PURCHASE COST</Text>
                <Text style={[styles.costVal, !canAfford && styles.costValRed]}>${formatNumber(cost)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                onPress={() => handleBuyHardware(hardware.id)}
                disabled={!canAfford}
                activeOpacity={0.7}
              >
                <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDim]}>
                  ⬡ {canAfford ? 'BUY UNIT' : 'INSUFFICIENT FUNDS'}
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 13,
    padding: 14,
    overflow: 'hidden',
  },
  cardOwned: {
    borderColor: 'rgba(0,255,136,0.18)',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,229,255,0.5)',
  },
  cardAccentOwned: {
    backgroundColor: 'rgba(0,255,136,0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    gap: 10,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconWrapOwned: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderColor: 'rgba(0,255,136,0.2)',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardName: {
    fontFamily: fonts.orbitron,
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
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
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.22)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  ownedBadgeActive: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderColor: 'rgba(0,255,136,0.25)',
  },
  ownedNum: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.nc,
    lineHeight: 22,
  },
  ownedNumActive: {
    color: colors.ng,
  },
  ownedLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.dim,
    letterSpacing: 1,
  },
  statsGrid: {
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  statsCell: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 7,
    padding: 6,
    alignItems: 'flex-start',
    minWidth: 70,
    flex: 1,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.dim,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statVal: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  valGreen: { color: colors.ng },
  valCyan: { color: colors.nc },
  valRed: { color: colors.nr },
  statUnit: {
    fontFamily: fonts.rajdhani,
    fontSize: 9,
    color: colors.dim,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,229,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  previewPrefix: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.dim,
    letterSpacing: 1,
  },
  previewGreen: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.ng,
  },
  previewCyan: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.nc,
  },
  previewDim: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.dim,
  },
  previewRed: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.nr,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  costLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.dim,
    letterSpacing: 2,
  },
  costVal: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ny,
  },
  costValRed: {
    color: colors.nr,
  },
  buyButton: {
    borderWidth: 1,
    borderColor: colors.ng,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.06)',
    shadowColor: colors.ng,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buyButtonDisabled: {
    borderColor: colors.borderDim,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
  },
  buyButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: colors.ng,
    fontWeight: '700',
    letterSpacing: 3,
  },
  buyButtonTextDim: {
    color: colors.dim,
    letterSpacing: 1,
  },
});

export default HardwareList;
