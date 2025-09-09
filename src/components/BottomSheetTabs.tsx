import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useGame } from '../contexts/GameContext';
import HardwareList from './HardwareList';
import UpgradeList from './UpgradeList';
import MarketScreen from './MarketScreen';
import PrestigeScreen from './PrestigeScreen';
import { BlockStatus } from './BlockStatus';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabState = 'minimized' | 'mining-maximized' | 'full-maximized';
type ActiveTab = 'mining' | 'market' | 'hardware' | 'upgrades' | 'prestige';

interface BottomSheetTabsProps {
  onMineBlock: () => void;
  t: (key: string) => string;
}

const BottomSheetTabs: React.FC<BottomSheetTabsProps> = ({ onMineBlock, t }) => {
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState<ActiveTab>('mining');
  const [tabState, setTabState] = useState<TabState>('minimized');
  const [isScrolling, setIsScrolling] = useState(false);
  
  const translateY = useSharedValue(SCREEN_HEIGHT - 100);
  const panGestureRef = useRef<PanGestureHandler>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const MINIMIZED_HEIGHT = 100;
  const MINING_MAXIMIZED_HEIGHT = SCREEN_HEIGHT * 0.5;
  const FULL_MAXIMIZED_HEIGHT = SCREEN_HEIGHT - 50;

  const getTargetHeight = (state: TabState): number => {
    switch (state) {
      case 'minimized':
        return SCREEN_HEIGHT - MINIMIZED_HEIGHT;
      case 'mining-maximized':
        return SCREEN_HEIGHT - MINING_MAXIMIZED_HEIGHT;
      case 'full-maximized':
        return SCREEN_HEIGHT - FULL_MAXIMIZED_HEIGHT;
      default:
        return SCREEN_HEIGHT - MINIMIZED_HEIGHT;
    }
  };

  const animateToState = (newState: TabState) => {
    const targetY = getTargetHeight(newState);
    
    translateY.value = withSpring(targetY, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
    
    setTabState(newState);
  };

  const handleTabPress = (tab: ActiveTab) => {
    setActiveTab(tab);
    
    if (tab === 'mining') {
      animateToState('mining-maximized');
    } else {
      animateToState('full-maximized');
    }
  };

  const handleMinimize = () => {
    animateToState('minimized');
  };

  const handleScrollBegin = () => {
    setIsScrolling(true);
  };

  const handleScrollEnd = (event: any) => {
    setIsScrolling(false);
    const { contentOffset } = event.nativeEvent;
    
    // If scrolled to top and user continues scrolling up, minimize
    if (contentOffset.y <= 0 && tabState !== 'minimized') {
      // Small delay to allow for natural scroll behavior
      setTimeout(() => {
        if (tabState !== 'minimized') {
          animateToState('minimized');
        }
      }, 100);
    }
  };

  const onPanGestureEvent = (event: any) => {
    'worklet';
    translateY.value = event.nativeEvent.translationY + getTargetHeight(tabState);
  };

  const onPanHandlerStateChange = (event: any) => {
    'worklet';
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // If swiping up with enough velocity, maximize
      if (velocityY < -500) {
        if (activeTab === 'mining') {
          runOnJS(animateToState)('mining-maximized');
        } else {
          runOnJS(animateToState)('full-maximized');
        }
      }
      // If swiping down with enough velocity, minimize
      else if (velocityY > 500) {
        runOnJS(animateToState)('minimized');
      }
      // Otherwise, snap to current state
      else {
        runOnJS(animateToState)(tabState);
      }
    }
  };

  const renderContent = () => {
    const content = (() => {
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
          return <HardwareList />;
        case 'upgrades':
          return <UpgradeList />;
        case 'market':
          return <MarketScreen />;
        case 'prestige':
          return <PrestigeScreen />;
        default:
          return null;
      }
    })();

    // For full-maximized tabs, wrap in ScrollView with gesture handling
    if (tabState === 'full-maximized') {
      return (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContent}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {content}
        </ScrollView>
      );
    }

    // For mining-maximized, no scroll needed
    return content;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const renderMinimizedTabs = () => {
    const tabs = [
      { id: 'mining' as ActiveTab, icon: '⛏️', label: 'Mining', unlocked: true },
      { id: 'market' as ActiveTab, icon: '📈', label: 'Market', unlocked: gameState.unlockedTabs.market },
      { id: 'hardware' as ActiveTab, icon: '💻', label: 'Hardware', unlocked: gameState.unlockedTabs.hardware },
      { id: 'upgrades' as ActiveTab, icon: '⚡', label: 'Upgrades', unlocked: gameState.unlockedTabs.upgrades },
      { id: 'prestige' as ActiveTab, icon: '🌟', label: 'Prestige', unlocked: gameState.unlockedTabs.prestige },
    ];

    return (
      <View style={styles.minimizedTabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.minimizedTab,
              activeTab === tab.id && styles.activeMinimizedTab,
              !tab.unlocked && styles.lockedTab,
            ]}
            onPress={() => tab.unlocked && handleTabPress(tab.id)}
            disabled={!tab.unlocked}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel,
              !tab.unlocked && styles.lockedTabLabel,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PanGestureHandler
        ref={panGestureRef}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            animatedStyle,
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {activeTab === 'mining' ? '⛏️ Mining' :
               activeTab === 'market' ? '📈 Market' :
               activeTab === 'hardware' ? '💻 Hardware' :
               activeTab === 'upgrades' ? '⚡ Upgrades' :
               '🌟 Prestige'}
            </Text>
            {tabState !== 'minimized' && (
              <TouchableOpacity onPress={handleMinimize} style={styles.minimizeButton}>
                <Text style={styles.minimizeButtonText}>−</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {tabState === 'minimized' ? renderMinimizedTabs() : renderContent()}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  minimizeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  minimizedTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  minimizedTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeMinimizedTab: {
    backgroundColor: '#00ff88',
  },
  lockedTab: {
    opacity: 0.3,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#000',
    fontWeight: 'bold',
  },
  lockedTabLabel: {
    color: '#666',
  },
});

export default BottomSheetTabs;
