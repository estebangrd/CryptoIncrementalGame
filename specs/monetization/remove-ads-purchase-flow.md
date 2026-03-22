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
- Se muestra confirmation dialog:
  - Titulo: "Remove Ads"
  - Descripcion:
    - "✓ Remove banner ads (bottom of screen)"
    - "✓ Remove interstitial ads (app opens)"
    - "✓ Rewarded ads still available for free boosts"
    - "✓ Permanent - never expires"
  - Precio: "$0.99"
  - Warning: "This is a one-time purchase"
  - Botones:
    - "Cancel" (gris, secondary)
    - "Purchase" (verde, primary)
- Si selecciona Cancel: cerrar dialog, no proceder
- Si selecciona Purchase:
  - Mostrar loading: "Processing purchase..."
  - Sistema operativo muestra dialog de confirmacion (Face ID/biometrics)
  - Usuario autoriza pago
  - Purchase se procesa:
    - Receipt validation (client-side)
    - Marcar como comprado: `removeAdsPurchased = true`
    - Guardar en AsyncStorage: `@removeAdsPurchased: true`
    - Enviar a backend (si implementado): `POST /api/purchases`
    - Guardar en purchase history con timestamp
    - Finalizar transaccion: `finishTransaction()`
  - Inmediatamente ocultar banner ad (si visible)
  - Actualizar UI:
    - Banner desaparece con animacion fade-out
    - Store card muestra badge "Purchased"
    - Boton cambia a "Purchased" (gris, deshabilitado)
  - Mostrar success dialog:
    - Titulo: "Ads Removed!"
    - Icono: Checkmark verde
    - Descripcion: "Banner and interstitial ads are now removed. Enjoy ad-free gameplay!"
    - Note: "Rewarded ads are still available if you want free boosts"
    - Boton: "Awesome!"
  - Log Analytics: see [remove-ads-analytics.md](remove-ads-analytics.md)

## Caso de Uso 2: Inmediatamente Despues de Comprar
**Dado que** el usuario acaba de comprar Remove Ads
**Cuando** esta en el juego
**Entonces**
- Banner ad (si estaba visible):
  - Fade out con animacion suave (300ms)
  - Contenido del juego se expande para llenar espacio
  - Layout se ajusta sin jarring jumps
- Top bar muestra badge temporal:
  - "Ad Free" badge (dorado, con icono de checkmark)
  - Visible por 10 segundos, luego fade out
  - Al tocar: tooltip "You removed ads! Thanks for supporting the game."
- Proximos app opens:
  - NO se mostraran interstitial ads
  - Codigo verifica `removeAdsPurchased === true` y skipea
- Rewarded ads:
  - Boton "Watch Ad for 2x Boost" SIGUE VISIBLE
  - Funcionalidad completamente intacta
  - Tooltip opcional: "You can still watch ads for free boosts!"

## Caso de Uso 3: Navegacion Post-Compra
**Dado que** Remove Ads fue comprado
**Cuando** el usuario navega entre pantallas
**Entonces**
- En TODAS las pantallas:
  - Banner ad NO se muestra (ni espacio reservado)
  - Contenido usa full height de pantalla
- En tab de Store/IAP:
  - Remove Ads card muestra badge "Purchased"
  - Boton deshabilitado, texto "Purchased"
  - Descripcion actualizada: "✓ Ads removed - Thank you!"
- En Settings:
  - Opcion visible: "Ad Free Mode: ✓ Active"
  - Link opcional: "Restore Purchases"

## Caso de Uso 4: Intentar Comprar Remove Ads (Ya Comprado)
**Dado que** el usuario YA compro Remove Ads
**Cuando** intenta comprarlo de nuevo
**Entonces**
- Boton esta deshabilitado visualmente:
  - Background gris
  - Texto: "Purchased"
  - Cursor: not-allowed
- Si de alguna forma intenta hacer click:
  - Mostrar toast: "You already own this item"
  - NO abrir confirmation dialog
  - NO procesar compra
  - NO cobrar dinero
- Store detecta que producto es non-consumable y ya purchased:
  - iOS: StoreKit retorna error "Already purchased"
  - Android: Play Billing retorna `ITEM_ALREADY_OWNED`
- Log Analytics: `iap_already_owned_attempt`

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
  - Component `<AdBanner>` retorna `null` inmediatamente
- Log Analytics: `interstitial_skipped_remove_ads`

## Caso de Uso 6: Reinstalar App (Restore Purchases)
**Dado que** el usuario compro Remove Ads previamente
**Cuando** reinstala la app o cambia de device
**Entonces**
- Al abrir app por primera vez:
  - gameState inicial: `removeAdsPurchased = false`
  - Banner ads se muestran temporalmente
  - Interstitial ads se intentan mostrar
- Usuario va a Settings -> "Restore Purchases"
- O automaticamente en inicializacion IAP:
  - `getAvailablePurchases()` retorna Remove Ads
  - Sistema detecta compra previa
  - Marca automaticamente: `removeAdsPurchased = true`
  - Oculta banner ad
  - Guarda en AsyncStorage
- Mostrar notificacion:
  - "Purchases Restored!"
  - "Remove Ads: ✓ Active"
- Log Analytics: `iap_restore_success` con product: `remove_ads`

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
- Sistema operativo muestra error nativo:
  - iOS: "Payment not completed"
  - Android: "Transaction failed"
- App detecta error en purchase listener
- Mostrar error dialog:
  - Titulo: "Purchase Failed"
  - Mensaje: "Your payment could not be processed. Please check your payment method and try again."
  - Boton: "OK"
- Estado NO cambia:
  - `removeAdsPurchased = false`
  - Banner ads siguen visibles
  - Interstitial ads siguen activos
- NO se finaliza transaccion (puede retry)
- Log Analytics: `iap_purchase_failed` con error_code, product: `remove_ads`, reason: payment_failed

## Caso de Uso 9: Compra Cancelada por Usuario
**Dado que** el usuario inicio compra de Remove Ads
**Cuando** cancela en dialog del sistema operativo
**Entonces**
- Purchase listener recibe error `E_USER_CANCELLED`
- NO mostrar error dialog (es intencional)
- Volver a store screen normalmente
- Estado no cambia:
  - `removeAdsPurchased = false`
  - Ads siguen activos
- Log Analytics: `iap_purchase_cancelled` con product: `remove_ads`

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
- Ademas del success dialog, mostrar:
  - "Thank you for supporting Blockchain Tycoon!"
  - "Your support helps us create more games"
  - Emoji/sticker de apreciacion
- En changelog/updates futuros:
  - Seccion especial: "Thanks to our supporters"
  - Badge en profile (futuro): "Supporter"
- Opcional: Unlock cosmetico pequeno (ej: gold UI theme)

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

```tsx
// src/components/RemoveAdsCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGame } from '../contexts/GameContext';
import IAPService from '../services/IAPService';
import { REMOVE_ADS_CONFIG } from '../config/iapConfig';
import analytics from '@react-native-firebase/analytics';

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
