import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import {
  formatNumber,
  calculateHardwareProduction,
  calculateHardwareElectricityCost,
  calculateHardwareMiningSpeed,
  isHardwareUnlocked,
} from '../utils/gameLogic';
import { colors, fonts } from '../config/theme';

// ── Section Header ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <View style={hdrStyles.row}>
    <Text style={hdrStyles.text}>{label}</Text>
    <View style={hdrStyles.line} />
  </View>
);
const hdrStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, paddingBottom: 10 },
  text: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(0,229,255,0.2)' },
});

// ── Metric Cell ─────────────────────────────────────────────────────────────
type DeltaType = 'pos' | 'neg' | 'zero';
const MetricCell: React.FC<{
  label: string;
  value: string;
  unit: string;
  delta: string;
  valueColor: string;
  deltaType: DeltaType;
  noBorder?: boolean;
}> = ({ label, value, unit, delta, valueColor, deltaType, noBorder }) => (
  <View style={[m.cell, !noBorder && m.cellDivider]}>
    <Text style={m.label}>{label}</Text>
    <Text style={[m.value, { color: valueColor }]}>{value}</Text>
    <Text style={m.unit}>{unit}</Text>
    <View style={[m.badge, deltaType === 'pos' ? m.badgePos : deltaType === 'neg' ? m.badgeNeg : m.badgeZero]}>
      <Text style={[m.badgeText, deltaType === 'pos' ? m.badgeTextPos : deltaType === 'neg' ? m.badgeTextNeg : m.badgeTextZero]}>
        {delta}
      </Text>
    </View>
  </View>
);
const m = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  cellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 7,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'center',
  },
  unit: {
    fontFamily: fonts.mono,
    fontSize: 7,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgePos: { backgroundColor: 'rgba(0,255,136,0.10)', borderColor: 'rgba(0,255,136,0.22)' },
  badgeNeg: { backgroundColor: 'rgba(255,61,90,0.10)', borderColor: 'rgba(255,61,90,0.22)' },
  badgeZero: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeTextPos: { color: colors.ng },
  badgeTextNeg: { color: colors.nr },
  badgeTextZero: { color: 'rgba(255,255,255,0.3)' },
});

