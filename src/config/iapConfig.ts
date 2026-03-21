/**
 * CONFIGURACIÓN DE IN-APP PURCHASES
 * Source of truth para product IDs, precios y rewards de IAP.
 */

export const IAP_PRODUCT_IDS = {
  REMOVE_ADS: 'com.blockchaintycoon.removeads',
  PERMANENT_MULTIPLIER: 'com.blockchaintycoon.permanent2x',
  BOOSTER_2X: 'com.blockchaintycoon.booster2x',
  BOOSTER_5X: 'com.blockchaintycoon.booster5x',
  STARTER_SMALL: 'com.blockchaintycoon.starter_small',
  STARTER_MEDIUM: 'com.blockchaintycoon.starter_medium',
  STARTER_LARGE: 'com.blockchaintycoon.starter_large',
  STARTER_MEGA: 'com.blockchaintycoon.starter_mega',
  OFFLINE_MINER: 'com.blockchaintycoon.offlineminer',
  LUCKY_BLOCK: 'com.blockchaintycoon.luckyblock',
  MARKET_PUMP: 'com.blockchaintycoon.marketpump',
} as const;

export const IAP_PRICES = {
  REMOVE_ADS: 0.99,
  PERMANENT_MULTIPLIER: 9.99,
  BOOSTER_2X: 0.99,
  BOOSTER_5X: 2.99,
  STARTER_SMALL: 0.99,
  STARTER_MEDIUM: 2.99,
  STARTER_LARGE: 4.99,
  STARTER_MEGA: 9.99,
  OFFLINE_MINER: 1.99,
  LUCKY_BLOCK: 0.99,
  MARKET_PUMP: 0.99,
} as const;

export const IAP_RECEIPT_VALIDATION = {
  clientSide: true,
  serverSide: false,
  serverEndpoint: null as string | null,
} as const;

export const ALL_PRODUCT_IDS = Object.values(IAP_PRODUCT_IDS);

export const REMOVE_ADS_CONFIG = {
  productId: IAP_PRODUCT_IDS.REMOVE_ADS,
  price: IAP_PRICES.REMOVE_ADS,
  currency: 'USD',
  promotions: {
    enabled: true,
    interstitialThreshold: 50,   // Show promo after X interstitials seen
    reminderThreshold: 25,       // Remind every X ads after first promo
    discountEnabled: false,
    discountPrice: 0.49,
  },
  badges: {
    popular: true,
    recommended: true,
    adFreeIndicator: true,
    adFreeIndicatorDurationMs: 10000,  // Show for 10 seconds after purchase
  },
} as const;
