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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a855f7',
    letterSpacing: 1,
    marginBottom: 12,
  },
  logContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a855f740',
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
    color: '#888',
    fontWeight: 'normal',
  },
  logEmpty: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  logEntry: {
    fontSize: 11,
    color: '#ccc',
    marginBottom: 3,
    lineHeight: 16,
  },
  logEntry_suggestion: {
    color: '#88ccff',
  },
  logEntry_action: {
    color: '#88ffcc',
  },
  logEntry_warning: {
    color: '#ffcc44',
  },
  logEntry_autonomous: {
    color: '#ff6688',
  },
  aiCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a855f730',
  },
  aiCardPurchased: {
    borderColor: '#a855f7',
    backgroundColor: '#1e1030',
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
    color: '#ff4444',
    fontWeight: 'bold',
  },
  ownedBadge: {
    fontSize: 11,
    color: '#a855f7',
    fontWeight: 'bold',
  },
  aiCardDesc: {
    fontSize: 13,
    color: '#aaa',
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
    color: '#00ff88',
    fontWeight: '600',
  },
  lockHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#1a0010',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff4444',
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#ffaaaa',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#cc0000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#aaa',
    fontSize: 14,
  },
  // ── Standard Upgrades ──
  upgradeItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    color: '#fff',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
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
  purchasedBadge: {
    backgroundColor: '#00ff88',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  purchasedText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
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
  buyButtonDanger: {
    backgroundColor: '#cc2200',
  },
  buyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: '#888',
  },
  textMuted: {
    color: '#555',
  },
});

export default UpgradeList;
