# UMP Consent — Google User Messaging Platform

## Estado
- **Fase**: Phase 3 (Monetization)
- **Estado**: Implemented (pending AdMob Console form configuration)
- **Prioridad**: Critical (blocks ad serving in EEA/UK/Switzerland)
- **Última actualización**: 2026-05-03

## Descripción

Integración del SDK de Google **User Messaging Platform (UMP)** dentro de
`react-native-google-mobile-ads` para cumplir con los requisitos de consent de
GDPR en el EEE, Reino Unido y Suiza. Sin UMP, AdMob bloquea las requests de
ads en esas regiones y puede sancionar la cuenta del publisher.

El SDK detecta la jurisdicción del usuario automáticamente (Google decide,
nosotros no detectamos región). El flujo es:

1. Antes de inicializar AdMob, pedir información de consent al SDK
   (`AdsConsent.requestInfoUpdate()`).
2. Si Google determina que se requiere consent y hay un form disponible,
   mostrarlo (`AdsConsent.loadAndShowConsentFormIfRequired()`).
3. Una vez que el status es `OBTAINED` o `NOT_REQUIRED`, llamar
   `MobileAds().initialize()` y precargar ads.
4. Re-mostrar el formulario en cualquier momento desde Settings cuando
   `privacyOptionsRequirementStatus === REQUIRED` (obligatorio para usuarios
   GDPR; ocultar si no aplica).

Para usuarios fuera de jurisdicciones reguladas, UMP responde
`status = NOT_REQUIRED` y el flujo es indistinguible del actual.

## Objetivos

- [x] Inicializar el flujo de UMP antes de cualquier request de ad.
- [x] Gating de `MobileAds().initialize()` detrás del consent (`OBTAINED` o
      `NOT_REQUIRED`).
- [x] Botón "Privacy options" en Settings, condicional al estado del SDK.
- [x] Strings localizadas (ES/EN/PT) para botón de privacy options.
- [x] No romper el flujo actual para usuarios no-GDPR (NOT_REQUIRED).
- [x] Graceful degradation: si UMP falla, intentar inicializar AdMob igual y
      loguear el error (Google reglas: ads no personalizados es la fallback
      automática del SDK).

## Comportamiento Esperado

### Caso 1 — Primer launch, usuario GDPR
**Dado que** el usuario abre la app por primera vez en un país EEE/UK/Suiza
**Cuando** se monta el provider de juego
**Entonces**
- Se llama `AdsConsent.requestInfoUpdate()`.
- El SDK responde `status = REQUIRED`, `isConsentFormAvailable = true`.
- Se llama `AdsConsent.loadAndShowConsentFormIfRequired()` que muestra el
  formulario configurado en AdMob Console.
- El usuario acepta o rechaza; el SDK persiste la decisión.
- `canRequestAds` queda en `true` (independientemente de la elección — el
  SDK gestiona personalizados vs no-personalizados internamente).
- Se llama `MobileAds().initialize()` y se precarga el rewarded.

### Caso 2 — Primer launch, usuario fuera de jurisdicción regulada
**Dado que** el usuario abre la app por primera vez fuera del EEE/UK/Suiza
**Cuando** se monta el provider
**Entonces**
- `requestInfoUpdate()` responde `status = NOT_REQUIRED`,
  `isConsentFormAvailable = false`.
- `loadAndShowConsentFormIfRequired()` no muestra nada (no-op).
- `MobileAds().initialize()` se ejecuta normalmente.

### Caso 3 — Re-apertura, consent ya dado
**Dado que** el usuario ya consintió en una sesión anterior
**Cuando** se reabre la app
**Entonces**
- `requestInfoUpdate()` responde `status = OBTAINED`.
- `loadAndShowConsentFormIfRequired()` no muestra form (status ya válido).
- AdMob se inicializa.

### Caso 4 — Cambio de preferencias desde Settings
**Dado que** el usuario está en jurisdicción regulada
**Cuando** abre Settings y toca "Privacy options"
**Entonces**
- Se llama `AdsConsent.showPrivacyOptionsForm()`.
- El form se muestra y el usuario puede actualizar su decisión.
- Cualquier cambio toma efecto en la próxima request de ad.

### Caso 5 — Botón oculto fuera de jurisdicción
**Dado que** el usuario está en una región sin regulación
**Cuando** abre Settings
**Entonces**
- El botón "Privacy options" no se muestra
  (`privacyOptionsRequirementStatus === NOT_REQUIRED`).

### Caso 6 — UMP falla en runtime
**Dado que** `requestInfoUpdate()` lanza un error (sin red, SDK roto, etc.)
**Cuando** se intenta inicializar UMP
**Entonces**
- Se loguea el error vía `logEvent('error', ...)`.
- Se intenta `MobileAds().initialize()` igual.
- AdMob por defecto sirve ads no-personalizados ante ausencia de TCString
  válido en jurisdicciones reguladas — comportamiento aceptable como
  fallback.

## Arquitectura

### Archivos nuevos

```
src/services/UMPConsentService.ts
```

