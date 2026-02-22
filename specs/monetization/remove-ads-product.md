# Remove Ads Product

## Estado
- **Fase**: Phase 1 - Genesis (Designed, Not Implemented)
- **Estado**: Specification Complete
- **Prioridad**: High (Key Conversion Product)
- **Última actualización**: 2026-02-21

## Descripción

El producto "Remove Ads" es el IAP de conversión primario del juego, diseñado para convertir usuarios molestos por anuncios en usuarios de pago. Por solo $0.99 (precio agresivo para maximizar conversión), los usuarios pueden remover permanentemente los banner ads y interstitial ads, mejorando significativamente su experiencia de juego.

Este producto es **non-consumable** (compra única, permanente) y afecta selectivamente solo a ads molestos: banner (bottom, siempre visible) e interstitial (app open cada 6h). Crucialmente, NO remueve rewarded ads porque estos otorgan beneficios al jugador (2x boost por 4 horas), manteniendo engagement y opción de ads voluntarias.

El producto incluye Restore Purchases functionality para usuarios que reinstalan o cambian de device, y persiste en AsyncStorage + backend (futuro) para máxima reliability.

## Objetivos
- [ ] Implementar producto IAP "Remove Ads" a $0.99
- [ ] Ocultar banner ads inmediatamente al comprar
- [ ] Prevenir interstitial ads en app opens futuros
- [ ] Mantener rewarded ads disponibles (NO removerlos)
- [ ] Implementar Restore Purchases para reinstalls
- [ ] Mostrar badge "Ad Free" cuando está activo
- [ ] Prevenir re-compra (mostrar "Already Purchased")
- [ ] Persistir estado en AsyncStorage y backend
- [ ] Trackear conversión en Firebase Analytics
- [ ] Implementar discount/promotion triggers (opcional)

## Comportamiento Esperado

### Caso de Uso 1: Usuario Ve Remove Ads (No Comprado)
**Dado que** el usuario NO ha comprado Remove Ads
**Cuando** abre la tienda de IAP
**Entonces**
- Se muestra card destacado de "Remove Ads":
  - Posición: Top de la tienda (primera opción visible)
  - Badge: "Popular" o "Recommended"
  - Título: "Remove Ads"
  - Descripción:
    - "Remove annoying banner and interstitial ads"
    - "Keep rewarded ads for free boosts"
    - "One-time purchase, permanent benefit"
  - Icono: Ad blocker symbol (🚫 con ad icon)
  - Precio: "$0.99" (grande, destacado)
  - Botón: "Buy Now" (verde, prominente)
- Si el usuario ha visto muchos ads (>20 interstitials):
  - Badge adicional: "You've seen X ads - time to remove them!"
  - Discount offer (opcional): "Limited time: $0.99 → $0.49"

### Caso de Uso 2: Comprar Remove Ads (Primera Vez)
**Dado que** el usuario presiona "Buy Remove Ads"
**Cuando** confirma la compra
**Entonces**
- Se muestra confirmation dialog:
  - Título: "Remove Ads"
  - Descripción:
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
  - Sistema operativo muestra dialog de confirmación (Face ID/biometrics)
  - Usuario autoriza pago
  - Purchase se procesa:
    - Receipt validation (client-side)
    - Marcar como comprado: `removeAdsPurchased = true`
    - Guardar en AsyncStorage: `@removeAdsPurchased: true`
    - Enviar a backend (si implementado): `POST /api/purchases`
    - Guardar en purchase history con timestamp
    - Finalizar transacción: `finishTransaction()`
  - Inmediatamente ocultar banner ad (si visible)
  - Actualizar UI:
    - Banner desaparece con animación fade-out
    - Store card muestra badge "Purchased"
    - Botón cambia a "Purchased" (gris, deshabilitado)
  - Mostrar success dialog:
    - Título: "Ads Removed!"
    - Icono: Checkmark verde
    - Descripción: "Banner and interstitial ads are now removed. Enjoy ad-free gameplay!"
    - Note: "Rewarded ads are still available if you want free boosts"
    - Botón: "Awesome!"
  - Log Analytics:
    - `iap_purchase_success` con product_id: `remove_ads`
    - `remove_ads_purchased` con ads_seen_count
    - `revenue` event con value: $0.99

