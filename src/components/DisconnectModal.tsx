import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../contexts/GameContext';

interface DisconnectModalProps {
  visible: boolean;
  onClose: () => void;
}

const DisconnectModal: React.FC<DisconnectModalProps> = ({ visible, onClose }) => {
  const { t } = useGame();
  const [showError, setShowError] = useState(false);

  const handleYes = () => {
    setShowError(true);
  };

  const handleClose = () => {
    setShowError(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {!showError ? (
            <>
              <Text style={styles.title}>{t('disconnect.modal.title')}</Text>
              <Text style={styles.body}>{t('disconnect.modal.body')}</Text>
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.noButton} onPress={handleClose}>
                  <Text style={styles.noButtonText}>{t('disconnect.modal.no')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.yesButton} onPress={handleYes}>
                  <Text style={styles.yesButtonText}>{t('disconnect.modal.yes')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.errorTitle}>{t('disconnect.modal.errorTitle')}</Text>
              <Text style={styles.body}>{t('disconnect.modal.errorBody')}</Text>
              <TouchableOpacity style={styles.okButton} onPress={handleClose}>
                <Text style={styles.okButtonText}>{t('disconnect.modal.ok')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 4,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  title: {
    color: '#ff4444',
    fontSize: 16,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 14,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  body: {
    color: '#cccccc',
    fontSize: 13,
    fontFamily: 'Courier New',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  noButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  noButtonText: {
    color: '#888888',
    fontSize: 13,
    fontFamily: 'Courier New',
  },
  yesButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  yesButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  okButton: {
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#888888',
    fontSize: 13,
    fontFamily: 'Courier New',
  },
});

export default DisconnectModal;
