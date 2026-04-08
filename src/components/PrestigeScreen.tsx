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

type SubTab = 'prestige' | 'history' | 'badges';

const PrestigeScreen: React.FC = () => {
  const { gameState, dispatch, t, showToast } = useGame();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('prestige');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const prestigeLevel = gameState.prestigeLevel;
  const nextLevel = prestigeLevel + 1;
  const currentProductionBonus = Math.round(prestigeLevel * PRESTIGE_CONFIG.bonuses.productionBonus * 100);
  const currentClickBonus = Math.round(prestigeLevel * PRESTIGE_CONFIG.bonuses.clickBonus * 100);
  const nextProductionBonus = Math.round(nextLevel * PRESTIGE_CONFIG.bonuses.productionBonus * 100);
  const nextClickBonus = Math.round(nextLevel * PRESTIGE_CONFIG.bonuses.clickBonus * 100);
  const canDoPrestige = canPrestige(gameState);
  const prestigeHistory = gameState.prestigeHistory || [];
  const unlockedBadges = gameState.unlockedBadges || [];

  const handlePrestigePress = () => {
    if (!canDoPrestige) return;
    setConfirmModalVisible(true);
  };

  const handleConfirmPrestige = () => {
    dispatch({ type: 'DO_PRESTIGE' });
    setConfirmModalVisible(false);
    setConfirmText('');
    showToast(`✨ Prestige Level ${gameState.prestigeLevel + 1}! +${Math.round((gameState.prestigeLevel + 1) * 10)}% production`, 'success');
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmText('');
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const renderPrestigeTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Current Level Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('prestige.level')}</Text>
        <Text style={styles.levelText}>{prestigeLevel}</Text>
      </View>

      {/* Current Bonuses */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prestige.currentBonuses')}</Text>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.productionBoost')}</Text>
          <Text style={styles.bonusValueGreen}>+{currentProductionBonus}%</Text>
        </View>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.clickBoost')}</Text>
          <Text style={styles.bonusValueGreen}>+{currentClickBonus}%</Text>
        </View>
      </View>

      {/* Next Level Bonuses */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prestige.nextBonuses')} (Level {nextLevel})</Text>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.productionBoost')}</Text>
          <Text style={styles.bonusValueGold}>+{nextProductionBonus}%</Text>
        </View>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>{t('prestige.clickBoost')}</Text>
          <Text style={styles.bonusValueGold}>+{nextClickBonus}%</Text>
        </View>
      </View>

      {/* What You'll Keep */}
      <View style={[styles.card, styles.keepCard]}>
        <Text style={styles.keepTitle}>{t('prestige.willKeep')}</Text>
        <Text style={styles.keepItem}>- Prestige Level (+1)</Text>
        <Text style={styles.keepItem}>- Production multiplier (+10%)</Text>
        <Text style={styles.keepItem}>- Click multiplier (+5%)</Text>
        <Text style={styles.keepItem}>- Badges and run history</Text>
      </View>

      {/* What You'll Lose */}
      <View style={[styles.card, styles.loseCard]}>
        <Text style={styles.loseTitle}>{t('prestige.willLose')}</Text>
        <Text style={styles.loseItem}>- All CryptoCoins ({formatNumber(gameState.cryptoCoins)})</Text>
        <Text style={styles.loseItem}>- All Real Money ({formatUSD(gameState.realMoney)})</Text>
        <Text style={styles.loseItem}>- All Hardware (except Manual Mining)</Text>
        <Text style={styles.loseItem}>- All Upgrades</Text>
        <Text style={styles.loseItem}>- Unlocked tabs (reset)</Text>
      </View>

      {/* Requirement */}
      {!canDoPrestige && (
        <View style={styles.requirementCard}>
          <Text style={styles.requirementText}>{t('prestige.requireBlocks')}</Text>
          <Text style={styles.requirementProgress}>
            {formatNumber(gameState.blocksMined)} / {formatNumber(PRESTIGE_CONFIG.requirements.minBlocks)} blocks
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
          <Text style={styles.statLabel}>Blocks Mined</Text>
          <Text style={styles.statValue}>{formatNumber(gameState.blocksMined)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Coins Earned</Text>
          <Text style={styles.statValue}>{formatNumber(gameState.totalCryptoCoins)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Money Earned</Text>
          <Text style={styles.statValue}>{formatUSD(gameState.totalRealMoneyEarned)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Hardware Owned</Text>
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
              <Text style={styles.historyRunNumber}>Run #{run.runNumber}</Text>
              <Text style={styles.historyDuration}>{formatDuration(run.duration)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Prestige Level At End</Text>
              <Text style={styles.statValue}>{run.prestigeLevel}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Blocks Mined</Text>
              <Text style={styles.statValue}>{formatNumber(run.blocksMined)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Coins</Text>
              <Text style={styles.statValue}>{formatNumber(run.totalCoinsEarned)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Money Earned</Text>
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
                <Text style={styles.badgeLocked}>Locked</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const isConfirmValid = confirmText === PRESTIGE_CONFIG.confirmationText;

  return (
    <View style={styles.container}>
      {/* Sub-tab selector */}
      <View style={styles.subTabsContainer}>
        {(['prestige', 'history', 'badges'] as SubTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, activeSubTab === tab && styles.subTabActive]}
            onPress={() => setActiveSubTab(tab)}
          >
            <Text style={[styles.subTabText, activeSubTab === tab && styles.subTabTextActive]}>
              {tab === 'prestige' ? t('prestige.system') :
               tab === 'history' ? t('prestige.historyTab') :
               t('prestige.badgesTab')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeSubTab === 'prestige' && renderPrestigeTab()}
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
              <Text style={styles.modalLoseItem}>All CryptoCoins: {formatNumber(gameState.cryptoCoins)}</Text>
              <Text style={styles.modalLoseItem}>All Real Money: {formatUSD(gameState.realMoney)}</Text>
              <Text style={styles.modalLoseItem}>All Hardware and Upgrades</Text>
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
