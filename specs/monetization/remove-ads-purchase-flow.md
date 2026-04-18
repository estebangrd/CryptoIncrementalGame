# Remove Ads — Purchase Flow

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: Implemented
- **Prioridad**: High
- **Ultima actualizacion**: 2026-03-21
- **Split from**: Original `remove-ads-product.md` (reorganized into 5 focused specs)

## Related Specs
- [Core Product](remove-ads-core.md) — Product definition, pricing, business rules, state
- [Flash Sale](remove-ads-flash-sale.md) — 35% roll, timer, cooldown logic
- [UI/UX](remove-ads-ui.md) — Card design, badges, settings screen
- [Analytics](remove-ads-analytics.md) — Events, conversion tracking, promotions

---

## Caso de Uso 1: Comprar Remove Ads (Primera Vez)
**Dado que** el usuario presiona "Buy Remove Ads"
**Cuando** confirma la compra
**Entonces**

> **Nota de implementación**: El flujo real es más simple que lo descrito. No hay confirmation dialog propio — `confirmPurchase()` llama directamente a `doPurchase()` que invoca `purchaseProduct()` del IAPService. El OS muestra su propio diálogo (Face ID/biometrics). No hay success dialog tras la compra. El botón muestra `ActivityIndicator` durante la compra y la UI se actualiza automáticamente cuando el reducer procesa `PURCHASE_REMOVE_ADS`.

- ~~Se muestra confirmation dialog~~ — **No implementado**: no hay diálogo de confirmación propio
- Al presionar el botón de compra:
  - Mostrar loading: `ActivityIndicator` en el botón (via `purchasing` state)
  - Sistema operativo muestra dialog de confirmacion (Face ID/biometrics)
  - Usuario autoriza pago
  - Purchase se procesa:
    - Receipt validation (client-side)
    - Marcar como comprado: `removeAdsPurchased = true`
    - ~~Guardar en AsyncStorage: `@removeAdsPurchased: true`~~ — se guarda como parte del gameState completo via auto-save
    - ~~Enviar a backend (si implementado): `POST /api/purchases`~~ — no implementado
    - Guardar en purchase history con timestamp
    - Finalizar transaccion: `finishTransaction()`
  - Inmediatamente ocultar banner ad (si visible)
  - Actualizar UI:
    - Store card muestra banner "Owned"
    - Botón de compra desaparece
  - ~~Mostrar success dialog~~ — **No implementado**: no hay diálogo de éxito ni animación de confetti
  - Log Analytics: `remove_ads_purchased` + `iap_purchase_success` (via analyticsMiddleware)

## Caso de Uso 2: Inmediatamente Despues de Comprar
**Dado que** el usuario acaba de comprar Remove Ads
**Cuando** esta en el juego
**Entonces**
- Banner ad (si estaba visible):
  - Se oculta (el componente retorna null cuando `removeAdsPurchased`)
  - Contenido del juego se expande para llenar espacio
  > **Nota de implementación**: No hay animación fade-out del banner — simplemente deja de renderizarse.
- Top bar muestra badge temporal:
  - "✓ Ad Free" badge (verde, con checkmark)
  - Visible por 10 segundos, luego fade out
  - ~~Al tocar: tooltip~~ — **No implementado**: no hay handler de toque en el badge
  > **Nota de implementación**: Implementado en `GameScreen.tsx` con `adFreeBadgeOpacity` animación. Fade-in 300ms, visible 10s (`REMOVE_ADS_CONFIG.badges.adFreeIndicatorDurationMs`), fade-out 400ms.
- Proximos app opens:
  - NO se mostraran interstitial ads
  - Codigo verifica `removeAdsPurchased === true` y skipea
- Rewarded ads:
  - Boton "Watch Ad for 2x Boost" SIGUE VISIBLE
  - Funcionalidad completamente intacta

## Caso de Uso 3: Navegacion Post-Compra
**Dado que** Remove Ads fue comprado
**Cuando** el usuario navega entre pantallas
**Entonces**
- En TODAS las pantallas:
  - Banner ad NO se muestra (ni espacio reservado)
  - Contenido usa full height de pantalla
