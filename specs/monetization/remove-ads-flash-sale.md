# Remove Ads — Flash Sale System

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: Implemented
- **Prioridad**: High
- **Ultima actualizacion**: 2026-03-21
- **Split from**: Original `remove-ads-product.md` (reorganized into 5 focused specs)

## Related Specs
- [Core Product](remove-ads-core.md) — Product definition, pricing, business rules, state
- [Purchase Flow](remove-ads-purchase-flow.md) — Confirmation, success, error handling, restore
- [UI/UX](remove-ads-ui.md) — Card design, badges, settings screen
- [Analytics](remove-ads-analytics.md) — Events, conversion tracking, promotions

---

## Overview

The flash sale is a time-limited discount on the Remove Ads product that creates urgency and improves conversion. It is probabilistic (35% chance) and triggers only on specific user actions.

## Implementation Files

- **Config**: `src/config/balanceConfig.ts` — `FLASH_SALE_CONFIG` (all timing/probability constants)
- **Logic**: `src/utils/flashSaleLogic.ts` — `computeHasActiveSale()`, `shouldRollFlashSale()`
- **Tests**: `__tests__/flashSale.test.ts` — Full unit-test coverage
- **UI**: `src/components/ShopScreen.tsx` — Flash sale banner and timer in the `removeAds` tab
- **State**: `GameContext.tsx` — Action `SET_FLASH_SALE`

## Flash Sale Rules

### Roll Trigger
- The flash sale roll fires **ONLY** when the user switches to the `removeAds` tab in the Shop
- It does NOT re-roll on state changes, re-renders, or other tab switches

### Roll Conditions (ALL must be true)
1. Remove Ads is **not** already purchased (`removeAdsPurchased === false`)
2. There is **no** active flash sale (`flashSaleExpiresAt` is 0 or in the past)
3. There is **no** active cooldown (`flashSaleCooldownUntil` is 0 or in the past)

### Probability
- **35%** chance per eligible roll (`Math.random() < FLASH_SALE_CONFIG.ROLL_CHANCE`)
- If the roll **fails**, a **4-hour cooldown** is set (`FLASH_SALE_CONFIG.COOLDOWN_AFTER_FAIL_MS`) to prevent tab spamming

### Duration
- Random duration between **8 and 14 minutes** (`FLASH_SALE_CONFIG.MIN_DURATION_MS` to `MAX_DURATION_MS`)
- `flashSaleExpiresAt = Date.now() + randomDuration`

### Timer UI
- Displays as `MM:SS` countdown
- Turns **red** when < 60 seconds remaining
- Has a **pulse animation** when < 60 seconds remaining
- Promo banner is hidden when no active sale

### On Expiry
- After the sale timer expires, a **24-hour cooldown** is set (`FLASH_SALE_CONFIG.COOLDOWN_AFTER_SALE_MS`)
- `flashSaleCooldownUntil = Date.now() + COOLDOWN_AFTER_SALE_MS`
- No new roll can fire until the cooldown passes
- The cooldown persists across app restarts (saved in state / AsyncStorage)

### On Failed Roll
- A **4-hour cooldown** is set (`FLASH_SALE_CONFIG.COOLDOWN_AFTER_FAIL_MS`)
- Prevents the user from spamming the tab to force a sale activation
- The cooldown persists across app restarts

## State Structure

```typescript
// In iapState (within GameState)
{
  flashSaleExpiresAt: number;        // Unix timestamp when sale ends (0 = no sale)
  flashSaleCooldownUntil: number;    // Unix timestamp when cooldown ends (0 = no cooldown)
}
```

### GameContext Action

> **Nota de implementacion**: El payload real usa claves abreviadas: `{ expiresAt: number; cooldownUntil: number }` (no `flashSaleExpiresAt`/`flashSaleCooldownUntil`). El reducer mapea `action.payload.expiresAt` a `state.iapState.flashSaleExpiresAt`.

```typescript
case 'SET_FLASH_SALE':
  return {
    ...state,
    iapState: {
      ...state.iapState,
      flashSaleExpiresAt: action.payload.expiresAt,
      flashSaleCooldownUntil: action.payload.cooldownUntil,
    },
  };
```

## Logic Functions

### `computeHasActiveSale(input: FlashSaleInput)`
Returns `true` if `flashSaleExpiresAt > now`. Used to determine whether to show the sale banner and timer.

> **Nota de implementacion**: La firma real es `computeHasActiveSale(input: FlashSaleInput)` donde `FlashSaleInput = { flashSaleExpiresAt: number; removeAdsPurchased: boolean }`. NO acepta un parametro `now` — usa `Date.now()` internamente. Tampoco recibe el `iapState` completo, solo los dos campos necesarios.

