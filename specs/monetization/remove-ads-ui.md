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

### Not Purchased State
- [ ] Posicion: Top de la tienda (primera opcion)
- [ ] Badge: "Popular" o "Recommended" (destacado)
- [ ] Icono: Grande, ad blocker symbol
- [ ] Titulo: "Remove Ads" (bold, grande)
- [ ] Descripcion:
  - "Remove annoying banner and interstitial ads"
  - "Keep rewarded ads for free boosts"
  - "One-time purchase, permanent benefit"
- [ ] Precio: "$0.99" (muy grande, verde)
- [ ] Boton: "Buy Now" (verde brillante, call-to-action)
- [ ] Si el usuario ha visto muchos ads (>20 interstitials):
  - Badge adicional: "You've seen X ads - time to remove them!"
  - Discount offer (opcional): "Limited time: $0.99 -> $0.49"

### Purchased State
- [ ] Badge: "Purchased" (verde)
- [ ] Boton: "Purchased" (gris, deshabilitado)
- [ ] Checkmark verde grande
- [ ] Descripcion actualizada: "✓ Ads removed - Thank you!"

## Confirmation Dialog
- [ ] Titulo: "Remove Ads"
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

## Success Dialog
- [ ] Icono: Checkmark grande verde con animacion
- [ ] Titulo: "Ads Removed!" (bold)
- [ ] Descripcion:
  - "Banner and interstitial ads are now removed"
  - "Enjoy ad-free gameplay!"
- [ ] Note: "Rewarded ads are still available for free boosts" (subtle)
- [ ] Boton: "Awesome!" (verde)
- [ ] Background: Confetti animation (sutil)

## Ad Free Badge (Post-Purchase)
- [ ] Ubicacion: Top bar, junto a coins/money
- [ ] Icono: Checkmark o shield
- [ ] Texto: "Ad Free"
- [ ] Color: Dorado/verde
- [ ] Animacion: Fade in, visible 10s, fade out
- [ ] Al tocar: Tooltip "Thanks for supporting the game!"

## Promotion Dialog (After X Ads)
- [ ] Titulo: "You've seen X ads!"
- [ ] Descripcion:
  - "Remove all ads for just $0.99"
  - "Support the game and enjoy ad-free experience"
- [ ] Icono: Frustrated emoji o ad icon con X
- [ ] Botones:
  - "Remove Ads Now" (verde, large)
  - "Maybe Later" (gris, small)
- [ ] Checkbox: "Don't show this again" (opcional)

## Settings Screen (Remove Ads Status)
- [ ] Seccion: "Ads & Purchases"
- [ ] Item:
  - Si NO comprado: "Remove Ads - $0.99" (link a store)
  - Si comprado: "Ad Free Mode: ✓ Active" (verde, checkmark)
- [ ] Boton: "Restore Purchases"

## Reference Component Implementation

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