### Caso de Uso 3: Inmediatamente Después de Comprar
**Dado que** el usuario acaba de comprar Remove Ads
**Cuando** está en el juego
**Entonces**
- Banner ad (si estaba visible):
  - Fade out con animación suave (300ms)
  - Contenido del juego se expande para llenar espacio
  - Layout se ajusta sin jarring jumps
- Top bar muestra badge temporal:
  - "Ad Free" badge (dorado, con icono de checkmark)
  - Visible por 10 segundos, luego fade out
  - Al tocar: tooltip "You removed ads! Thanks for supporting the game."
- Próximos app opens:
  - NO se mostrarán interstitial ads
  - Código verifica `removeAdsPurchased === true` y skipea
- Rewarded ads:
  - Botón "Watch Ad for 2x Boost" SIGUE VISIBLE
  - Funcionalidad completamente intacta
  - Tooltip opcional: "You can still watch ads for free boosts!"

### Caso de Uso 4: Navegación Post-Compra
**Dado que** Remove Ads fue comprado
**Cuando** el usuario navega entre pantallas
**Entonces**
- En TODAS las pantallas:
  - Banner ad NO se muestra (ni espacio reservado)
  - Contenido usa full height de pantalla
- En tab de Store/IAP:
  - Remove Ads card muestra badge "Purchased"
  - Botón deshabilitado, texto "Purchased"
  - Descripción actualizada: "✓ Ads removed - Thank you!"
- En Settings:
  - Opción visible: "Ad Free Mode: ✓ Active"
  - Link opcional: "Restore Purchases"

### Caso de Uso 5: Intentar Comprar Remove Ads (Ya Comprado)
**Dado que** el usuario YA compró Remove Ads
**Cuando** intenta comprarlo de nuevo
**Entonces**
- Botón está deshabilitado visualmente:
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

### Caso de Uso 6: App Open Después de Comprar (Same Session)
**Dado que** el usuario compró Remove Ads en esta sesión
**Cuando** cierra app y la reabre
**Entonces**
- Al verificar si mostrar interstitial:
  - Código lee `gameState.iapState.removeAdsPurchased`
  - Valor es `true`
  - Skipea interstitial ad completamente
  - NO intenta cargar ad
- Banner ad:
  - NO se carga ni se muestra
  - Component `<AdBanner>` retorna `null` inmediatamente
- Log Analytics: `interstitial_skipped_remove_ads`

### Caso de Uso 7: Reinstalar App (Restore Purchases)
**Dado que** el usuario compró Remove Ads previamente
**Cuando** reinstala la app o cambia de device
**Entonces**
- Al abrir app por primera vez:
  - gameState inicial: `removeAdsPurchased = false`
  - Banner ads se muestran temporalmente
  - Interstitial ads se intentan mostrar
- Usuario va a Settings → "Restore Purchases"
- O automáticamente en inicialización IAP:
  - `getAvailablePurchases()` retorna Remove Ads
  - Sistema detecta compra previa
  - Marca automáticamente: `removeAdsPurchased = true`
  - Oculta banner ad
  - Guarda en AsyncStorage
- Mostrar notificación:
  - "Purchases Restored!"
  - "Remove Ads: ✓ Active"
- Log Analytics: `iap_restore_success` con product: `remove_ads`

### Caso de Uso 8: Múltiples Devices (Same Account)
**Dado que** el usuario usa iOS/Android con misma Apple ID / Google Account
**Cuando** instala el juego en otro device
**Entonces**
- Primera instalación en device 2:
  - Mismo flujo de Restore Purchases
  - `getAvailablePurchases()` retorna Remove Ads
  - Se restaura automáticamente
- Remove Ads funciona en TODOS los devices del usuario:
  - iOS: Sincronizado por Apple ID via StoreKit
  - Android: Sincronizado por Google Account via Play Billing
