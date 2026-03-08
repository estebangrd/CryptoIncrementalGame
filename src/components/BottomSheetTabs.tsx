import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { THEME } from '../styles/theme';
import { useGame } from '../contexts/GameContext';
import HardwareList from './HardwareList';
import UpgradeList from './UpgradeList';
import MarketScreen from './MarketScreen';
import PrestigeScreen from './PrestigeScreen';
import EnergyScreen from './EnergyScreen';
import ChronicleScreen from './ChronicleScreen';
import { BlockStatus } from './BlockStatus';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ActiveTab = 'mining' | 'market' | 'hardware' | 'upgrades' | 'prestige' | 'energy' | 'chronicle';

interface BottomSheetTabsProps {
  onMineBlock: () => void;
  t: (key: string) => string;
  bottomOffset?: number;
  onTabChange?: (tab: string) => void;
  topAnim?: Animated.Value;
}

const BottomSheetTabs: React.FC<BottomSheetTabsProps> = ({ onMineBlock, t, bottomOffset = 0, onTabChange, topAnim }) => {
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState<ActiveTab>('mining');
  
  // Debug log for tab state
  React.useEffect(() => {
    console.log('DEBUG: BottomSheetTabs - activeTab:', activeTab);
    console.log('DEBUG: BottomSheetTabs - unlockedTabs:', gameState.unlockedTabs);
  }, [activeTab, gameState.unlockedTabs]);

  const handleTabPress = (tab: ActiveTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
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
            <MarketScreen />
          </ScrollView>
        );
      case 'prestige':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <PrestigeScreen />
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
      { id: 'energy' as ActiveTab, icon: '⚡', label: t('energy.tab'), unlocked: gameState.unlockedTabs.energy ?? false },
      { id: 'chronicle' as ActiveTab, icon: '📖', label: t('narrative.tab'), unlocked: gameState.unlockedTabs.chronicle ?? false },
      { id: 'prestige' as ActiveTab, icon: '🌟', label: 'Prestige', unlocked: gameState.unlockedTabs.prestige },
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

  const containerTop = topAnim ?? SCREEN_HEIGHT * 0.5;

  return (
    <Animated.View style={[styles.container, { top: containerTop, bottom: bottomOffset }]}>
      <View style={styles.bottomSheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'mining' ? '⛏️ Mining' :
             activeTab === 'market' ? '📈 Market' :
             activeTab === 'hardware' ? '💻 Hardware' :
             activeTab === 'upgrades' ? '⚡ Upgrades' :
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: 'rgba(2,8,16,0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,255,136,0.15)',
    shadowColor: THEME.neonGreen,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,136,0.08)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.neonGreen,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderNeutral,
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
    borderWidth: 1,
    borderColor: THEME.borderNeutral,
  },
  activeTab: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1,
    borderColor: THEME.neonGreen,
    shadowColor: THEME.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  lockedTab: {
    opacity: 0.2,
    borderColor: 'transparent',
  },
  tabIcon: {
    fontSize: 20,
  },
  activeTabIcon: {
    fontSize: 18,
  },
  activeTabLabel: {
    color: THEME.neonGreen,
    fontWeight: 'bold',
    fontSize: 9,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
});

export default BottomSheetTabs;
