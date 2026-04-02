import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { languages } from '../data/translations';
import { clearAllGameData } from '../utils/storage';
import { restorePurchases } from '../services/IAPService';
import { IAP_PRODUCT_IDS } from '../config/iapConfig';
import AchievementsScreen from './AchievementsScreen';
import { debugForceSpawnRef } from './AdBoosterBubbles';
import { MARKET_EVENT_CONFIG, MARKET_EVENT_META } from '../config/balanceConfig';
import type { ToastInfo, MarketEventToastData } from './Toast';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenShop: () => void;
  onTestGoodEnding?: () => void;
  onTestAICollapse?: () => void;
  onTestHumanCollapse?: () => void;
  onTestAchievementToast?: () => void;
  onTestEarningsToast?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onReset, onOpenShop, onTestGoodEnding, onTestAICollapse, onTestHumanCollapse, onTestAchievementToast, onTestEarningsToast }) => {
  const { gameState, currentLanguage, setLanguage, t, dispatch, showToast } = useGame();
  const [showAchievements, setShowAchievements] = useState(false);

  const MARKET_TOAST_LIST: { eventId: string; labelKey: string; multiplier: number; label: string }[] = [
    { eventId: 'halving_anticipation', labelKey: MARKET_EVENT_CONFIG.halving_anticipation.labelKey, multiplier: MARKET_EVENT_CONFIG.halving_anticipation.multiplier, label: 'Halving Anticipation' },
    { eventId: 'halving_shock', labelKey: MARKET_EVENT_CONFIG.halving_shock.labelKey, multiplier: MARKET_EVENT_CONFIG.halving_shock.multiplier, label: 'Halving Shock' },
    { eventId: 'market_spike', labelKey: MARKET_EVENT_CONFIG.market_spike.labelKey, multiplier: MARKET_EVENT_CONFIG.market_spike.multiplier, label: 'Market Spike' },
    { eventId: 'blackout_regional', labelKey: MARKET_EVENT_CONFIG.blackout_regional.labelKey, multiplier: MARKET_EVENT_CONFIG.blackout_regional.multiplier, label: 'Blackout Regional' },
    { eventId: 'ai_autonomous', labelKey: MARKET_EVENT_CONFIG.ai_autonomous.labelKey, multiplier: MARKET_EVENT_CONFIG.ai_autonomous.multiplier, label: 'AI Autonomous' },
    { eventId: 'planetary_collapse_incoming', labelKey: MARKET_EVENT_CONFIG.planetary_collapse_incoming.labelKey, multiplier: MARKET_EVENT_CONFIG.planetary_collapse_incoming.multiplier, label: 'Planetary Collapse' },
    { eventId: 'whale_dump', labelKey: MARKET_EVENT_CONFIG.whale_dump.labelKey, multiplier: MARKET_EVENT_CONFIG.whale_dump.multiplier, label: 'Whale Dump' },
    { eventId: 'media_hype', labelKey: MARKET_EVENT_CONFIG.media_hype.labelKey, multiplier: MARKET_EVENT_CONFIG.media_hype.multiplier, label: 'Media Hype' },
  ];
  const marketToastIndexRef = useRef(0);

  const handleLanguageChange = async (languageCode: string) => {
    await setLanguage(languageCode);
  };

  const handleRestorePurchases = async () => {
    const purchases = await restorePurchases();

    if (purchases.length === 0) {
      showToast('No purchases to restore', 'info');
      return;
    }

    let restoredCount = 0;
    for (const purchase of purchases) {
      const id = purchase.productId;
      if (id === IAP_PRODUCT_IDS.REMOVE_ADS) {
        dispatch({ type: 'PURCHASE_REMOVE_ADS', payload: { productId: id, transactionId: purchase.transactionId ?? '', purchaseDate: Date.now(), price: 0, currency: '', platform: 'ios', receipt: '', validated: true, delivered: true } });
        restoredCount++;
      } else if (id === IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER) {
        dispatch({ type: 'PURCHASE_PERMANENT_MULTIPLIER', payload: { productId: id, transactionId: purchase.transactionId ?? '', purchaseDate: Date.now(), price: 0, currency: '', platform: 'ios', receipt: '', validated: true, delivered: true } });
        restoredCount++;
      }
    }

    showToast(
      restoredCount > 0 ? `✓ Restored ${restoredCount} purchase(s)` : 'No restorable purchases found',
      restoredCount > 0 ? 'success' : 'info',
    );
  };

  const handleClearSavedData = () => {
    Alert.alert(
      'Clear Saved Data',
      'This will completely clear all saved game data and reset the app to a fresh state. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            await clearAllGameData();
            dispatch({ type: 'RESET_GAME' });
            Alert.alert('Success', 'All saved data has been cleared. The app will now start fresh.');
          },
        },
      ]
    );
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('ui.settings')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Language Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('ui.language')}</Text>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === language.code && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      currentLanguage === language.code && styles.selectedLanguageText,
                    ]}
                  >
                    {language.nativeName}
                  </Text>
                  {currentLanguage === language.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Game Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Game Actions</Text>
              
              <TouchableOpacity style={styles.dangerButton} onPress={onReset}>
                <Text style={styles.dangerButtonText}>{t('ui.reset')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.dangerButton, { marginTop: 8 }]} onPress={handleClearSavedData}>
                <Text style={styles.dangerButtonText}>Clear Saved Data (Debug)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8 }]} onPress={handleRestorePurchases}>
                <Text style={styles.actionButtonText}>🔄 Restore Purchases</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8 }]} onPress={() => setShowAchievements(true)}>
                <Text style={styles.actionButtonText}>🏆 Achievements</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8 }]} onPress={onTestGoodEnding}>
                <Text style={styles.actionButtonText}>🌍 Test Good Ending (Debug)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8, backgroundColor: '#5c2a2a' }]} onPress={onTestAICollapse}>
                <Text style={styles.actionButtonText}>🤖 Test AI Collapse (Debug)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8, backgroundColor: '#5c3a1a' }]} onPress={onTestHumanCollapse}>
                <Text style={styles.actionButtonText}>🔥 Test Human Collapse (Debug)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8, backgroundColor: '#3a2a5c' }]} onPress={onTestAchievementToast}>
                <Text style={styles.actionButtonText}>🏅 Test Achievement Toast (Debug)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8, backgroundColor: '#0a2a1a' }]} onPress={onTestEarningsToast}>
                <Text style={styles.actionButtonText}>⛏ Test Earnings Toast (Debug)</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: '#0a2a3a' }]} onPress={() => { debugForceSpawnRef.current?.('hash'); onClose(); }}>
                  <Text style={styles.actionButtonText}>🖥 Hash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: '#0a2a1a' }]} onPress={() => { debugForceSpawnRef.current?.('market'); onClose(); }}>
                  <Text style={styles.actionButtonText}>📈 Market</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: '#2a1a1a' }]} onPress={() => { debugForceSpawnRef.current?.('energy'); onClose(); }}>
                  <Text style={styles.actionButtonText}>⚡ Energy</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8, backgroundColor: '#2a2a0a' }]} onPress={() => { dispatch({ type: 'APPLY_MARKET_EVENT', payload: { eventId: 'media_hype' } }); onClose(); }}>
                <Text style={styles.actionButtonText}>📰 Trigger Media Hype (Debug)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { marginTop: 8, backgroundColor: '#1a2a2a' }]} onPress={() => {
                const idx = marketToastIndexRef.current;
                const evt = MARKET_TOAST_LIST[idx];
                const meta = MARKET_EVENT_META[evt.eventId];
                const headline = t(evt.labelKey);
                const toastType: ToastInfo['type'] = evt.multiplier >= 1 ? 'success' : 'warning';
                const meData: MarketEventToastData | undefined = meta ? {
                  tag: meta.tag,
                  headline,
                  delta: meta.delta,
                  durationLabel: meta.durationLabel,
                  polarity: evt.multiplier >= 1 ? 'pos' : 'neg',
                } : undefined;
                onClose();
                setTimeout(() => showToast(headline, toastType, meData), 150);
                marketToastIndexRef.current = (idx + 1) % MARKET_TOAST_LIST.length;
              }}>
                <Text style={styles.actionButtonText}>🔔 Next: {MARKET_TOAST_LIST[marketToastIndexRef.current]?.label} ({marketToastIndexRef.current + 1}/{MARKET_TOAST_LIST.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Ads & Purchases */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ads & Purchases</Text>
              {gameState.iapState.removeAdsPurchased && (
                <View style={[styles.adFreeStatus, { marginBottom: 8 }]}>
                  <Text style={styles.adFreeStatusText}>✓ Ad Free Mode: Active</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2a1a3e', borderWidth: 1, borderColor: '#a855f7' }]}
                onPress={() => { onClose(); onOpenShop(); }}
              >
                <Text style={styles.actionButtonText}>💎 Open Shop</Text>
              </TouchableOpacity>
            </View>

            {/* Game Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.infoText}>
                Blockchain Tycoon v0.1.0
              </Text>
              <Text style={styles.infoText}>
                An incremental mining game
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Achievements Modal */}
    <Modal visible={showAchievements} animationType="slide" onRequestClose={() => setShowAchievements(false)}>
      <View style={achievementsModalStyles.container}>
        <View style={achievementsModalStyles.header}>
          <TouchableOpacity onPress={() => setShowAchievements(false)} style={achievementsModalStyles.closeButton}>
            <Text style={achievementsModalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <AchievementsScreen />
      </View>
    </Modal>
    </>
  );
};

const achievementsModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  closeButtonText: {
    color: '#888',
    fontSize: 20,
  },
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#888',
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLanguage: {
    backgroundColor: '#00ff88',
  },
  languageText: {
    fontSize: 16,
    color: '#fff',
  },
  selectedLanguageText: {
    color: '#000',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  adFreeStatus: {
    backgroundColor: '#1a3a28',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  adFreeStatusText: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#2a5c8a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsModal;

