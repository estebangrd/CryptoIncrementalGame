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
} as const;

export const IAP_RECEIPT_VALIDATION = {
  clientSide: true,
  serverSide: false,
  serverEndpoint: null as string | null,
} as const;

export const ALL_PRODUCT_IDS = Object.values(IAP_PRODUCT_IDS);
