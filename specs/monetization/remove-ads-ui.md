# Remove Ads — UI/UX Requirements

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
- [Analytics](remove-ads-analytics.md) — Events, conversion tracking, promotions

---

## Remove Ads Product Card (Store)

> **Nota de implementación**: La implementación actual usa un diseño cyberpunk completamente diferente al diseño blanco/material descrito abajo. El card real usa `LinearGradient` con tonos rojos/naranjas (`#ff3d5a` → `#ff8c42`), un icono `🚫` grande, perks listados con iconos `✕` y `✓`, y un sistema de "unlock steps" (3 compras → desbloqueo progresivo). No existe un componente separado `RemoveAdsCard.tsx` — toda la UI está integrada en `ShopScreen.tsx` → `renderNoAds()`.

### Not Purchased State
- [x] Posicion: Top de la tienda (primera opcion) — es el primer tab `removeAds`
- [ ] Badge: "Popular" o "Recommended" (destacado)
  > **Nota de implementación**: No se muestra badge "Popular" ni "Recommended" en la UI. La config `REMOVE_ADS_CONFIG.badges.popular` existe en `iapConfig.ts` pero no se renderiza.
- [x] Icono: Grande, ad blocker symbol — usa emoji `🚫`
- [x] Titulo: "Remove Ads" (bold, grande) — via `t('shop.noAds.title')`
- [x] Descripcion (como perks):
  - "✕ No banner ads"
  - "✕ No interstitial ads"
  - "✓ Rewarded ads still available"
  - "✓ Permanent"
- [ ] Precio: "$0.99" (muy grande, verde)
  > **Nota de implementación**: El precio normal se muestra como **$2.99** (price anchoring). El precio real de $0.99 solo aparece cuando hay flash sale activa, tachando el $2.99. Sin flash sale, el botón solo dice el texto de compra sin mostrar $0.99 explícitamente.
- [x] Boton: Buy button con shimmer animation (rojo sin sale, amarillo con sale)
- [ ] Si el usuario ha visto muchos ads (>20 interstitials):
  - Badge adicional: "You've seen X ads - time to remove them!"
  - Discount offer (opcional): "Limited time: $0.99 -> $0.49"
  > **Nota de implementación**: No implementado. No existe lógica de "ads seen" banner ni promotion dialog en ShopScreen. La config `REMOVE_ADS_CONFIG.promotions` existe pero no hay UI que la consuma. El action `MARK_PROMO_SHOWN` existe en el reducer pero no se despacha desde ninguna parte.

### Purchased State
- [x] Badge/banner: "Owned" banner verde — via `t('shop.noAds.owned')`
- [x] Boton: No se muestra (reemplazado por banner "Owned")
- [ ] Checkmark verde grande — no hay checkmark separado, se muestra texto de "Owned"
- [ ] Descripcion actualizada: "✓ Ads removed - Thank you!" — se muestra banner "Owned" sin descripción adicional

## Confirmation Dialog

> **Nota de implementación**: No hay confirmation dialog. `confirmPurchase()` llama directamente a `doPurchase()`, que invoca `purchaseProduct()` del IAPService sin diálogo previo. El OS muestra su propio diálogo de confirmación (Face ID / biometrics).

- [ ] Titulo: "Remove Ads"
- [ ] Lista de beneficios
- [ ] Precio: "$0.99" (destacado)
- [ ] Warning: "One-time purchase" (subtle)
- [ ] Botones: "Cancel" / "Purchase"

## Success Dialog

> **Nota de implementación**: No hay success dialog ni animación de confetti. Tras la compra exitosa, el reducer marca `removeAdsPurchased = true` y la UI se actualiza inmediatamente (el card muestra "Owned"). Un toast puede aparecer vía `showToast`, pero no hay diálogo dedicado.

- [ ] Icono: Checkmark grande verde con animacion
- [ ] Titulo: "Ads Removed!" (bold)
- [ ] Descripcion
- [ ] Boton: "Awesome!" (verde)
- [ ] Background: Confetti animation (sutil)

## Ad Free Badge (Post-Purchase)

