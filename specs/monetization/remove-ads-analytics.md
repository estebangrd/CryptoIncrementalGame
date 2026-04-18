# Remove Ads — Analytics & Conversion Tracking

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: Implemented
- **Prioridad**: High
- **Ultima actualizacion**: 2026-03-21
- **Split from**: Original `remove-ads-product.md` (reorganized into 5 focused specs)

## Related Specs
- [Core Product](remove-ads-core.md) — Product definition, pricing, business rules, state
- [Purchase Flow](remove-ads-purchase-flow.md) — Confirmation, success, error handling, restore
- [Flash Sale](remove-ads-flash-sale.md) — 35% roll, timer, cooldown logic
- [UI/UX](remove-ads-ui.md) — Card design, badges, settings screen

---

> **Nota de implementación general**: Firebase NO está integrado. No existe dependencia `@react-native-firebase/analytics` en `package.json`. Todos los eventos de analytics se envían a `DevAnalyticsProvider` (`src/services/analytics/devAnalytics.ts`), que solo hace `console.log`. La infraestructura está preparada para swappear a Firebase via `setAnalyticsProvider()` en `src/services/analytics/index.ts`, pero actualmente solo funciona en dev/console. Los eventos se emiten desde `analyticsMiddleware.ts` (post-reducer) y desde `ShopScreen.tsx` (errores de compra).

## Analytics Events

### Purchase Funnel

> **Nota de implementación**: Los eventos se emiten via `logEvent()` de `src/services/analytics/index.ts`, que delega al provider activo (actualmente `DevAnalyticsProvider` → console.log). Los nombres y payloads de los eventos difieren del spec original — ver notas por evento.

```typescript
// Initiated — user tapped Buy and confirmed in our dialog
analytics().logEvent('remove_ads_purchase_initiated', {
  ads_seen_before_purchase: gameState.adState.totalInterstitialsShown,
});
// ⚠️ NO IMPLEMENTADO: no existe evento "remove_ads_purchase_initiated".
// No hay confirmation dialog, así que no hay punto de "initiated".

// Success — purchase completed and receipt validated
analytics().logEvent('remove_ads_purchase_success', {
  price: 0.99,
  currency: 'USD',
  ads_seen: gameState.iapState.adsSeenBeforePurchase,
});
// ✅ IMPLEMENTADO como dos eventos en analyticsMiddleware.ts:
//   logEvent('remove_ads_purchased', { price })
//   logEvent('iap_purchase_success', { productId, price, currency })
// Nota: el nombre es 'remove_ads_purchased' (no 'remove_ads_purchase_success')
// y no incluye ads_seen en el payload.

// Revenue event (for Firebase revenue tracking)
analytics().logEvent('revenue', {
  value: 0.99,
  currency: 'USD',
  product_id: 'remove_ads',
});
// ⚠️ NO IMPLEMENTADO: no existe evento 'revenue' separado.

// Failed — payment error (not user cancellation)
analytics().logEvent('iap_purchase_failed', {
  error_code: error.code,
  product: 'remove_ads',
  reason: 'payment_failed',
});
// ✅ IMPLEMENTADO en ShopScreen.tsx con payload diferente:
//   logEvent('iap_purchase_failed', { productId, errorMessage })
// Nota: usa 'productId' y 'errorMessage' en vez de 'error_code', 'product', 'reason'.

// Cancelled — user dismissed OS payment dialog
analytics().logEvent('iap_purchase_cancelled', {
  product: 'remove_ads',
});
// ✅ IMPLEMENTADO en ShopScreen.tsx:
//   logEvent('iap_purchase_cancelled', { productId })
// Nota: usa 'productId' en vez de 'product'.

// Already owned — user somehow tried to re-purchase
analytics().logEvent('iap_already_owned_attempt', {
  product: 'remove_ads',
});
// ⚠️ NO IMPLEMENTADO: no existe este evento. El botón se deshabilita
// cuando purchased=true, previniendo re-compra a nivel de UI.
```

### Post-Purchase

