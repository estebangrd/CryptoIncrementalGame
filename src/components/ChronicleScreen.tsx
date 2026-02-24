/**
 * ChronicleScreen — Displays the history of narrative events (Phase 6).
 * Shows all triggered events in reverse chronological order (most recent first).
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { NarrativeEvent } from '../types/game';
import { getNarrativeEventTextKey } from '../utils/narrativeLogic';

const getEventColor = (threshold: number): string => {
  if (threshold >= 60) return '#22c55e';
  if (threshold >= 40) return '#eab308';
  if (threshold >= 20) return '#f97316';
  return '#ef4444';
};

const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

const ChronicleEntry: React.FC<{ event: NarrativeEvent }> = ({ event }) => {
  const { t } = useGame();

  const titleKey = `narrative.event${event.threshold}.title`;
  const textKey = getNarrativeEventTextKey(event.threshold, event.aiActiveAtTrigger);
  const color = getEventColor(event.threshold);
  const resourcesPct = Math.round(event.planetResourcesAtTrigger);

  return (
    <View style={[styles.entry, { borderLeftColor: color }]}>
      <View style={styles.entryHeader}>
        <Text style={[styles.entryThreshold, { color }]}>
          🌍 {event.threshold}% triggered → {resourcesPct}%
        </Text>
        <Text style={styles.entryTime}>{formatRelativeTime(event.triggeredAt)}</Text>
      </View>
      <Text style={styles.entryTitle}>{t(titleKey)}</Text>
      <Text style={styles.entryBody} numberOfLines={3}>{t(textKey)}</Text>
    </View>
  );
};

const ChronicleScreen: React.FC = () => {
  const { gameState, t } = useGame();

  const events = [...(gameState.narrativeEvents ?? [])]
    .sort((a, b) => b.triggeredAt - a.triggeredAt);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <Text style={styles.screenTitle}>{t('narrative.chronicle.title')}</Text>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('narrative.chronicle.empty')}</Text>
        </View>
      ) : (
        events.map((event) => (
          <ChronicleEntry key={event.threshold} event={event} />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
    paddingTop: 16,
    paddingBottom: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  entry: {
    backgroundColor: '#222',
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  entryThreshold: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  entryTime: {
    fontSize: 11,
    color: '#666',
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  entryBody: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 17,
    fontStyle: 'italic',
  },
});

export default ChronicleScreen;