> **Nota de implementación**: Implementado en `GameScreen.tsx`. El badge se muestra en el top bar con animación fade-in → 10s visible → fade-out, controlado por `REMOVE_ADS_CONFIG.badges.adFreeIndicatorDurationMs`. No tiene handler de toque (tooltip no implementado).

- [x] Ubicacion: Top bar, junto a coins/money
- [x] Icono: Checkmark — muestra "✓ Ad Free"
- [x] Texto: "Ad Free"
- [x] Color: Verde (usando estilos `adFreeBadge` / `adFreeBadgeText`)
- [x] Animacion: Fade in (300ms), visible 10s, fade out (400ms)
- [ ] Al tocar: Tooltip "Thanks for supporting the game!" — no implementado

## Promotion Dialog (After X Ads)

> **Nota de implementación**: No implementado. No existe componente de promotion dialog. La configuración (`REMOVE_ADS_CONFIG.promotions`) y el estado (`adState.lastPromotionShownAt`, action `MARK_PROMO_SHOWN`) existen en el código pero no hay UI que muestre el diálogo ni lógica que lo dispare. El archivo `src/utils/promotionTriggers.ts` referenciado en la spec de analytics no existe.

- [ ] Titulo: "You've seen X ads!"
- [ ] Descripcion
- [ ] Icono: Frustrated emoji o ad icon con X
- [ ] Botones: "Remove Ads Now" / "Maybe Later"
- [ ] Checkbox: "Don't show this again" (opcional)

## Settings Screen (Remove Ads Status)

> **Nota de implementación**: Implementado en `SettingsModal.tsx`. La sección "Ads & Purchases" existe. El estado comprado muestra "✓ Ad Free Mode: Active". El botón "Restore Purchases" (`🔄 Restore Purchases`) existe y llama a `restorePurchases()` del IAPService. Sin embargo, no hay link directo a la store cuando no está comprado — solo se muestra el status si ya fue comprado.

- [x] Seccion: "Ads & Purchases"
- [ ] Item:
  - Si NO comprado: "Remove Ads - $0.99" (link a store) — no implementado, la sección solo muestra status si está comprado
  - Si comprado: "Ad Free Mode: ✓ Active" (verde, checkmark) — implementado
- [x] Boton: "Restore Purchases" — implementado con toast de resultado

## Reference Component Implementation

> **Nota de implementación**: No existe `RemoveAdsCard.tsx` como componente separado. Toda la UI de Remove Ads está integrada en `ShopScreen.tsx` → función `renderNoAds()`. El diseño real usa cyberpunk theme (fondos oscuros, LinearGradient rojo/naranja, fuentes Orbitron) en lugar del diseño blanco/material mostrado abajo. El código de referencia abajo NO refleja la implementación actual.

```tsx
// src/components/RemoveAdsCard.tsx (full render)
export const RemoveAdsCard: React.FC = () => {
  const { gameState, dispatch } = useGame();
  const [isPurchasing, setIsPurchasing] = React.useState(false);
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
```

## Styles

> **Nota de implementación**: Los estilos reales están en `ShopScreen.tsx` con prefijo `na_` (ej: `na_hero`, `na_buyBtnOuter`, `na_priceNormal`). Usan el tema cyberpunk (`colors` y `fonts` de `theme.ts`), no los colores Material/blancos de abajo.

```typescript
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

## Edge Cases (UI-specific)

**Edge Case: Active step card pulse animates background instead of border (bug fixed)**
- Input: The active unlock-step card's `stepGlow` animation used an `Animated.View` overlay with `backgroundColor: rgba(255,214,0,0.15)` pulsing opacity, causing the entire card fill to blink yellow.
- Problem: The HTML spec defines `stepGlow` as a `box-shadow` animation (border glow only), but the React Native implementation incorrectly applied it as a background fill since RN has no `box-shadow` animation support.
- Fix: Changed the overlay from `backgroundColor` to `borderWidth: 1, borderColor: rgba(255,214,0,0.6)` so only the border pulses. The static background from `na_stepActive` (`rgba(255,214,0,0.06)`) remains constant.
