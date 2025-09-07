import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameState } from '../types/game';
import { formatBlockInfo, calculateBlockTime } from '../utils/blockLogic';
import { formatNumber } from '../utils/gameLogic';

interface BlockInfoProps {
  gameState: GameState;
  onMineBlock: () => void;
  t: (key: string) => string;
}

export const BlockInfo: React.FC<BlockInfoProps> = ({ gameState, onMineBlock, t }) => {
  const blockInfo = formatBlockInfo(gameState);
  const blockTime = calculateBlockTime(gameState.difficulty, gameState.totalHashRate);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phase 1: Genesis</Text>
      
      {/* Block Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Block Progress</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${blockInfo.phaseProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {formatNumber(blockInfo.blocksMined)} / {formatNumber(blockInfo.totalBlocks)} blocks
        </Text>
        <Text style={styles.progressText}>
          {blockInfo.phaseProgress.toFixed(1)}% complete
        </Text>
      </View>

      {/* Current Reward */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Block Reward</Text>
        <Text style={styles.rewardText}>
          {formatNumber(blockInfo.currentReward)} coins
        </Text>
      </View>

      {/* Next Halving */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Halving</Text>
        <Text style={styles.halvingText}>
          In {formatNumber(blockInfo.blocksUntilHalving)} blocks
        </Text>
        <Text style={styles.halvingText}>
          Block #{formatNumber(blockInfo.nextHalving)}
        </Text>
      </View>

      {/* Mining Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mining Stats</Text>
        <Text style={styles.statText}>
          Hash Rate: {formatNumber(blockInfo.totalHashRate)} H/s
        </Text>
        <Text style={styles.statText}>
          Difficulty: {formatNumber(blockInfo.difficulty)}
        </Text>
        <Text style={styles.statText}>
          Block Time: {blockTime.toFixed(1)}s
        </Text>
        <Text style={styles.statText}>
          Total Coins Mined: {formatNumber(blockInfo.totalCoinsMined)}
        </Text>
      </View>

      {/* Mine Block Button */}
      <TouchableOpacity 
        style={styles.mineButton} 
        onPress={onMineBlock}
        disabled={blockInfo.blocksMined >= blockInfo.totalBlocks}
      >
        <Text style={styles.mineButtonText}>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 10,
  },
  progressText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
  },
  rewardText: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  halvingText: {
    color: '#ffaa00',
    fontSize: 14,
    textAlign: 'center',
  },
  statText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 4,
  },
  mineButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  mineButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
