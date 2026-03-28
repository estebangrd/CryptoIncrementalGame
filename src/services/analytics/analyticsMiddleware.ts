import { GameState } from '../../types/game';
import { GameAction } from '../../contexts/GameContext';
import { logEvent } from './index';

/**
 * Analytics middleware — compares prevState/nextState after each reducer action
 * and fires the appropriate analytics events.
 *
 * Deliberately excluded (too frequent/noisy):
 *   ADD_PRODUCTION, UPDATE_MARKET, UPDATE_MARKET_STATE, MINE_BLOCK,
 *   CHECK_*_EXPIRATION, SELECT_CURRENCY, ADD_AI_LOG, ADVANCE_PRICE_INDEX,
 *   UPDATE_CRYPTO_PRICES, UPDATE_CRYPTOCURRENCY_PRICES, SET_IAP_PURCHASING,
 *   SET_HYDRATED, SET_LANGUAGE, UPDATE_OFFLINE_PROGRESS,
 *   CHECK_ACHIEVEMENTS, CHECK_AD_BOOST_EXPIRATION, CHECK_AD_BUBBLE_EXPIRATIONS,
 *   CHECK_BOOSTER_EXPIRATION, CHECK_MARKET_PUMP_EXPIRATION, CHECK_REGULATORY_STATUS
 */
