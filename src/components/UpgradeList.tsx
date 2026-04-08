import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { formatUSDCompact, canAffordUpgrade, isUpgradeUnlocked } from '../utils/gameLogic';
import { isAIUnlocked, canPurchaseAILevel } from '../utils/aiLogic';
import { AI_CONFIG } from '../config/balanceConfig';
import { colors, fonts } from '../config/theme';

const AI_LEVEL_NAMES: Record<number, string> = {
  1: 'Asistente',
  2: 'Copiloto',
  3: 'Autónomo',
};

const AISection: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [confirmLevel3, setConfirmLevel3] = useState(false);

  const ai = gameState.ai;
  const aiUnlocked = isAIUnlocked(gameState);

  if (!aiUnlocked && ai.level === 0) return null;

  const handleBuyLevel = (level: 1 | 2 | 3) => {
    if (level === 3) {
      setConfirmLevel3(true);
      return;
    }
    if (canPurchaseAILevel(gameState, level)) {
      dispatch({ type: 'PURCHASE_AI_LEVEL', payload: { level } });
    }
  };

  const handleConfirmLevel3 = () => {
    setConfirmLevel3(false);
    dispatch({ type: 'PURCHASE_AI_LEVEL', payload: { level: 3, confirmed: true } });
  };

  const levels: Array<1 | 2 | 3> = [1, 2, 3];

  return (
    <View style={styles.aiSection}>
      <Text style={styles.aiSectionTitle}>{t('ai.section.title')}</Text>

      {ai.level >= 1 && (
        <View style={styles.logCard}>
          <Text style={styles.logTitle}>
            {t('ai.log.title')}
            {'  '}
            <Text style={styles.logLevelBadge}>
              [{t('ai.active.level')
                .replace('{{level}}', String(ai.level))
                .replace('{{name}}', AI_LEVEL_NAMES[ai.level] ?? '')}]
            </Text>
          </Text>
          {ai.logEntries.length === 0 ? (
            <Text style={styles.logEmpty}>{t('ai.log.empty')}</Text>
          ) : (
            ai.logEntries.slice(0, 5).map((entry, i) => (
              <Text key={i} style={[styles.logEntry, styles[`logEntry_${entry.type}`] as object]}>
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {'  '}{entry.message}
              </Text>
            ))
          )}
        </View>
      )}

      {levels.map(level => {
        const config = AI_CONFIG.LEVELS[level];
        const isPurchased = ai.level >= level;
        const canAfford = canPurchaseAILevel(gameState, level);
        const isLocked = !isPurchased && (level === 1 ? !aiUnlocked : ai.level < level - 1);
        const pctBonus = Math.round((config.productionMultiplier - 1) * 100);

        return (
          <View
            key={level}
            style={[
              styles.aiCard,
              isPurchased && styles.aiCardPurchased,
              isLocked && styles.aiCardLocked,
            ]}
          >
            <View style={styles.aiCardHeader}>
              <Text style={[styles.aiCardTitle, isLocked && styles.textMuted]}>
                {t(`ai.level${level}.name`)}
              </Text>
              {config.isIrreversible && !isPurchased && (
                <Text style={styles.irreversibleBadge}>{t('ai.irreversible.badge')}</Text>
              )}
              {isPurchased && <Text style={styles.ownedBadge}>✓ ACTIVE</Text>}
            </View>

            <Text style={[styles.aiCardDesc, isLocked && styles.textMuted]}>
              {t(`ai.level${level}.description`)}
            </Text>

            <View style={styles.aiCardStats}>
              <Text style={styles.aiCardBonus}>+{pctBonus}% {t('ai.production.bonus').replace('+{{pct}}% ', '')}</Text>
              <Text style={[styles.aiCardCost, !canAfford && !isPurchased && styles.cannotAfford]}>
                {formatUSDCompact(config.cost)}
              </Text>
            </View>

            {isLocked && (
              <Text style={styles.lockHint}>
                {level === 1
                  ? '🔒 ' + t('ai.requires.hardware')
                  : `🔒 ${t('ai.requires.level').replace('{{level}}', String(level - 1))}`}
              </Text>
            )}

            {!isPurchased && !isLocked && (
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  !canAfford && styles.buyButtonDisabled,
                  level === 3 && canAfford && styles.buyButtonDanger,
                ]}
                onPress={() => handleBuyLevel(level)}
                disabled={!canAfford}
                activeOpacity={0.7}
              >
                <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDim]}>
                  {t('ui.buy')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Modal visible={confirmLevel3} transparent animationType="fade" onRequestClose={() => setConfirmLevel3(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('ai.confirm.title')}</Text>
            <Text style={styles.modalMessage}>{t('ai.confirm.message')}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLevel3}>
              <Text style={styles.confirmButtonText}>{t('ai.confirm.button')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmLevel3(false)}>
              <Text style={styles.cancelButtonText}>{t('ai.confirm.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Section Header ─────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <View style={secStyles.row}>
    <Text style={secStyles.text}>{label}</Text>
    <View style={secStyles.line} />
  </View>
);

const secStyles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,214,0,0.2)',
  },
});

// ── UpgradeList ─────────────────────────────────────────────────────
const UpgradeList: React.FC = () => {
  const { gameState, dispatch, t } = useGame();

  const handleBuyUpgrade = (upgradeId: string) => {
    if (canAffordUpgrade(gameState, upgradeId)) {
      dispatch({ type: 'BUY_UPGRADE', payload: upgradeId });
    }
  };

  const getUpgradeIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      'mouse-pointer': '👆',
      cpu: '🖥️',
      gpu: '🎮',
    };
    return icons[iconName] || '⚡';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <AISection />

      <SectionHeader label="Research Lab" />

      {gameState.upgrades
        .filter((upgrade) => isUpgradeUnlocked(gameState, upgrade) || upgrade.purchased)
        .map((upgrade) => {
          const canAfford = canAffordUpgrade(gameState, upgrade.id);
          const isPurchased = upgrade.purchased;

          return (
            <View key={upgrade.id} style={[styles.upgradeCard, isPurchased && styles.upgradeCardOwned]}>
              {/* Top accent */}
              <View style={[styles.cardAccent, isPurchased && styles.cardAccentOwned]} />

              <View style={styles.upgradeHeader}>
                <View style={[styles.upgradeIconWrap, isPurchased && styles.upgradeIconWrapOwned]}>
                  <Text style={styles.upgradeIcon}>{getUpgradeIcon(upgrade.icon)}</Text>
                </View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{t(upgrade.nameKey)}</Text>
                  <Text style={styles.upgradeDesc}>{t(upgrade.descriptionKey)}</Text>
                </View>
              </View>

              <View style={styles.upgradeFooter}>
                <View>
                  <Text style={styles.upgradeCostLabel}>RESEARCH COST</Text>
                  <Text style={[
                    styles.upgradeCost,
                    !canAfford && !isPurchased && styles.cannotAfford,
                    isPurchased && styles.ownedCost,
                  ]}>
                    {formatUSDCompact(upgrade.cost)}
                  </Text>
                </View>

                {isPurchased ? (
                  <View style={styles.deployedBadge}>
                    <Text style={styles.deployedBadgeText}>✓ DEPLOYED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                    onPress={() => handleBuyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDim]}>
                      ACQUIRE
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    padding: 12,
    gap: 10,
  },
  // AI Section
  aiSection: {
    marginBottom: 8,
  },
  aiSectionTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: '#a855f7',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  logCard: {
    backgroundColor: 'rgba(168,85,247,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    padding: 10,
    marginBottom: 10,
  },
  logTitle: {
    fontFamily: fonts.rajdhaniBold,
    fontSize: 12,
    color: '#a855f7',
    marginBottom: 6,
  },
  logLevelBadge: {
    fontFamily: fonts.rajdhani,
    fontSize: 11,
    color: colors.dim,
    fontWeight: 'normal',
  },
  logEmpty: {
    fontFamily: fonts.rajdhani,
    fontSize: 12,
    color: colors.dim,
    fontStyle: 'italic',
  },
  logEntry: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: '#ccc',
    marginBottom: 2,
    lineHeight: 15,
  },
  logEntry_suggestion: { color: '#88ccff' },
  logEntry_action: { color: colors.ng },
  logEntry_warning: { color: colors.ny },
  logEntry_autonomous: { color: colors.nr },
  aiCard: {
    backgroundColor: 'rgba(168,85,247,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  aiCardPurchased: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  aiCardLocked: {
    opacity: 0.4,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiCardTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: '#e0c3fc',
    flex: 1,
  },
  irreversibleBadge: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.nr,
    fontWeight: 'bold',
  },
  ownedBadge: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: '#a855f7',
    fontWeight: 'bold',
  },
  aiCardDesc: {
    fontFamily: fonts.rajdhani,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
    marginBottom: 8,
  },
  aiCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiCardBonus: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: '#a855f7',
  },
  aiCardCost: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ng,
  },
  lockHint: {
    fontFamily: fonts.rajdhani,
    fontSize: 12,
    color: colors.dim,
    fontStyle: 'italic',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#120008',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.nr,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontFamily: fonts.orbitron,
    fontSize: 16,
    color: colors.nr,
    marginBottom: 14,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: fonts.rajdhani,
    fontSize: 14,
    color: '#ffaaaa',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#cc0000',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButtonText: {
    fontFamily: fonts.orbitron,
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: colors.bg2,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.rajdhani,
    color: colors.dim,
    fontSize: 14,
  },
  // Standard Upgrades
  upgradeCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 13,
    padding: 14,
    overflow: 'hidden',
  },
  upgradeCardOwned: {
    borderColor: 'rgba(0,255,136,0.18)',
    backgroundColor: 'rgba(0,255,136,0.025)',
    opacity: 0.75,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,214,0,0.5)',
  },
  cardAccentOwned: {
    backgroundColor: 'rgba(0,255,136,0.5)',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  upgradeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,214,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  upgradeIconWrapOwned: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderColor: 'rgba(0,255,136,0.2)',
  },
  upgradeIcon: {
    fontSize: 22,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontFamily: fonts.orbitron,
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 3,
  },
  upgradeDesc: {
    fontFamily: fonts.rajdhani,
    fontSize: 12,
    color: colors.dim,
    lineHeight: 16,
  },
  upgradeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  upgradeCostLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.dim,
    letterSpacing: 2,
    marginBottom: 2,
  },
  upgradeCost: {
    fontFamily: fonts.orbitron,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ny,
  },
  ownedCost: {
    color: colors.dim,
    fontSize: 13,
  },
  cannotAfford: {
    color: colors.nr,
  },
  deployedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  deployedBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.ng,
    letterSpacing: 1,
  },
  buyButton: {
    flex: 1,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.38)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,214,0,0.06)',
  },
  buyButtonDisabled: {
    borderColor: colors.borderDim,
    backgroundColor: 'transparent',
  },
  buyButtonDanger: {
    borderColor: colors.nr,
  },
  buyButtonText: {
    fontFamily: fonts.orbitron,
    fontSize: 11,
    color: colors.ny,
    fontWeight: '700',
    letterSpacing: 2,
  },
  buyButtonTextDim: {
    color: colors.dim,
  },
  textMuted: {
    color: '#555',
  },
});

export default UpgradeList;