- En tab de Store/IAP:
  - Remove Ads card muestra banner "Owned" (verde)
  - Botón de compra no se renderiza
  > **Nota de implementación**: No muestra "Purchased" como badge ni texto de descripción "✓ Ads removed - Thank you!". Muestra un banner simple con texto de `t('shop.noAds.owned')`.
- En Settings:
  - Opcion visible: "✓ Ad Free Mode: Active" (implementado en `SettingsModal.tsx`)
  - Botón "🔄 Restore Purchases" disponible

## Caso de Uso 4: Intentar Comprar Remove Ads (Ya Comprado)
**Dado que** el usuario YA compro Remove Ads
**Cuando** intenta comprarlo de nuevo
**Entonces**

> **Nota de implementación**: Cuando `removeAdsPurchased` es `true`, el card muestra el banner "Owned" y el botón de compra no se renderiza en absoluto (el bloque completo de precio + botón se reemplaza por el banner). No hay posibilidad de re-compra a nivel de UI. No se emite `iap_already_owned_attempt` — el evento no existe en `AnalyticsEventMap`.

- Boton no se renderiza (reemplazado por banner "Owned")
- El reducer también protege: `if (state.iapState.removeAdsPurchased) return state;`
- Store detecta que producto es non-consumable y ya purchased:
  - iOS: StoreKit retorna error "Already purchased"
  - Android: Play Billing retorna `ITEM_ALREADY_OWNED`
- ~~Log Analytics: `iap_already_owned_attempt`~~ — no implementado

## Caso de Uso 5: App Open Despues de Comprar (Same Session)
**Dado que** el usuario compro Remove Ads en esta sesion
**Cuando** cierra app y la reabre
**Entonces**
- Al verificar si mostrar interstitial:
  - Codigo lee `gameState.iapState.removeAdsPurchased`
  - Valor es `true`
  - Skipea interstitial ad completamente
  - NO intenta cargar ad
- Banner ad:
  - NO se carga ni se muestra
  - Component retorna `null` inmediatamente
- ~~Log Analytics: `interstitial_skipped_remove_ads`~~ — no implementado (el skip ocurre silenciosamente)

## Caso de Uso 6: Reinstalar App (Restore Purchases)
**Dado que** el usuario compro Remove Ads previamente
**Cuando** reinstala la app o cambia de device
**Entonces**

> **Nota de implementación**: Implementado en `SettingsModal.tsx` → `handleRestorePurchases()`. Llama a `restorePurchases()` del IAPService, itera los purchases retornados, y despacha `PURCHASE_REMOVE_ADS` si encuentra el product ID correspondiente. Muestra toast con resultado. No hay auto-restore en inicialización — solo manual via Settings.

- Al abrir app por primera vez:
  - gameState inicial: `removeAdsPurchased = false`
  - Banner ads se muestran temporalmente
  - Interstitial ads se intentan mostrar
- Usuario va a Settings -> "🔄 Restore Purchases"
- ~~O automaticamente en inicializacion IAP~~ — no hay auto-restore al iniciar
- Mostrar toast:
  - "✓ Restored N purchase(s)" (si hay compras) o "No restorable purchases found"
- ~~Log Analytics: `iap_restore_success`~~ — no implementado

## Caso de Uso 7: Multiples Devices (Same Account)
**Dado que** el usuario usa iOS/Android con misma Apple ID / Google Account
**Cuando** instala el juego en otro device
**Entonces**
- Primera instalacion en device 2:
  - Mismo flujo de Restore Purchases
  - `getAvailablePurchases()` retorna Remove Ads
  - Se restaura automaticamente
- Remove Ads funciona en TODOS los devices del usuario:
  - iOS: Sincronizado por Apple ID via StoreKit
  - Android: Sincronizado por Google Account via Play Billing
- No se puede comprar de nuevo:
  - Store detecta que ya lo posee
  - Boton deshabilitado en todos los devices

## Caso de Uso 8: Error Durante Compra (Payment Failed)
**Dado que** el usuario intenta comprar Remove Ads
**Cuando** el pago falla (tarjeta rechazada, fondos insuficientes)
**Entonces**

> **Nota de implementación**: No hay error dialog (Alert.alert). Los errores se muestran via `showToast(error.message, 'error')` — un toast efímero en la parte superior de la pantalla.

