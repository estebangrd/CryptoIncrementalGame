import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { THEME } from '../styles/theme';
import { useGame } from '../contexts/GameContext';
import { formatNumber, canAffordUpgrade, isUpgradeUnlocked } from '../utils/gameLogic';
import { isAIUnlocked, canPurchaseAILevel } from '../utils/aiLogic';
import { AI_CONFIG } from '../config/balanceConfig';

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
      <Text style={styles.aiTitle}>{t('ai.section.title')}</Text>

      {/* AI Log (visible from level 1) */}
      {ai.level >= 1 && (
        <View style={styles.logContainer}>
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

      {/* AI Level Cards */}
      {levels.map(level => {
        const config = AI_CONFIG.LEVELS[level];
        const isPurchased = ai.level >= level;
        const canAfford = canPurchaseAILevel(gameState, level);
        const isLocked = !isPurchased && (
          level === 1 ? !aiUnlocked : ai.level < level - 1
        );
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
              <Text style={styles.aiCardBonus}>
                +{pctBonus}% {t('ai.production.bonus').replace('+{{pct}}% ', '')}
              </Text>
              <Text style={[styles.aiCardCost, !canAfford && !isPurchased && styles.cannotAfford]}>
                ${formatNumber(config.cost)}
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
              >
                <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDisabled]}>
                  {t('ui.buy')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Confirmation modal for Level 3 */}
      <Modal
        visible={confirmLevel3}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLevel3(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
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
    <ScrollView style={styles.container}>
      <AISection />

      {gameState.upgrades
        .filter((upgrade) => isUpgradeUnlocked(gameState, upgrade) || upgrade.purchased)
        .map((upgrade) => {
          const canAfford = canAffordUpgrade(gameState, upgrade.id);
          const isPurchased = upgrade.purchased;

          return (
            <View key={upgrade.id} style={styles.upgradeItem}>
              <View style={styles.upgradeHeader}>
                <Text style={styles.upgradeIcon}>{getUpgradeIcon(upgrade.icon)}</Text>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{t(upgrade.nameKey)}</Text>
                  <Text style={styles.upgradeDescription}>{t(upgrade.descriptionKey)}</Text>
                </View>
              </View>

              <View style={styles.upgradeStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>{t('ui.cost')}:</Text>
                  <Text style={[styles.statValue, !canAfford && !isPurchased && styles.cannotAfford]}>
                    ${formatNumber(upgrade.cost)}
                  </Text>
                </View>
                {isPurchased && (
                  <View style={styles.purchasedBadge}>
                    <Text style={styles.purchasedText}>✓ {t('ui.owned')}</Text>
                  </View>
                )}
              </View>

              {!isPurchased && (
                <TouchableOpacity
                  style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                  onPress={() => handleBuyUpgrade(upgrade.id)}
                  disabled={!canAfford}
                >
                  <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDisabled]}>
                    {t('ui.buy')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  // ── AI Section ──
  aiSection: {
    marginBottom: 24,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#a855f7',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  logContainer: {
    backgroundColor: 'rgba(168,85,247,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    padding: 10,
    marginBottom: 12,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#a855f7',
    marginBottom: 6,
  },
  logLevelBadge: {
    fontSize: 11,
    color: THEME.textDim,
    fontWeight: 'normal',
  },
  logEmpty: {
    fontSize: 12,
    color: THEME.textDim,
    fontStyle: 'italic',
  },
  logEntry: {
    fontSize: 11,
    color: THEME.textBody,
    marginBottom: 3,
    lineHeight: 16,
  },
  logEntry_suggestion: {
    color: '#88ccff',
  },
  logEntry_action: {
    color: THEME.neonGreen,
  },
  logEntry_warning: {
    color: THEME.neonYellow,
  },
  logEntry_autonomous: {
    color: THEME.neonRed,
  },
  aiCard: {
    backgroundColor: 'rgba(168,85,247,0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  aiCardPurchased: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  aiCardLocked: {
    opacity: 0.5,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0c3fc',
    flex: 1,
  },
  irreversibleBadge: {
    fontSize: 11,
    color: THEME.neonRed,
    fontWeight: 'bold',
  },
  ownedBadge: {
    fontSize: 11,
    color: '#a855f7',
    fontWeight: 'bold',
  },
  aiCardDesc: {
    fontSize: 13,
    color: THEME.textDim,
    lineHeight: 18,
    marginBottom: 10,
  },
  aiCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiCardBonus: {
    fontSize: 13,
    color: '#a855f7',
    fontWeight: '600',
  },
  aiCardCost: {
    fontSize: 13,
    color: THEME.neonGreen,
    fontWeight: '600',
  },
  lockHint: {
    fontSize: 12,
    color: THEME.textDim,
    fontStyle: 'italic',
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: 'rgba(2,8,16,0.98)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: THEME.neonRed,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.neonRed,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: THEME.textBody,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: 'rgba(255,61,90,0.2)',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.neonRed,
  },
  confirmButtonText: {
    color: THEME.neonRed,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.borderNeutral,
  },
  cancelButtonText: {
    color: THEME.textDim,
    fontSize: 14,
  },
  // ── Standard Upgrades ──
  upgradeItem: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.borderYellow,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textWhite,
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 13,
    color: THEME.textDim,
    lineHeight: 18,
  },
  upgradeStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.textDim,
  },
  statValue: {
    fontSize: 14,
    color: THEME.neonYellow,
    fontWeight: '600',
  },
  cannotAfford: {
    color: THEME.neonRed,
  },
  purchasedBadge: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: THEME.neonGreen,
  },
  purchasedText: {
    color: THEME.neonGreen,
    fontSize: 12,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: 'rgba(255,214,0,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.neonYellow,
  },
  buyButtonDisabled: {
    backgroundColor: 'transparent',
    borderColor: THEME.borderNeutral,
  },
  buyButtonDanger: {
    backgroundColor: 'rgba(255,61,90,0.15)',
    borderColor: THEME.neonRed,
  },
  buyButtonText: {
    color: THEME.neonYellow,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: THEME.textDim,
  },
  textMuted: {
    color: THEME.textDim,
  },
});

export default UpgradeList;
