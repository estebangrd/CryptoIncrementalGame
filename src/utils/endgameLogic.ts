/**
 * endgameLogic.ts — Pure functions for the Endgame system (Phase 7).
 * Based on spec: specs/game-mechanics/endgame-collapse.md
 */

import { GameState, EndgameStats, EndingType } from '../types/game';
import { ENDGAME_CONFIG } from '../config/balanceConfig';

export interface EndingBonus {
  productionMultiplier: number;
  renewableDiscount: number;
}

/**
 * Calculates the prestige bonus multipliers for a given ending type.
 *
 * Both bonuses accumulate independently. A player who alternates strategies
 * accumulates both types of bonus.
 */
export const calculateEndingBonus = (
  endingType: EndingType,
  collapseCount: number,
  goodEndingCount: number,
): EndingBonus => {
  if (endingType === 'collapse') {
    return {
      productionMultiplier: 1 + (ENDGAME_CONFIG.COLLAPSE_PRODUCTION_BONUS_PER_PRESTIGE * collapseCount),
      renewableDiscount: 0,
    };
  }
  if (endingType === 'good_ending') {
    return {
      productionMultiplier: 1 + (ENDGAME_CONFIG.GOOD_ENDING_PRODUCTION_BONUS_PER_PRESTIGE * goodEndingCount),
      renewableDiscount: Math.min(
        ENDGAME_CONFIG.GOOD_ENDING_RENEWABLE_DISCOUNT_CAP,
        ENDGAME_CONFIG.GOOD_ENDING_RENEWABLE_DISCOUNT_PER_RUN * goodEndingCount,
      ),
    };
  }
  return { productionMultiplier: 1, renewableDiscount: 0 };
};

/**
 * Returns the combined production multiplier from all endgame bonuses.
 * Both collapse and good-ending bonuses multiply together.
 */
export const calculateTotalEndgameProductionMultiplier = (
  collapseCount: number,
  goodEndingCount: number,
): number => {
  const collapseBonus = 1 + (ENDGAME_CONFIG.COLLAPSE_PRODUCTION_BONUS_PER_PRESTIGE * collapseCount);
  const goodEndingBonus = 1 + (ENDGAME_CONFIG.GOOD_ENDING_PRODUCTION_BONUS_PER_PRESTIGE * goodEndingCount);
  return collapseBonus * goodEndingBonus;
};

/**
 * Returns the accumulated renewable energy discount (0–0.80) from good endings.
 */
export const calculateRenewableDiscount = (goodEndingCount: number): number => {
  return Math.min(
    ENDGAME_CONFIG.GOOD_ENDING_RENEWABLE_DISCOUNT_CAP,
    ENDGAME_CONFIG.GOOD_ENDING_RENEWABLE_DISCOUNT_PER_RUN * goodEndingCount,
  );
};

/**
 * Captures end-of-run statistics at the moment an ending is triggered.
 */
export const buildEndgameStats = (
  state: GameState,
  endingType: EndingType,
): EndgameStats => {
  const runDurationMs = Date.now() - (state.currentRunStartTime ?? Date.now());
  return {
    blocksMined: state.blocksMined,
    totalCryptoCoinsEarned: state.totalCryptoCoins,
    totalMoneyEarned: state.totalRealMoneyEarned,
    planetResourcesAtEnd: state.planetResources ?? 100,
    aiLevelReached: state.ai?.level ?? 0,
    runDurationMs,
    endingType,
  };
};
