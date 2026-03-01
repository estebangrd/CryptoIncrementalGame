# Ad System - AdMob Integration

## Estado
- **Fase**: Phase 1 - Genesis (Designed, Not Implemented)
- **Estado**: Specification Complete
- **Prioridad**: High (Primary Monetization)
- **Última actualización**: 2026-02-21

## Descripción

El sistema de anuncios proporciona monetización primaria para Blockchain Tycoon a través de Google AdMob. Implementa tres tipos de anuncios: Banner Ads (bottom position, removibles con IAP), Rewarded Video Ads (unlimited con cooldown, otorgan 2x production por 4 horas), e Interstitial Ads (app open, max 1 cada 6 horas, removibles con IAP).

La estrategia de anuncios está diseñada para maximizar revenue sin comprometer la experiencia de usuario: los banners son discretos, los intersticiales son poco frecuentes, y los rewarded ads ofrecen valor genuino al jugador. Los rewarded ads NO se pueden remover con IAP porque otorgan beneficios, mientras que banner e interstitial SÍ se pueden remover.

Este es el primer juego del desarrollador, por lo que AdMob es la plataforma elegida por su facilidad de integración y excelente documentación para principiantes.

## Objetivos
- [ ] Integrar Google AdMob en iOS y Android
- [ ] Implementar Banner Ads en posición bottom (todas las pantallas)
- [ ] Implementar Rewarded Video Ads con cooldown de 5 minutos
- [ ] Implementar Interstitial Ads en app open (max 1 cada 6 horas)
- [ ] Aplicar reward de 2x production por 4 horas al ver rewarded ad
- [ ] Respetar estado de "Remove Ads" IAP (ocultar banner/interstitial)
- [ ] Implementar graceful degradation (si ad falla, continuar gameplay)
- [ ] Cumplir con GDPR/COPPA compliance
- [ ] Trackear eventos de ads en Firebase Analytics

## Comportamiento Esperado

### Caso de Uso 1: Inicialización de AdMob
**Dado que** el usuario abre la app por primera vez
**Cuando** el app se inicializa
**Entonces**
- AdMob SDK se inicializa con App ID correcto (iOS/Android)
- Se verifica si hay consent para GDPR (usuarios de EU)
- Si es EU y no hay consent: mostrar consent dialog
- Si hay consent o no es EU: inicializar AdMob normalmente
- Se pre-cargan anuncios en background:
  - Banner ad (para mostrar inmediatamente)
  - Interstitial ad (para próximo app open)
  - Rewarded ad (para cuando usuario quiera verlo)
- Si la inicialización falla: log error pero continuar gameplay
- Estado de inicialización se guarda en `adInitialized: true`

### Caso de Uso 2: Mostrar Banner Ad (Primera Vez)
**Dado que** el usuario está en la pantalla principal
**Cuando** la pantalla carga y AdMob está inicializado
**Entonces**
- Se verifica si Remove Ads IAP fue comprado:
  - Si comprado: NO mostrar banner, skip
  - Si NO comprado: continuar
- Banner ad se carga en bottom position
- Banner se muestra con size `ANCHORED_ADAPTIVE_BANNER` (responsive)
- Altura del banner se reserva en el layout (50-90px según device):
  - `AdBanner` reporta su altura real al parent via prop `onHeightChange(height: number)`
  - `GameScreen` guarda esa altura en estado (`adBannerHeight`)
  - `BottomSheetTabs` recibe prop `bottomOffset` y ajusta su `container.bottom` a ese valor
  - El banner queda en `position: 'absolute'` bottom 0 (ancla visual)
  - El bottom sheet se acorta por arriba para no quedar cubierto por el banner
- Cuando Remove Ads se compra: `AdBanner` retorna null y emite `onHeightChange(0)` via useEffect, recuperando el espacio completo para la UI de juego
- El layout resultante se comporta como si el banner no existiera: las proporciones de todos los elementos se mantienen exactamente igual, simplemente el bottom sheet ocupa hasta el borde inferior de la pantalla
- Si el banner falla al cargar:
  - Log error a Analytics: `ad_load_failed`
  - NO mostrar espacio vacío
  - Retry después de 30 segundos
- Si el banner carga exitosamente:
  - Log evento: `ad_loaded` con type `banner`
  - Banner permanece visible mientras el usuario esté en la app

### Caso de Uso 3: Banner Ad en Múltiples Pantallas
**Dado que** el usuario navega entre tabs/screens
**Cuando** cambia de pantalla
**Entonces**
- El banner persiste en TODAS las pantallas (no se recarga)
- Posición siempre bottom, nunca cubre contenido importante
- En pantallas con scroll: banner permanece fijo en bottom (sticky)
- Excepciones donde NO mostrar banner:
  - Modales/dialogs fullscreen
  - Loading screens
  - Splash screen
  - Si Remove Ads fue comprado

### Caso de Uso 4: Usuario Ve Rewarded Video Ad (Primera Vez)
**Dado que** el usuario quiere un boost de producción
**Cuando** presiona el botón "Watch Ad for 2x Boost"
**Entonces**
- Se verifica si hay cooldown activo:
  - Si cooldown activo (< 5 min desde último): mostrar timer "Available in X:XX"
  - Si cooldown expiró o no hay cooldown: continuar
- Se verifica si rewarded ad está cargado:
  - Si cargado: mostrar ad inmediatamente
  - Si NO cargado: mostrar "Loading ad..." spinner
    - Intentar cargar ad
    - Si falla después de 5s: "Ad not available, try again later"
    - Si carga exitosamente: mostrar ad
- Rewarded ad se reproduce en fullscreen
- Usuario ve el video (típicamente 15-30 segundos)
- Usuario tiene opciones:
  - Ver el ad completo → otorgar reward
  - Cerrar ad antes de completarlo → NO otorgar reward
- Si el ad se completa:
  - Aplicar reward: 2x production multiplier por 4 horas
  - Mostrar notificación: "2x Production Boost Active! (4 hours)"
  - Iniciar cooldown de 5 minutos
  - Guardar timestamp de activación en gameState
  - Pre-cargar próximo rewarded ad en background
  - Log evento: `rewarded_ad_watched`
- Si el ad se cierra prematuramente:
  - NO aplicar reward
  - Mostrar toast: "Watch the full ad to get the reward"
  - NO iniciar cooldown
  - Log evento: `rewarded_ad_skipped`