```typescript
// Interstitial skipped because Remove Ads is active
analytics().logEvent('interstitial_skipped_remove_ads', {});
// ⚠️ NO IMPLEMENTADO: la lógica de skip existe (el reducer chequea
// removeAdsPurchased) pero no se emite evento analytics al respecto.

// Restore purchases succeeded
analytics().logEvent('iap_restore_success', {
  product: 'remove_ads',
});
// ⚠️ NO IMPLEMENTADO: SettingsModal.tsx hace restore y muestra toast,
// pero no emite evento analytics de restore success.

// Refund detected (future, backend only)
analytics().logEvent('iap_refund', {
  product: 'remove_ads',
});
// ⚠️ NO IMPLEMENTADO (esperado — requiere backend).
```

### Promotion Events

> **Nota de implementación**: Ninguno de estos eventos está implementado. No existe promotion dialog UI. Los eventos `remove_ads_promo_shown` y `remove_ads_promo_clicked` no están definidos en `AnalyticsEventMap` (`src/services/analytics/types.ts`) ni se emiten desde ningún componente.

```typescript
// Promotion dialog shown (after X interstitials seen)
analytics().logEvent('remove_ads_promo_shown', {
  ads_seen: gameState.adState.totalInterstitialsShown,
});
// ⚠️ NO IMPLEMENTADO

// User tapped "Remove Ads Now" in promotion dialog
analytics().logEvent('remove_ads_promo_clicked', {
  ads_seen: gameState.adState.totalInterstitialsShown,
});
// ⚠️ NO IMPLEMENTADO
```

## Promotion Trigger Logic

> **Nota de implementación**: El archivo `src/utils/promotionTriggers.ts` NO existe. La configuración de promociones (`REMOVE_ADS_CONFIG.promotions`) existe en `iapConfig.ts` y el estado `adState.lastPromotionShownAt` / action `MARK_PROMO_SHOWN` existen en el reducer, pero la función `shouldShowRemoveAdsPromo()` y su UI no están implementadas.

```typescript
// src/utils/promotionTriggers.ts (NO EXISTE)
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

### Promotion Configuration (from `REMOVE_ADS_CONFIG`)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `promotions.enabled` | `true` | Master toggle for promo dialogs |
| `promotions.interstitialThreshold` | `50` | Show first promo after 50 interstitials |
| `promotions.reminderThreshold` | `25` | Remind every 25 ads after first promo |
| `promotions.discountEnabled` | `false` | Discount pricing (requires store config) |
| `promotions.discountPrice` | `0.49` | Discounted price if enabled |

## Caso de Uso: Promocion/Discount Trigger
**Dado que** el usuario ha visto muchos ads pero no ha comprado
**Cuando** alcanza cierto threshold (ej: 50 interstitial ads vistos)
**Entonces**
- En proximo app open, mostrar promotion dialog:
  - Titulo: "You've seen 50 ads!"
  - Descripcion: "Remove all ads for just $0.99 - support the game and enjoy ad-free experience"
  - Boton: "Remove Ads Now"
  - Boton secundario: "Maybe Later"
- Si selecciona "Remove Ads Now":
  - Abrir store directamente en Remove Ads product
  - Pre-seleccionar producto con animacion highlight
- Si selecciona "Maybe Later":
  - Cerrar dialog
  - Mostrar de nuevo despues de 25 ads mas
- Log Analytics: `remove_ads_promo_shown`, `remove_ads_promo_clicked`

## Conversion Rate Formulas

### Conversion Rate Calculation
```typescript
function calculateRemoveAdsConversionRate(analytics: Analytics): number {
  const totalUsers = analytics.totalUsers;
  const purchasedUsers = analytics.getUsersWhoCompletedPurchase('remove_ads');
  return (purchasedUsers / totalUsers) * 100;
}
// Target: 2-5% conversion rate
// Industry average para $0.99 IAP: 1-3%
```

### Time to Conversion
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
// Target: 24-48 horas (1-2 dias de gameplay)
```

## Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Conversion rate | 2-5% | % of users who purchase Remove Ads |
| Time to conversion | 24-48h | Average time from install to purchase |
| Promo click-through | >10% | % of users who tap "Remove Ads Now" from promo |
| Restore success rate | >95% | % of restore attempts that succeed |
| Purchase failure rate | <5% | % of initiated purchases that fail |
