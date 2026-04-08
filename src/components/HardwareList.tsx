import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import {
  formatNumber,
  formatUSDCompact,
  calculateHardwareProduction,
  calculateHardwareElectricityCost,
  calculateHardwareMiningSpeed,
  isHardwareUnlocked,
  getConstrainedMiningSpeed,
} from '../utils/gameLogic';
import { calculateDifficulty, calculateCurrentReward } from '../utils/blockLogic';
import { ELECTRICITY_FEE_CONFIG } from '../config/balanceConfig';
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
          const feeActive = ELECTRICITY_FEE_CONFIG.RATE_PERCENT > 0;
          const isDisabled = feeActive && hardware.isEnabled === false;

          // Current totals (for display, compute as-if enabled so metrics always show)
          const displayHw = { ...hardware, isEnabled: undefined };
          const hashRate = calculateHardwareProduction(displayHw, gameState.upgrades);
          const electricityCost = calculateHardwareElectricityCost(displayHw);
          const miningSpeed = calculateHardwareMiningSpeed(displayHw, gameState.upgrades);
          // Global formula: CC/sec = (miningSpeed / difficulty) × globalBlockReward
          const difficulty = calculateDifficulty(getConstrainedMiningSpeed(gameState));
          const globalReward = calculateCurrentReward(gameState.blocksMined);
          const coinsPerSecond = (miningSpeed / difficulty) * globalReward;

          // Per-tier fee in CC/s
          const tierFeeCC = hardware.electricityCost * hardware.owned * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100;
          const isUnprofitable = hasUnits && tierFeeCC > coinsPerSecond && coinsPerSecond > 0;
          const lossPerSec = tierFeeCC - coinsPerSecond;

          // +1 unit deltas
          const unitHardware = { ...hardware, owned: 1, isEnabled: undefined };
          const deltaHashRate = calculateHardwareProduction(unitHardware, gameState.upgrades);
          const deltaMiningSpeed = calculateHardwareMiningSpeed(unitHardware, gameState.upgrades);
          const deltaCoinsPerSec = (deltaMiningSpeed / difficulty) * globalReward;
          const deltaElectricity = hardware.electricityCost;

          return (
            <View key={hardware.id} style={[
              styles.card,
              hasUnits && !isDisabled && styles.cardOwned,
              isDisabled && styles.cardDisabled,
            ]}>
              {/* Top gradient accent */}
              <View style={[
                styles.cardAccent,
                isDisabled
                  ? styles.cardAccentDisabled
                  : hasUnits ? styles.cardAccentOwned : styles.cardAccentBase,
              ]} />

              {/* Unprofitable warning strip */}
              {isUnprofitable && !isDisabled && (
                <View style={styles.warningStrip}>
                  <Text style={styles.warningText}>
                    {`\u26A0 ${t('hardware.unprofitable')} \u2014 ${t('hardware.unprofitableLosing')} ${formatNumber(lossPerSec)} CC/s`}
                  </Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconWrap,
                  hasUnits && !isDisabled && styles.iconWrapOwned,
                  isDisabled && styles.iconWrapDisabled,
                ]}>
                  <Text style={[styles.icon, isDisabled && styles.iconDisabled]}>{hardware.icon}</Text>
                </View>
                <View style={styles.titleGroup}>
                  <Text style={[styles.hwName, isDisabled && styles.textDimmed]}>{t(hardware.nameKey)}</Text>
                  <Text style={styles.hwDesc}>{t(hardware.descriptionKey)}</Text>
                </View>
                <View style={styles.ownedToggleCol}>
                  <View style={[
                    styles.ownedBadge,
                    !hasUnits && styles.ownedBadgeDim,
                    isDisabled && styles.ownedBadgeOff,
                  ]}>
                    <Text style={[styles.ownedNum, !hasUnits && styles.ownedNumDim, isDisabled && styles.ownedNumOff]}>
                      {hardware.owned}
                    </Text>
                    <Text style={[styles.ownedLbl, !hasUnits && styles.ownedLblDim, isDisabled && styles.ownedLblOff]}>
                      {isDisabled ? t('hardware.toggleOff') : 'OWNED'}
                    </Text>
                  </View>
                  {hasUnits && feeActive && (
                    <Switch
                      value={!isDisabled}
                      onValueChange={() => dispatch({ type: 'TOGGLE_HARDWARE', payload: hardware.id })}
                      trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(0,255,136,0.35)' }}
                      thumbColor={isDisabled ? '#666' : colors.ng}
                      style={styles.toggle}
                    />
                  )}
                </View>
              </View>

              {/* Metrics grid */}
              <View style={styles.metricsGrid}>
                <MetricCell
                  noBorder
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
                  unit="kW/h"
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
                    {formatUSDCompact(cost)}
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
  cardDisabled: {
    borderColor: 'rgba(255,255,255,0.06)',
    opacity: 0.55,
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
  cardAccentDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    opacity: 0.5,
  },

  // Warning strip
  warningStrip: {
    backgroundColor: 'rgba(255,61,90,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,61,90,0.25)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 2,
  },
  warningText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    color: '#ff3d5a',
    textAlign: 'center',
    letterSpacing: 1,
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
  iconWrapDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  icon: {
    fontSize: 22,
  },
  iconDisabled: {
    opacity: 0.4,
  },
  textDimmed: {
    opacity: 0.5,
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
  ownedBadgeOff: {
    backgroundColor: 'rgba(255,61,90,0.10)',
    borderColor: 'rgba(255,61,90,0.25)',
  },
  ownedNumOff: {
    color: '#ff3d5a',
  },
  ownedLblOff: {
    color: 'rgba(255,61,90,0.6)',
  },
  ownedToggleCol: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  toggle: {
    transform: [{ scale: 0.8 }],
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