### `shouldRollFlashSale(input: ShouldRollInput)`
Returns `true` if all roll conditions are met:
- `removeAdsPurchased === false`
- `flashSaleExpiresAt <= now` (no active sale)
- `flashSaleCooldownUntil <= now` (no active cooldown)

This function does NOT perform the random roll — it only checks eligibility. The caller performs `Math.random() < 0.35`.

> **Nota de implementacion**: La firma real es `shouldRollFlashSale(input: ShouldRollInput)` donde `ShouldRollInput = { removeAdsPurchased: boolean; flashSaleExpiresAt: number; flashSaleCooldownUntil: number; now: number }`. El parametro `now` es obligatorio dentro del objeto input (no opcional ni separado). El caller en `ShopScreen.tsx` pasa `now: Date.now()` explicitamente.

## Implementation Detail: Preventing Re-rolls (Bug Fix)

**Problem**: The original roll `useEffect` in `ShopScreen` included `flashSaleExpiresAt` and `flashSaleCooldownUntil` in its dependency array. Whenever those values changed (e.g., after `LOAD_GAME` dispatched the persisted state, or after a sale expired and set `cooldownUntil`), the effect re-ran while `activeTab === 'removeAds'` was still true. If the snapshot seen by the re-run had no active sale and no cooldown, another 35% roll fired — effectively making the flash-sale banner appear on nearly every session start regardless of the intended probability.

**Fix**: The roll effect now depends **only** on `activeTab`. Current `iapState` values are read via a `useRef` snapshot inside the effect, so changes to `flashSaleExpiresAt` / `flashSaleCooldownUntil` never re-trigger the roll.

```typescript
// In ShopScreen.tsx (simplified)
const iapStateRef = useRef(gameState.iapState);
iapStateRef.current = gameState.iapState;

useEffect(() => {
  if (activeTab !== 'removeAds') return;
  const now = Date.now();
  const snap = iapStateRef.current;
  if (!shouldRollFlashSale({
    removeAdsPurchased: snap.removeAdsPurchased,
    flashSaleExpiresAt: snap.flashSaleExpiresAt,
    flashSaleCooldownUntil: snap.flashSaleCooldownUntil,
    now,
  })) return;

  if (Math.random() < FLASH_SALE_CONFIG.ROLL_CHANCE) {
    const range = FLASH_SALE_CONFIG.MAX_DURATION_MS - FLASH_SALE_CONFIG.MIN_DURATION_MS;
    const duration = FLASH_SALE_CONFIG.MIN_DURATION_MS + Math.floor(Math.random() * (range + 1));
    dispatch({ type: 'SET_FLASH_SALE', payload: { expiresAt: now + duration, cooldownUntil: 0 } });
  } else {
    // Failed roll → 4h cooldown to prevent tab spamming
    dispatch({ type: 'SET_FLASH_SALE', payload: { expiresAt: 0, cooldownUntil: now + FLASH_SALE_CONFIG.COOLDOWN_AFTER_FAIL_MS } });
  }
}, [activeTab]);
```

## Flash Sale UI

- **Promo banner**: Shown only when `computeHasActiveSale()` is true
- **Timer**: Countdown in `MM:SS` format, updated every second
- **Red state**: Timer text and border turn red when < 60s
- **Pulse animation**: Border pulses when < 60s (border-only, not background fill — see style-reference.md)
- **Price display**: Shows original price struck through + flash sale price with `textShadow` glow effect
- **Hidden when no sale**: The entire promo banner is conditionally rendered — no empty space

## Edge Cases

**Flash sale roll fires on app start**: If the user's last active tab was `removeAds` and the app reloads, the `useEffect` for `activeTab` will fire. This is correct behavior — it counts as "switching to the tab."

**Sale expires while user is on the tab**: The timer reaches 0, the banner hides, and the 24h cooldown begins. No re-roll fires because the effect only runs on `activeTab` changes (not on state changes).

**User purchases during flash sale**: The sale state is irrelevant after purchase since `removeAdsPurchased = true` prevents any future sale rolls.

**Cooldown spans midnight / clock changes**: Cooldown is based on Unix timestamps, so timezone changes do not affect it. Clock manipulation could bypass it, but this is acceptable for a $0.99 product.

## Testing

Tests in `__tests__/flashSale.test.ts`:

```typescript
describe('Flash Sale Logic', () => {
  describe('computeHasActiveSale', () => {
    it('returns true when flashSaleExpiresAt is in the future');
    it('returns false when flashSaleExpiresAt is in the past');
    it('returns false when flashSaleExpiresAt is 0');
  });

  describe('shouldRollFlashSale', () => {
    it('returns true when no sale, no cooldown, not purchased');
    it('returns false when removeAdsPurchased is true');
    it('returns false when sale is active');
    it('returns false when cooldown is active');
  });
});
```