### Caso de Uso 5: Usuario con Boost Activo Ve Otro Rewarded Ad
**Dado que** el usuario ya tiene un boost de 2x activo
**Cuando** intenta ver otro rewarded ad
**Entonces**
- Se verifica si hay boost activo:
  - Si boost activo: mostrar warning dialog
    - "You already have a 2x boost active (X:XX remaining)"
    - "Watching another ad will REPLACE the current boost, not stack"
    - Botones: "Cancel" | "Watch Ad Anyway"
  - Si selecciona "Cancel": cerrar dialog, no mostrar ad
  - Si selecciona "Watch Ad Anyway":
    - Mostrar rewarded ad normalmente
    - Al completar: RESETEAR el timer a 4 horas (no sumar)
    - Mostrar notificación: "Boost refreshed! 4 hours remaining"
    - Log evento: `rewarded_ad_refreshed`

### Caso de Uso 6: Boost de Rewarded Ad Activo Durante Gameplay
**Dado que** el usuario tiene un boost de 2x activo
**Cuando** está jugando
**Entonces**
- La producción total se multiplica por 2:
  - `totalProduction = baseProduction × prestigeMultiplier × rewardedAdBoost`
  - `rewardedAdBoost = 2.0` si activo, `1.0` si no activo
- UI muestra indicador visual del boost:
  - Badge/icon en top bar: "2x Boost: 3:45:12"
  - Timer cuenta regresiva en tiempo real
  - Color dorado/especial para indicar boost activo
- Cuando el boost expira:
  - Producción vuelve a normal (sin el 2x)
  - Mostrar notificación: "2x Boost expired!"
  - Remover badge/icon del top bar
  - Log evento: `rewarded_ad_boost_expired`
  - El cooldown de 5 min NO se aplica al expirar (solo al ver nuevo ad)

### Caso de Uso 7: Interstitial Ad en App Open
**Dado que** el usuario abre la app
**Cuando** la app pasa de background a foreground
**Entonces**
- Se verifica si Remove Ads IAP fue comprado:
  - Si comprado: NO mostrar interstitial, skip
  - Si NO comprado: continuar
- Se verifica tiempo desde último interstitial:
  - Si < 6 horas: NO mostrar, skip
  - Si >= 6 horas o nunca mostrado: continuar
- Se verifica si interstitial está cargado:
  - Si NO cargado: intentar cargar en background, skip por ahora
  - Si cargado: continuar
- Se verifica si es la primera vez que abre la app (session inicial):
  - Si es primera vez: NO mostrar interstitial (mala UX)
  - Si es re-open: continuar
- Mostrar interstitial en fullscreen
- Usuario ve el ad (típicamente 5-15 segundos)
- Usuario puede cerrar después de 5 segundos (skip button aparece)
- Al cerrar (completado o skipped):
  - Guardar timestamp de último interstitial
  - Pre-cargar próximo interstitial en background
  - Log evento: `interstitial_ad_shown`
  - Continuar gameplay normalmente

### Caso de Uso 8: Interstitial Ad Falla al Cargar
**Dado que** se debe mostrar un interstitial
**Cuando** el ad no está disponible (sin conexión, sin inventory)
**Entonces**
- NO mostrar error al usuario (silent fail)
- NO bloquear gameplay
- Continuar como si el ad se hubiera mostrado
- Log error: `interstitial_load_failed` con reason
- Intentar pre-cargar otro interstitial después de 1 minuto
- NO resetear el timer de 6 horas (cuenta como "no mostrado")

### Caso de Uso 9: Usuario Compra Remove Ads IAP
**Dado que** el usuario tenía ads activos
**Cuando** compra "Remove Ads" IAP
**Entonces**
- Inmediatamente ocultar banner ad (si visible)
- Actualizar estado: `removeAdsPurchased: true`
- Guardar estado en AsyncStorage y backend
- Los próximos interstitials NO se mostrarán (se skippean)
- Banner NO se mostrará en ninguna pantalla
- Rewarded ads SIGUEN DISPONIBLES (NO removidos):
  - Botón "Watch Ad for 2x Boost" sigue visible
  - Funcionalidad completa de rewarded ads intacta
- Mostrar notificación: "Ads removed! (Rewarded ads still available)"
- Log evento: `remove_ads_purchased`

### Caso de Uso 10: Usuario Sin Conexión
**Dado que** el usuario no tiene internet
**Cuando** intenta ver un ad
**Entonces**
- Banner ad: mostrar espacio vacío o placeholder "No connection"
- Rewarded ad: mostrar dialog "No internet connection. Connect to watch ads."
- Interstitial ad: skip silenciosamente
- Cuando la conexión se restaura:
  - Pre-cargar todos los tipos de ads
  - Banner aparece automáticamente
  - Log evento: `ads_connection_restored`

### Caso de Uso 11: Cooldown de Rewarded Ad
**Dado que** el usuario acaba de ver un rewarded ad
**Cuando** el boost se activa
**Entonces**
- Se inicia cooldown de 5 minutos
- Botón "Watch Ad" se deshabilita
- UI muestra timer: "Next ad available in 4:32"
- Timer cuenta regresiva en tiempo real
- Al expirar el cooldown:
  - Botón se habilita de nuevo
  - Mostrar badge/notification: "Rewarded ad available!"
  - Log evento: `rewarded_ad_cooldown_expired`

### Caso de Uso 12: App Cerrada con Boost Activo
**Dado que** el usuario tiene boost de 2x activo
**Cuando** cierra la app y la reabre después
**Entonces**
- Al reabrir app:
  - Calcular tiempo offline: `Date.now() - lastSaveTime`
  - Verificar si boost sigue activo:
    - Si `Date.now() - boostActivatedAt < 4 hours`: boost sigue activo
    - Si expiró durante offline: boost inactivo
  - Si boost expiró mientras estaba offline:
    - Producción offline se calcula con boost hasta el momento de expiración
    - Después de expiración: producción sin boost
    - Mostrar notificación: "Your 2x boost expired while you were away"
  - Si boost sigue activo:
    - Continuar aplicando boost
    - Mostrar tiempo restante actualizado

## Fórmulas y Cálculos