Encapsula las llamadas a `AdsConsent.*` y expone:

```typescript
ensureConsentFlow(): Promise<{ canRequestAds: boolean }>
isPrivacyOptionsRequired(): Promise<boolean>
showPrivacyOptionsForm(): Promise<void>
```

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/services/AdMobService.ts` | `initializeAdMob()` espera consent antes de `MobileAds().initialize()` |
| `src/components/SettingsModal.tsx` | Sección Privacy con botón condicional |
| `src/data/translations.ts` | Keys `ui.privacyOptions`, `ui.privacyOptionsSection` (ES/EN/PT) |

### Flujo de inicialización (post-cambio)

```
GameProvider mount
  └─ initializeAdMob()
       ├─ ensureConsentFlow()                 // UMP: requestInfoUpdate + loadAndShowConsentFormIfRequired
       │     └─ status ∈ {OBTAINED, NOT_REQUIRED} (o error → fallback)
       └─ MobileAds().initialize()
            └─ loadRewardedAd()
```

## Reglas de Negocio

1. **Consent gating**: nunca llamar `MobileAds().initialize()` sin haber
   intentado primero `AdsConsent.requestInfoUpdate()`.
2. **Idempotencia**: `ensureConsentFlow()` puede llamarse múltiples veces;
   el SDK cachea el status y no muestra forms innecesarios.
3. **Errores no bloqueantes**: si UMP falla, AdMob debe inicializarse igual
   (gameplay no se interrumpe; el SDK servirá NPA por defecto).
4. **Privacy options visibilidad**: el botón en Settings se muestra solo si
   `privacyOptionsRequirementStatus === REQUIRED` (Google exige que sea
   accesible para usuarios GDPR; mostrarlo a otros es ruido visual).
5. **No detección de región propia**: confiamos en Google para determinar
   jurisdicción; nunca hardcodear lista de países.
6. **No reset automático**: nunca llamar `AdsConsent.reset()` en producción
   (perdería el consent del usuario; solo útil para debugging).

## Configuración requerida en AdMob Console

(documentado en la respuesta del PR — no se versiona aquí porque cambia con
la UI de la consola)

## Validaciones

### Pre-init
- [x] `AdsConsent.requestInfoUpdate()` se llama antes de
      `MobileAds().initialize()`.
- [x] Si `status === REQUIRED && isConsentFormAvailable`, se llama
      `loadAndShowConsentFormIfRequired()`.

### Settings
- [x] Botón solo visible si `privacyOptionsRequirementStatus === REQUIRED`.
- [x] Tap llama `AdsConsent.showPrivacyOptionsForm()`.

### Errores
- [x] Cualquier excepción de UMP se loguea pero no aborta la
      inicialización de AdMob.

## Dependencias

- `react-native-google-mobile-ads@^16.0.3` (ya instalado, expone
  `AdsConsent` y los enums `AdsConsentStatus`,
  `AdsConsentPrivacyOptionsRequirementStatus`).

## Criterios de Aceptación

- [x] En cold-start, `requestInfoUpdate` se invoca antes de cualquier
      request de ad.
- [x] El form de consent se muestra automáticamente en jurisdicciones
      reguladas.
- [x] Fuera de regulación, no se muestra ningún form y AdMob inicializa
      normalmente.
- [x] Botón "Privacy options" aparece en Settings solo si UMP lo requiere.
- [x] Tap en el botón abre el form de privacy options.
- [x] Tests existentes siguen verdes; lint sin errores nuevos.

## Edge Cases

**1. Consent form disponible pero `status === OBTAINED`**
- Skip: el SDK no muestra form si el status ya es OBTAINED.

**2. App offline durante primer launch**
- `requestInfoUpdate()` puede fallar. Catch, log, intentar AdMob igual. En
  la próxima sesión con red, UMP reintentará.

**3. Usuario rechaza el form (cierra sin elegir)**
- El SDK marca el status como `OBTAINED` con consents vacíos. AdMob sirve
  NPA. `canRequestAds = true`.

**4. Settings abierto antes de que UMP termine**
- `getConsentInfo()` retorna `UNKNOWN` mientras no haya respuesta del SDK.
  Tratar como "no requerido" y ocultar el botón hasta que el SDK responda.

## Notas de Implementación

- El paquete `react-native-google-mobile-ads` provee `AdsConsent.gatherConsent()`
  como helper que combina `requestInfoUpdate` + `loadAndShowConsentFormIfRequired`.
  Lo usamos directamente para reducir superficie de error.
- El campo `gdprConsentGiven: boolean | null` en `AdState` queda **obsoleto**
  (UMP gestiona el consent internamente vía IAB TCString en NSUserDefaults /
  SharedPreferences). No se borra para no romper saves existentes, pero
  ningún código nuevo debe leerlo ni escribirlo.

## Referencias

- UMP integration guide: https://developers.google.com/admob/android/privacy
- Invertase docs: https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent
- AdsConsent API: `node_modules/react-native-google-mobile-ads/src/AdsConsent.ts`
