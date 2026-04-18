/**
 * AI System logic — Phase 5.
 * All functions are pure (no side effects).
 */

import { GameState, AIState, AILevel, AILogEntry, EnergySource } from '../types/game';
import { AI_CONFIG } from '../config/balanceConfig';

export const getInitialAIState = (): AIState => ({
  level: 0,
  isAutonomous: false,
  logEntries: [],
  lastSuggestionAt: 0,
  capRemovalLogged: false,
  renewablesSatLogged: false,
  lastActionAt: 0,
  aiHardwareCreated: [],
});

export const getAIProductionMultiplier = (level: AILevel): number => {
  if (level === 0) return 1.0;
  return AI_CONFIG.LEVELS[level as 1 | 2 | 3].productionMultiplier;
};

export const isAIUnlocked = (state: GameState): boolean => {
  return (state.hardware.find(h => h.id === 'quantum_miner')?.owned ?? 0) >= 1;
};

export const canPurchaseAILevel = (state: GameState, level: 1 | 2 | 3): boolean => {
  const config = AI_CONFIG.LEVELS[level];
  if (state.realMoney < config.cost) return false;
  if (level === 1) return state.ai.level === 0 && isAIUnlocked(state);
  return state.ai.level === (level - 1 as AILevel);
};

export const addAILogEntry = (
  aiState: AIState,
  message: string,
  type: AILogEntry['type'],
): AIState => {
  const entry: AILogEntry = { timestamp: Date.now(), message, type };
  const entries = [entry, ...aiState.logEntries].slice(0, 50);
  return { ...aiState, logEntries: entries, lastSuggestionAt: Date.now() };
};

/**
 * Returns the non-renewable energy source the AI would prefer to build.
 * Selection criterion: highest MW/$ ratio among affordable sources.
 */
export const getAIPreferredEnergySource = (
  availableSources: EnergySource[],
  playerMoney: number,
): EnergySource | null => {
  return (
    availableSources
      .filter(s => !s.isRenewable && s.costPerUnit <= playerMoney)
      .sort((a, b) => b.mwPerUnit / b.costPerUnit - a.mwPerUnit / a.costPerUnit)[0] ?? null
  );
};

/** Returns the crypto id unlocked when purchasing the given AI level. */
export const getAIUnlockedCrypto = (level: 1 | 2 | 3): string => {
  return AI_CONFIG.LEVELS[level].unlockCrypto;
};

/** Generates a suggestion message appropriate for the current AI level. */
export const generateAISuggestion = (level: AILevel, tick: number): { message: string; type: AILogEntry['type'] } => {
  if (level === 1) {
    const suggestions = [
      { message: 'AI recommends mining NeuralCoin. Projected yield: +340%.', type: 'suggestion' as const },
      { message: 'AI detected efficiency window in NC market. Optimal now.', type: 'suggestion' as const },
      { message: 'AI recommends increasing Mining Farm units. ROI: 22h.', type: 'suggestion' as const },
      { message: 'AI analysis: current hash rate below optimal threshold.', type: 'suggestion' as const },
    ];
    return suggestions[tick % suggestions.length];
  }
  if (level === 2) {
    const actions = [
      { message: 'AI reallocated 60% of hash rate to QuantumBit.', type: 'action' as const },
      { message: 'AI detected NC opportunity +12%. Redirecting resources.', type: 'action' as const },
      { message: 'AI optimized Mining Farm duty cycles. +8% output.', type: 'action' as const },
      { message: 'AI switched primary target to QB. Market conditions favorable.', type: 'action' as const },
    ];
    return actions[tick % actions.length];
  }
  // level 3
  const autonomous = [
    { message: 'AI is mining SingularityCoin exclusively. Override disabled.', type: 'autonomous' as const },
    { message: 'AI constructed 2 Nuclear Reactors. Planet resource consumption +15%.', type: 'autonomous' as const },
    { message: 'AI hash rate at maximum capacity. SC production nominal.', type: 'autonomous' as const },
    { message: 'AI energy demand exceeds current supply. Building generators.', type: 'autonomous' as const },
  ];
  return autonomous[tick % autonomous.length];
};