### Multiplicador de Rewarded Ad Boost
```typescript
function calculateRewardedAdBoost(gameState: GameState): number {
  const now = Date.now();
  const boostDuration = 4 * 60 * 60 * 1000; // 4 horas en ms

  if (!gameState.adBoost.isActive) {
    return 1.0; // Sin boost
  }

  const timeElapsed = now - gameState.adBoost.activatedAt;

  if (timeElapsed >= boostDuration) {
    // Boost expiró
    return 1.0;
  }

  // Boost activo
  return AD_CONFIG.rewardedAdBoostMultiplier; // 2.0
}

// Tiempo restante del boost
function getBoostTimeRemaining(gameState: GameState): number {
  const now = Date.now();
  const boostDuration = 4 * 60 * 60 * 1000;
  const timeElapsed = now - gameState.adBoost.activatedAt;
  const remaining = boostDuration - timeElapsed;

  return Math.max(0, remaining);
}
```

### Cooldown de Rewarded Ad
```typescript
function canWatchRewardedAd(gameState: GameState): boolean {
  const now = Date.now();
  const cooldownDuration = 5 * 60 * 1000; // 5 minutos en ms

  if (!gameState.adBoost.lastWatchedAt) {
    return true; // Nunca visto, puede ver
  }

  const timeSinceLastWatch = now - gameState.adBoost.lastWatchedAt;

  return timeSinceLastWatch >= cooldownDuration;
}

function getCooldownTimeRemaining(gameState: GameState): number {
  const now = Date.now();
  const cooldownDuration = 5 * 60 * 1000;
  const timeSinceLastWatch = now - gameState.adBoost.lastWatchedAt;
  const remaining = cooldownDuration - timeSinceLastWatch;

  return Math.max(0, remaining);
}
```

### Verificación de Interstitial Ad
```typescript
function shouldShowInterstitialAd(gameState: GameState): boolean {
  // No mostrar si Remove Ads fue comprado
  if (gameState.iapState.removeAdsPurchased) {
    return false;
  }

  // No mostrar en primera sesión
  if (gameState.adState.isFirstSession) {
    return false;
  }

  // Verificar cooldown de 6 horas
  const now = Date.now();
  const cooldownDuration = 6 * 60 * 60 * 1000; // 6 horas en ms

  if (!gameState.adState.lastInterstitialShownAt) {
    return true; // Nunca mostrado, puede mostrar
  }

  const timeSinceLast = now - gameState.adState.lastInterstitialShownAt;

  return timeSinceLast >= cooldownDuration;
}
```

### Aplicación del Boost a la Producción
```typescript
function calculateTotalProductionWithBoost(gameState: GameState): number {
  // Calcular producción base
  const baseProduction = calculateBaseProduction(gameState);

  // Aplicar prestige multiplier
  const withPrestige = baseProduction * gameState.prestigeProductionMultiplier;

  // Aplicar rewarded ad boost (si activo)
  const adBoost = calculateRewardedAdBoost(gameState);
  const finalProduction = withPrestige * adBoost;

  return finalProduction;
}

// Ejemplo:
// Base production: 1000 CC/s
// Prestige multiplier: 1.5x
// Ad boost: 2.0x (si activo)
// Final: 1000 × 1.5 × 2.0 = 3000 CC/s
```

### Offline Production con Boost Activo
```typescript
function calculateOfflineEarningsWithBoost(
  secondsOffline: number,
  baseProductionPerSecond: number,
  boostState: AdBoostState
): number {
  if (!boostState.isActive) {
    // Sin boost, cálculo normal
    return secondsOffline * baseProductionPerSecond * 0.5; // 50% offline
  }

  const boostDuration = 4 * 60 * 60; // 4 horas en segundos
  const boostActivatedAt = boostState.activatedAt / 1000; // convertir a segundos
  const now = Date.now() / 1000;
  const offlineStartTime = now - secondsOffline;

  // Calcular cuánto tiempo del offline tuvo boost
  const boostExpiresAt = boostActivatedAt + boostDuration;

  let timeWithBoost = 0;
  let timeWithoutBoost = 0;

  if (offlineStartTime >= boostExpiresAt) {
    // Todo el offline fue sin boost (expiró antes)
    timeWithoutBoost = secondsOffline;
  } else if (offlineStartTime < boostActivatedAt) {
    // Offline empezó antes del boost
    const timeBeforeBoost = Math.min(boostActivatedAt - offlineStartTime, secondsOffline);
    const timeAfterBoostStart = secondsOffline - timeBeforeBoost;

    timeWithBoost = Math.min(timeAfterBoostStart, boostDuration);
    timeWithoutBoost = secondsOffline - timeWithBoost;
  } else {
    // Offline empezó durante el boost
    timeWithBoost = Math.min(boostExpiresAt - offlineStartTime, secondsOffline);
    timeWithoutBoost = secondsOffline - timeWithBoost;
  }

  // Calcular earnings
  const earningsWithBoost = timeWithBoost * baseProductionPerSecond * 2.0 * 0.5;
  const earningsWithoutBoost = timeWithoutBoost * baseProductionPerSecond * 0.5;

  return earningsWithBoost + earningsWithoutBoost;
}
```

## Constantes de Configuración

En `src/config/adConfig.ts`:

```typescript
export const AD_CONFIG = {
  // AdMob App IDs
  appId: {
    ios: 'ca-app-pub-XXXXXXXXXX~XXXXXXXXXX', // TODO: Replace with real ID
    android: 'ca-app-pub-XXXXXXXXXX~XXXXXXXXXX', // TODO: Replace with real ID
  },

  // AdMob Ad Unit IDs (Production)
  adUnitIds: {
    banner: {
      ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
      android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
    },
    rewarded: {
      ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
      android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
    },
    interstitial: {
      ios: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
      android: 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
    },
  },

  // Test Ad Unit IDs (for development)
  testAdUnitIds: {
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
  },

  // Rewarded Ad Configuration
  rewardedAdBoostMultiplier: 2.0,        // 2x production
  rewardedAdBoostDuration: 4 * 60 * 60,  // 4 horas en segundos
  rewardedAdCooldown: 5 * 60,            // 5 minutos en segundos

  // Interstitial Configuration
  interstitialCooldown: 6 * 60 * 60,     // 6 horas en segundos
  interstitialSkipDelay: 5,               // 5 segundos hasta skip button

  // Banner Configuration
  bannerSize: 'SMART_BANNER',             // Adaptive banner size
  bannerPosition: 'BOTTOM',               // Always bottom

  // Loading/Retry Configuration
  adLoadTimeout: 5000,                    // 5 segundos
  adRetryDelay: 30000,                    // 30 segundos
  maxRetries: 3,                          // Max 3 intentos

  // GDPR/Compliance
  requireConsent: true,                   // Require consent for EU users
  underAgeOfConsent: 13,                  // COPPA compliance
};
```

