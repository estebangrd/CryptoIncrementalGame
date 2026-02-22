// Servicio de AdMob para ads rewarded e interstitial
import {
  MobileAds,
  RewardedAd,
  InterstitialAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { getAdUnitId, AD_TIMING } from '../config/adConfig';
import { GameState } from '../types/game';

// Módulo-level state para instancias pre-cargadas
let rewardedAd: RewardedAd | null = null;
let interstitialAd: InterstitialAd | null = null;
let rewardedAdLoaded = false;
let interstitialLoaded = false;

/**
 * Inicializa el SDK de AdMob y pre-carga el primer rewarded ad.
 * Debe llamarse una vez al arrancar la app.
 * @returns true si la inicialización fue exitosa
 */
export const initializeAdMob = async (): Promise<boolean> => {
  try {
    await MobileAds().initialize();
    loadRewardedAd();
    return true;
  } catch (error) {
    console.warn('[AdMobService] Failed to initialize AdMob:', error);
    return false;
  }
};

/**
 * Crea una nueva instancia del rewarded ad y la pre-carga.
 * Se llama automáticamente después de mostrar un ad para tener el siguiente listo.
 */
export const loadRewardedAd = (): void => {
  const ad = RewardedAd.createForAdRequest(getAdUnitId('rewarded'));
  rewardedAd = ad;

  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedAdLoaded = true;
  });

  ad.addAdEventListener(AdEventType.ERROR, () => {
    rewardedAdLoaded = false;
    // Reintentar después del delay configurado
    setTimeout(() => {
      loadRewardedAd();
    }, AD_TIMING.AD_RETRY_DELAY_MS);
  });

  ad.load();
};

/**
 * Muestra el rewarded ad pre-cargado.
 * @param onReward - Callback invocado cuando el usuario gana la recompensa
 * @param onDismiss - Callback opcional invocado cuando el ad se cierra
 * @returns true si el ad se mostró correctamente
 */
export const showRewardedAd = async (
  onReward: () => void,
  onDismiss?: () => void,
): Promise<boolean> => {
  if (!rewardedAdLoaded || !rewardedAd) {
    return false;
  }

  try {
    const ad = rewardedAd;

    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onReward();
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      onDismiss?.();
      // Pre-cargar el siguiente ad inmediatamente
      loadRewardedAd();
    });

    ad.show();
    return true;
  } catch (error) {
    console.warn('[AdMobService] Failed to show rewarded ad:', error);
    return false;
  }
};

/**
 * Crea una nueva instancia del interstitial ad y la pre-carga.
 * Se llama automáticamente después de mostrar un ad para tener el siguiente listo.
 */
export const loadInterstitial = (): void => {
  const ad = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'));
  interstitialAd = ad;

  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });

  ad.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    // Pre-cargar el siguiente ad inmediatamente
    loadInterstitial();
  });

  ad.load();
};

/**
 * Muestra el interstitial si el jugador cumple las condiciones de elegibilidad.
 * No muestra en primera sesión ni si está dentro del cooldown.
 * @param gameState - Estado actual del juego para verificar elegibilidad
 * @returns true si el ad se mostró correctamente
 */
export const showInterstitialIfEligible = (gameState: GameState): boolean => {
  // No mostrar si el jugador compró Remove Ads
  if (gameState.iapState.removeAdsPurchased) {
    return false;
  }

  // No mostrar en la primera sesión
  if (gameState.adState.isFirstSession) {
    return false;
  }

  if (!interstitialLoaded || !interstitialAd) {
    return false;
  }

  // Verificar cooldown
  const lastShown = gameState.adState.lastInterstitialShownAt;
  if (lastShown !== null && Date.now() - lastShown < AD_TIMING.INTERSTITIAL_COOLDOWN_MS) {
    return false;
  }

  try {
    interstitialAd.show();
    return true;
  } catch (error) {
    console.warn('[AdMobService] Failed to show interstitial:', error);
    return false;
  }
};

/**
 * Indica si hay un rewarded ad cargado y listo para mostrar.
 */
export const isRewardedAdReady = (): boolean => {
  return rewardedAdLoaded && rewardedAd !== null;
};

/**
 * Indica si hay un interstitial cargado y listo para mostrar.
 */
export const isInterstitialReady = (): boolean => {
  return interstitialLoaded && interstitialAd !== null;
};

/**
 * Verifica si el jugador puede ver un rewarded ad en este momento.
 * Comprueba disponibilidad del ad y que haya pasado el cooldown.
 * @param gameState - Estado actual del juego
 * @returns true si el jugador puede ver el ad
 */
export const canWatchRewardedAd = (gameState: GameState): boolean => {
  if (!isRewardedAdReady()) {
    return false;
  }

  // Verificar cooldown del boost
  const lastWatched = gameState.adBoost.lastWatchedAt;
  if (lastWatched !== null && Date.now() - lastWatched < AD_TIMING.REWARDED_COOLDOWN_MS) {
    return false;
  }

  return true;
};