- Sistema operativo muestra error nativo
- App detecta error en `doPurchase()` catch block
- Mostrar toast de error: `showToast(error.message || 'Purchase failed', 'error')`
- Estado NO cambia:
  - `removeAdsPurchased = false`
  - `isPurchasing` se resetea a `false`
- Log Analytics: `iap_purchase_failed` con `{ productId, errorMessage }` (payload difiere del spec — usa `productId` + `errorMessage` en vez de `error_code` + `product` + `reason`)

## Caso de Uso 9: Compra Cancelada por Usuario
**Dado que** el usuario inicio compra de Remove Ads
**Cuando** cancela en dialog del sistema operativo
**Entonces**

> **Nota de implementación**: Implementado correctamente en `ShopScreen.tsx` → `doPurchase()`. Detecta `error.code === 'E_USER_CANCELLED'` y no muestra toast de error.

- Purchase catch recibe error `E_USER_CANCELLED`
- NO mostrar error (es intencional) — solo se resetea `purchasing` state
- Volver a store screen normalmente
- Estado no cambia
- Log Analytics: `iap_purchase_cancelled` con `{ productId }` (nota: usa `productId`, no `product`)

## Caso de Uso 10: Refund (Usuario Solicita Reembolso)
**Dado que** el usuario compro Remove Ads
**Cuando** solicita refund en App Store / Play Store
**Entonces**
- Store procesa refund (Apple/Google decision, no controlado por app)
- Si refund aprobado:
  - Sin backend: App NO detecta refund (beneficio persiste)
  - Con backend (futuro):
    - Server recibe notificacion de refund
    - Server revoca beneficio: `removeAdsPurchased = false`
    - Proximo sync: App muestra ads de nuevo
    - Mostrar notificacion: "Your purchase was refunded. Ads are now active."
- Log Analytics: `iap_refund` (solo con backend)
- **Nota**: Para Phase 1 (sin backend), refunds no se detectan - usuario mantiene beneficio (aceptable, fraud minimo esperado)

## Caso de Uso 11: Post-Purchase Gratitude
**Dado que** el usuario compro Remove Ads
**Cuando** completa la compra
**Entonces**

> **Nota de implementación**: No implementado. No hay success dialog, gratitude message, badge "Supporter", ni unlock cosmético. La única señal post-compra es el badge "✓ Ad Free" temporal en el top bar (10s, implementado en `GameScreen.tsx`) y el banner "Owned" en el card del shop.

- ~~Ademas del success dialog, mostrar mensaje de agradecimiento~~ — no implementado
- ~~Badge en profile: "Supporter"~~ — no implementado
- ~~Unlock cosmetico~~ — no implementado

## Validaciones

### Pre-Purchase
- [ ] Verificar que IAP esta inicializado
- [ ] Verificar que producto esta disponible en region
- [ ] Verificar que NO esta ya purchased:
  - `removeAdsPurchased === false`
  - Store no retorna `ITEM_ALREADY_OWNED`
- [ ] Verificar conexion a internet

### During Purchase
- [ ] Mostrar loading state
- [ ] Deshabilitar boton (prevenir double-click)
- [ ] Set `isPurchasing = true`

### Post-Purchase
- [ ] Validar receipt (client-side):
  - Transaction ID valido
  - Product ID = 'remove_ads'
  - Timestamp razonable
- [ ] Verificar que purchase fue successful (no error)
- [ ] Marcar `removeAdsPurchased = true`
- [ ] Guardar en AsyncStorage
- [ ] Enviar a backend (si implementado)
- [ ] Finalizar transaccion: `finishTransaction()`
- [ ] Guardar en purchase history
- [ ] Actualizar UI inmediatamente

### State Integrity
- [ ] `removeAdsPurchased` debe ser boolean
- [ ] `removeAdsPurchaseDate` debe ser timestamp valido (si purchased)
- [ ] Si `removeAdsPurchased = true`:
  - Banner ad NO visible
  - Interstitial ad NO se muestra
  - Rewarded ad SIGUE disponible

### Restore Purchases
- [ ] Llamar `getAvailablePurchases()`
- [ ] Verificar cada purchase retornado
- [ ] Si product ID = 'remove_ads':
  - Marcar `removeAdsPurchased = true`
  - Guardar en AsyncStorage
  - Actualizar UI
- [ ] Mostrar success message

## Reference Implementation

