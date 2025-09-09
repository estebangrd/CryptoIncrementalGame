import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { formatNumber } from '../utils/gameLogic';
import { clearGameData } from '../utils/storage';
import BottomSheetTabs from './BottomSheetTabs';
import SettingsModal from './SettingsModal';

const GameScreen: React.FC = () => {
  const { gameState, dispatch, t } = useGame();
  const [showSettings, setShowSettings] = useState(false);

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

      {/* Main Stats Area */}
      <View style={styles.statsArea}>
        <View style={styles.statsContent}>
          <Text style={styles.cryptoCoinsText}>
            {formatNumber(gameState.cryptoCoins)} {t('game.cryptoCoins')}
          </Text>
          <Text style={styles.productionText}>
            {formatNumber(gameState.cryptoCoinsPerSecond)} {t('game.perSecond')}
          </Text>
          <Text style={styles.hashRateText}>
            {formatNumber(gameState.totalHashRate)} H/s
          </Text>
          {gameState.totalElectricityCost > 0 && (
            <Text style={styles.electricityText}>
              -{formatNumber(gameState.totalElectricityCost)}/sec electricity
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {t('game.totalCryptoCoins')}: {formatNumber(gameState.totalCryptoCoins)}
        </Text>
        <Text style={styles.statsText}>
          Blocks Mined: {formatNumber(gameState.blocksMined)}
        </Text>
        {gameState.realMoney > 0 && (
          <Text style={styles.moneyText}>
            💰 Real Money: ${formatNumber(gameState.realMoney)}
          </Text>
        )}
        {gameState.totalRealMoneyEarned > 0 && (
          <Text style={styles.moneyText}>
            💵 Total Earned: ${formatNumber(gameState.totalRealMoneyEarned)}
          </Text>
        )}
      </View>


      {/* Bottom Sheet Tabs */}
      <BottomSheetTabs onMineBlock={handleMineBlock} t={t} />

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
  statsArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statsContent: {
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
  hashRateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  electricityText: {
    fontSize: 14,
    color: '#ff6666',
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
  moneyText: {
    fontSize: 14,
    color: '#00ff88',
    marginBottom: 2,
    fontWeight: 'bold',
  },
});

export default GameScreen;
