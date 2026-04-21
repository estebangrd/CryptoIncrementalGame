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
import { SkillNode, SkillTreeBranch } from '../types/game';
import {
  calculateAvailableSkillPoints,
  canPurchaseNode,
  findSkillNode,
  getBranchBonusPercent,
  hasPurchasedNodes,
} from '../utils/skillTreeLogic';
import { SKILL_TREE_CONFIG } from '../config/balanceConfig';

const BRANCH_COLORS: Record<SkillTreeBranch, string> = {
  hardware: '#00ff88',
  market: '#ffd600',
  click: '#00e5ff',
};

const BRANCH_LABEL_KEY: Record<SkillTreeBranch, string> = {
  hardware: 'skillTree.branchHardware',
  market: 'skillTree.branchMarket',
  click: 'skillTree.branchClick',
};

const SkillTreeScreen: React.FC = () => {
  const { gameState, dispatch, t, showToast } = useGame();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const tree = gameState.prestigeSkillTree;
  const available = calculateAvailableSkillPoints(gameState);
  const earned = gameState.prestigeLevel * SKILL_TREE_CONFIG.POINTS_PER_PRESTIGE;
  const lost = tree?.lostPoints ?? 0;
  const canReset = !!tree && hasPurchasedNodes(tree);

  const selectedNode = selectedNodeId && tree ? findSkillNode(tree, selectedNodeId) : undefined;

  const handleNodePress = (node: SkillNode) => {
    if (!canPurchaseNode(gameState, node.id)) return;
    setSelectedNodeId(node.id);
  };

  const handleConfirmPurchase = () => {
    if (!selectedNodeId) return;
    dispatch({ type: 'PURCHASE_SKILL_NODE', payload: { nodeId: selectedNodeId } });
    showToast(t('skillTree.toast.purchased'), 'success');
    setSelectedNodeId(null);
  };

  const handleConfirmReset = () => {
    dispatch({ type: 'RESET_SKILL_TREE' });
    showToast(t('skillTree.toast.reset'), 'warning');
    setResetModalVisible(false);
  };

  const purchasedCount = tree ? tree.nodes.filter(n => n.purchased).length : 0;

  const renderBranch = (branch: SkillTreeBranch) => {
    if (!tree) return null;
    const branchNodes = tree.nodes
      .filter(n => n.branch === branch)
      .sort((a, b) => b.position - a.position); // render top (6) → bottom (1)
    const color = BRANCH_COLORS[branch];
    const branchBonus = getBranchBonusPercent(gameState, branch);

    return (
      <View key={branch} style={styles.branchColumn}>
        <View style={[styles.branchHeader, { borderColor: color }]}>
          <Text style={[styles.branchName, { color }]}>
            {t(BRANCH_LABEL_KEY[branch])}
          </Text>
          <Text style={[styles.branchBonus, { color }]}>+{branchBonus}%</Text>
        </View>
        {branchNodes.map((node, idx) => {
          const canBuy = canPurchaseNode(gameState, node.id);
          const purchased = node.purchased;
          const isLast = idx === branchNodes.length - 1;
          return (
            <View key={node.id} style={styles.nodeWrapper}>
              <TouchableOpacity
                style={[
                  styles.node,
                  { borderColor: purchased ? color : canBuy ? color : '#333' },
                  purchased && { backgroundColor: color + '20' },
                  !purchased && !canBuy && styles.nodeLocked,
                ]}
                onPress={() => handleNodePress(node)}
                disabled={!canBuy}
              >
                <Text
                  style={[
                    styles.nodeValue,
                    { color: purchased ? color : canBuy ? color : '#555' },
                  ]}
                >
                  +{Math.round(node.value * 100)}%
                </Text>
                <Text
                  style={[
                    styles.nodeStatus,
                    { color: purchased ? color : canBuy ? '#aaa' : '#555' },
                  ]}
                >
                  {purchased
                    ? t('skillTree.owned')
                    : canBuy
                      ? t('skillTree.costLabel')
                      : t('skillTree.locked')}
                </Text>
              </TouchableOpacity>
              {!isLast && <View style={[styles.connector, { backgroundColor: color + '40' }]} />}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerStat}>
            <Text style={styles.headerLabel}>{t('skillTree.available')}</Text>
            <Text
              style={[
                styles.headerValue,
                available > 0 ? styles.headerValueHot : styles.headerValueDim,
              ]}
            >
              {available}
            </Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={styles.headerLabel}>{t('skillTree.totalEarned')}</Text>
            <Text style={styles.headerValue}>{earned}</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={styles.headerLabel}>{t('skillTree.lostPoints')}</Text>
            <Text style={[styles.headerValue, styles.headerValueLost]}>{lost}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.resetButton, !canReset && styles.resetButtonDisabled]}
          onPress={() => setResetModalVisible(true)}
          disabled={!canReset}
        >
          <Text style={[styles.resetButtonText, !canReset && styles.resetButtonTextDisabled]}>
            {t('skillTree.resetButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tree */}
      <ScrollView
        contentContainerStyle={styles.treeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.treeRow}>
          {SKILL_TREE_CONFIG.BRANCHES.map(branch => renderBranch(branch as SkillTreeBranch))}
        </View>
      </ScrollView>

      {/* Purchase confirmation modal */}
      <Modal
        visible={!!selectedNode}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNodeId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedNode && (
              <>
                <Text style={[styles.modalTitle, { color: BRANCH_COLORS[selectedNode.branch] }]}>
                  {t(selectedNode.nameKey)}
                </Text>
                <Text style={styles.modalDesc}>{t(selectedNode.descriptionKey)}</Text>
                <Text style={styles.modalCost}>{t('skillTree.costLabel')}</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setSelectedNodeId(null)}
                  >
                    <Text style={styles.modalCancelText}>{t('skillTree.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmButton,
                      { backgroundColor: BRANCH_COLORS[selectedNode.branch] },
                    ]}
                    onPress={handleConfirmPurchase}
                  >
                    <Text style={styles.modalConfirmText}>{t('skillTree.learn')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reset confirmation modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, styles.modalTitleWarning]}>
              {t('skillTree.resetTitle')}
            </Text>
            <Text style={styles.modalWarning}>{t('skillTree.resetWarning')}</Text>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>{t('skillTree.resetRefundLabel')}</Text>
              <Text style={styles.modalInfoValue}>{purchasedCount}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>{t('skillTree.resetLostAfter')}</Text>
              <Text style={styles.modalInfoValueLost}>
                {lost} → {lost + SKILL_TREE_CONFIG.RESPEC_COST}
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>{t('skillTree.resetAvailableAfter')}</Text>
              <Text style={styles.modalInfoValue}>
                {Math.max(0, earned - (lost + SKILL_TREE_CONFIG.RESPEC_COST))}
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('skillTree.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, styles.modalResetButton]}
                onPress={handleConfirmReset}
              >
                <Text style={styles.modalResetText}>{t('skillTree.resetConfirm')}</Text>
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
  headerCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    margin: 12,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerValueHot: {
    color: '#00e5ff',
  },
  headerValueDim: {
    color: '#666',
  },
  headerValueLost: {
    color: '#ff6b6b',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    borderColor: '#444',
  },
  resetButtonText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resetButtonTextDisabled: {
    color: '#555',
  },
  treeContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  treeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  branchColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  branchHeader: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 2,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  branchName: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  branchBonus: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  nodeWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  node: {
    width: '100%',
    backgroundColor: '#222',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  nodeLocked: {
    opacity: 0.5,
  },
  nodeValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  nodeStatus: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  connector: {
    width: 2,
    height: 14,
  },
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
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTitleWarning: {
    color: '#ff4444',
  },
  modalDesc: {
    fontSize: 14,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalCost: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalWarning: {
    fontSize: 13,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#888',
  },
  modalInfoValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalInfoValueLost: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalConfirmButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalResetButton: {
    backgroundColor: '#ff4444',
  },
  modalResetText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default SkillTreeScreen;
