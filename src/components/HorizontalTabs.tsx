import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import HardwareList from './HardwareList';
import UpgradeList from './UpgradeList';
import MarketScreen from './MarketScreen';
import PrestigeScreen from './PrestigeScreen';
import EnergyScreen from './EnergyScreen';
import ChronicleScreen from './ChronicleScreen';
import { BlockStatus } from './BlockStatus';
import { colors, fonts } from '../config/theme';

type ActiveTab = 'mining' | 'market' | 'hardware' | 'upgrades' | 'prestige' | 'energy' | 'chronicle';

interface HorizontalTabsProps {
  onMineBlock: () => void;
  t: (key: string) => string;
  bottomOffset?: number;
}

const HorizontalTabs: React.FC<HorizontalTabsProps> = ({ onMineBlock, t, bottomOffset = 0 }) => {
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState<ActiveTab>('mining');

  const tabs = [
    { id: 'mining' as ActiveTab, icon: '⛏', label: 'Mining', unlocked: true },
    { id: 'market' as ActiveTab, icon: '📈', label: 'Market', unlocked: gameState.unlockedTabs.market },
    { id: 'hardware' as ActiveTab, icon: '💻', label: 'Hardware', unlocked: gameState.unlockedTabs.hardware },
    { id: 'upgrades' as ActiveTab, icon: '🔧', label: 'Upgrades', unlocked: gameState.unlockedTabs.upgrades },
    { id: 'energy' as ActiveTab, icon: '⚡', label: t('energy.tab'), unlocked: gameState.unlockedTabs.energy ?? false },
    { id: 'chronicle' as ActiveTab, icon: '📖', label: t('narrative.tab'), unlocked: gameState.unlockedTabs.chronicle ?? false },
    { id: 'prestige' as ActiveTab, icon: '🌟', label: 'Prestige', unlocked: gameState.unlockedTabs.prestige },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'mining':
        return (
          <BlockStatus gameState={gameState} onMineBlock={onMineBlock} t={t} />
        );
      case 'hardware':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <HardwareList />
          </ScrollView>
        );
      case 'upgrades':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <UpgradeList />
          </ScrollView>
        );
      case 'market':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <MarketScreen />
          </ScrollView>
        );
      case 'prestige':
        return (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

  return (
    <View style={[styles.container, { paddingBottom: bottomOffset }]}>
      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = !tab.unlocked;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                isLocked && styles.tabLocked,
              ]}
              onPress={() => !isLocked && setActiveTab(tab.id)}
              disabled={isLocked}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, isLocked && styles.tabLabelLocked]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderDim,
    minWidth: 60,
  },
  tabActive: {
    backgroundColor: 'rgba(0,255,136,0.10)',
    borderColor: colors.ng,
  },
  tabLocked: {
    opacity: 0.3,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabIconActive: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 9,
    color: colors.dim,
    fontFamily: fonts.rajdhani,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.ng,
    fontFamily: fonts.rajdhaniBold,
  },
  tabLabelLocked: {
    color: colors.dim,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
});

export default HorizontalTabs;
