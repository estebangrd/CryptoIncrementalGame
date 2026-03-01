import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { EnergySource } from '../types/game';
import {
  areNonRenewablesUnlocked,
  canBuildEnergySource,
  getEffectiveRenewableCap,
  calculateRenewableGeneratedMW,
} from '../utils/energyLogic';
import { ENERGY_CONFIG } from '../config/balanceConfig';

const formatMW = (mw: number): string => {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)}GW`;
  return `${mw.toFixed(0)}MW`;
};

const formatMoney = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
};

const EnergyScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const energy = gameState.energy;

  if (!energy) return null;

  const { totalGeneratedMW, totalRequiredMW, aiControlled } = energy;
  const balance = totalGeneratedMW - totalRequiredMW;
  const purchasedUpgrades = gameState.renewableCapUpgrades ?? [];
  const effectiveCap = getEffectiveRenewableCap(purchasedUpgrades);
  const nonRenewablesUnlocked = areNonRenewablesUnlocked(energy, effectiveCap);

  const getStatus = (): { label: string; color: string } => {
    if (totalRequiredMW === 0 || totalGeneratedMW >= totalRequiredMW) {
      return { label: t('energy.status.operational'), color: '#00ff88' };
    }
    if (totalGeneratedMW === 0) {
      return { label: t('energy.status.blackout'), color: '#ff4444' };
    }
    return { label: t('energy.status.partialBlackout'), color: '#ffaa00' };
  };

  const status = getStatus();

  const handleBuild = (sourceId: string) => {
    dispatch({ type: 'BUILD_ENERGY_SOURCE', payload: sourceId });
  };

  const handleDemolish = (sourceId: string) => {
    dispatch({ type: 'DEMOLISH_ENERGY_SOURCE', payload: sourceId });
  };

  const renderSource = (source: EnergySource) => {
    const currentRenewableMW = Object.values(energy.sources)
      .filter(s => s.isRenewable)
      .reduce((sum, s) => sum + s.quantity * s.mwPerUnit, 0);

    const canBuild = canBuildEnergySource(energy, source.id, gameState.realMoney, effectiveCap);
    const atRenewableCap = source.isRenewable &&
      currentRenewableMW + source.mwPerUnit > effectiveCap;
    const canDemolish = source.isRenewable && source.quantity > 0 && !aiControlled;
    const isAiLocked = !source.isRenewable && aiControlled;

    return (
      <View key={source.id} style={styles.sourceRow}>
        <Text style={styles.sourceIcon}>{source.icon}</Text>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName}>{t(source.nameKey)}</Text>
          <Text style={styles.sourceStats}>
            ×{source.quantity}  {formatMW(source.quantity * source.mwPerUnit)}
          </Text>
          <Text style={styles.sourceCost}>{formatMoney(source.costPerUnit)}/unit</Text>
        </View>
        <View style={styles.sourceActions}>
          <TouchableOpacity
            style={[styles.actionBtn, !canBuild && styles.actionBtnDisabled]}
            onPress={() => canBuild && handleBuild(source.id)}
            disabled={!canBuild}
          >
            <Text style={styles.actionBtnText}>
              {isAiLocked ? '🤖' : atRenewableCap ? '🔒' : '+'}
            </Text>
          </TouchableOpacity>
          {source.isRenewable && (
            <TouchableOpacity
              style={[styles.actionBtn, !canDemolish && styles.actionBtnDisabled]}
              onPress={() => canDemolish && handleDemolish(source.id)}
              disabled={!canDemolish}
            >
              <Text style={styles.actionBtnText}>-</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renewableSources = Object.values(energy.sources).filter(s => s.isRenewable);
  const nonRenewableSources = Object.values(energy.sources).filter(s => !s.isRenewable);

  const currentRenewableMW = calculateRenewableGeneratedMW(energy.sources);
  const renewableCapPct = Math.round((currentRenewableMW / effectiveCap) * 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Status Panel */}
      <View style={[styles.panel, { borderColor: status.color }]}>
        <View style={styles.panelRow}>
          <Text style={styles.label}>⚡ {t('energy.generated')}:</Text>
          <Text style={[styles.value, { color: status.color }]}>{formatMW(totalGeneratedMW)}</Text>
        </View>
        <View style={styles.panelRow}>
          <Text style={styles.label}>{t('energy.required')}:</Text>
          <Text style={styles.value}>{formatMW(totalRequiredMW)}</Text>
          <Text style={[styles.statusBadge, { color: status.color }]}>{status.label}</Text>
        </View>
        {balance !== 0 && (
          <View style={styles.panelRow}>
            <Text style={styles.label}>{balance >= 0 ? t('energy.surplus') : t('energy.deficit')}:</Text>
            <Text style={[styles.value, { color: balance >= 0 ? '#00ff88' : '#ff4444' }]}>
              {formatMW(Math.abs(balance))}
            </Text>
          </View>
        )}
        {gameState.planetResources < 100 && (
          <View style={styles.panelRow}>
            <Text style={styles.label}>{t('energy.planetResources')}:</Text>
            <Text style={[styles.value, { color: gameState.planetResources > 50 ? '#ffaa00' : '#ff4444' }]}>
              {gameState.planetResources.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>

      {/* Renewables Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('energy.renewables')}</Text>
        <Text style={styles.sectionCap}>
          {formatMW(currentRenewableMW)} / {formatMW(ENERGY_CONFIG.RENEWABLE_CAP_MW)} {t('energy.cap')}
          {' '}({renewableCapPct}%)
        </Text>
      </View>
      <View style={styles.sourceList}>
        {renewableSources.map(renderSource)}
      </View>

      {/* Renewable Upgrades Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('energy.renewableUpgrades')}</Text>
      </View>
      <View style={styles.sourceList}>
        {ENERGY_CONFIG.RENEWABLE_UPGRADES.map(upgrade => {
          const isPurchased = purchasedUpgrades.includes(upgrade.id);
          const prereqMet = !upgrade.requiresUpgrade || purchasedUpgrades.includes(upgrade.requiresUpgrade);
          const capAtThisPoint = getEffectiveRenewableCap(
            purchasedUpgrades.filter((_, i) =>
              ENERGY_CONFIG.RENEWABLE_UPGRADES.findIndex(u => u.id === upgrade.id) >
              ENERGY_CONFIG.RENEWABLE_UPGRADES.findIndex(u => u.id === purchasedUpgrades[i])
            )
          );
          // Cap before this upgrade = current effective cap if not yet purchased
          const capBefore = isPurchased
            ? effectiveCap - upgrade.capIncreaseMW
            : effectiveCap;
          const capAfter = capBefore + upgrade.capIncreaseMW;
          const renewableFull = currentRenewableMW >= capBefore;
          const canAfford = gameState.realMoney >= upgrade.cost;
          const canPurchase = !isPurchased && prereqMet && renewableFull && canAfford;

          return (
            <View key={upgrade.id} style={[styles.sourceRow, isPurchased && styles.sourceRowPurchased]}>
              <Text style={styles.sourceIcon}>{upgrade.icon}</Text>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{t(`energy.upgrade.${upgrade.id}`)}</Text>
                <Text style={styles.sourceStats}>
                  {formatMW(capBefore)} → {formatMW(capAfter)}
                </Text>
                {!isPurchased && (
                  <Text style={[styles.sourceCost, !prereqMet && styles.lockedText]}>
                    {!prereqMet
                      ? `🔒 ${t('energy.upgrade.requiresPrevious')}`
                      : !renewableFull
                      ? `${t('energy.upgrade.fillCapFirst')} (${renewableCapPct}%)`
                      : formatMoney(upgrade.cost)}
                  </Text>
                )}
              </View>
              <View style={styles.sourceActions}>
                {isPurchased ? (
                  <Text style={styles.purchasedBadge}>✓</Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, !canPurchase && styles.actionBtnDisabled]}
                    onPress={() => canPurchase && dispatch({ type: 'PURCHASE_RENEWABLE_UPGRADE', payload: upgrade.id })}
                    disabled={!canPurchase}
                  >
                    <Text style={[styles.actionBtnText, canPurchase && { color: '#000' }]}>$</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Non-Renewables Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('energy.nonRenewables')}</Text>
        {aiControlled && (
          <Text style={styles.aiLabel}>🤖 {t('energy.aiControlled')}</Text>
        )}
      </View>
      {nonRenewablesUnlocked ? (
        <View style={styles.sourceList}>
          {nonRenewableSources.map(renderSource)}
        </View>
      ) : (
        <View style={styles.lockedSection}>
          <Text style={styles.lockedText}>🔒 {t('energy.lockedHint')}</Text>
          <Text style={styles.lockedSubtext}>{renewableCapPct}% / 80%</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#2a2a2a',
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
  },
  sectionCap: {
    fontSize: 11,
    color: '#666',
  },
  aiLabel: {
    fontSize: 11,
    color: '#ffaa00',
  },
  sourceList: {
    marginBottom: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  sourceIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  sourceStats: {
    fontSize: 12,
    color: '#00ff88',
    marginTop: 2,
  },
  sourceCost: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  sourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: '#333',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sourceRowPurchased: {
    opacity: 0.5,
  },
  purchasedBadge: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: 'bold',
    width: 34,
    textAlign: 'center',
  },
  lockedSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  lockedText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  lockedSubtext: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
  },
});

export default EnergyScreen;