export const trackAction = (
  prevState: GameState,
  action: GameAction,
  nextState: GameState,
): void => {
  // Skip if state didn't change (reducer returned same reference)
  if (prevState === nextState) return;

  // ── Action-specific events ─────────────────────────────────────────────────
  switch (action.type) {
    case 'BUY_HARDWARE':
      logEvent('hardware_purchased', {
        hardwareId: action.payload,
        owned: nextState.hardware.find(h => h.id === action.payload)?.owned ?? 0,
        cost: 0, // cost already deducted, not easily recovered
        currency: 'cc',
      });
      break;

    case 'BUY_HARDWARE_WITH_MONEY':
      logEvent('hardware_purchased', {
        hardwareId: action.payload,
        owned: nextState.hardware.find(h => h.id === action.payload)?.owned ?? 0,
        cost: 0,
        currency: 'money',
      });
      break;

    case 'BUY_UPGRADE':
      logEvent('upgrade_purchased', {
        upgradeId: action.payload,
        cost: prevState.realMoney - nextState.realMoney,
      });
      break;

    case 'SELL_COINS_FOR_MONEY': {
      const moneyEarned = nextState.totalRealMoneyEarned - prevState.totalRealMoneyEarned;
      logEvent('coins_sold', {
        amount: action.payload.amount,
        price: action.payload.price,
        moneyEarned,
      });
      break;
    }

    case 'DO_PRESTIGE': {
      const runDuration = prevState.currentRunStartTime
        ? (Date.now() - prevState.currentRunStartTime) / 1000
        : 0;
      logEvent('prestige_completed', {
        newLevel: nextState.prestigeLevel,
        blocksMined: prevState.blocksMined,
        runDurationSec: Math.round(runDuration),
      });
      break;
    }

    case 'LOAD_GAME':
      logEvent('game_loaded', {
        prestigeLevel: nextState.prestigeLevel,
        blocksMined: nextState.blocksMined,
      });
      break;

    case 'RESET_GAME':
      logEvent('game_reset', {});
      break;

    // ── IAP purchases ──────────────────────────────────────────────────────────
    case 'PURCHASE_REMOVE_ADS':
      logEvent('remove_ads_purchased', { price: action.payload.price });
      logEvent('iap_purchase_success', {
        productId: action.payload.productId,
        price: action.payload.price,
        currency: action.payload.currency,
      });
      break;

    case 'PURCHASE_BOOSTER_2X':
      logEvent('booster_2x_purchased', { price: action.payload.price });
      logEvent('iap_purchase_success', {
        productId: action.payload.productId,
        price: action.payload.price,
        currency: action.payload.currency,
      });
      break;

    case 'PURCHASE_BOOSTER_5X':
      logEvent('booster_5x_purchased', { price: action.payload.price });
      logEvent('iap_purchase_success', {
        productId: action.payload.productId,
        price: action.payload.price,
        currency: action.payload.currency,
      });
      break;

    case 'PURCHASE_PERMANENT_MULTIPLIER':
      logEvent('booster_permanent_purchased', { price: action.payload.price });
      logEvent('iap_purchase_success', {
        productId: action.payload.productId,
        price: action.payload.price,
        currency: action.payload.currency,
      });
      break;

    case 'PURCHASE_STARTER_PACK':
      logEvent('starter_pack_purchased', {
        packType: action.payload.packType,
        cc: nextState.iapState.packCurrentCC || 0,
        cash: nextState.iapState.packCurrentCash || 0,
      });
      logEvent('iap_purchase_success', {
        productId: action.payload.record.productId,
        price: action.payload.record.price,
        currency: action.payload.record.currency,
      });
      break;

    case 'PURCHASE_OFFLINE_MINER':
      logEvent('booster_offline_miner_purchased', { durationMs: action.payload.durationMs });
      logEvent('iap_purchase_success', {
        productId: action.payload.record.productId,
        price: action.payload.record.price,
        currency: action.payload.record.currency,
      });
      break;

    case 'PURCHASE_LUCKY_BLOCK':
      logEvent('booster_lucky_block_purchased', { blocks: action.payload.blocks });
      logEvent('iap_purchase_success', {
        productId: action.payload.record.productId,
        price: action.payload.record.price,
        currency: action.payload.record.currency,
      });
      break;

    case 'PURCHASE_MARKET_PUMP':
      logEvent('booster_market_pump_purchased', { durationMs: action.payload.durationMs });
      logEvent('iap_purchase_success', {
        productId: action.payload.record.productId,
        price: action.payload.record.price,
        currency: action.payload.record.currency,
      });
      break;

    case 'SET_FLASH_SALE':
      if (action.payload.expiresAt > 0) {
        logEvent('flash_sale_triggered', {
          durationMs: action.payload.expiresAt - Date.now(),
        });
      }
      break;

    // ── Booster expirations ────────────────────────────────────────────────────
    case 'EXPIRE_BOOSTER_2X':
      logEvent('booster_expired', { boosterType: '2x' });
      break;

    case 'EXPIRE_BOOSTER_5X':
      logEvent('booster_expired', { boosterType: '5x' });
      break;

    case 'EXPIRE_MARKET_PUMP':
      logEvent('booster_expired', { boosterType: 'market_pump' });
      break;

    case 'EXPIRE_AD_BOOST':
      logEvent('booster_expired', { boosterType: 'ad_boost' });
      break;

    case 'EXPIRE_AD_HASH_BOOST':
      logEvent('booster_expired', { boosterType: 'ad_hash_boost' });
      break;

    case 'EXPIRE_AD_MARKET_BOOST':
      logEvent('booster_expired', { boosterType: 'ad_market_boost' });
      break;

    // ── Ad bubble activations ──────────────────────────────────────────────────
    case 'ACTIVATE_AD_BOOST':
      logEvent('ad_boost_activated', { boostType: 'production' });
      break;

    case 'ACTIVATE_AD_HASH_BOOST':
      logEvent('ad_boost_activated', { boostType: 'hash' });
      break;

    case 'ACTIVATE_AD_MARKET_BOOST':
      logEvent('ad_boost_activated', { boostType: 'market' });
      break;

    case 'AD_ENERGY_RESTORE':
      logEvent('ad_boost_activated', { boostType: 'energy' });
      break;

    // ── Energy ─────────────────────────────────────────────────────────────────
    case 'BUILD_ENERGY_SOURCE':
      logEvent('energy_source_built', {
        sourceId: action.payload,
        quantity: nextState.energy?.sources[action.payload]?.quantity ?? 0,
      });
      break;

    case 'DEMOLISH_ENERGY_SOURCE':
      logEvent('energy_source_demolished', { sourceId: action.payload });
      break;

    // ── AI ──────────────────────────────────────────────────────────────────────
    case 'PURCHASE_AI_LEVEL':
      logEvent('ai_level_purchased', { level: action.payload.level });
      break;

    // ── Narrative ──────────────────────────────────────────────────────────────
    case 'DISMISS_NARRATIVE_EVENT':
      logEvent('narrative_event_resolved', { threshold: action.payload });
      break;

    // ── Offline earnings ───────────────────────────────────────────────────────
    case 'CLAIM_OFFLINE_EARNINGS':
      logEvent('offline_earnings_claimed', {
        amount: action.payload.amount,
        secondsAway: prevState.offlineSecondsAway,
      });
      break;

    case 'DISMISS_OFFLINE_EARNINGS':
      logEvent('offline_earnings_dismissed', {});
      break;

    // ── Prestige via ending ────────────────────────────────────────────────────
    case 'COMPLETE_ENDING_PRESTIGE': {
      const endRunDuration = prevState.currentRunStartTime
        ? (Date.now() - prevState.currentRunStartTime) / 1000
        : 0;
      logEvent('prestige_completed', {
        newLevel: nextState.prestigeLevel,
        blocksMined: prevState.blocksMined,
        runDurationSec: Math.round(endRunDuration),
      });
      break;
    }

    default:
      break;
  }

  // ── Cross-cutting diffs (run after every action) ───────────────────────────

  // Feature unlocks
  if (prevState.unlockedTabs && nextState.unlockedTabs) {
    const tabKeys = Object.keys(nextState.unlockedTabs) as Array<keyof typeof nextState.unlockedTabs>;
    for (const tab of tabKeys) {
      if (!prevState.unlockedTabs[tab] && nextState.unlockedTabs[tab]) {
        logEvent('feature_unlocked', { feature: tab });
      }
    }
  }

  // Halving
  if (prevState.nextHalving !== nextState.nextHalving && nextState.blocksMined > prevState.blocksMined) {
    logEvent('halving_reached', {
      blocksMined: nextState.blocksMined,
      newReward: nextState.currentReward,
    });
  }

  // Achievement unlocks
  if (nextState.achievements && prevState.achievements) {
    for (let i = 0; i < nextState.achievements.length; i++) {
      const prev = prevState.achievements[i];
      const next = nextState.achievements[i];
      if (next?.unlocked && !prev?.unlocked) {
        logEvent('achievement_unlocked', { achievementId: next.id });
      }
    }
  }
};
