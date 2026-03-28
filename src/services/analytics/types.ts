// ── Analytics Event Types ──────────────────────────────────────────────────────
// Typed map of every analytics event name → payload shape.
// Add new events here — the compiler will enforce correct usage everywhere.

export interface AnalyticsEventMap {
  // ── Tier 1: Revenue ──────────────────────────────────────────────────────────
  iap_purchase_success: { productId: string; price: number; currency: string };
  iap_purchase_failed: { productId: string; errorMessage: string };
  iap_purchase_cancelled: { productId: string };
  remove_ads_purchased: { price: number };
  booster_2x_purchased: { price: number };
  booster_5x_purchased: { price: number };
  booster_permanent_purchased: { price: number };
  booster_offline_miner_purchased: { durationMs: number };
  booster_lucky_block_purchased: { blocks: number };
  booster_market_pump_purchased: { durationMs: number };
  starter_pack_purchased: { packType: 'small' | 'medium' | 'large' | 'mega'; cc: number; cash: number };
  flash_sale_triggered: { durationMs: number };

  // ── Tier 2: Funnel ───────────────────────────────────────────────────────────
  session_started: {};
  session_ended: { durationSec: number };
  game_loaded: { prestigeLevel: number; blocksMined: number };
  game_reset: {};
  hardware_purchased: { hardwareId: string; owned: number; cost: number; currency: 'cc' | 'money' };
  upgrade_purchased: { upgradeId: string; cost: number };
  coins_sold: { amount: number; price: number; moneyEarned: number };
  prestige_completed: { newLevel: number; blocksMined: number; runDurationSec: number };
  feature_unlocked: { feature: string };
  achievement_unlocked: { achievementId: string };
  halving_reached: { blocksMined: number; newReward: number };

  // ── Tier 3: Engagement ───────────────────────────────────────────────────────
  tab_viewed: { tabName: string };
  shop_opened: {};
  shop_tab_viewed: { tabName: string };
  rewarded_ad_watched: { bubbleType: string };
  ad_boost_activated: { boostType: string };
  booster_expired: { boosterType: string };
  offline_earnings_claimed: { amount: number; secondsAway: number };
  offline_earnings_dismissed: {};
  energy_source_built: { sourceId: string; quantity: number };
  energy_source_demolished: { sourceId: string };
  ai_level_purchased: { level: number };
  narrative_event_resolved: { threshold: number };

  // ── Tier 4: Errors ───────────────────────────────────────────────────────────
  error: { category: 'ad' | 'iap' | 'storage' | 'api'; message: string; context?: string };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

// ── Provider Interface ────────────────────────────────────────────────────────

export interface IAnalyticsProvider {
  initialize(): Promise<void>;
  logEvent<K extends AnalyticsEventName>(name: K, params: AnalyticsEventMap[K]): void;
  setUserProperties(properties: Record<string, string | number | boolean>): void;
}
