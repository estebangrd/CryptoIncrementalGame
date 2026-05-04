import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { canPrestige } from '../utils/prestigeLogic';
import { formatNumber, formatUSD } from '../utils/gameLogic';
import { PRESTIGE_CONFIG } from '../config/balanceConfig';
import { ALL_BADGES } from '../data/badges';
import { PrestigeRun } from '../types/game';
import SkillTreeScreen from './SkillTreeScreen';
import {
  calculateAvailableSkillPoints,
  isSkillTreeMastered,
  calculateMasteryLevel,
  getTotalTreeCost,
  sumPurchasedCost,
  getBranchBonusPercent,
} from '../utils/skillTreeLogic';

type SubTab = 'prestige' | 'skillTree' | 'history' | 'badges';

const PrestigeScreen: React.FC = () => {
  const { gameState, dispatch, t, showToast } = useGame();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('prestige');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const prestigeLevel = gameState.prestigeLevel;
  const canDoPrestige = canPrestige(gameState);
  const prestigeHistory = gameState.prestigeHistory || [];
  const unlockedBadges = gameState.unlockedBadges || [];

  // Mastery: bonuses kick in only after the player has fully purchased the skill tree.
  const mastered = isSkillTreeMastered(gameState.prestigeSkillTree);
  const masteryLevel = calculateMasteryLevel(gameState);
  const masteryProductionBonus = Math.round(masteryLevel * PRESTIGE_CONFIG.bonuses.productionBonus * 100);
  const masteryClickBonus = Math.round(masteryLevel * PRESTIGE_CONFIG.bonuses.clickBonus * 100);
  const nextMasteryLevel = masteryLevel + 1;
  const nextMasteryProductionBonus = Math.round(nextMasteryLevel * PRESTIGE_CONFIG.bonuses.productionBonus * 100);
  const nextMasteryClickBonus = Math.round(nextMasteryLevel * PRESTIGE_CONFIG.bonuses.clickBonus * 100);

  // Pre-mastery progress: total points spent across the tree vs total cost.
  const treeTotalCost = getTotalTreeCost();
  const treePointsSpent = gameState.prestigeSkillTree
    ? sumPurchasedCost(gameState.prestigeSkillTree)
    : 0;
  const treeProgressPct = Math.min(100, Math.round((treePointsSpent / treeTotalCost) * 100));

  // Active skill tree bonuses (consolidated by branch).
  const skillTreeHardwarePct = getBranchBonusPercent(gameState, 'hardware');
  const skillTreeMarketPct = getBranchBonusPercent(gameState, 'market');
  const skillTreeClickPct = getBranchBonusPercent(gameState, 'click');

  const handlePrestigePress = () => {
    if (!canDoPrestige) return;
    setConfirmModalVisible(true);
  };

  const handleConfirmPrestige = () => {
    dispatch({ type: 'DO_PRESTIGE' });
    setConfirmModalVisible(false);
    setConfirmText('');
    showToast(t('prestigeScreen.toastSuccess').replace('{level}', String(gameState.prestigeLevel + 1)), 'success');
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmText('');
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    const totalH = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (totalH >= 24) {
      const d = Math.floor(totalH / 24);
      const h = totalH % 24;
      return `${d}d ${h}h ${m}m`;
    }
    return `${totalH}h ${m}m`;
  };

  const renderPrestigeTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Current Level Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('prestige.level')}</Text>
        <Text style={styles.levelText}>{prestigeLevel}</Text>
      </View>

      {/* Mastery progress (pre-completion) or active mastery card (post-completion) */}
      {!mastered ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('prestige.mastery.progressTitle')}</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${treeProgressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>{treePointsSpent} / {treeTotalCost}</Text>
          <Text style={styles.masteryHint}>{t('prestige.mastery.progressBody')}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, styles.masteryCard]}>
            <Text style={styles.masteryTitle}>✓ {t('prestige.mastery.completedTitle')}</Text>
            <Text style={styles.masteryHint}>{t('prestige.mastery.completedBody')}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('prestige.mastery.bonusesTitle').replace('{level}', String(masteryLevel))}
            </Text>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>{t('prestige.productionBoost')}</Text>
              <Text style={styles.bonusValueGreen}>+{masteryProductionBonus}%</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>{t('prestige.clickBoost')}</Text>
              <Text style={styles.bonusValueGreen}>+{masteryClickBonus}%</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('prestige.mastery.nextTitle').replace('{level}', String(nextMasteryLevel))}
            </Text>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>{t('prestige.productionBoost')}</Text>
              <Text style={styles.bonusValueGold}>+{nextMasteryProductionBonus}%</Text>
            </View>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>{t('prestige.clickBoost')}</Text>
              <Text style={styles.bonusValueGold}>+{nextMasteryClickBonus}%</Text>
            </View>
          </View>
        </>
      )}

      {/* Active Skill Tree Bonuses (always visible, derived from purchased nodes) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prestige.skillTreeBonusesTitle')}</Text>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.skillTreeBonus.hardware')}</Text>
          <Text style={skillTreeHardwarePct > 0 ? styles.bonusValueGreen : styles.bonusValueDim}>+{skillTreeHardwarePct}%</Text>
        </View>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.skillTreeBonus.market')}</Text>
          <Text style={skillTreeMarketPct > 0 ? styles.bonusValueGreen : styles.bonusValueDim}>+{skillTreeMarketPct}%</Text>
        </View>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.skillTreeBonus.click')}</Text>
          <Text style={skillTreeClickPct > 0 ? styles.bonusValueGreen : styles.bonusValueDim}>+{skillTreeClickPct}%</Text>
        </View>
      </View>

      {/* What You'll Keep */}
      <View style={[styles.card, styles.keepCard]}>
        <Text style={styles.keepTitle}>{t('prestige.willKeep')}</Text>
        <Text style={styles.keepItem}>{t('prestigeScreen.keepLevel')}</Text>
        <Text style={styles.keepItem}>{t('prestigeScreen.keepProduction')}</Text>
        <Text style={styles.keepItem}>{t('prestigeScreen.keepClick')}</Text>
        <Text style={styles.keepItem}>{t('prestigeScreen.keepBadges')}</Text>
      </View>

      {/* What You'll Lose */}
      <View style={[styles.card, styles.loseCard]}>
        <Text style={styles.loseTitle}>{t('prestige.willLose')}</Text>
        <Text style={styles.loseItem}>{t('prestigeScreen.loseAllCC').replace('{amount}', formatNumber(gameState.cryptoCoins))}</Text>
        <Text style={styles.loseItem}>{t('prestigeScreen.loseAllMoney').replace('{amount}', formatUSD(gameState.realMoney))}</Text>
        <Text style={styles.loseItem}>{t('prestigeScreen.loseAllHardware')}</Text>
        <Text style={styles.loseItem}>{t('prestigeScreen.loseAllUpgrades')}</Text>
        <Text style={styles.loseItem}>{t('prestigeScreen.loseUnlockedTabs')}</Text>
      </View>

      {/* Requirement */}
      {!canDoPrestige && (
        <View style={styles.requirementCard}>
          <Text style={styles.requirementText}>{t('prestige.requireBlocks')}</Text>
          <Text style={styles.requirementProgress}>
            {t('prestigeScreen.requirementBlocks')
              .replace('{current}', formatNumber(gameState.blocksMined))
              .replace('{required}', formatNumber(PRESTIGE_CONFIG.requirements.minBlocks))}
          </Text>
        </View>
      )}

      {/* Prestige Button */}
      <TouchableOpacity
        style={[styles.prestigeButton, !canDoPrestige && styles.prestigeButtonDisabled]}
        onPress={handlePrestigePress}
        disabled={!canDoPrestige}
      >
        <Text style={[styles.prestigeButtonText, !canDoPrestige && styles.prestigeButtonTextDisabled]}>
          {canDoPrestige ? t('prestige.prestigeNow') : t('prestige.notAvailable')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Current Run Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prestige.currentRun')}</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('blockStatus.blocksMined')}</Text>
          <Text style={styles.statValue}>{formatNumber(gameState.blocksMined)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('prestigeScreen.coinsEarned')}</Text>
          <Text style={styles.statValue}>{formatNumber(gameState.totalCryptoCoins)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('prestigeScreen.moneyEarned')}</Text>
          <Text style={styles.statValue}>{formatUSD(gameState.totalRealMoneyEarned)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('prestigeScreen.hardwareOwned')}</Text>
          <Text style={styles.statValue}>
            {gameState.hardware.reduce((sum, hw) => sum + hw.owned, 0)}
          </Text>
        </View>
      </View>

      {/* History */}
      {prestigeHistory.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('prestige.noHistory')}</Text>
        </View>
      ) : (
        prestigeHistory.slice().reverse().map((run: PrestigeRun) => (
          <View key={run.runNumber} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyRunNumber}>{t('prestigeScreen.runNumber').replace('{n}', String(run.runNumber))}</Text>
              <Text style={styles.historyDuration}>{formatDuration(run.duration)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('prestigeScreen.prestigeLevelAtEnd')}</Text>
              <Text style={styles.statValue}>{run.prestigeLevel}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('blockStatus.blocksMined')}</Text>
              <Text style={styles.statValue}>{formatNumber(run.blocksMined)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('prestigeScreen.totalCoins')}</Text>
              <Text style={styles.statValue}>{formatNumber(run.totalCoinsEarned)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('prestigeScreen.moneyEarned')}</Text>
              <Text style={styles.statValue}>{formatUSD(run.totalMoneyEarned)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderBadgesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.badgesGrid}>
        {ALL_BADGES.map(badge => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const isHidden = badge.hidden && !isUnlocked;
          return (
            <View
              key={badge.id}
              style={[styles.badgeCard, isUnlocked && styles.badgeCardUnlocked]}
            >
              <Text style={styles.badgeIcon}>{isHidden ? '?' : badge.icon}</Text>
              <Text style={[styles.badgeName, isUnlocked && styles.badgeNameUnlocked]}>
                {isHidden ? '???' : t(badge.nameKey)}
              </Text>
              {!isHidden && (
                <Text style={styles.badgeDesc}>{t(badge.descriptionKey)}</Text>
              )}
              {isUnlocked && badge.reward && badge.reward.type !== 'none' && (
                <Text style={styles.badgeReward}>
                  {badge.reward.type === 'production' ? 'x' + badge.reward.value + ' Prod' : 'x' + badge.reward.value + ' Click'}
                </Text>
              )}
              {!isUnlocked && !isHidden && (
                <Text style={styles.badgeLocked}>{t('achievements.locked')}</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const isConfirmValid = confirmText === PRESTIGE_CONFIG.confirmationText;
  const skillTreeUnlocked = prestigeLevel >= 1;
  const availableSkillPoints = skillTreeUnlocked ? calculateAvailableSkillPoints(gameState) : 0;
  const visibleSubTabs: SubTab[] = skillTreeUnlocked
    ? ['prestige', 'skillTree', 'history', 'badges']
    : ['prestige', 'history', 'badges'];

  return (
    <View style={styles.container}>
      {/* Sub-tab selector */}
      <View style={styles.subTabsContainer}>
        {visibleSubTabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, activeSubTab === tab && styles.subTabActive]}
            onPress={() => setActiveSubTab(tab)}
          >
            <Text style={[styles.subTabText, activeSubTab === tab && styles.subTabTextActive]}>
              {tab === 'prestige' ? t('prestige.system') :
               tab === 'skillTree' ? t('skillTree.tabName') :
               tab === 'history' ? t('prestige.historyTab') :
               t('prestige.badgesTab')}
            </Text>
            {tab === 'skillTree' && availableSkillPoints > 0 && (
              <View style={styles.skillTreeBadge}>
                <Text style={styles.skillTreeBadgeText}>{availableSkillPoints}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={activeSubTab === 'skillTree' ? styles.contentFlush : styles.content}>
        {activeSubTab === 'prestige' && renderPrestigeTab()}
        {activeSubTab === 'skillTree' && <SkillTreeScreen />}
        {activeSubTab === 'history' && renderHistoryTab()}
        {activeSubTab === 'badges' && renderBadgesTab()}
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('prestige.confirmTitle')}</Text>
            <Text style={styles.modalWarning}>{t('prestige.confirmWarning')}</Text>

            <View style={styles.modalLoseList}>
              <Text style={styles.modalLoseItem}>{t('prestigeScreen.allCryptoCoins').replace('{amount}', formatNumber(gameState.cryptoCoins))}</Text>
              <Text style={styles.modalLoseItem}>{t('prestigeScreen.allRealMoney').replace('{amount}', formatUSD(gameState.realMoney))}</Text>
              <Text style={styles.modalLoseItem}>{t('prestigeScreen.allHardwareUpgrades')}</Text>
            </View>

            <Text style={styles.modalTypeLabel}>{t('prestige.typeToConfirm')}</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="PRESTIGE"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelConfirm}
              >
                <Text style={styles.modalCancelText}>{t('prestige.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, !isConfirmValid && styles.modalConfirmButtonDisabled]}
                onPress={handleConfirmPrestige}
                disabled={!isConfirmValid}
              >
                <Text style={[styles.modalConfirmText, !isConfirmValid && styles.modalConfirmTextDisabled]}>
                  {t('prestige.confirmButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00ff88',
  },
  subTabText: {
    fontSize: 12,
    color: '#888',
  },
  subTabTextActive: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentFlush: {
    flex: 1,
  },
  skillTreeBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00e5ff',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillTreeBadgeText: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  levelText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bonusLabel: {
    fontSize: 13,
    color: '#888',
  },
  bonusValueGreen: {
    fontSize: 13,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  bonusValueGold: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  bonusValueDim: {
    fontSize: 13,
    color: '#555',
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00e5ff',
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  masteryHint: {
    fontSize: 12,
    color: '#888',
  },
  masteryCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#00e5ff',
  },
  masteryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00e5ff',
    marginBottom: 4,
  },
  keepCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#00ff88',
  },
  keepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 8,
  },
  keepItem: {
    fontSize: 13,
    color: '#aaffcc',
    marginBottom: 4,
  },
  loseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
  },
  loseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 8,
  },
  loseItem: {
    fontSize: 13,
    color: '#ffaaaa',
    marginBottom: 4,
  },
  requirementCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  requirementText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  requirementProgress: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  prestigeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  prestigeButtonDisabled: {
    backgroundColor: '#444',
  },
  prestigeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  prestigeButtonTextDisabled: {
    color: '#888',
  },
  // History tab
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  statValue: {
    fontSize: 13,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
  historyCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyRunNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  historyDuration: {
    fontSize: 13,
    color: '#888',
  },
  // Badges tab
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeCardUnlocked: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2200',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameUnlocked: {
    color: '#FFD700',
  },
  badgeDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeReward: {
    fontSize: 10,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  badgeLocked: {
    fontSize: 10,
    color: '#555',
    fontStyle: 'italic',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalLoseList: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalLoseItem: {
    fontSize: 13,
    color: '#ffaaaa',
    marginBottom: 4,
  },
  modalTypeLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#444',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalConfirmTextDisabled: {
    color: '#888',
  },
});

export default PrestigeScreen;