## Estructura de Datos

### AdState (GameState)
```typescript
interface GameState {
  // ... otros campos

  adState: {
    // AdMob initialization
    adInitialized: boolean;              // Si AdMob fue inicializado
    gdprConsentGiven: boolean | null;    // null = no EU, true/false = consent

    // Banner state
    bannerLoaded: boolean;               // Si banner está cargado
    bannerVisible: boolean;              // Si banner está visible

    // Interstitial state
    lastInterstitialShownAt: number | null;  // Timestamp de último interstitial
    interstitialLoaded: boolean;             // Si interstitial está pre-cargado
    isFirstSession: boolean;                 // Para no mostrar en primera vez

    // Rewarded ad state
    rewardedAdLoaded: boolean;           // Si rewarded ad está pre-cargado
  };

  // Rewarded Ad Boost State
  adBoost: {
    isActive: boolean;                   // Si boost de 2x está activo
    activatedAt: number | null;          // Timestamp de activación
    expiresAt: number | null;            // Timestamp de expiración
    lastWatchedAt: number | null;        // Timestamp de último ad visto
  };

  // IAP state (relacionado)
  iapState: {
    removeAdsPurchased: boolean;         // Si Remove Ads fue comprado
    // ... otros IAP
  };
}
```

### Ad Event Log (Analytics)
```typescript
interface AdEvent {
  eventName: string;                     // Nombre del evento
  adType: 'banner' | 'rewarded' | 'interstitial';
  timestamp: number;
  success: boolean;
  errorCode?: string;                    // Si falló
  metadata?: {
    boostActive?: boolean;
    cooldownRemaining?: number;
    removeAdsPurchased?: boolean;
  };
}
```

## Reglas de Negocio

1. **Banner Ads son removibles con IAP**: Comprar "Remove Ads" ($0.99) oculta banners
2. **Interstitial Ads son removibles con IAP**: Comprar "Remove Ads" también los remueve
3. **Rewarded Ads NO son removibles**: Siempre disponibles porque otorgan beneficio
4. **Rewarded Ad boost NO stackea**: Ver otro ad reemplaza el boost, no lo suma
5. **Cooldown de rewarded ad es 5 minutos**: Después de ver un ad, debe esperar 5 min
6. **Boost de rewarded ad dura 4 horas**: 2x production por 4 horas exactas
7. **Interstitial cooldown es 6 horas**: Max 1 cada 6 horas, solo en app open
8. **No interstitial en primera sesión**: Mala UX mostrar ad inmediatamente
9. **Graceful degradation**: Si ad falla, continuar gameplay sin bloquear
10. **GDPR compliance obligatorio**: Usuarios de EU deben dar consent explícito
11. **Banner siempre en bottom**: Nunca cubre contenido importante
12. **Boost persiste offline**: Si cierra app con boost, sigue al reabrir (si no expiró)

## UI/UX Requirements

### Banner Ad Component
- [ ] Posición: Bottom de la pantalla, siempre
- [ ] Size: SMART_BANNER (adaptive, 50-90px de altura)
- [ ] Background: Match con theme del juego
- [ ] NO cubrir botones importantes (compra, venta, etc.)
- [ ] En pantallas con scroll: banner sticky (no scrollea)
- [ ] Si Remove Ads comprado: banner invisible (no reserve espacio)

### Rewarded Ad Button
- [ ] Ubicación: Top bar o tab dedicado "Free Boost"
- [ ] Icono: Video/play icon + "2x Boost"
- [ ] Estados:
  - **Available**: Verde, pulsante, "Watch Ad for 2x Boost"
  - **Cooldown**: Gris, deshabilitado, "Next ad in 4:32"
  - **Boost Active**: Dorado, muestra timer "2x Active: 3:45:12"
  - **Loading**: Spinner, "Loading ad..."
- [ ] Al tocar:
  - Si available: mostrar rewarded ad inmediatamente
  - Si cooldown: mostrar toast "Available in X minutes"
  - Si boost active: mostrar dialog de confirmación

### Boost Active Indicator
- [ ] Badge en top bar: "2x" con timer
- [ ] Color: Dorado/amarillo brillante
- [ ] Animación: Glow/pulsante sutil
- [ ] Timer: Formato "H:MM:SS"
- [ ] Al tocar: mostrar modal con detalles:
  - "2x Production Boost Active"
  - "Time remaining: 3:45:12"
  - "Your production is doubled!"
  - Botón: "Watch another ad (will reset timer)"

### Interstitial Ad Display
- [ ] Fullscreen overlay
- [ ] Skip button aparece después de 5 segundos
- [ ] NO bloquear gameplay si falla
- [ ] NO mostrar loading spinner (silent background load)

### GDPR Consent Dialog (EU Users)
- [ ] Mostrar antes de inicializar AdMob
- [ ] Título: "We use ads to keep this game free"
- [ ] Texto:
  - "We show ads to support development"
  - "You can opt-out or remove ads with a one-time purchase"
  - "Your data is processed according to our Privacy Policy"
- [ ] Botones:
  - "Accept" (verde)
  - "Decline" (gris)
  - "Learn More" (link a privacy policy)
- [ ] Si decline: NO mostrar ads personalizados (solo non-personalized)

### No Connection Dialog (Rewarded Ads)
- [ ] Título: "No internet connection"
- [ ] Texto: "Connect to the internet to watch ads and get boosts"
- [ ] Icono: WiFi con X
- [ ] Botón: "OK"

## Validaciones

### Pre-Initialization
- [ ] Verificar que AdMob App ID está configurado (no test ID en production)
- [ ] Verificar que device tiene conexión a internet
- [ ] Verificar GDPR consent para usuarios de EU
- [ ] Verificar edad del usuario (COPPA compliance)

