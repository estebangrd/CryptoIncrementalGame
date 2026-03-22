# Remove Ads — Core Product Definition

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: Implemented
- **Prioridad**: High (Key Conversion Product)
- **Ultima actualizacion**: 2026-03-21
- **Split from**: Original `remove-ads-product.md` (reorganized into 5 focused specs)

## Related Specs
- [Purchase Flow](remove-ads-purchase-flow.md) — Confirmation, success, error handling, restore
- [Flash Sale](remove-ads-flash-sale.md) — 35% roll, timer, cooldown logic
- [UI/UX](remove-ads-ui.md) — Card design, badges, settings screen
- [Analytics](remove-ads-analytics.md) — Events, conversion tracking, promotions

## Descripcion

El producto "Remove Ads" es el IAP de conversion primario del juego, disenado para convertir usuarios molestos por anuncios en usuarios de pago. Por solo $0.99 (precio agresivo para maximizar conversion), los usuarios pueden remover permanentemente los banner ads y interstitial ads, mejorando significativamente su experiencia de juego.

Este producto es **non-consumable** (compra unica, permanente) y afecta selectivamente solo a ads molestos: banner (bottom, siempre visible) e interstitial (app open cada 6h). Crucialmente, NO remueve rewarded ads porque estos otorgan beneficios al jugador (2x boost por 4 horas), manteniendo engagement y opcion de ads voluntarias.

El producto incluye Restore Purchases functionality para usuarios que reinstalan o cambian de device, y persiste en AsyncStorage + backend (futuro) para maxima reliability.

## Objetivos
- [ ] Implementar producto IAP "Remove Ads" a $0.99
- [ ] Ocultar banner ads inmediatamente al comprar
- [ ] Prevenir interstitial ads en app opens futuros
- [ ] Mantener rewarded ads disponibles (NO removerlos)
- [ ] Implementar Restore Purchases para reinstalls
- [ ] Persistir estado en AsyncStorage y backend
- [ ] Implementar discount/promotion triggers (opcional)

## What It Removes

| Ad Type | Removed? | Details |
|---------|----------|---------|
| Banner ads (bottom) | YES | Fade out immediately on purchase |
| Interstitial ads (app open, 6h cooldown) | YES | Skipped completely |
| Rewarded ads (voluntary, 2x boost) | NO | Always available, even after purchase |

## Reglas de Negocio

1. **Remove Ads es non-consumable**: Solo se puede comprar UNA VEZ, permanente
2. **Precio fijo $0.99**: Precio agresivo para maximizar conversion
3. **Remove solo banner e interstitial**: Rewarded ads NO se remueven
4. **Efecto inmediato**: Ads se ocultan inmediatamente al comprar
5. **Persistencia total**: AsyncStorage + backend + store sync
6. **Restore Purchases automatico**: En inicializacion IAP
7. **Multi-device sync**: Funciona en todos los devices del usuario
8. **Promociones opcionales**: Mostrar despues de X ads vistos
9. **No refund detection sin backend**: Usuario mantiene beneficio (aceptable Phase 1)
10. **Analytics tracking obligatorio**: Trackear conversion funnel completo

## Constantes de Configuracion

En `src/config/iapConfig.ts` (especifico a Remove Ads):

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
    adsSeenBeforePurchase: number;          // Cuantos ads vio antes de comprar

    // Flash sale state (see remove-ads-flash-sale.md)
    flashSaleExpiresAt: number;
    flashSaleCooldownUntil: number;

    // Purchase record (en history)
    purchaseHistory: PurchaseRecord[];      // Incluye record de Remove Ads
  };

  adState: {
    // Ad tracking (para promotion triggers)
    totalInterstitialsShown: number;        // Total de interstitials mostrados
    totalBannerImpressions: number;         // Total de banner impressions
    lastPromotionShownAt: number | null;    // Timestamp de ultima promo
  };
}
```

### Promotion Dialog State
```typescript
interface PromotionState {
  type: 'remove_ads_promo';
  triggered: boolean;                       // Si ya se disparo
  triggeredAt: number | null;               // Timestamp
  dismissed: boolean;                       // Si usuario dismisseo
  dismissedCount: number;                   // Cuantas veces dismisseo
}
```

## Formulas y Calculos

### Verificacion de Remove Ads Comprado
```typescript
function isRemoveAdsPurchased(gameState: GameState): boolean {
  return gameState.iapState.removeAdsPurchased === true;
}

function shouldShowBannerAd(gameState: GameState): boolean {
  if (isRemoveAdsPurchased(gameState)) {
    return false;
  }
  return true;
}

function shouldShowInterstitialAd(gameState: GameState): boolean {
  if (isRemoveAdsPurchased(gameState)) {
    return false;
  }
  const timeSinceLast = Date.now() - gameState.adState.lastInterstitialShownAt;
  const cooldown = 6 * 60 * 60 * 1000;
  return timeSinceLast >= cooldown;
}
```

### Rewarded Ads Siguen Disponibles
```typescript
function shouldShowRewardedAdButton(gameState: GameState): boolean {
  // Rewarded ads SIEMPRE disponibles, incluso con Remove Ads
  return true;
}
```

## GameContext Action
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
- `Analytics` - Tracking de conversion

## Criterios de Aceptacion

- [ ] Remove Ads se puede comprar por $0.99
- [ ] Banner ads se ocultan inmediatamente al comprar
- [ ] Interstitial ads NO se muestran despues de comprar
- [ ] Rewarded ads SIGUEN disponibles despues de comprar
- [ ] Estado persiste entre sesiones (AsyncStorage)
- [ ] Funciona en multiples devices (mismo account)

## Performance Considerations

- Purchase processing: < 3s
- UI update (hide ads): Immediate (< 100ms)
- AsyncStorage write: < 50ms
- Analytics logging: Async, non-blocking

## Preguntas Abiertas

- [ ] **Discount pricing**: Ofrecer $0.49 promotional?
  - **Recomendacion**: Test A/B, posiblemente aumenta conversion 2-3x
- [ ] **Bundle con otros IAP**: "Remove Ads + Permanent Multiplier" por $9.99?
  - **Recomendacion**: Phase 3+, canibaliza ventas individuales
- [ ] **Family Sharing**: Permitir que familia comparta Remove Ads?
  - **Recomendacion**: Si (iOS Family Sharing, Android ya permite)
- [ ] **Cosmetic unlock**: Dar badge/theme especial con compra?
  - **Recomendacion**: Si, pequeno incentivo adicional

## Referencias

- IAP Best Practices: https://developer.apple.com/app-store/in-app-purchase/
- Conversion Optimization: https://www.revenuecat.com/blog/iap-pricing-strategies/
- Remove Ads Pricing Research: https://www.blog.google/products/admob/remove-ads-iap-strategies/
