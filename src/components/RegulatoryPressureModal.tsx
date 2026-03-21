/**
 * RegulatoryPressureModal — EU regulatory tax event banner.
 * Shows a decision modal with pay / appeal / ignore options.
 * While appealing, the modal is hidden. When appealResultTime passes,
 * shows the result (success / partial / rejected).
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
import { REGULATORY_EVENT_CONFIG } from '../config/balanceConfig';
import { fonts } from '../config/theme';
import { RegulatoryPressureEvent } from '../types/game';

interface Props {
  event: RegulatoryPressureEvent | null;
}

type AppealOutcome = 'success' | 'partial' | 'rejected';

function computeAppealOutcome(resources: number): AppealOutcome {
  const cfg = REGULATORY_EVENT_CONFIG;
  let pSuccess = cfg.APPEAL_SUCCESS_BASE;
  let pPartial = cfg.APPEAL_PARTIAL_BASE;
  if (resources > cfg.APPEAL_BONUS_THRESHOLD) {
    pSuccess += cfg.APPEAL_BONUS_CLEAN;
    pPartial -= 5;
  } else if (resources < cfg.APPEAL_PENALTY_THRESHOLD) {
    pSuccess -= cfg.APPEAL_PENALTY_DEPLETED;
    pPartial -= 5;
  }
  const roll = Math.random() * 100;
  if (roll < pSuccess) return 'success';
  if (roll < pSuccess + pPartial) return 'partial';
  return 'rejected';
}

const RegulatoryPressureModal: React.FC<Props> = ({ event }) => {
  const { dispatch } = useGame();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState('');
  // Computed once when appeal result becomes available
  const appealOutcomeRef = useRef<AppealOutcome | null>(null);
  const [appealResultReady, setAppealResultReady] = useState(false);

  // Animate in when active
  useEffect(() => {
    const shouldShow =
      event?.status === 'active' ||
      (event?.status === 'appealing' && appealResultReady);
    if (shouldShow) {
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
  }, [event?.status, appealResultReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for decision window
  useEffect(() => {
    if (event?.status !== 'active') return;
    const tick = () => {
      const remaining = Math.max(0, event.decisionDeadline - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event?.status, event?.decisionDeadline]);

  // Poll for appeal result time
  useEffect(() => {
    if (event?.status !== 'appealing' || !event.appealResultTime) return;
    if (Date.now() >= event.appealResultTime) {
      if (!appealOutcomeRef.current) {
        appealOutcomeRef.current = computeAppealOutcome(event.planetResourcesAtTrigger);
      }
      setAppealResultReady(true);
      return;
    }
    const id = setInterval(() => {
      if (event.appealResultTime && Date.now() >= event.appealResultTime) {
        if (!appealOutcomeRef.current) {
          appealOutcomeRef.current = computeAppealOutcome(event.planetResourcesAtTrigger);
        }
        setAppealResultReady(true);
        clearInterval(id);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [event?.status, event?.appealResultTime, event?.planetResourcesAtTrigger]);

  if (!event || event.status === 'resolved') return null;
  // While appealing and result not yet ready: hide modal (player waits)
  if (event.status === 'appealing' && !appealResultReady) return null;

  const showAppealResult = event.status === 'appealing' && appealResultReady;
  const outcome = appealOutcomeRef.current;

  if (showAppealResult && outcome) {
    return <AppealResultModal outcome={outcome} event={event} />;
  }

  // Decision modal (status === 'active')
  const totalDuration = REGULATORY_EVENT_CONFIG.DECISION_WINDOW_MS;
  const remaining = Math.max(0, event.decisionDeadline - Date.now());
  const progress = remaining / totalDuration; // 1 → 0

  return (
    <Modal transparent={true} animationType="fade" visible={true} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }, { translateX: shakeAnim }], opacity: opacityAnim },
          ]}
        >
          <LinearGradient
            colors={['#ff3d5a', '#ff6b42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={[styles.iconBox, styles.iconBoxRed]}>
                <Text style={styles.iconText}>⚠️</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={[styles.category, styles.categoryRed]}>PRESIÓN EXTERNA · REGULATORIO</Text>
                <Text style={styles.title}>Reguladores de la UE proponen impuesto de emergencia</Text>
              </View>
            </View>

            {/* Timer bar */}
            <View style={styles.timerWrap}>
              <View style={styles.timerTrack}>
                <LinearGradient
                  colors={['#ff3d5a', '#ff6b42']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.timerFill, { width: `${Math.round(progress * 100)}%` }]}
                />
              </View>
              <View style={styles.timerLabels}>
                <Text style={styles.timerLabel}>Decidí ahora</Text>
                <Text style={styles.timerLabel}>{timeLeft}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              La Comisión Europea propone un impuesto del 40% a operaciones de minado que superen 50K H/s. Debés decidir ahora.
            </Text>

            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={[styles.tag, styles.tagNegative]}>
                <Text style={[styles.tagText, styles.tagTextNegative]}>−30% Hash Rate si ignorás</Text>
              </View>
              <View style={[styles.tag, styles.tagNeutral]}>
                <Text style={[styles.tagText, styles.tagTextNeutral]}>
                  Costo: ${REGULATORY_EVENT_CONFIG.TAX_AMOUNT.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.btn, styles.btnRed]}
              onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_PRESSURE', payload: 'pay' })}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnText, styles.btnTextRed]}>💰 PAGAR IMPUESTO</Text>
              <Text style={styles.btnSub}>
                Costo: ${REGULATORY_EVENT_CONFIG.TAX_AMOUNT.toLocaleString()} — operación continúa normalmente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_PRESSURE', payload: 'appeal' })}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnText, styles.btnTextSecondary]}>⚖️ APELAR LEGALMENTE</Text>
              <Text style={styles.btnSub}>
                Demora la decisión — costo ${REGULATORY_EVENT_CONFIG.LEGAL_FEE.toLocaleString()} en abogados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDismiss}
              onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_PRESSURE', payload: 'ignore' })}
              activeOpacity={0.75}
            >
              <Text style={styles.btnDismissText}>IGNORAR</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface AppealResultProps {
  outcome: AppealOutcome;
  event: RegulatoryPressureEvent;
}