### Pre-Banner Load
- [ ] Verificar que AdMob está inicializado
- [ ] Verificar que Remove Ads NO fue comprado
- [ ] Verificar que hay conexión a internet

### Pre-Rewarded Ad Show
- [ ] Verificar que cooldown expiró (>= 5 min desde último)
- [ ] Verificar que rewarded ad está cargado
- [ ] Verificar que hay conexión a internet
- [ ] Si boost activo: mostrar warning dialog

### Pre-Interstitial Show
- [ ] Verificar que Remove Ads NO fue comprado
- [ ] Verificar que NO es primera sesión
- [ ] Verificar que >= 6 horas desde último interstitial
- [ ] Verificar que interstitial está cargado

### Post-Rewarded Ad Complete
- [ ] Verificar que ad fue completado (no skipped)
- [ ] Aplicar boost: `adBoost.isActive = true`
- [ ] Guardar timestamp: `adBoost.activatedAt = Date.now()`
- [ ] Calcular expiración: `adBoost.expiresAt = Date.now() + 4h`
- [ ] Guardar timestamp de último visto: `adBoost.lastWatchedAt = Date.now()`
- [ ] Iniciar cooldown de 5 minutos

### State Integrity
- [ ] `adBoost.activatedAt` debe ser <= `Date.now()`
- [ ] `adBoost.expiresAt` debe ser > `adBoost.activatedAt`
- [ ] Si `adBoost.isActive = true`, debe tener `activatedAt` y `expiresAt`
- [ ] `lastInterstitialShownAt` debe ser <= `Date.now()`

## Dependencias

### NPM Packages
```json
{
  "react-native-google-mobile-ads": "^14.0.0",
  "@react-native-firebase/analytics": "^18.0.0"
}
```

### iOS Setup
- Add `GADApplicationIdentifier` to `Info.plist`
- Add `SKAdNetworkItems` to `Info.plist` (for iOS 14+)
- Run `pod install` después de instalar package

### Android Setup
- Add AdMob App ID to `AndroidManifest.xml`:
  ```xml
  <meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXX~XXXXXXXXXX"/>
  ```
- Add internet permission (ya debería estar)

### Requiere
- `GameContext` - Para acceder y modificar adState, adBoost
- `AsyncStorage` - Para persistir adState
- `Firebase Analytics` - Para trackear eventos de ads
- `IAP System` - Para verificar si Remove Ads fue comprado

### Bloquea
- Ningún sistema (ads no son critical path)

### Relacionado con
- `Remove Ads IAP` - Deshabilita banner e interstitial ads
- `Boosters IAP` - Alternativa pagada a rewarded ad boost
- `Production System` - Aplica boost multiplier

## Criterios de Aceptación

- [ ] AdMob se inicializa correctamente en iOS y Android
- [ ] Banner ad se muestra en bottom de todas las pantallas
- [ ] Banner NO se muestra si Remove Ads fue comprado
- [ ] Rewarded ad se puede ver cada 5 minutos (cooldown)
- [ ] Rewarded ad otorga 2x production por exactamente 4 horas
- [ ] Boost timer cuenta regresiva correctamente en UI
- [ ] Ver otro rewarded ad durante boost activo reemplaza el boost
- [ ] Interstitial ad se muestra max 1 vez cada 6 horas en app open
- [ ] Interstitial NO se muestra en primera sesión
- [ ] Interstitial NO se muestra si Remove Ads fue comprado
- [ ] Si ad falla al cargar, gameplay continúa sin bloqueo
- [ ] GDPR consent dialog se muestra a usuarios de EU
- [ ] Todos los eventos de ads se trackean en Firebase Analytics
- [ ] Boost persiste correctamente entre sesiones (offline)

## Notas de Implementación

### Inicialización de AdMob
```typescript
// src/services/AdMobService.ts
import MobileAds, { BannerAd, RewardedAd, InterstitialAd } from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '../config/adConfig';
import analytics from '@react-native-firebase/analytics';

class AdMobService {
  private static instance: AdMobService;
  private rewardedAd: RewardedAd | null = null;
  private interstitialAd: InterstitialAd | null = null;

  static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize AdMob
      await MobileAds().initialize();

      // Set request configuration
      await MobileAds().setRequestConfiguration({
        // Max Ad Content Rating
        maxAdContentRating: 'PG',

        // Tag for child-directed treatment (COPPA)
        tagForChildDirectedTreatment: false,

        // Tag for under age of consent
        tagForUnderAgeOfConsent: false,

        // Test device IDs (solo development)
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });

      console.log('AdMob initialized successfully');

      // Pre-load ads
      this.loadRewardedAd();
      this.loadInterstitialAd();

      analytics().logEvent('admob_initialized', {});
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      analytics().logEvent('admob_init_failed', { error: error.message });
    }
  }

  // Load rewarded ad
  loadRewardedAd(): void {
    const adUnitId = __DEV__
      ? AD_CONFIG.testAdUnitIds.rewarded[Platform.OS]
      : AD_CONFIG.adUnitIds.rewarded[Platform.OS];

    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);

    this.rewardedAd.addAdEventListener('loaded', () => {
      console.log('Rewarded ad loaded');
      analytics().logEvent('ad_loaded', { ad_type: 'rewarded' });
    });

    this.rewardedAd.addAdEventListener('error', (error) => {
      console.error('Rewarded ad failed to load:', error);
      analytics().logEvent('ad_load_failed', {
        ad_type: 'rewarded',
        error_code: error.code,
      });

      // Retry after delay
      setTimeout(() => this.loadRewardedAd(), AD_CONFIG.adRetryDelay);
    });

    this.rewardedAd.load();
  }

  // Show rewarded ad
  async showRewardedAd(onRewarded: () => void): Promise<void> {
    if (!this.rewardedAd || !this.rewardedAd.loaded) {
      console.warn('Rewarded ad not loaded');
      Alert.alert('Ad not available', 'Please try again in a moment.');
      return;
    }

    try {
      this.rewardedAd.addAdEventListener('rewarded', (reward) => {
        console.log('User earned reward:', reward);
        onRewarded();
        analytics().logEvent('rewarded_ad_watched', {
          reward_type: reward.type,
          reward_amount: reward.amount,
        });
      });

      this.rewardedAd.addAdEventListener('closed', () => {
        console.log('Rewarded ad closed');
        // Pre-load next ad
        this.loadRewardedAd();
      });

      await this.rewardedAd.show();
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      analytics().logEvent('rewarded_ad_show_failed', {
        error: error.message,
      });
    }
  }

  // Load interstitial ad
  loadInterstitialAd(): void {
    const adUnitId = __DEV__
      ? AD_CONFIG.testAdUnitIds.interstitial[Platform.OS]
      : AD_CONFIG.adUnitIds.interstitial[Platform.OS];

    this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId);

    this.interstitialAd.addAdEventListener('loaded', () => {
      console.log('Interstitial ad loaded');
      analytics().logEvent('ad_loaded', { ad_type: 'interstitial' });
    });

    this.interstitialAd.addAdEventListener('error', (error) => {
      console.error('Interstitial ad failed to load:', error);
      analytics().logEvent('ad_load_failed', {
        ad_type: 'interstitial',
        error_code: error.code,
      });

      // Retry after delay
      setTimeout(() => this.loadInterstitialAd(), AD_CONFIG.adRetryDelay);
    });

    this.interstitialAd.load();
  }

  // Show interstitial ad
  async showInterstitialAd(): Promise<void> {
    if (!this.interstitialAd || !this.interstitialAd.loaded) {
      console.warn('Interstitial ad not loaded, skipping');
      return; // Silent fail
    }

    try {
      this.interstitialAd.addAdEventListener('closed', () => {
        console.log('Interstitial ad closed');
        // Pre-load next ad
        this.loadInterstitialAd();
      });

      await this.interstitialAd.show();
      analytics().logEvent('interstitial_ad_shown', {});
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      analytics().logEvent('interstitial_ad_show_failed', {
        error: error.message,
      });
    }
  }
}

export default AdMobService;
```

