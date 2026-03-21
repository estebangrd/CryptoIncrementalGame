/**
 * Pure helper functions for flash sale state in the Remove Ads shop tab.
 *
 * Extracted from ShopScreen so they can be unit-tested independently and to
 * make it clear the roll decision depends only on a snapshot of state taken
 * at the moment the tab becomes active — NOT on reactive subscriptions to
 * flashSaleExpiresAt / flashSaleCooldownUntil.
 */

interface FlashSaleInput {
  flashSaleExpiresAt: number;
  removeAdsPurchased: boolean;
}

interface ShouldRollInput {
  removeAdsPurchased: boolean;
  flashSaleExpiresAt: number;
  flashSaleCooldownUntil: number;
  now: number;
}

/**
 * Derive whether a flash sale is currently active and should be displayed.
 * Returns true only when the player has NOT purchased Remove Ads, a sale has
 * been rolled (expiresAt > 0), and the expiry timestamp is still in the future.
 */
export function computeHasActiveSale(input: FlashSaleInput): boolean {
  const { flashSaleExpiresAt, removeAdsPurchased } = input;
  if (removeAdsPurchased) return false;
  if (flashSaleExpiresAt <= 0) return false;
  return Date.now() < flashSaleExpiresAt;
}

/**
 * Decide whether a new flash sale roll is eligible.
 * A roll is allowed only when:
 *  - Remove Ads has not been purchased
 *  - No sale is currently active (expiresAt is in the past or zero)
 *  - No cooldown is in effect (cooldownUntil is in the past or zero)
 *
 * NOTE: This function does NOT apply the 35% random chance — the caller is
 * responsible for that so the randomness stays testable separately.
 */
export function shouldRollFlashSale(input: ShouldRollInput): boolean {
  const { removeAdsPurchased, flashSaleExpiresAt, flashSaleCooldownUntil, now } = input;
  if (removeAdsPurchased) return false;
  const saleActive = flashSaleExpiresAt > 0 && now < flashSaleExpiresAt;
  if (saleActive) return false;
  const inCooldown = flashSaleCooldownUntil > 0 && now < flashSaleCooldownUntil;
  if (inCooldown) return false;
  return true;
}
