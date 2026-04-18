/**
 * AI Observer Logic — Level 3 autonomous decision tree.
 * Pure functions: no side effects, no state mutations.
 */

import { GameState } from '../types/game';
import { AI_CONFIG } from '../config/balanceConfig';
import { getBasePrice } from './blockLogic';
import { getEnergySourceCurrentCost } from './energyLogic';
import { calculateHardwareCost } from './gameLogic';
import { aiExclusiveHardware } from '../data/hardwareData';

export type AIActionType =
  | { type: 'SELL_CC'; amount: number; pricePerCoin: number; message: string }
  | { type: 'BUY_ENERGY'; sourceId: string; cost: number; message: string }
  | { type: 'BUY_HARDWARE'; hardwareId: string; cost: number; message: string }
  | { type: 'CREATE_AI_HARDWARE'; hardwareId: string; message: string }
  | null;

const { OBSERVER_MODE } = AI_CONFIG;

/**
 * Priority-based decision tree for AI observer actions.
 * Returns the next action the AI should take, or null if nothing to do.
 */
export const getNextAIAction = (state: GameState): AIActionType => {
  // 1. Sell CC — if above threshold, sell 50% at current market price
  if (state.cryptoCoins > OBSERVER_MODE.SELL_CC_THRESHOLD) {
    const amount = Math.floor(state.cryptoCoins * OBSERVER_MODE.SELL_PERCENT);
    const pricePerCoin = getBasePrice(state.blocksMined);
    // Apply market events multiplier
    const eventMultiplier = (state.activeMarketEvents ?? [])
      .reduce((mult, e) => mult * e.multiplier, 1);
    const effectivePrice = pricePerCoin * (state.priceDeviation != null ? (1 + state.priceDeviation) : 1) * eventMultiplier;
    if (amount > 0) {
      const cashGain = amount * effectivePrice;
      return {
        type: 'SELL_CC',
        amount,
        pricePerCoin: effectivePrice,
        message: `AI sold ${formatNumber(amount)} CC for $${formatNumber(cashGain)}.`,
      };
    }
  }

  // 2. Buy energy — if there's an energy deficit, build most efficient non-renewable
  const energy = state.energy;
  if (energy && energy.totalRequiredMW > energy.totalGeneratedMW) {
    const nonRenewables = Object.values(energy.sources).filter(s => !s.isRenewable);
    // Sort by MW/$ efficiency (using actual scaled cost)
    const affordable = nonRenewables
      .map(s => ({ source: s, cost: getEnergySourceCurrentCost(s) }))
      .filter(({ cost }) => state.realMoney >= cost)
      .sort((a, b) => (b.source.mwPerUnit / b.cost) - (a.source.mwPerUnit / a.cost));

    if (affordable.length > 0) {
      const best = affordable[0];
      return {
        type: 'BUY_ENERGY',
        sourceId: best.source.id,
        cost: best.cost,
        message: `AI built 1 ${best.source.id.replace(/_/g, ' ')}. Energy +${best.source.mwPerUnit} MW.`,
      };
    }
  }

  // 3. Buy hardware — buy most expensive affordable normal hardware
  const normalHardware = state.hardware
    .filter(h => !h.aiExclusive)
    .map(h => ({ hw: h, cost: calculateHardwareCost(h) }))
    .filter(({ cost }) => state.realMoney >= cost)
    .sort((a, b) => b.cost - a.cost);

  if (normalHardware.length > 0) {
    const best = normalHardware[0];
    return {
      type: 'BUY_HARDWARE',
      hardwareId: best.hw.id,
      cost: best.cost,
      message: `AI purchased 1 ${best.hw.id.replace(/_/g, ' ')}. Unit #${best.hw.owned + 1}.`,
    };
  }

  // 4. Create AI-exclusive hardware — if nothing else affordable, invent new tier
  const ai = state.ai;
  const createdSet = new Set(ai?.aiHardwareCreated ?? []);
  for (const template of aiExclusiveHardware) {
    if (!createdSet.has(template.id)) {
      return {
        type: 'CREATE_AI_HARDWARE',
        hardwareId: template.id,
        message: `AI designed new hardware: ${template.id.replace(/_/g, ' ')}. Technology beyond human comprehension.`,
      };
    }
  }

  // 5. Buy AI-exclusive hardware — if AI hardware exists, buy more units
  const aiHardware = state.hardware
    .filter(h => h.aiExclusive)
    .map(h => ({ hw: h, cost: calculateHardwareCost(h) }))
    .filter(({ cost }) => state.realMoney >= cost)
    .sort((a, b) => b.cost - a.cost);

  if (aiHardware.length > 0) {
    const best = aiHardware[0];
    return {
      type: 'BUY_HARDWARE',
      hardwareId: best.hw.id,
      cost: best.cost,
      message: `AI expanded ${best.hw.id.replace(/_/g, ' ')} array. Unit #${best.hw.owned + 1}.`,
    };
  }

  return null;
};

/** Format large numbers for display in AI messages */
const formatNumber = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};