### Banner Ad Component
```tsx
// src/components/AdBanner.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useGame } from '../contexts/GameContext';
import { AD_CONFIG } from '../config/adConfig';
import analytics from '@react-native-firebase/analytics';

export const AdBanner: React.FC = () => {
  const { gameState } = useGame();

  // Don't show if Remove Ads purchased
  if (gameState.iapState.removeAdsPurchased) {
    return null;
  }

  const adUnitId = __DEV__
    ? AD_CONFIG.testAdUnitIds.banner[Platform.OS]
    : AD_CONFIG.adUnitIds.banner[Platform.OS];

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
          analytics().logEvent('ad_loaded', { ad_type: 'banner' });
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
          analytics().logEvent('ad_load_failed', {
            ad_type: 'banner',
            error_code: error.code,
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
  },
});
```

### Rewarded Ad Button Component
```tsx
// src/components/RewardedAdButton.tsx
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { useGame } from '../contexts/GameContext';
import AdMobService from '../services/AdMobService';
import { formatTime } from '../utils/formatters';

export const RewardedAdButton: React.FC = () => {
  const { gameState, dispatch } = useGame();
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      if (gameState.adBoost.isActive) {
        const remaining = gameState.adBoost.expiresAt! - Date.now();
        if (remaining <= 0) {
          // Boost expired
          dispatch({ type: 'EXPIRE_AD_BOOST' });
          setTimeRemaining('');
        } else {
          setTimeRemaining(formatTime(Math.floor(remaining / 1000)));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.adBoost]);

  const canWatch = () => {
    const now = Date.now();
    const cooldownDuration = 5 * 60 * 1000;

    if (!gameState.adBoost.lastWatchedAt) return true;

    const timeSinceLast = now - gameState.adBoost.lastWatchedAt;
    return timeSinceLast >= cooldownDuration;
  };

  const getCooldownRemaining = () => {
    const now = Date.now();
    const cooldownDuration = 5 * 60 * 1000;
    const timeSinceLast = now - gameState.adBoost.lastWatchedAt!;
    const remaining = cooldownDuration - timeSinceLast;
    return Math.max(0, Math.floor(remaining / 1000));
  };

  const handlePress = () => {
    if (!canWatch()) {
      const remaining = getCooldownRemaining();
      Alert.alert('Cooldown Active', `Next ad available in ${formatTime(remaining)}`);
      return;
    }

    if (gameState.adBoost.isActive) {
      // Show warning if boost already active
      Alert.alert(
        'Boost Already Active',
        `You already have a 2x boost active (${timeRemaining} remaining).\n\nWatching another ad will REPLACE the current boost, not stack.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Watch Ad Anyway',
            onPress: () => showAd(),
          },
        ]
      );
    } else {
      showAd();
    }
  };

  const showAd = async () => {
    const adService = AdMobService.getInstance();

    await adService.showRewardedAd(() => {
      // Reward granted
      dispatch({ type: 'ACTIVATE_AD_BOOST' });
      Alert.alert('Boost Activated!', '2x Production for 4 hours!');
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        gameState.adBoost.isActive ? styles.active : styles.available,
        !canWatch() && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={!canWatch() && !gameState.adBoost.isActive}
    >
      {gameState.adBoost.isActive ? (
        <View>
          <Text style={styles.text}>2x Boost Active</Text>
          <Text style={styles.timer}>{timeRemaining}</Text>
        </View>
      ) : canWatch() ? (
        <Text style={styles.text}>Watch Ad for 2x Boost</Text>
      ) : (
        <View>
          <Text style={styles.text}>Next ad in</Text>
          <Text style={styles.timer}>{formatTime(getCooldownRemaining())}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  available: {
    backgroundColor: '#4CAF50',
  },
  active: {
    backgroundColor: '#FFD700',
  },
  disabled: {
    backgroundColor: '#999',
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timer: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
});
```

### GameContext Actions
```typescript
// src/contexts/GameContext.tsx

// Action: ACTIVATE_AD_BOOST
case 'ACTIVATE_AD_BOOST':
  const now = Date.now();
  const duration = 4 * 60 * 60 * 1000; // 4 horas

  return {
    ...state,
    adBoost: {
      isActive: true,
      activatedAt: now,
      expiresAt: now + duration,
      lastWatchedAt: now,
    },
  };

// Action: EXPIRE_AD_BOOST
case 'EXPIRE_AD_BOOST':
  return {
    ...state,
    adBoost: {
      ...state.adBoost,
      isActive: false,
      activatedAt: null,
      expiresAt: null,
    },
  };

// Action: CHECK_AD_BOOST_EXPIRATION (llamar en app open)
case 'CHECK_AD_BOOST_EXPIRATION':
  if (!state.adBoost.isActive) return state;

  const currentTime = Date.now();
  if (currentTime >= state.adBoost.expiresAt!) {
    // Boost expiró
    return {
      ...state,
      adBoost: {
        ...state.adBoost,
        isActive: false,
        activatedAt: null,
        expiresAt: null,
      },
    };
  }

  return state; // Boost sigue activo
```

### App.tsx - Interstitial on App Open
```typescript
// src/App.tsx
import { useEffect } from 'react';
import { AppState } from 'react-native';
import AdMobService from './services/AdMobService';
import { useGame } from './contexts/GameContext';

function App() {
  const { gameState, dispatch } = useGame();
  const adService = AdMobService.getInstance();

  useEffect(() => {
    // Initialize AdMob
    adService.initialize();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground
        handleAppOpen();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleAppOpen = () => {
    // Check if should show interstitial
    const shouldShow = shouldShowInterstitialAd(gameState);

    if (shouldShow) {
      adService.showInterstitialAd();
      dispatch({ type: 'UPDATE_LAST_INTERSTITIAL_TIME' });
    }

    // Check if ad boost expired while offline
    dispatch({ type: 'CHECK_AD_BOOST_EXPIRATION' });
  };

  // ... rest of app
}
```

## Testing

### Unit Tests
```typescript
describe('AdMob System', () => {
  describe('calculateRewardedAdBoost', () => {
    it('should return 1.0 when boost is not active', () => {
      const state = { adBoost: { isActive: false } };
      expect(calculateRewardedAdBoost(state)).toBe(1.0);
    });

    it('should return 2.0 when boost is active and not expired', () => {
      const now = Date.now();
      const state = {
        adBoost: {
          isActive: true,
          activatedAt: now - 60000, // 1 minuto atrás
        },
      };
      expect(calculateRewardedAdBoost(state)).toBe(2.0);
    });

    it('should return 1.0 when boost expired', () => {
      const now = Date.now();
      const state = {
        adBoost: {
          isActive: true,
          activatedAt: now - 5 * 60 * 60 * 1000, // 5 horas atrás
        },
      };
      expect(calculateRewardedAdBoost(state)).toBe(1.0);
    });
  });

  describe('canWatchRewardedAd', () => {
    it('should return true if never watched', () => {
      const state = { adBoost: { lastWatchedAt: null } };
      expect(canWatchRewardedAd(state)).toBe(true);
    });

    it('should return false if cooldown active', () => {
      const now = Date.now();
      const state = {
        adBoost: { lastWatchedAt: now - 60000 }, // 1 minuto atrás
      };
      expect(canWatchRewardedAd(state)).toBe(false);
    });

    it('should return true if cooldown expired', () => {
      const now = Date.now();
      const state = {
        adBoost: { lastWatchedAt: now - 6 * 60 * 1000 }, // 6 minutos atrás
      };
      expect(canWatchRewardedAd(state)).toBe(true);
    });
  });

  describe('shouldShowInterstitialAd', () => {
    it('should return false if Remove Ads purchased', () => {
      const state = { iapState: { removeAdsPurchased: true } };
      expect(shouldShowInterstitialAd(state)).toBe(false);
    });

    it('should return false if first session', () => {
      const state = {
        iapState: { removeAdsPurchased: false },
        adState: { isFirstSession: true },
      };
      expect(shouldShowInterstitialAd(state)).toBe(false);
    });

    it('should return false if cooldown active', () => {
      const now = Date.now();
      const state = {
        iapState: { removeAdsPurchased: false },
        adState: {
          isFirstSession: false,
          lastInterstitialShownAt: now - 60000, // 1 minuto atrás
        },
      };
      expect(shouldShowInterstitialAd(state)).toBe(false);
    });

    it('should return true if all conditions met', () => {
      const now = Date.now();
      const state = {
        iapState: { removeAdsPurchased: false },
        adState: {
          isFirstSession: false,
          lastInterstitialShownAt: now - 7 * 60 * 60 * 1000, // 7 horas atrás
        },
      };
      expect(shouldShowInterstitialAd(state)).toBe(true);
    });
  });
});
```

### Integration Tests
```typescript
describe('Rewarded Ad Flow', () => {
  it('should activate boost when ad is watched', async () => {
    const { getByText } = render(<RewardedAdButton />);
    const button = getByText('Watch Ad for 2x Boost');

    // Mock ad service
    jest.spyOn(AdMobService.prototype, 'showRewardedAd').mockImplementation(
      async (onRewarded) => {
        onRewarded(); // Simulate ad completion
      }
    );

    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('2x Boost Active')).toBeTruthy();
    });
  });

  it('should show warning if boost already active', async () => {
    const initialState = {
      adBoost: {
        isActive: true,
        activatedAt: Date.now(),
        expiresAt: Date.now() + 4 * 60 * 60 * 1000,
      },
    };

    const { getByText } = render(<RewardedAdButton />, { initialState });
    const button = getByText('2x Boost Active');

    fireEvent.press(button);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Boost Already Active',
        expect.stringContaining('REPLACE')
      );
    });
  });
});
```

### E2E Tests
```typescript
describe('Ad System E2E', () => {
  it('should show banner on all screens except when purchased', async () => {
    await device.launchApp();

    // Banner should be visible initially
    await expect(element(by.id('banner-ad'))).toBeVisible();

    // Navigate to different screens
    await element(by.id('market-tab')).tap();
    await expect(element(by.id('banner-ad'))).toBeVisible();

    await element(by.id('hardware-tab')).tap();
    await expect(element(by.id('banner-ad'))).toBeVisible();

    // Purchase Remove Ads
    await purchaseRemoveAds();

    // Banner should be gone
    await expect(element(by.id('banner-ad'))).not.toBeVisible();
  });

  it('should apply 2x boost after watching rewarded ad', async () => {
    await device.launchApp();

    // Get initial production
    const initialProduction = await getProductionValue();

    // Watch rewarded ad
    await element(by.id('rewarded-ad-button')).tap();
    await waitForAdToComplete();

    // Production should be doubled
    const boostedProduction = await getProductionValue();
    expect(boostedProduction).toBeCloseTo(initialProduction * 2, 1);

    // Boost indicator should be visible
    await expect(element(by.id('boost-indicator'))).toBeVisible();
  });
});
```

## Performance Considerations

### Non-Functional Requirements
- **AdMob initialization**: < 500ms
- **Banner load time**: < 2s (no bloquear UI)
- **Rewarded ad load time**: < 3s
- **Interstitial show delay**: < 100ms (pre-loaded)
- **Boost calculation overhead**: < 1ms (ejecuta cada frame)

### Optimizaciones
- Pre-cargar ads en background (no esperar a que usuario las necesite)
- Cache de ad state en memoria (no leer AsyncStorage cada frame)
- Batch de analytics events (no enviar cada ad load)
- Lazy initialization de AdMob (no bloquear app launch)

### Memory Management
- Liberar interstitial ads después de mostrarse
- Limitar a 1 rewarded ad pre-cargado a la vez
- No cargar múltiples banners (solo 1 instance)

## Analytics

```typescript
// Ad loaded
analytics().logEvent('ad_loaded', {
  ad_type: 'banner' | 'rewarded' | 'interstitial',
  timestamp: Date.now(),
});