- No se puede comprar de nuevo:
  - Store detecta que ya lo posee
  - Botón deshabilitado en todos los devices

### Caso de Uso 9: Error Durante Compra (Payment Failed)
**Dado que** el usuario intenta comprar Remove Ads
**Cuando** el pago falla (tarjeta rechazada, fondos insuficientes)
**Entonces**
- Sistema operativo muestra error nativo:
  - iOS: "Payment not completed"
  - Android: "Transaction failed"
- App detecta error en purchase listener
- Mostrar error dialog:
  - Título: "Purchase Failed"
  - Mensaje: "Your payment could not be processed. Please check your payment method and try again."
  - Botón: "OK"
- Estado NO cambia:
  - `removeAdsPurchased = false`
  - Banner ads siguen visibles
  - Interstitial ads siguen activos
- NO se finaliza transacción (puede retry)
- Log Analytics:
  - `iap_purchase_failed` con error_code
  - Incluir: product: `remove_ads`, reason: payment_failed

### Caso de Uso 10: Compra Cancelada por Usuario
**Dado que** el usuario inició compra de Remove Ads
**Cuando** cancela en dialog del sistema operativo
**Entonces**
- Purchase listener recibe error `E_USER_CANCELLED`
- NO mostrar error dialog (es intencional)
- Volver a store screen normalmente
- Estado no cambia:
  - `removeAdsPurchased = false`
  - Ads siguen activos
- Log Analytics: `iap_purchase_cancelled` con product: `remove_ads`

### Caso de Uso 11: Refund (Usuario Solicita Reembolso)
**Dado que** el usuario compró Remove Ads
**Cuando** solicita refund en App Store / Play Store
**Entonces**
- Store procesa refund (Apple/Google decision, no controlado por app)
- Si refund aprobado:
  - Sin backend: App NO detecta refund (beneficio persiste)
  - Con backend (futuro):
    - Server recibe notificación de refund
    - Server revoca beneficio: `removeAdsPurchased = false`
    - Próximo sync: App muestra ads de nuevo
    - Mostrar notificación: "Your purchase was refunded. Ads are now active."
- Log Analytics: `iap_refund` (solo con backend)
- **Nota**: Para Phase 1 (sin backend), refunds no se detectan - usuario mantiene beneficio (aceptable, fraud mínimo esperado)

### Caso de Uso 12: Promoción/Discount Trigger
**Dado que** el usuario ha visto muchos ads pero no ha comprado
**Cuando** alcanza cierto threshold (ej: 50 interstitial ads vistos)
**Entonces**
- En próximo app open, mostrar promotion dialog:
  - Título: "You've seen 50 ads!"
  - Descripción: "Remove all ads for just $0.99 - support the game and enjoy ad-free experience"
  - Botón: "Remove Ads Now"
  - Botón secundario: "Maybe Later"
- Si selecciona "Remove Ads Now":
  - Abrir store directamente en Remove Ads product
  - Pre-seleccionar producto con animación highlight
- Si selecciona "Maybe Later":
  - Cerrar dialog
  - Mostrar de nuevo después de 25 ads más
- Log Analytics: `remove_ads_promo_shown`, `remove_ads_promo_clicked`

### Caso de Uso 13: Post-Purchase Gratitude
**Dado que** el usuario compró Remove Ads
**Cuando** completa la compra
**Entonces**
- Además del success dialog, mostrar:
  - "Thank you for supporting Blockchain Tycoon!"
  - "Your support helps us create more games"
  - Emoji/sticker de apreciación
- En changelog/updates futuros:
  - Sección especial: "Thanks to our supporters"
  - Badge en profile (futuro): "Supporter"
- Opcional: Unlock cosmético pequeño (ej: gold UI theme)

## Fórmulas y Cálculos

