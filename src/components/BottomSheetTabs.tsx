import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import HardwareList from './HardwareList';
import UpgradeList from './UpgradeList';
import MarketScreen from './MarketScreen';
import PrestigeScreen from './PrestigeScreen';
import ShopScreen from './ShopScreen';
import EnergyScreen from './EnergyScreen';
import ChronicleScreen from './ChronicleScreen';
import { BlockStatus } from './BlockStatus';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ActiveTab = 'mining' | 'market' | 'hardware' | 'upgrades' | 'prestige' | 'shop' | 'energy' | 'chronicle';

interface BottomSheetTabsProps {
  onMineBlock: () => void;
  t: (key: string) => string;
}

const BottomSheetTabs: React.FC<BottomSheetTabsProps> = ({ onMineBlock, t }) => {
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState<ActiveTab>('mining');
  
  // Debug log for tab state
  React.useEffect(() => {
    console.log('DEBUG: BottomSheetTabs - activeTab:', activeTab);
    console.log('DEBUG: BottomSheetTabs - unlockedTabs:', gameState.unlockedTabs);
  }, [activeTab, gameState.unlockedTabs]);

  const handleTabPress = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'mining':
        return (
          <BlockStatus 
            gameState={gameState} 
            onMineBlock={onMineBlock} 
            t={t} 
          />
        );
      case 'hardware':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <HardwareList />
          </ScrollView>
        );
      case 'upgrades':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <UpgradeList />
          </ScrollView>
        );
      case 'market':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <MarketScreen isActive={activeTab === 'market'} />
          </ScrollView>
        );
      case 'prestige':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <PrestigeScreen />
          </ScrollView>
        );
      case 'shop':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <ShopScreen />
          </ScrollView>
        );
      case 'energy':
        return <EnergyScreen />;
      case 'chronicle':
        return <ChronicleScreen />;
      default:
        return null;
    }
  };


  const renderTabs = () => {
    const tabs = [
      { id: 'mining' as ActiveTab, icon: '⛏️', label: 'Mining', unlocked: true },
      { id: 'market' as ActiveTab, icon: '📈', label: 'Market', unlocked: gameState.unlockedTabs.market },
      { id: 'hardware' as ActiveTab, icon: '💻', label: 'Hardware', unlocked: gameState.unlockedTabs.hardware },
      { id: 'upgrades' as ActiveTab, icon: '🔧', label: 'Upgrades', unlocked: gameState.unlockedTabs.upgrades },
      { id: 'prestige' as ActiveTab, icon: '🌟', label: 'Prestige', unlocked: gameState.unlockedTabs.prestige },
      { id: 'energy' as ActiveTab, icon: '⚡', label: t('energy.tab'), unlocked: gameState.unlockedTabs.energy ?? false },
      { id: 'shop' as ActiveTab, icon: '🛒', label: 'Shop', unlocked: true },
      { id: 'chronicle' as ActiveTab, icon: '📖', label: t('narrative.tab'), unlocked: gameState.unlockedTabs.chronicle ?? false },
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && styles.activeTab,
                !tab.unlocked && styles.lockedTab,
              ]}
              onPress={() => tab.unlocked && handleTabPress(tab.id)}
              disabled={!tab.unlocked}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                {tab.icon}
              </Text>
              {isActive && (
                <Text style={styles.activeTabLabel}>{tab.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.bottomSheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'mining' ? '⛏️ Mining' :
             activeTab === 'market' ? '📈 Market' :
             activeTab === 'hardware' ? '💻 Hardware' :
             activeTab === 'upgrades' ? '⚡ Upgrades' :
             activeTab === 'shop' ? '🛒 Shop' :
             activeTab === 'energy' ? `⚡ ${t('energy.tab')}` :
             activeTab === 'chronicle' ? `📖 ${t('narrative.tab')}` :
             '🌟 Prestige'}
          </Text>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: SCREEN_HEIGHT * 0.5, // Start from middle of screen
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 2,
    minHeight: 44,
  },
  activeTab: {
    backgroundColor: '#0d1f0d',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  lockedTab: {
    opacity: 0.25,
  },
  tabIcon: {
    fontSize: 20,
  },
  activeTabIcon: {
    fontSize: 18,
  },
  activeTabLabel: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 9,
    marginTop: 3,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
});

export default BottomSheetTabs;
