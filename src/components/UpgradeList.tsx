import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { formatNumber, canAffordUpgrade } from '../utils/gameLogic';

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
    <View style={styles.container}>
      {gameState.upgrades.map((upgrade) => {
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
                  {formatNumber(upgrade.cost)} {t('game.cryptoCoins')}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
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
  buyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: '#888',
  },
});

export default UpgradeList;