### Verificación de Remove Ads Comprado
```typescript
function isRemoveAdsPurchased(gameState: GameState): boolean {
  return gameState.iapState.removeAdsPurchased === true;
}

function shouldShowBannerAd(gameState: GameState): boolean {
  // No mostrar si Remove Ads fue comprado
  if (isRemoveAdsPurchased(gameState)) {
    return false;
  }

  // Mostrar si no comprado
  return true;
}

function shouldShowInterstitialAd(gameState: GameState): boolean {
  // No mostrar si Remove Ads fue comprado
  if (isRemoveAdsPurchased(gameState)) {
    return false;
  }

  // Verificar cooldown de 6 horas
  const timeSinceLast = Date.now() - gameState.adState.lastInterstitialShownAt;
  const cooldown = 6 * 60 * 60 * 1000;

  return timeSinceLast >= cooldown;
}
```

### Rewarded Ads Siguen Disponibles
```typescript
function shouldShowRewardedAdButton(gameState: GameState): boolean {
  // Rewarded ads SIEMPRE disponibles, incluso con Remove Ads
  // Remove Ads NO afecta rewarded ads
  return true;
}
```

### Cálculo de Conversión Rate
```typescript
function calculateRemoveAdsConversionRate(analytics: Analytics): number {
  const totalUsers = analytics.totalUsers;
  const purchasedUsers = analytics.getUsersWhoCompletedPurchase('remove_ads');

  return (purchasedUsers / totalUsers) * 100;
}

// Target: 2-5% conversion rate
// Industry average para $0.99 IAP: 1-3%
```

### Tiempo Promedio Hasta Compra
```typescript
function calculateTimeToConversion(purchaseHistory: PurchaseRecord[]): number {
  const removeAdsPurchases = purchaseHistory.filter(
    p => p.productId === 'remove_ads'
  );

  const timesToConversion = removeAdsPurchases.map(purchase => {
    const installTime = getInstallTime(purchase.userId);
    return purchase.purchaseDate - installTime;
  });

  const average = timesToConversion.reduce((sum, t) => sum + t, 0) / timesToConversion.length;

  return average; // En milisegundos
}

// Target: 24-48 horas (1-2 días de gameplay)
```

## Constantes de Configuración

En `src/config/iapConfig.ts` (específico a Remove Ads):

```typescript
export const REMOVE_ADS_CONFIG = {
  // Product ID
  productId: 'com.blockchaintycoon.removeads',

  // Price (reference, actual from stores)
  price: 0.99,
  currency: 'USD',

  // Promotion triggers
  promotions: {
    enabled: true,                          // Enable promotional dialogs
    interstitialThreshold: 50,              // Show promo after X interstitials
    reminderThreshold: 25,                  // Remind every X ads after first promo
    discountEnabled: false,                 // TODO: Implement discount (requires store config)
    discountPrice: 0.49,                    // Discounted price (if enabled)
  },

  // UI
  badges: {
    popular: true,                          // Show "Popular" badge
    recommended: true,                      // Show "Recommended" badge
    adFreeIndicator: true,                  // Show "Ad Free" badge after purchase
    adFreeIndicatorDuration: 10000,         // Show for 10 seconds
  },

  // Analytics
  trackConversion: true,                    // Track conversion funnel
  trackAdsSeenBeforePurchase: true,         // Track how many ads before buying
};
```

## Estructura de Datos

### Remove Ads State (dentro de GameState)
```typescript
interface GameState {
  iapState: {
    // Remove Ads specific
    removeAdsPurchased: boolean;            // Si fue comprado
    removeAdsPurchaseDate: number | null;   // Timestamp de compra
    adsSeenBeforePurchase: number;          // Cuántos ads vio antes de comprar

    // Purchase record (en history)
    purchaseHistory: PurchaseRecord[];      // Incluye record de Remove Ads
  };

  adState: {
    // Ad tracking (para promotion triggers)
    totalInterstitialsShown: number;        // Total de interstitials mostrados
    totalBannerImpressions: number;         // Total de banner impressions
    lastPromotionShownAt: number | null;    // Timestamp de última promo
  };
}
```

### Promotion Dialog State
```typescript
interface PromotionState {
  type: 'remove_ads_promo';
  triggered: boolean;                       // Si ya se disparó
  triggeredAt: number | null;               // Timestamp
  dismissed: boolean;                       // Si usuario dismisseó
  dismissedCount: number;                   // Cuántas veces dismisseó
}
```

