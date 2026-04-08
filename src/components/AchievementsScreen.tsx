import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../contexts/GameContext';
import { getAchievementCompletionPercent } from '../utils/achievementLogic';
import { formatNumber, formatUSD } from '../utils/gameLogic';
import { Achievement } from '../types/game';

type FilterCategory = 'all' | 'mining' | 'hardware' | 'economy' | 'prestige' | 'secret';

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  rare: '#4a9eff',
  epic: '#a855f7',
  legendary: '#FFD700',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const formatDate = (ts: number): string => {
  return new Date(ts).toLocaleDateString();
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const isHiddenLocked = achievement.hidden && !achievement.unlocked;
  const rarityColor = RARITY_COLORS[achievement.rarity] ?? '#888';
  const displayName = achievement.name || achievement.nameKey;
  const displayDescription = achievement.description || achievement.descriptionKey;

  return (
    <View style={[styles.card, achievement.unlocked && styles.cardUnlocked]}>
      <View style={styles.cardLeft}>
        <Text style={[styles.cardIcon, !achievement.unlocked && styles.iconLocked]}>
          {isHiddenLocked ? '🔒' : achievement.icon}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardName, !achievement.unlocked && styles.textLocked]} numberOfLines={1}>
            {isHiddenLocked ? '???' : displayName}
          </Text>
          <Text style={[styles.rarityBadge, { color: rarityColor }]}>
            {RARITY_LABELS[achievement.rarity]}
          </Text>
        </View>
        <Text style={[styles.cardDesc, !achievement.unlocked && styles.textLocked]} numberOfLines={2}>
          {isHiddenLocked ? '???' : displayDescription}
        </Text>
        {achievement.target !== undefined && !achievement.unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, ((achievement.progress ?? 0) / achievement.target) * 100)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {formatNumber(achievement.progress ?? 0)}/{formatNumber(achievement.target)}
            </Text>
          </View>
        )}
        {achievement.unlocked && achievement.unlockedAt && (
          <Text style={styles.unlockedDate}>Unlocked: {formatDate(achievement.unlockedAt)}</Text>
        )}
        {achievement.unlocked && achievement.reward && (
          <Text style={styles.reward}>
            {achievement.reward.type === 'coins' ? `+${formatNumber(achievement.reward.amount ?? 0)} CC` :
             achievement.reward.type === 'money' ? `+${formatUSD(achievement.reward.amount ?? 0)}` :
             achievement.reward.type === 'multiplier' ? `${achievement.reward.multiplier}x boost` : ''}
          </Text>
        )}
      </View>
    </View>
  );
};

const FILTER_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mining', label: '⛏️' },
  { key: 'hardware', label: '🖥️' },
  { key: 'economy', label: '💰' },
  { key: 'prestige', label: '⭐' },
  { key: 'secret', label: '🔒' },
];

const AchievementsScreen: React.FC = () => {
  const { gameState } = useGame();
  const [filter, setFilter] = useState<FilterCategory>('all');

  const achievements = gameState.achievements || [];
  const completionPct = getAchievementCompletionPercent(achievements);

  const filtered = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.completionBadge}>
          <Text style={styles.completionText}>{completionPct}% Complete</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Achievement list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No achievements in this category yet.</Text>
        )}
        {filtered.map(a => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
        <View style={styles.listFooter} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  completionBadge: { backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#00ff88' },
  completionText: { fontSize: 12, color: '#00ff88', fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 4 },
  filterTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: '#2a2a2a' },
  filterTabActive: { backgroundColor: '#00ff88' },
  filterTabText: { fontSize: 12, color: '#888' },
  filterTabTextActive: { color: '#000', fontWeight: 'bold' },
  list: { flex: 1, paddingHorizontal: 12 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#2a2a2a', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', borderWidth: 1, borderColor: '#333' },
  cardUnlocked: { borderColor: '#00ff88' },
  cardLeft: { marginRight: 12, justifyContent: 'center' },
  cardIcon: { fontSize: 28 },
  iconLocked: { opacity: 0.4 },
  cardRight: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: 'bold', color: '#fff', flex: 1 },
  textLocked: { color: '#555' },
  rarityBadge: { fontSize: 10, fontWeight: 'bold', marginLeft: 8 },
  cardDesc: { fontSize: 12, color: '#888', marginBottom: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#444', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#00ff88', borderRadius: 2 },
  progressText: { fontSize: 10, color: '#888', minWidth: 60, textAlign: 'right' },
  unlockedDate: { fontSize: 10, color: '#555', marginTop: 2 },
  reward: { fontSize: 11, color: '#00ff88', marginTop: 2 },
  listFooter: { height: 20 },
});

export default AchievementsScreen;