// Ad failed to load
analytics().logEvent('ad_load_failed', {
  ad_type: 'banner' | 'rewarded' | 'interstitial',
  error_code: error.code,
  error_message: error.message,
});

// Rewarded ad watched
analytics().logEvent('rewarded_ad_watched', {
  boost_was_active: gameState.adBoost.isActive,
  cooldown_remaining: getCooldownRemaining(),
});

// Rewarded ad skipped
analytics().logEvent('rewarded_ad_skipped', {
  watch_duration: watchDuration, // cuánto vio antes de skip
});

// Boost activated
analytics().logEvent('ad_boost_activated', {
  prestige_level: gameState.prestigeLevel,
  current_production: calculateBaseProduction(gameState),
});

// Boost expired
analytics().logEvent('ad_boost_expired', {
  total_duration: 4 * 60 * 60,
  earnings_during_boost: earningsDuringBoost,
});

// Interstitial shown
analytics().logEvent('interstitial_ad_shown', {
  time_since_last: Date.now() - gameState.adState.lastInterstitialShownAt,
  session_count: sessionCount,
});

// Remove Ads purchased (impact on ad revenue)
analytics().logEvent('remove_ads_purchased', {
  total_ads_seen: totalAdsSeenBeforePurchase,
  days_since_install: daysSinceInstall,
});
```

## Edge Cases

**Edge Case 1: App cerrada durante rewarded ad**
- Input: Usuario ve rewarded ad, cierra app antes de que termine
- Expected: Boost NO se activa (solo si completa el ad)

**Edge Case 2: Boost activo durante prestige**
- Input: Usuario hace prestige con boost activo
- Expected: Boost persiste después de prestige (es un beneficio temporal, no se resetea)

**Edge Case 3: Múltiples rewarded ads en cooldown**
- Input: Usuario ve ad, espera 4 min, intenta ver otro
- Expected: Botón deshabilitado, muestra "Available in 1:00"

**Edge Case 4: Remove Ads comprado, boost activo**
- Input: Usuario compra Remove Ads mientras tiene boost activo
- Expected: Boost continúa activo hasta expirar (es un reward ganado)

**Edge Case 5: Sin conexión durante todo el gameplay**
- Input: Usuario juega completamente offline
- Expected: Banner/interstitial no se muestran, rewarded ad no disponible

**Edge Case 6: AdMob initialization falla**
- Input: AdMob no puede inicializarse (región bloqueada, SDK corrupto)
- Expected: Gameplay continúa normalmente, ads simplemente no se muestran

**Edge Case 7: Rewarded ad no disponible (sin inventory)**
- Input: Usuario intenta ver rewarded ad pero no hay inventory
- Expected: Mostrar "Ad not available, try again later"

**Edge Case 8: Boost activo por 4 horas, usuario offline por 5 horas**
- Input: Boost activo, app cerrada por más tiempo que la duración del boost
- Expected: Offline earnings calculan con boost hasta hora 4, sin boost hora 4-5

**Edge Case 9: GDPR consent declined**
- Input: Usuario de EU declina consent
- Expected: Mostrar solo non-personalized ads (menor revenue pero compliance)

**Edge Case 10: Device clock manipulado**
- Input: Usuario cambia hora del device para skip cooldowns
- Expected: Usar server time si está disponible, o detectar anomalías

## Preguntas Abiertas

- [ ] **Stacking de boosters**: ¿Permitir que rewarded ad boost stackee con IAP boosters?
  - **Recomendación**: Sí, son fuentes diferentes (ad gratis vs IAP pagado)

- [ ] **Rewarded ad cooldown ajustable**: ¿Reducir cooldown con prestige level?
  - **Recomendación**: No, mantener 5 min fijo para no canibalizar IAP boosters

- [ ] **Banner position customizable**: ¿Permitir al usuario elegir top/bottom?
  - **Recomendación**: No, mantener bottom para UX consistente

- [ ] **Interstitial frequency**: ¿6 horas es demasiado generoso?
  - **Recomendación**: Testear, posiblemente reducir a 4 horas si retention es alta

- [ ] **Multiple rewarded ad types**: ¿Ofrecer diferentes rewards (coins, money, etc.)?
  - **Recomendación**: Phase 3+, mantener simple inicialmente

- [ ] **Ad frequency cap por día**: ¿Limitar total de ads vistas por día?
  - **Recomendación**: Solo para rewarded (unlimited con cooldown es suficiente)

- [ ] **Offline ad earnings**: ¿Permitir "watch ad to boost offline earnings"?
  - **Recomendación**: Phase 4+, interesante feature pero complejo

- [ ] **Remove Ads discount**: ¿Ofrecer descuento después de X interstitials vistos?
  - **Recomendación**: Sí, buena estrategia de conversión

## Referencias

- AdMob React Native: https://docs.page/invertase/react-native-google-mobile-ads
- AdMob Best Practices: https://support.google.com/admob/answer/6128543
- GDPR Compliance: https://support.google.com/admob/answer/9012903
- COPPA Compliance: https://support.google.com/admob/answer/9004919
- Ad Frequency Best Practices: https://www.blog.google/products/admob/ad-frequency-best-practices/
- Rewarded Ads UX: https://developers.google.com/admob/unity/rewarded-fullscreen