## Reglas de Negocio

1. **Remove Ads es non-consumable**: Solo se puede comprar UNA VEZ, permanente
2. **Precio fijo $0.99**: Precio agresivo para maximizar conversión
3. **Remove solo banner e interstitial**: Rewarded ads NO se remueven
4. **Efecto inmediato**: Ads se ocultan inmediatamente al comprar
5. **Persistencia total**: AsyncStorage + backend + store sync
6. **Restore Purchases automático**: En inicialización IAP
7. **Multi-device sync**: Funciona en todos los devices del usuario
8. **Promociones opcionales**: Mostrar después de X ads vistos
9. **No refund detection sin backend**: Usuario mantiene beneficio (aceptable Phase 1)
10. **Analytics tracking obligatorio**: Trackear conversión funnel completo

## UI/UX Requirements

### Remove Ads Product Card (Store)
- [ ] Posición: Top de la tienda (primera opción)
- [ ] Badge: "Popular" o "Recommended" (destacado)
- [ ] Icono: Grande, ad blocker symbol (🚫 con ad)
- [ ] Título: "Remove Ads" (bold, grande)
- [ ] Descripción:
  - "Remove annoying banner and interstitial ads"
  - "Keep rewarded ads for free boosts"
  - "One-time purchase, permanent benefit"
- [ ] Precio: "$0.99" (muy grande, verde)
- [ ] Botón: "Buy Now" (verde brillante, call-to-action)
- [ ] Si comprado:
  - Badge: "Purchased" (verde)
  - Botón: "Purchased" (gris, deshabilitado)
  - Checkmark verde grande

### Confirmation Dialog
- [ ] Título: "Remove Ads"
- [ ] Lista de beneficios:
  - "✓ Remove banner ads"
  - "✓ Remove interstitial ads"
  - "✓ Keep rewarded ads for boosts"
  - "✓ Permanent - never expires"
- [ ] Precio: "$0.99" (destacado)
- [ ] Warning: "One-time purchase" (subtle)
- [ ] Botones:
  - "Cancel" (gris, outlined)
  - "Purchase" (verde, filled, bold)

### Success Dialog
- [ ] Icono: Checkmark grande verde con animación
- [ ] Título: "Ads Removed!" (bold)
- [ ] Descripción:
  - "Banner and interstitial ads are now removed"
  - "Enjoy ad-free gameplay!"
- [ ] Note: "Rewarded ads are still available for free boosts" (subtle)
- [ ] Botón: "Awesome!" (verde)
- [ ] Background: Confetti animation (sutil)

### Ad Free Badge (Post-Purchase)
- [ ] Ubicación: Top bar, junto a coins/money
- [ ] Icono: Checkmark o shield
- [ ] Texto: "Ad Free"
- [ ] Color: Dorado/verde
- [ ] Animación: Fade in, visible 10s, fade out
- [ ] Al tocar: Tooltip "Thanks for supporting the game!"

### Promotion Dialog (After X Ads)
- [ ] Título: "You've seen X ads!"
- [ ] Descripción:
  - "Remove all ads for just $0.99"
  - "Support the game and enjoy ad-free experience"
- [ ] Icono: Frustrated emoji o ad icon con X
- [ ] Botones:
  - "Remove Ads Now" (verde, large)
  - "Maybe Later" (gris, small)
- [ ] Checkbox: "Don't show this again" (opcional)

### Settings Screen (Remove Ads Status)
- [ ] Sección: "Ads & Purchases"
- [ ] Item:
  - Si NO comprado: "Remove Ads - $0.99" (link a store)
  - Si comprado: "Ad Free Mode: ✓ Active" (verde, checkmark)
- [ ] Botón: "Restore Purchases"

## Validaciones

### Pre-Purchase
- [ ] Verificar que IAP está inicializado
- [ ] Verificar que producto está disponible en region
- [ ] Verificar que NO está ya purchased:
  - `removeAdsPurchased === false`
  - Store no retorna `ITEM_ALREADY_OWNED`
