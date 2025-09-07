import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { formatNumber } from '../utils/gameLogic';
import { clearGameData } from '../utils/storage';
import HardwareList from './HardwareList';
import UpgradeList from './UpgradeList';
import MarketScreen from './MarketScreen';
import PrestigeScreen from './PrestigeScreen';
import { BlockInfo } from './BlockInfo';

import SettingsModal from './SettingsModal';

const GameScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [activeTab, setActiveTab] = useState<'hardware' | 'upgrades' | 'market' | 'prestige' | 'blocks'>('hardware');
  const [showSettings, setShowSettings] = useState(false);

  const handleClick = () => {
    dispatch({ type: 'CLICK' });
  };

  const handleMineBlock = () => {
    dispatch({ type: 'MINE_BLOCK' });
  };

  const handleReset = () => {
    Alert.alert(
      t('ui.reset'),
      t('ui.resetConfirm'),
      [
        { text: t('ui.cancel'), style: 'cancel' },
        {
          text: t('ui.confirm'),
          style: 'destructive',
          onPress: async () => {
            await clearGameData();
            dispatch({ type: 'RESET_GAME' });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('game.title')}</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Main Click Area */}
      <TouchableOpacity style={styles.clickArea} onPress={handleClick} activeOpacity={0.8}>
        <View style={styles.clickContent}>
          <Text style={styles.cryptoCoinsText}>
            {formatNumber(gameState.cryptoCoins)} {t('game.cryptoCoins')}
          </Text>
          <Text style={styles.productionText}>
            {formatNumber(gameState.cryptoCoinsPerSecond)} {t('game.perSecond')}
          </Text>
          <Text style={styles.clickText}>
            {formatNumber(gameState.cryptoCoinsPerClick)} {t('game.perClick')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {t('game.totalClicks')}: {formatNumber(gameState.totalClicks)}
        </Text>
        <Text style={styles.statsText}>
          {t('game.totalCryptoCoins')}: {formatNumber(gameState.totalCryptoCoins)}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hardware' && styles.activeTab]}
          onPress={() => setActiveTab('hardware')}
        >
          <Text style={[styles.tabText, activeTab === 'hardware' && styles.activeTabText]}>
            {t('ui.hardware')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upgrades' && styles.activeTab]}
          onPress={() => setActiveTab('upgrades')}
        >
          <Text style={[styles.tabText, activeTab === 'upgrades' && styles.activeTabText]}>
            {t('ui.upgrades')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'market' && styles.activeTab]}
          onPress={() => setActiveTab('market')}
        >
          <Text style={[styles.tabText, activeTab === 'market' && styles.activeTabText]}>
            {t('game.market')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prestige' && styles.activeTab]}
          onPress={() => setActiveTab('prestige')}
        >
          <Text style={[styles.tabText, activeTab === 'prestige' && styles.activeTabText]}>
            {t('game.prestige')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocks' && styles.activeTab]}
          onPress={() => setActiveTab('blocks')}
        >
          <Text style={[styles.tabText, activeTab === 'blocks' && styles.activeTabText]}>
            Blocks
          </Text>
        </TouchableOpacity>

      </View>

      {/* Content Area */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        {activeTab === 'hardware' ? (
          <HardwareList />
        ) : activeTab === 'upgrades' ? (
          <UpgradeList />
        ) : activeTab === 'market' ? (
          <MarketScreen />
        ) : activeTab === 'prestige' ? (
          <PrestigeScreen />
        ) : (
          <BlockInfo 
            gameState={gameState} 
            onMineBlock={handleMineBlock} 
            t={t} 
          />
        )}
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onReset={handleReset}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  clickArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  clickContent: {
    alignItems: 'center',
  },
  cryptoCoinsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 10,
  },
  productionText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 5,
  },
  clickText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
  },
  statsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00ff88',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00ff88',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});

export default GameScreen;
