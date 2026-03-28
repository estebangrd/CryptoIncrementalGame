/**
 * Pure-function logic for the BoosterNotch component.
 * Computes the list of active boosters and the total production multiplier.
 */

import { BOOSTER_CONFIG, AD_BUBBLE_CONFIG } from '../config/balanceConfig';
import { IAPState, AdBoostState, AdHashBoostState, AdMarketBoostState } from '../types/game';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActiveBooster {
  id: string;
  multiplier: number;
  icon: string;
  label: string;
  color: string;
  isPermanent?: boolean;
  /** For time-based boosters: when it expires (unix ms) */
  expiresAt?: number;
  /** For time-based boosters: total duration from activation (ms) */
  totalDurationMs?: number;
  /** For block-based boosters: blocks remaining */
  blocksRemaining?: number;
  /** If true, this booster does NOT affect the production multiplier (e.g. marketPump, luckyBlock) */
  isNonProduction?: boolean;
}

// ─── getActiveBoostersList ──────────────────────────────────────────────────

export function getActiveBoostersList(
  iapState: Pick<
    IAPState,
    'booster2x' | 'booster5x' | 'permanentMultiplierPurchased' |
    'offlineMiner' | 'luckyBlock' | 'marketPump'
  >,
  adBoost: AdBoostState,
  now: number,
  adHashBoost?: AdHashBoostState,
  adMarketBoost?: AdMarketBoostState,
): ActiveBooster[] {
  const list: ActiveBooster[] = [];

  // 1. Permanent 2x
  if (iapState.permanentMultiplierPurchased) {
    list.push({
      id: 'permanent',
      multiplier: BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier,
      isPermanent: true,
      icon: '♾',
      label: 'Permanent 2x',
      color: '#a040ff',
    });
  }

  // 2. 5x Booster
  if (
    iapState.booster5x.isActive &&
    iapState.booster5x.expiresAt !== null &&
    now < iapState.booster5x.expiresAt
  ) {
    list.push({
      id: 'booster5x',
      multiplier: BOOSTER_CONFIG.BOOSTER_5X.multiplier,
      isPermanent: false,
      expiresAt: iapState.booster5x.expiresAt,
      totalDurationMs: BOOSTER_CONFIG.BOOSTER_5X.durationMs,
      icon: '🚀',
      label: '5x Booster',
      color: '#ff6b1a',
    });
  }

  // 3. 2x Booster
  if (
    iapState.booster2x.isActive &&
    iapState.booster2x.expiresAt !== null &&
    now < iapState.booster2x.expiresAt
  ) {
    list.push({
      id: 'booster2x',
      multiplier: BOOSTER_CONFIG.BOOSTER_2X.multiplier,
      isPermanent: false,
      expiresAt: iapState.booster2x.expiresAt,
      totalDurationMs: BOOSTER_CONFIG.BOOSTER_2X.durationMs,
      icon: '⚡',
      label: '2x Booster',
      color: '#ffd600',
    });
  }

  // 4. Ad Boost
  if (
    adBoost.isActive &&
    adBoost.expiresAt !== null &&
    now < adBoost.expiresAt
  ) {
    list.push({
      id: 'adBoost',
      multiplier: BOOSTER_CONFIG.REWARDED_AD_BOOST.multiplier,
      isPermanent: false,
      expiresAt: adBoost.expiresAt,
      totalDurationMs: BOOSTER_CONFIG.REWARDED_AD_BOOST.durationMs,
      icon: '📺',
      label: 'Ad 2x',
      color: '#ffd600',
    });
  }

  // 4b. Ad Hash Rate Boost
  if (
    adHashBoost?.isActive &&
    adHashBoost.expiresAt !== null &&
    now < adHashBoost.expiresAt
  ) {
    list.push({
      id: 'adHashBoost',
      multiplier: AD_BUBBLE_CONFIG.HASH_BOOST.multiplier,
      isPermanent: false,
      expiresAt: adHashBoost.expiresAt,
      totalDurationMs: AD_BUBBLE_CONFIG.HASH_BOOST.durationMs,
      icon: '🖥',
      label: 'Hash +20%',
      color: '#00e5ff',
    });
  }

  // 4c. Ad Market Boost
  if (
    adMarketBoost?.isActive &&
    adMarketBoost.expiresAt !== null &&
    now < adMarketBoost.expiresAt
  ) {
    list.push({
      id: 'adMarketBoost',
      multiplier: AD_BUBBLE_CONFIG.MARKET_BOOST.multiplier,
      isPermanent: false,
      expiresAt: adMarketBoost.expiresAt,
      totalDurationMs: AD_BUBBLE_CONFIG.MARKET_BOOST.durationMs,
      icon: '📈',
      label: 'Market +25%',
      color: '#00ff88',
      isNonProduction: true,
    });
  }

  // 5. Lucky Block
  if (iapState.luckyBlock.isActive && iapState.luckyBlock.blocksRemaining > 0) {
    list.push({
      id: 'luckyBlock',
      multiplier: BOOSTER_CONFIG.LUCKY_BLOCK.rewardMultiplier,
      isPermanent: false,
      blocksRemaining: iapState.luckyBlock.blocksRemaining,
      icon: '🎲',
      label: 'Lucky Block',
      color: '#00ff88',
      isNonProduction: true,
    });
  }

  // 6. Market Pump
  if (
    iapState.marketPump.isActive &&
    iapState.marketPump.expiresAt !== null &&
    now < iapState.marketPump.expiresAt
  ) {
    list.push({
      id: 'marketPump',
      multiplier: BOOSTER_CONFIG.MARKET_PUMP.priceMultiplier,
      isPermanent: false,
      expiresAt: iapState.marketPump.expiresAt,
      totalDurationMs: BOOSTER_CONFIG.MARKET_PUMP.baseDurationMs,
      icon: '📈',
      label: 'Market Pump',
      color: '#ff3d5a',
      isNonProduction: true,
    });
  }

  // 7. Offline Miner
  if (
    iapState.offlineMiner.isActive &&
    iapState.offlineMiner.expiresAt !== null &&
    now < iapState.offlineMiner.expiresAt
  ) {
    list.push({
      id: 'offlineMiner',
      multiplier: 1,
      isPermanent: false,
      expiresAt: iapState.offlineMiner.expiresAt,
      totalDurationMs: BOOSTER_CONFIG.OFFLINE_MINER.baseDurationMs,
      icon: '🌙',
      label: 'Offline Miner',
      color: '#00e5ff',
      isNonProduction: true,
    });
  }

  return list;
}

// ─── getTotalProductionMultiplier ───────────────────────────────────────────

export function getTotalProductionMultiplier(boosters: ActiveBooster[]): number {
  let total = 1;
  for (const b of boosters) {
    if (!b.isNonProduction) {
      total *= b.multiplier;
    }
  }
  return total;
}