- [ ] Verificar conexión a internet

### During Purchase
- [ ] Mostrar loading state
- [ ] Deshabilitar botón (prevenir double-click)
- [ ] Set `isPurchasing = true`

### Post-Purchase
- [ ] Validar receipt (client-side):
  - Transaction ID válido
  - Product ID = 'remove_ads'
  - Timestamp razonable
- [ ] Verificar que purchase fue successful (no error)
- [ ] Marcar `removeAdsPurchased = true`
- [ ] Guardar en AsyncStorage
- [ ] Enviar a backend (si implementado)
- [ ] Finalizar transacción: `finishTransaction()`
- [ ] Guardar en purchase history
- [ ] Actualizar UI inmediatamente

### State Integrity
- [ ] `removeAdsPurchased` debe ser boolean
- [ ] `removeAdsPurchaseDate` debe ser timestamp válido (si purchased)
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

## Dependencias

### Requiere
- `react-native-iap` - Para purchase flow
- `GameContext` - Para state management
- `AsyncStorage` - Para persistencia
- `Firebase Analytics` - Para tracking
- `Ad System` - Para verificar y ocultar ads

### Bloquea
- Ningún sistema (es opcional)

### Relacionado con
- `Ad System` - Remove Ads deshabilita banner e interstitial
- `IAP System` - Remove Ads es un IAP product
- `Analytics` - Tracking de conversión

## Criterios de Aceptación

- [ ] Remove Ads se puede comprar por $0.99
- [ ] Banner ads se ocultan inmediatamente al comprar
- [ ] Interstitial ads NO se muestran después de comprar
- [ ] Rewarded ads SIGUEN disponibles después de comprar
- [ ] Botón muestra "Purchased" y está deshabilitado después de comprar
- [ ] Restore Purchases restaura Remove Ads correctamente
- [ ] Estado persiste entre sesiones (AsyncStorage)
- [ ] Funciona en múltiples devices (mismo account)
- [ ] Intentar comprar de nuevo muestra "Already Purchased"
- [ ] Promoción se muestra después de X ads (si enabled)
- [ ] Analytics trackea conversión correctamente

## Notas de Implementación

