/**
 * NarrativeEventModal — Shows a breaking-news modal for narrative events (Phase 6).
 * Dismissible by tapping the CLOSE button or the dark overlay.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { NarrativeEvent } from '../types/game';
import { getNarrativeEventTextKey } from '../utils/narrativeLogic';
import { useGame } from '../contexts/GameContext';

interface NarrativeEventModalProps {
  event: NarrativeEvent | null;
  onDismiss: () => void;
}

const NarrativeEventModal: React.FC<NarrativeEventModalProps> = ({ event, onDismiss }) => {
  const { t } = useGame();
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (event) {
      // Slide down from top
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(-300);
    }
  }, [event, slideAnim]);

  if (!event) return null;

  const titleKey = `narrative.event${event.threshold}.title`;
  const textKey = getNarrativeEventTextKey(event.threshold, event.aiActiveAtTrigger);
  const resourcesPct = Math.round(event.planetResourcesAtTrigger);

  return (
    <Modal
      transparent
      animationType="none"
      visible={!!event}
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <Animated.View
          style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Header */}
            <Text style={styles.header}>{t('narrative.modal.header')}</Text>
            <View style={styles.divider} />

            {/* Title */}
            <Text style={styles.title}>{t(titleKey)}</Text>

            {/* Body */}
            <Text style={styles.body}>{t(textKey)}</Text>

            {/* Resources at trigger */}
            <View style={styles.resourcesRow}>
              <Text style={styles.resourcesText}>
                {t('narrative.modal.resources')}: {resourcesPct}%
              </Text>
            </View>

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
              <Text style={styles.closeButtonText}>{t('narrative.modal.close')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1e2a1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d5a2d',
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff88',
    letterSpacing: 1,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#2d5a2d',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resourcesRow: {
    backgroundColor: '#111a11',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  resourcesText: {
    fontSize: 13,
    color: '#ff6644',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default NarrativeEventModal;
