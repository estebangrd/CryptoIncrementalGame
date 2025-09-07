import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameState } from '../types/game';
import { formatBlockInfo, calculateBlockTime } from '../utils/blockLogic';
import { formatNumber } from '../utils/gameLogic';

interface BlockStatusProps {
  gameState: GameState;
  onMineBlock: () => void;
  t: (key: string) => string;
}

export const BlockStatus: React.FC<BlockStatusProps> = ({ gameState, onMineBlock, t }) => {
  const blockInfo = formatBlockInfo(gameState);
  const blockTime = calculateBlockTime(gameState.difficulty, gameState.totalHashRate);
  
  return (
    <View style={styles.container}>
      {/* Phase and Progress */}
      <View style={styles.header}>
        <Text style={styles.phaseTitle}>Phase 1: Genesis</Text>
        <Text style={styles.progressText}>
          {formatNumber(blockInfo.blocksMined)} / {formatNumber(blockInfo.totalBlocks)} blocks
        </Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${blockInfo.phaseProgress}%` }
          ]} 
        />
      </View>
      
      {/* Block Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Reward</Text>
          <Text style={styles.infoValue}>{formatNumber(blockInfo.currentReward)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Hash Rate</Text>
          <Text style={styles.infoValue}>{formatNumber(blockInfo.totalHashRate)} H/s</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Next Halving</Text>
          <Text style={styles.infoValue}>{formatNumber(blockInfo.blocksUntilHalving)}</Text>
        </View>
      </View>
      
      {/* Mine Block Button */}
      <TouchableOpacity 
        style={[
          styles.mineButton,
          blockInfo.blocksMined >= blockInfo.totalBlocks && styles.mineButtonDisabled
        ]} 
        onPress={onMineBlock}
        disabled={blockInfo.blocksMined >= blockInfo.totalBlocks}
      >
        <Text style={[
          styles.mineButtonText,
          blockInfo.blocksMined >= blockInfo.totalBlocks && styles.mineButtonTextDisabled
        ]}>
          {blockInfo.blocksMined >= blockInfo.totalBlocks ? 'Phase Complete!' : 'Mine Block'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  progressText: {
    fontSize: 14,
    color: '#cccccc',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mineButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  mineButtonDisabled: {
    backgroundColor: '#444444',
  },
  mineButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mineButtonTextDisabled: {
    color: '#888888',
  },
});