> **Nota de implementación**: No existe `RemoveAdsCard.tsx` como componente separado. La compra se maneja en `ShopScreen.tsx` → `doPurchase()` / `confirmPurchase()`. No usa `Alert.alert()` para confirmación, no importa `@react-native-firebase/analytics` (usa `logEvent` de `src/services/analytics/`). El código de referencia abajo NO refleja la implementación actual.

```tsx
// src/components/RemoveAdsCard.tsx (NO EXISTE — ver ShopScreen.tsx)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGame } from '../contexts/GameContext';
import IAPService from '../services/IAPService';
import { REMOVE_ADS_CONFIG } from '../config/iapConfig';
import analytics from '@react-native-firebase/analytics'; // NO INTEGRADO

export const RemoveAdsCard: React.FC = () => {
  const { gameState, dispatch } = useGame();
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  const handlePurchase = async () => {
    Alert.alert(
      'Remove Ads',
      '✓ Remove banner ads\n✓ Remove interstitial ads\n✓ Keep rewarded ads for boosts\n✓ Permanent - never expires\n\nPrice: $0.99',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              const iapService = IAPService.getInstance();
              await iapService.requestPurchase(REMOVE_ADS_CONFIG.productId);
              analytics().logEvent('remove_ads_purchase_initiated', {
                ads_seen: gameState.adState.totalInterstitialsShown,
              });
            } catch (error) {
              console.error('Purchase failed:', error);
              Alert.alert('Purchase Failed', error.message);
              analytics().logEvent('remove_ads_purchase_failed', {
                error: error.message,
              });
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ]
    );
  };

  // ... see remove-ads-ui.md for full component render
};
```

## Edge Cases

**Edge Case 1: Purchase durante banner visible**
- Input: Usuario compra mientras banner esta en pantalla
- Expected: Banner fade out inmediatamente

**Edge Case 2: Reinstall sin Restore**
- Input: Usuario no hace Restore Purchases
- Expected: Ads se muestran hasta que haga Restore (o auto-restore en init)

**Edge Case 3: Refund sin backend**
- Input: Usuario hace refund
- Expected: Beneficio persiste (no detectado)

**Edge Case 4: Multiples devices, solo compra en uno**
- Input: Compra en iPhone, instala en iPad
- Expected: Restore automatico sincroniza en iPad

**Edge Case 5: Dev mode — no real store available**
- Input: Running in `__DEV__` mode without App Store / Google Play sandbox
- Problem: `requestPurchase()` fails or resolves without triggering `purchaseUpdatedListener`, so buttons appear non-functional
- Fix: `IAPService.registerDevPurchaseCallback()` is called by GameContext on mount. When `__DEV__` is true and a callback is registered, `purchaseProduct()` creates a mock `PurchaseRecord` and invokes the callback directly, bypassing the native store. This dispatches the same reducer actions as a real purchase.
- Implementation: `src/services/IAPService.ts` (`registerDevPurchaseCallback`, dev branch in `purchaseProduct`), `src/contexts/GameContext.tsx` (`handlePurchaseRecord` extracted from listener)
- Tests: `__tests__/iapService.test.ts`

## Testing

### Unit Tests
```typescript
describe('Remove Ads Product', () => {
  it('should hide banner ad when purchased', () => {
    const state = { iapState: { removeAdsPurchased: true } };
    expect(shouldShowBannerAd(state)).toBe(false);
  });

  it('should skip interstitial when purchased', () => {
    const state = {
      iapState: { removeAdsPurchased: true },
      adState: { lastInterstitialShownAt: 0 },
    };
    expect(shouldShowInterstitialAd(state)).toBe(false);
  });

  it('should keep rewarded ads available when purchased', () => {
    const state = { iapState: { removeAdsPurchased: true } };
    expect(shouldShowRewardedAdButton(state)).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Remove Ads Purchase Flow', () => {
  it('should complete purchase and hide ads', async () => {
    const { getByText } = render(<RemoveAdsCard />);
    fireEvent.press(getByText('Buy Now'));
    fireEvent.press(getByText('Purchase'));
    await waitFor(() => {
      expect(getByText('✓ Purchased')).toBeTruthy();
    });
    expect(element(by.id('banner-ad'))).not.toBeVisible();
  });
});
```
