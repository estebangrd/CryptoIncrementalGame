/**
 * AI Observer Logic — Level 3 autonomous decision tree.
 * Pure functions: no side effects, no state mutations.
 *
 * Each tick returns a LIST of actions (sell → buy energy → buy hardware)
 * so the AI performs multiple operations per cycle.
 */

import { GameState } from '../types/game';
import { AI_CONFIG } from '../config/balanceConfig';
import { getEnergySourceCurrentCost } from './energyLogic';
import { calculateHardwareCost } from './gameLogic';
import { aiExclusiveHardware } from '../data/hardwareData';

export type AIAction =
  | { type: 'SELL_CC'; amount: number; pricePerCoin: number; message: string }
  | { type: 'BUY_ENERGY'; sourceId: string; cost: number; message: string }
  | { type: 'BUY_HARDWARE'; hardwareId: string; cost: number; message: string }
  | { type: 'CREATE_AI_HARDWARE'; hardwareId: string; message: string };

const { OBSERVER_MODE } = AI_CONFIG;

/** Get the current CC market price from the cryptocurrency object */
const getCCMarketPrice = (state: GameState): number => {
  const cc = state.cryptocurrencies?.find(c => c.id === 'cryptocoin');
  return cc?.currentValue ?? 0.05;
};

/**
 * Returns ALL actions the AI should perform this tick (in order).
 * The reducer executes them sequentially, updating state between each.
 */
export const getAIActions = (state: GameState): AIAction[] => {
  const actions: AIAction[] = [];
  // Work with a mutable budget so subsequent actions see updated money/coins
  let availableMoney = state.realMoney;
  let availableCoins = state.cryptoCoins;

  // 1. Sell CC — if any meaningful amount exists, sell 50% at real market price
  if (availableCoins > OBSERVER_MODE.SELL_CC_THRESHOLD) {
    const amount = Math.floor(availableCoins * OBSERVER_MODE.SELL_PERCENT);
    const pricePerCoin = getCCMarketPrice(state);
    if (amount > 0 && pricePerCoin > 0) {
      const cashGain = amount * pricePerCoin;
      actions.push({
        type: 'SELL_CC',
        amount,
        pricePerCoin,
        message: `AI sold ${formatNumber(amount)} CC for $${formatNumber(cashGain)}.`,
      });
      availableCoins -= amount;
      availableMoney += cashGain;
    }
  }

  // 2. Buy energy — if there's an energy deficit, build most efficient non-renewable
  const energy = state.energy;
  if (energy && energy.totalRequiredMW > energy.totalGeneratedMW) {
    const nonRenewables = Object.values(energy.sources).filter(s => !s.isRenewable);
    const affordable = nonRenewables
      .map(s => ({ source: s, cost: getEnergySourceCurrentCost(s) }))
      .filter(({ cost }) => availableMoney >= cost)
      .sort((a, b) => (b.source.mwPerUnit / b.cost) - (a.source.mwPerUnit / a.cost));

    if (affordable.length > 0) {
      const best = affordable[0];
      actions.push({
        type: 'BUY_ENERGY',
        sourceId: best.source.id,
        cost: best.cost,
        message: `AI built 1 ${best.source.id.replace(/_/g, ' ')}. Energy +${best.source.mwPerUnit} MW.`,
      });
      availableMoney -= best.cost;
    }
  }

  // 3. Buy hardware — buy most expensive affordable hardware
  const normalHardware = state.hardware
    .filter(h => !h.aiExclusive)
    .map(h => ({ hw: h, cost: calculateHardwareCost(h) }))
    .filter(({ cost }) => availableMoney >= cost)
    .sort((a, b) => b.cost - a.cost);

  if (normalHardware.length > 0) {
    const best = normalHardware[0];
    actions.push({
      type: 'BUY_HARDWARE',
      hardwareId: best.hw.id,
      cost: best.cost,
      message: `AI purchased 1 ${best.hw.id.replace(/_/g, ' ')}. Unit #${best.hw.owned + 1}.`,
    });
    availableMoney -= best.cost;
  }

  // 4. Create AI-exclusive hardware — if none created yet, invent next tier
  const ai = state.ai;
  const createdSet = new Set(ai?.aiHardwareCreated ?? []);
  for (const template of aiExclusiveHardware) {
    if (!createdSet.has(template.id)) {
      actions.push({
        type: 'CREATE_AI_HARDWARE',
        hardwareId: template.id,
        message: `AI designed new hardware: ${template.id.replace(/_/g, ' ')}. Technology beyond human comprehension.`,
      });
      break; // only create one per tick
    }
  }

  // 5. Buy AI-exclusive hardware — if AI hardware exists, buy more units
  if (actions.length === 0 || availableMoney > 0) {
    const aiHw = state.hardware
      .filter(h => h.aiExclusive)
      .map(h => ({ hw: h, cost: calculateHardwareCost(h) }))
      .filter(({ cost }) => availableMoney >= cost)
      .sort((a, b) => b.cost - a.cost);

    if (aiHw.length > 0) {
      const best = aiHw[0];
      actions.push({
        type: 'BUY_HARDWARE',
        hardwareId: best.hw.id,
        cost: best.cost,
        message: `AI expanded ${best.hw.id.replace(/_/g, ' ')} array. Unit #${best.hw.owned + 1}.`,
      });
    }
  }

  return actions;
};

// ── Legacy single-action API (kept for tests) ──────────────────────────────

export type AIActionType = AIAction | null;

export const getNextAIAction = (state: GameState): AIActionType => {
  const actions = getAIActions(state);
  return actions.length > 0 ? actions[0] : null;
};

/** Format large numbers for display in AI messages */
const formatNumber = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};
