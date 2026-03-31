/**
 * MarketOpportunityModal — Extreme price spike event banner.
 * Shows a 20-minute window with options to go to Market or auto-sell.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useGame } from '../contexts/GameContext';
import { MARKET_OPPORTUNITY_CONFIG } from '../config/balanceConfig';
import { fonts } from '../config/theme';
import { MarketOpportunityEvent } from '../types/game';

interface Props {
  event: MarketOpportunityEvent | null;
}

const MarketOpportunityModal: React.FC<Props> = ({ event }) => {
  const { dispatch, t } = useGame();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState('');
  const [timerProgress, setTimerProgress] = useState(1);

  useEffect(() => {
    if (event?.status === 'active') {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [event?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (event?.status !== 'active') return;
    const tick = () => {
      const remaining = Math.max(0, event.expiresAt - Date.now());
      const total = MARKET_OPPORTUNITY_CONFIG.DURATION_MS;
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${m}:${String(s).padStart(2, '0')}`);
      setTimerProgress(remaining / total);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event?.status, event?.expiresAt]);

  if (!event || event.status !== 'active') return null;

  return (
    <Modal transparent={true} animationType="fade" visible={true} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
        >
          <LinearGradient
            colors={['#00ff88', '#00e5ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>📈</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.category}>{t('marketOpportunity.category')}</Text>
                <Text style={styles.title}>{t('marketOpportunity.title')}</Text>
              </View>
            </View>

            {/* Timer bar */}
            <View style={styles.timerWrap}>
              <View style={styles.timerTrack}>
                <LinearGradient
                  colors={['#00ff88', '#00e5ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.timerFill, { width: `${Math.round(timerProgress * 100)}%` }]}
                />
              </View>
              <View style={styles.timerLabels}>
                <Text style={styles.timerLabel}>{t('marketOpportunity.timerLabel')}</Text>
                <Text style={styles.timerLabel}>{timeLeft}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              {t('marketOpportunity.description')}
            </Text>

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={[styles.tag, styles.tagPositive]}>
                <Text style={[styles.tagText, styles.tagTextPositive]}>{t('marketOpportunity.tagPrice')}</Text>
              </View>
              <View style={[styles.tag, styles.tagWarning]}>
                <Text style={[styles.tagText, styles.tagTextWarning]}>{t('marketOpportunity.tagTimer')}</Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen]}
              onPress={() => dispatch({ type: 'RESOLVE_MARKET_OPPORTUNITY', payload: 'went_to_market' })}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnText, styles.btnTextGreen]}>{t('marketOpportunity.btnGoToMarket')}</Text>
              <Text style={styles.btnSub}>{t('marketOpportunity.btnGoToMarketSub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => dispatch({ type: 'RESOLVE_MARKET_OPPORTUNITY', payload: 'auto_sold' })}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnText, styles.btnTextSecondary]}>{t('marketOpportunity.btnAutoSell')}</Text>
              <Text style={styles.btnSub}>{t('marketOpportunity.btnAutoSellSub')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 18,
    backgroundColor: '#020d0a',
    overflow: 'hidden',
  },
  accentBar: { height: 3, width: '100%' },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(0,255,136,0.07)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: { fontSize: 22 },
  headerTextCol: { flex: 1, gap: 4 },
  category: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(0,255,136,0.6)', letterSpacing: 3, textTransform: 'uppercase' },
  title: { fontFamily: fonts.orbitron, fontSize: 13, color: '#fff', lineHeight: 18 },
  timerWrap: { marginBottom: 14 },
  timerTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  timerFill: { height: '100%', borderRadius: 2 },
  timerLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  timerLabel: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
  description: {
    fontFamily: fonts.rajdhani, fontSize: 13,
    color: 'rgba(255,255,255,0.65)', lineHeight: 20, marginBottom: 12,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.rajdhani, fontSize: 11 },
  tagPositive: { backgroundColor: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.22)' },
  tagTextPositive: { color: '#00ff88' },
  tagWarning: { backgroundColor: 'rgba(255,214,0,0.08)', borderColor: 'rgba(255,214,0,0.2)' },
  tagTextWarning: { color: '#ffd600' },
  btn: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginBottom: 7 },
  btnText: { fontFamily: fonts.orbitron, fontSize: 11, letterSpacing: 2 },
  btnSub: { fontFamily: fonts.rajdhani, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  btnGreen: { backgroundColor: 'rgba(0,255,136,0.12)', borderColor: '#00ff88' },
  btnTextGreen: { color: '#00ff88' },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' },
  btnTextSecondary: { color: 'rgba(255,255,255,0.4)' },
});

export default MarketOpportunityModal;
