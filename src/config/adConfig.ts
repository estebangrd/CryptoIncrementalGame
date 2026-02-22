/**
 * CONFIGURACIÓN DE ADMOB
 * Source of truth para App IDs, ad unit IDs y constantes de comportamiento de ads.
 * TODO: Reemplazar testAdUnitIds con IDs reales antes de producción.
 */
import { Platform } from 'react-native';

export const AD_APP_IDS = {
  ios: 'ca-app-pub-3940256099942544~1458002511',     // TODO: reemplazar con ID real
  android: 'ca-app-pub-3940256099942544~3347511713', // TODO: reemplazar con ID real
} as const;

export const AD_UNIT_IDS = {
  banner: {
    ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',     // TODO: ID real
    android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // TODO: ID real
  },
  rewarded: {
    ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',     // TODO: ID real
    android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // TODO: ID real
  },
  interstitial: {
    ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',     // TODO: ID real
    android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX', // TODO: ID real
  },
} as const;

export const TEST_AD_UNIT_IDS = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  rewarded: {
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
  },
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  },
} as const;

// Durante desarrollo usa test IDs; en producción usa los reales
const IS_DEV = __DEV__;

export const getAdUnitId = (type: 'banner' | 'rewarded' | 'interstitial'): string => {
  const ids = IS_DEV ? TEST_AD_UNIT_IDS : AD_UNIT_IDS;
  const platform = Platform.OS as 'ios' | 'android';
  return ids[type][platform];
};

export const AD_TIMING = {
  REWARDED_BOOST_DURATION_MS: 4 * 60 * 60 * 1000,  // 4 horas
  REWARDED_COOLDOWN_MS: 5 * 60 * 1000,              // 5 minutos
  INTERSTITIAL_COOLDOWN_MS: 6 * 60 * 60 * 1000,     // 6 horas
  INTERSTITIAL_SKIP_DELAY_S: 5,                      // segundos hasta botón skip
  AD_LOAD_TIMEOUT_MS: 5000,
  AD_RETRY_DELAY_MS: 30000,
  MAX_RETRIES: 3,
} as const;

export const AD_PROMOTION = {
  INTERSTITIAL_THRESHOLD: 50,  // mostrar promo Remove Ads después de N interstitials
  REMINDER_THRESHOLD: 25,      // primer recordatorio
} as const;