const AppealResultModal: React.FC<AppealResultProps> = ({ outcome, event: _event }) => {
  const { dispatch } = useGame();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = REGULATORY_EVENT_CONFIG;
  const accentColors: Record<AppealOutcome, [string, string]> = {
    success: ['#00ff88', '#00e5ff'],
    partial: ['#ffd600', '#ff8c00'],
    rejected: ['#ff3d5a', '#ff6b42'],
  };
  const [color1, color2] = accentColors[outcome];

  return (
    <Modal transparent={true} animationType="fade" visible={true} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
        >
          <LinearGradient
            colors={[color1, color2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBox, styles.iconBoxNeutral]}>
                <Text style={styles.iconText}>⚖️</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.category}>RESULTADO LEGAL · APELACIÓN</Text>
                {outcome === 'success' && (
                  <Text style={styles.title}>Apelación exitosa — impuesto anulado</Text>
                )}
                {outcome === 'partial' && (
                  <Text style={styles.title}>Acuerdo parcial — impuesto reducido</Text>
                )}
                {outcome === 'rejected' && (
                  <Text style={styles.title}>Apelación rechazada — fallo definitivo</Text>
                )}
              </View>
            </View>

            {outcome === 'success' && (
              <>
                <Text style={styles.description}>
                  El tribunal europeo falló a tu favor. El impuesto fue declarado desproporcionado y queda sin efecto. Tus ${cfg.LEGAL_FEE.toLocaleString()} en honorarios legales fueron suficientes.
                </Text>
                <View style={styles.tagsRow}>
                  <View style={[styles.tag, styles.tagPositive]}><Text style={[styles.tagText, styles.tagTextPositive]}>Impuesto anulado</Text></View>
                  <View style={[styles.tag, styles.tagPositive]}><Text style={[styles.tagText, styles.tagTextPositive]}>Hash rate sin cambios</Text></View>
                  <View style={[styles.tag, styles.tagNeutral]}><Text style={[styles.tagText, styles.tagTextNeutral]}>Costo total: ${cfg.LEGAL_FEE.toLocaleString()}</Text></View>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnGreen]}
                  onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_APPEAL', payload: { outcome: 'success' } })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, styles.btnTextGreen]}>✓ RECIBIDO</Text>
                </TouchableOpacity>
              </>
            )}

            {outcome === 'partial' && (
              <>
                <Text style={styles.description}>
                  El tribunal aceptó un acuerdo. Pagarás el 20% del impuesto original. La operación continúa sin penalización adicional.
                </Text>
                <View style={styles.tagsRow}>
                  <View style={[styles.tag, styles.tagWarning]}><Text style={[styles.tagText, styles.tagTextWarning]}>Pago reducido: ${cfg.PARTIAL_AMOUNT.toLocaleString()}</Text></View>
                  <View style={[styles.tag, styles.tagPositive]}><Text style={[styles.tagText, styles.tagTextPositive]}>Hash rate sin cambios</Text></View>
                  <View style={[styles.tag, styles.tagNeutral]}><Text style={[styles.tagText, styles.tagTextNeutral]}>Costo total: ${(cfg.LEGAL_FEE + cfg.PARTIAL_AMOUNT).toLocaleString()}</Text></View>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnYellow]}
                  onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_APPEAL', payload: { outcome: 'partial', choice: 'pay' } })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, styles.btnTextYellow]}>💰 PAGAR ${cfg.PARTIAL_AMOUNT.toLocaleString()}</Text>
                  <Text style={styles.btnSub}>Acuerdo aceptado — operación continúa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_APPEAL', payload: { outcome: 'partial', choice: 'accept_penalty' } })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, styles.btnTextSecondary]}>RECHAZAR ACUERDO</Text>
                  <Text style={styles.btnSub}>Aceptar penalización de hash rate −30%</Text>
                </TouchableOpacity>
              </>
            )}

            {outcome === 'rejected' && (
              <>
                <Text style={styles.description}>
                  El tribunal rechazó la apelación. Debés pagar el impuesto original más una multa por demora. No hay más instancias posibles.
                </Text>
                <View style={styles.tagsRow}>
                  <View style={[styles.tag, styles.tagNegative]}><Text style={[styles.tagText, styles.tagTextNegative]}>Impuesto completo: ${cfg.TAX_AMOUNT.toLocaleString()}</Text></View>
                  <View style={[styles.tag, styles.tagNegative]}><Text style={[styles.tagText, styles.tagTextNegative]}>Multa por demora: $8,000</Text></View>
                  <View style={[styles.tag, styles.tagWarning]}><Text style={[styles.tagText, styles.tagTextWarning]}>Total: ${cfg.REJECTED_TOTAL.toLocaleString()} o −30% hash rate</Text></View>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnRed]}
                  onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_APPEAL', payload: { outcome: 'rejected', choice: 'pay' } })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, styles.btnTextRed]}>💰 PAGAR ${cfg.REJECTED_TOTAL.toLocaleString()}</Text>
                  <Text style={styles.btnSub}>Operación continúa sin penalización</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => dispatch({ type: 'RESOLVE_REGULATORY_APPEAL', payload: { outcome: 'rejected', choice: 'accept_penalty' } })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, styles.btnTextSecondary]}>ACEPTAR PENALIZACIÓN</Text>
                  <Text style={styles.btnSub}>−30% hash rate por 24h — sin costo adicional</Text>
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: '#0d0408',
    overflow: 'hidden',
  },
  accentBar: { height: 3, width: '100%' },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBoxRed: { backgroundColor: 'rgba(255,61,90,0.08)', borderWidth: 1, borderColor: 'rgba(255,61,90,0.2)' },
  iconBoxNeutral: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  iconText: { fontSize: 22 },
  headerTextCol: { flex: 1, gap: 4 },
  category: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase' },
  categoryRed: { color: 'rgba(255,61,90,0.6)' },
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
  tagNegative: { backgroundColor: 'rgba(255,61,90,0.1)', borderColor: 'rgba(255,61,90,0.22)' },
  tagTextNegative: { color: '#ff3d5a' },
  tagPositive: { backgroundColor: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.22)' },
  tagTextPositive: { color: '#00ff88' },
  tagWarning: { backgroundColor: 'rgba(255,214,0,0.08)', borderColor: 'rgba(255,214,0,0.2)' },
  tagTextWarning: { color: '#ffd600' },
  tagNeutral: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  tagTextNeutral: { color: 'rgba(255,255,255,0.4)' },
  btn: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginBottom: 7 },
  btnText: { fontFamily: fonts.orbitron, fontSize: 11, letterSpacing: 2 },
  btnSub: { fontFamily: fonts.rajdhani, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  btnRed: { backgroundColor: 'rgba(255,61,90,0.12)', borderColor: '#ff3d5a' },
  btnTextRed: { color: '#ff3d5a' },
  btnGreen: { backgroundColor: 'rgba(0,255,136,0.12)', borderColor: '#00ff88' },
  btnTextGreen: { color: '#00ff88' },
  btnYellow: { backgroundColor: 'rgba(255,214,0,0.12)', borderColor: '#ffd600' },
  btnTextYellow: { color: '#ffd600' },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' },
  btnTextSecondary: { color: 'rgba(255,255,255,0.4)' },
  btnDismiss: { alignItems: 'center', paddingVertical: 8 },
  btnDismissText: { fontFamily: fonts.orbitron, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
});

export default RegulatoryPressureModal;