// ── HardwareList ─────────────────────────────────────────────────────────────
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

          // Current totals
          const hashRate = calculateHardwareProduction(hardware, gameState.upgrades);
          const electricityCost = calculateHardwareElectricityCost(hardware);
          const miningSpeed = calculateHardwareMiningSpeed(hardware, gameState.upgrades);
          const coinsPerSecond = miningSpeed * hardware.blockReward;

          // +1 unit deltas
          const unitHardware = { ...hardware, owned: 1 };
          const deltaHashRate = calculateHardwareProduction(unitHardware, gameState.upgrades);
          const deltaMiningSpeed = calculateHardwareMiningSpeed(unitHardware, gameState.upgrades);
          const deltaCoinsPerSec = deltaMiningSpeed * hardware.blockReward;
          const deltaElectricity = hardware.electricityCost;

          return (
            <View key={hardware.id} style={[styles.card, hasUnits && styles.cardOwned]}>
              {/* Top gradient accent */}
              <View style={[styles.cardAccent, hasUnits ? styles.cardAccentOwned : styles.cardAccentBase]} />

              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, hasUnits && styles.iconWrapOwned]}>
                  <Text style={styles.icon}>{hardware.icon}</Text>
                </View>
                <View style={styles.titleGroup}>
                  <Text style={styles.hwName}>{t(hardware.nameKey)}</Text>
                  <Text style={styles.hwDesc}>{t(hardware.descriptionKey)}</Text>
                </View>
                <View style={[styles.ownedBadge, !hasUnits && styles.ownedBadgeDim]}>
                  <Text style={[styles.ownedNum, !hasUnits && styles.ownedNumDim]}>{hardware.owned}</Text>
                  <Text style={[styles.ownedLbl, !hasUnits && styles.ownedLblDim]}>OWNED</Text>
                </View>
              </View>

              {/* Metrics grid */}
              <View style={styles.metricsGrid}>
                <MetricCell
                  noBorder
                  label="Reward"
                  value={formatNumber(hasUnits ? hardware.blockReward : 0)}
                  unit="CC/blk"
                  delta="—"
                  valueColor={colors.ny}
                  deltaType="zero"
                />
                <MetricCell
                  label="Hash Rate"
                  value={formatNumber(hashRate)}
                  unit="H/s"
                  delta={`+${formatNumber(deltaHashRate)}`}
                  valueColor={colors.nc}
                  deltaType="pos"
                />
                <MetricCell
                  label="Mine Spd"
                  value={formatNumber(miningSpeed)}
                  unit="blk/s"
                  delta={`+${formatNumber(deltaMiningSpeed)}`}
                  valueColor={colors.nc}
                  deltaType="pos"
                />
                <MetricCell
                  label="Coins/s"
                  value={formatNumber(coinsPerSecond)}
                  unit="CC/s"
                  delta={`+${formatNumber(deltaCoinsPerSec)}`}
                  valueColor={colors.ng}
                  deltaType="pos"
                />
                <MetricCell
                  label="Power"
                  value={electricityCost > 0 ? `-${formatNumber(electricityCost)}` : '0'}
                  unit="$/s"
                  delta={deltaElectricity > 0 ? `-${formatNumber(deltaElectricity)}` : '0'}
                  valueColor={colors.nr}
                  deltaType={deltaElectricity > 0 ? 'neg' : 'zero'}
                />
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>PURCHASE COST</Text>
                  <Text style={[styles.costValue, !canAfford && styles.costValueRed]}>
                    ${formatNumber(cost)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                  onPress={() => handleBuyHardware(hardware.id)}
                  disabled={!canAfford}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.buyBtnText, !canAfford && styles.buyBtnTextDim]}>
                    {canAfford ? '⬡ BUY UNIT' : '⊘ INSUFFICIENT FUNDS'}
                  </Text>
                </TouchableOpacity>
              </View>
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

  // ── Card ──
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardOwned: {
    borderColor: 'rgba(0,255,136,0.20)',
  },

  // Gradient accent bar at top
  cardAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
  },
  cardAccentBase: {
    backgroundColor: colors.nc,
    opacity: 0.5,
  },
  cardAccentOwned: {
    backgroundColor: colors.ng,
    opacity: 0.5,
  },

  // ── Header ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    marginTop: 4,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapOwned: {
    backgroundColor: 'rgba(0,255,136,0.07)',
    borderColor: 'rgba(0,255,136,0.20)',
  },
  icon: {
    fontSize: 22,
  },
  titleGroup: {
    flex: 1,
  },
  hwName: {
    fontFamily: fonts.orbitron,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  hwDesc: {
    fontFamily: fonts.rajdhani,
    fontSize: 12,
    color: colors.dim,
    lineHeight: 15,
  },
  ownedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
    minWidth: 52,
  },
  ownedBadgeDim: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ownedNum: {
    fontFamily: fonts.orbitron,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ng,
    lineHeight: 22,
  },
  ownedNumDim: {
    color: colors.dim,
    fontSize: 16,
  },
  ownedLbl: {
    fontFamily: fonts.mono,
    fontSize: 7,
    letterSpacing: 2,
    color: 'rgba(0,255,136,0.55)',
  },
  ownedLblDim: {
    color: 'rgba(255,255,255,0.3)',
  },

  // ── Metrics grid ──
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
  },

  // ── Footer ──
  footer: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: colors.dim,
  },
  costValue: {
    fontFamily: fonts.orbitron,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ny,
  },
  costValueRed: {
    color: colors.nr,
  },
  buyBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: 'rgba(0,255,136,0.06)',
    borderWidth: 1,
    borderColor: colors.ng,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  buyBtnText: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ng,
    letterSpacing: 3,
  },
  buyBtnTextDim: {
    color: colors.dim,
    letterSpacing: 1,
  },
});

export default HardwareList;