### Purchase Flow Component
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
    // Show confirmation
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

              // Purchase success is handled in purchase listener
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

  const isPurchased = gameState.iapState.removeAdsPurchased;

  return (
    <View style={[styles.card, isPurchased && styles.purchasedCard]}>
      {/* Badge */}
      <View style={styles.badgeContainer}>
        {isPurchased ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Purchased</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.popularBadge]}>
            <Text style={styles.badgeText}>Popular</Text>
          </View>
        )}
      </View>

      {/* Icon */}
      <View style={styles.icon}>
        <Text style={styles.iconText}>🚫📱</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Remove Ads</Text>

      {/* Description */}
      <Text style={styles.description}>
        {isPurchased
          ? '✓ Ads removed - Thank you for your support!'
          : 'Remove annoying banner and interstitial ads. Keep rewarded ads for free boosts.'}
      </Text>

      {/* Benefits */}
      {!isPurchased && (
        <View style={styles.benefits}>
          <Text style={styles.benefit}>✓ No more banner ads</Text>
          <Text style={styles.benefit}>✓ No more interstitial ads</Text>
          <Text style={styles.benefit}>✓ Rewarded ads still available</Text>
          <Text style={styles.benefit}>✓ One-time purchase, permanent</Text>
        </View>
      )}

      {/* Price & Button */}
      {!isPurchased ? (
        <>
          <Text style={styles.price}>$0.99</Text>
          <TouchableOpacity
            style={[styles.button, isPurchasing && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={isPurchasing}
          >
            <Text style={styles.buttonText}>
              {isPurchasing ? 'Processing...' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.purchasedBadgeLarge}>
          <Text style={styles.purchasedText}>✓ Purchased</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  purchasedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badge: {
    backgroundColor: '#999',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  icon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  benefits: {
    marginBottom: 16,
  },
  benefit: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  purchasedBadgeLarge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchasedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

### GameContext Action
```typescript
// src/contexts/GameContext.tsx

case 'PURCHASE_REMOVE_ADS':
  const now = Date.now();

  return {
    ...state,
    iapState: {
      ...state.iapState,
      removeAdsPurchased: true,
      removeAdsPurchaseDate: now,
      adsSeenBeforePurchase: state.adState.totalInterstitialsShown,
    },
  };
```

### Promotion Dialog Logic
```typescript
// src/utils/promotionTriggers.ts
export function shouldShowRemoveAdsPromo(gameState: GameState): boolean {
  // Don't show if already purchased
  if (gameState.iapState.removeAdsPurchased) {
    return false;
  }

  const config = REMOVE_ADS_CONFIG.promotions;

  if (!config.enabled) {
    return false;
  }

  const { totalInterstitialsShown } = gameState.adState;
  const { lastPromotionShownAt } = gameState.adState;

  // First promo after X interstitials
  if (totalInterstitialsShown >= config.interstitialThreshold) {
    if (!lastPromotionShownAt) {
      return true; // First promo
    }

    // Reminder every Y ads after first promo
    const adsSinceLastPromo = totalInterstitialsShown - lastPromotionShownAt;
    if (adsSinceLastPromo >= config.reminderThreshold) {
      return true;
    }
  }

  return false;
}
```

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

    // Click Buy
    fireEvent.press(getByText('Buy Now'));

    // Confirm
    fireEvent.press(getByText('Purchase'));

    // Wait for purchase
    await waitFor(() => {
      expect(getByText('✓ Purchased')).toBeTruthy();
    });

    // Verify banner is hidden
    expect(element(by.id('banner-ad'))).not.toBeVisible();
  });
});
```

## Performance Considerations

- Purchase processing: < 3s
- UI update (hide ads): Immediate (< 100ms)
- AsyncStorage write: < 50ms
- Analytics logging: Async, non-blocking

## Analytics

```typescript
analytics().logEvent('remove_ads_purchase_initiated', {
  ads_seen_before_purchase: gameState.adState.totalInterstitialsShown,
});

analytics().logEvent('remove_ads_purchase_success', {
  price: 0.99,
  currency: 'USD',
  ads_seen: gameState.iapState.adsSeenBeforePurchase,
});

analytics().logEvent('remove_ads_promo_shown', {
  ads_seen: gameState.adState.totalInterstitialsShown,
});

analytics().logEvent('remove_ads_already_owned', {});
```

## Edge Cases

**Edge Case 1: Purchase durante banner visible**
- Input: Usuario compra mientras banner está en pantalla
- Expected: Banner fade out inmediatamente

**Edge Case 2: Reinstall sin Restore**
- Input: Usuario no hace Restore Purchases
- Expected: Ads se muestran hasta que haga Restore (o auto-restore en init)

**Edge Case 3: Refund sin backend**
- Input: Usuario hace refund
- Expected: Beneficio persiste (no detectado)

**Edge Case 4: Múltiples devices, solo compra en uno**
- Input: Compra en iPhone, instala en iPad
- Expected: Restore automático sincroniza en iPad

## Preguntas Abiertas

- [ ] **Discount pricing**: ¿Ofrecer $0.49 promotional?
  - **Recomendación**: Test A/B, posiblemente aumenta conversión 2-3x

- [ ] **Bundle con otros IAP**: ¿"Remove Ads + Permanent Multiplier" por $9.99?
  - **Recomendación**: Phase 3+, canibaliza ventas individuales

- [ ] **Family Sharing**: ¿Permitir que familia comparta Remove Ads?
  - **Recomendación**: Sí (iOS Family Sharing, Android ya permite)

- [ ] **Cosmetic unlock**: ¿Dar badge/theme especial con compra?
  - **Recomendación**: Sí, pequeño incentivo adicional

## Referencias

- IAP Best Practices: https://developer.apple.com/app-store/in-app-purchase/
- Conversion Optimization: https://www.revenuecat.com/blog/iap-pricing-strategies/
- Remove Ads Pricing Research: https://www.blog.google/products/admob/remove-ads-iap-strategies/
