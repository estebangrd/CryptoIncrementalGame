/**
 * LocalProtestModal — Regional blackout / environmental protest consequence banner.
 * Fires once when player consumes 34%+ of planet resources.
 * No mechanical impact — purely narrative. Text shows exact % consumed.
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
import LinearGradient from 'react-native-linear-gradient';
import { useGame } from '../contexts/GameContext';
import { fonts } from '../config/theme';
import { LocalProtestEvent } from '../types/game';

interface Props {
  event: LocalProtestEvent | null;
}

const LocalProtestModal: React.FC<Props> = ({ event }) => {
  const { gameState, dispatch, t } = useGame();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (event?.status === 'active') {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [event?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event || event.status !== 'active') return null;

  const pct = event.resourcesConsumedAtTrigger;
  const description = t('localProtest.description').replace('{pct}', String(pct));

  return (
    <Modal transparent={true} animationType="fade" visible={true} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#ffd600', '#ff8c00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>🌍</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.category}>{t('localProtest.category')}</Text>
                <Text style={styles.title}>{t('localProtest.title')}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={[styles.tag, styles.tagNeutral]}>
                <Text style={[styles.tagText, styles.tagTextNeutral]}>{t('localProtest.tagNoImpact')}</Text>
              </View>
              <View style={[styles.tag, styles.tagWarning]}>
                <Text style={[styles.tagText, styles.tagTextWarning]}>{t('localProtest.tagPressure')}</Text>
              </View>
              <View style={[styles.tag, styles.tagNegative]}>
                <Text style={[styles.tagText, styles.tagTextNegative]}>{t('localProtest.tagReputation')}</Text>
              </View>
            </View>

            {/* Choices */}
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={styles.btnRationing}
                onPress={() => dispatch({ type: 'DISMISS_LOCAL_PROTEST', payload: { choice: 'rationing' } })}
                activeOpacity={0.75}
              >
                <Text style={styles.btnText}>{t('localProtest.choiceRationing')}</Text>
                <Text style={styles.btnSub}>{t('localProtest.rationingDesc')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  const cost = Math.round(gameState.realMoney * 0.15);
                  dispatch({ type: 'DISMISS_LOCAL_PROTEST', payload: { choice: 'compensation', compensationCost: cost } });
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.btnText}>{t('localProtest.choiceCompensation')}</Text>
                <Text style={styles.btnSub}>${Math.round(gameState.realMoney * 0.15).toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#0a0802',
    overflow: 'hidden',
  },
  accentBar: { height: 3, width: '100%' },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,214,0,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,214,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: { fontSize: 22 },
  headerTextCol: { flex: 1, gap: 4 },
  category: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(255,214,0,0.6)', letterSpacing: 3, textTransform: 'uppercase' },
  title: { fontFamily: fonts.orbitron, fontSize: 13, color: '#fff', lineHeight: 18 },
  description: {
    fontFamily: fonts.rajdhani, fontSize: 13,
    color: 'rgba(255,255,255,0.65)', lineHeight: 21, marginBottom: 16,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  tag: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.rajdhani, fontSize: 11 },
  tagNeutral: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  tagTextNeutral: { color: 'rgba(255,255,255,0.4)' },
  tagWarning: { backgroundColor: 'rgba(255,214,0,0.08)', borderColor: 'rgba(255,214,0,0.2)' },
  tagTextWarning: { color: '#ffd600' },
  tagNegative: { backgroundColor: 'rgba(255,61,90,0.1)', borderColor: 'rgba(255,61,90,0.22)' },
  tagTextNegative: { color: '#ff3d5a' },
  choiceRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    borderColor: '#ffd600', backgroundColor: 'rgba(255,214,0,0.12)',
    paddingVertical: 12, alignItems: 'center',
  },
  btnRationing: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,61,90,0.4)', backgroundColor: 'rgba(255,61,90,0.08)',
    paddingVertical: 12, alignItems: 'center',
  },
  btnText: { fontFamily: fonts.orbitron, fontSize: 10, letterSpacing: 1, color: '#ffd600' },
  btnSub: { fontFamily: fonts.rajdhani, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});

export default LocalProtestModal;
