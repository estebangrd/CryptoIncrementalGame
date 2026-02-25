import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { languages } from '../data/translations';
import { clearAllGameData } from '../utils/storage';
import { restorePurchases } from '../services/IAPService';
import { IAP_PRODUCT_IDS } from '../config/iapConfig';
import AchievementsScreen from './AchievementsScreen';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  onOpenShop: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onReset, onOpenShop }) => {
  const { gameState, currentLanguage, setLanguage, t, dispatch } = useGame();
  const [showAchievements, setShowAchievements] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    await setLanguage(languageCode);
  };

  const handleRestorePurchases = async () => {
    Alert.alert('Restoring...', 'Please wait while we restore your purchases.');
    const purchases = await restorePurchases();

    if (purchases.length === 0) {
      Alert.alert('Restore Purchases', 'No purchases to restore.');
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

    Alert.alert('Restore Purchases', restoredCount > 0
      ? `Successfully restored ${restoredCount} purchase(s).`
      : 'No restorable purchases found (boosters and packs cannot be restored).');
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

