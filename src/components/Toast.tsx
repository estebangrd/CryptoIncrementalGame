import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastProps {
  toast: ToastInfo | null;
  onDismiss: () => void;
}

const BG: Record<string, string> = {
  success: '#0d2e1a',
  error: '#2e0d0d',
  info: '#1a1a2e',
  warning: '#2e2a0d',
};
const BORDER: Record<string, string> = {
  success: '#00ff88',
  error: '#ff4444',
  info: '#4a9eff',
  warning: '#ffd600',
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!toast) return;
    translateY.setValue(-80);
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    anim.start(() => onDismissRef.current());
    return () => anim.stop();
  }, [toast, translateY, opacity]);

  if (!toast) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: BG[toast.type],
        borderColor: BORDER[toast.type],
        transform: [{ translateY }],
        opacity,
      },
    ]}>
      <Text style={[styles.text, { color: BORDER[toast.type] }]}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 9998,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Toast;
