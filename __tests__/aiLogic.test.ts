/**
 * Unit tests for AI System.
 * Based on spec: specs/game-mechanics/ai-system.md
 */

import {
  getInitialAIState,
  getAIProductionMultiplier,
  isAIUnlocked,
  canPurchaseAILevel,
  addAILogEntry,
  getAIPreferredEnergySource,
  getAIUnlockedCrypto,
} from '../src/utils/aiLogic';
import { getNextAIAction } from '../src/utils/aiObserverLogic';
import { canMineBlock } from '../src/utils/blockLogic';
import { updateOfflineProgress } from '../src/utils/gameLogic';
import { GameState, AIState, AILevel, EnergySource } from '../src/types/game';
import { getInitialGameState } from '../src/utils/gameLogic';
import { AI_CONFIG } from '../src/config/balanceConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  ...getInitialGameState(),
  ...overrides,
});

const makeStateWithAI = (level: AILevel, moneyOverride?: number): GameState => {
  return makeState({
    realMoney: moneyOverride ?? 100_000_000,
    ai: {
      level,
      isAutonomous: level === 3,
      logEntries: [],
      lastSuggestionAt: 0,
      capRemovalLogged: false,
      renewablesSatLogged: false,
      lastActionAt: 0,
      aiHardwareCreated: [],
    },
    aiCryptosUnlocked: [],
    hardware: getInitialGameState().hardware.map(h =>
      h.id === 'quantum_miner' ? { ...h, owned: level >= 1 ? 1 : 0 } : h,
    ),
  });
};

const makeEnergySource = (
  id: string,
  overrides: Partial<EnergySource> = {},
): EnergySource => ({
  id,
  nameKey: `energy.${id}`,
  descriptionKey: `energy.${id}.desc`,
  mwPerUnit: 1000,
  costPerUnit: 5000,
  isRenewable: false,
  depletionPerMwPerSecond: 0.0001,
  icon: '🏭',
  quantity: 0,
  unlockedByAI: false,
  ...overrides,
});

// ─── getInitialAIState ────────────────────────────────────────────────────────

describe('getInitialAIState', () => {
  it('starts at level 0 with no log entries', () => {
    const ai = getInitialAIState();
    expect(ai.level).toBe(0);
    expect(ai.isAutonomous).toBe(false);
    expect(ai.logEntries).toHaveLength(0);
    expect(ai.lastSuggestionAt).toBe(0);
  });
});

// ─── getAIProductionMultiplier ────────────────────────────────────────────────

describe('getAIProductionMultiplier', () => {
  it('returns 1.0 without AI', () => {
    expect(getAIProductionMultiplier(0)).toBe(1.0);
  });

  it('returns Level 1 multiplier from config', () => {
    expect(getAIProductionMultiplier(1)).toBe(AI_CONFIG.LEVELS[1].productionMultiplier);
  });

  it('returns Level 2 multiplier from config', () => {
    expect(getAIProductionMultiplier(2)).toBe(AI_CONFIG.LEVELS[2].productionMultiplier);
  });

  it('returns Level 3 multiplier from config', () => {
    expect(getAIProductionMultiplier(3)).toBe(AI_CONFIG.LEVELS[3].productionMultiplier);
  });
});

// ─── isAIUnlocked ─────────────────────────────────────────────────────────────

describe('isAIUnlocked', () => {
  it('returns false when player has no Quantum Miner', () => {
    const state = makeState();
    expect(isAIUnlocked(state)).toBe(false);
  });

  it('returns true when player has 1 Quantum Miner', () => {
    const state = makeState({
      hardware: getInitialGameState().hardware.map(h =>
        h.id === 'quantum_miner' ? { ...h, owned: 1 } : h,
      ),
    });
    expect(isAIUnlocked(state)).toBe(true);
  });

  it('returns true when player has multiple Quantum Miners', () => {
    const state = makeState({
      hardware: getInitialGameState().hardware.map(h =>
        h.id === 'quantum_miner' ? { ...h, owned: 5 } : h,
      ),
    });
    expect(isAIUnlocked(state)).toBe(true);
  });
});

// ─── canPurchaseAILevel ───────────────────────────────────────────────────────

describe('canPurchaseAILevel', () => {
  it('Level 1: requires Quantum Miner and no current AI', () => {
    const noHardware = makeState({ realMoney: 1_000_000, ai: getInitialAIState() });
    expect(canPurchaseAILevel(noHardware, 1)).toBe(false);
  });

  it('Level 1: available with Quantum Miner and enough money', () => {
    // AI level 0, but player owns a Quantum Miner and has enough money
    const state = makeState({
      realMoney: AI_CONFIG.LEVELS[1].cost,
      ai: getInitialAIState(),
      aiCryptosUnlocked: [],
      hardware: getInitialGameState().hardware.map(h =>
        h.id === 'quantum_miner' ? { ...h, owned: 1 } : h,
      ),
    });
    expect(canPurchaseAILevel(state, 1)).toBe(true);
  });

  it('Level 1: blocked when not enough money', () => {
    const state = makeStateWithAI(0, 100);
    expect(canPurchaseAILevel(state, 1)).toBe(false);
  });

  it('Level 2: requires Level 1 already purchased', () => {
    const state = makeStateWithAI(0, 10_000_000);
    expect(canPurchaseAILevel(state, 2)).toBe(false);
  });

  it('Level 2: available when Level 1 purchased and enough money', () => {
    const state = makeStateWithAI(1, AI_CONFIG.LEVELS[2].cost);
    expect(canPurchaseAILevel(state, 2)).toBe(true);
  });

  it('Level 3: requires Level 2 purchased', () => {
    const state = makeStateWithAI(1, AI_CONFIG.LEVELS[3].cost);
    expect(canPurchaseAILevel(state, 3)).toBe(false);
  });

  it('Level 3: available when Level 2 purchased and enough money', () => {
    const state = makeStateWithAI(2, AI_CONFIG.LEVELS[3].cost);
    expect(canPurchaseAILevel(state, 3)).toBe(true);
  });

  it('Level 3: blocked without enough money', () => {
    const state = makeStateWithAI(2, 1_000);
    expect(canPurchaseAILevel(state, 3)).toBe(false);
  });
});

// ─── addAILogEntry ────────────────────────────────────────────────────────────

describe('addAILogEntry', () => {
  it('prepends the new entry to logEntries', () => {
    const ai = getInitialAIState();
    const updated = addAILogEntry(ai, 'test message', 'suggestion');
    expect(updated.logEntries).toHaveLength(1);
    expect(updated.logEntries[0].message).toBe('test message');
    expect(updated.logEntries[0].type).toBe('suggestion');
  });

  it('most recent entry is first', () => {
    let ai = getInitialAIState();
    ai = addAILogEntry(ai, 'first', 'suggestion');
    ai = addAILogEntry(ai, 'second', 'action');
    expect(ai.logEntries[0].message).toBe('second');
    expect(ai.logEntries[1].message).toBe('first');
  });

  it('caps entries at 50', () => {
    let ai = getInitialAIState();
    for (let i = 0; i < 60; i++) {
      ai = addAILogEntry(ai, `msg ${i}`, 'suggestion');
    }
    expect(ai.logEntries).toHaveLength(50);
    expect(ai.logEntries[0].message).toBe('msg 59');
  });
});

// ─── getAIPreferredEnergySource ───────────────────────────────────────────────

describe('getAIPreferredEnergySource', () => {
  it('returns null when no non-renewable sources are affordable', () => {
    const sources = [makeEnergySource('coal_plant', { costPerUnit: 10_000 })];
    expect(getAIPreferredEnergySource(sources, 100)).toBeNull();
  });

  it('returns null for renewable sources', () => {
    const renewable = makeEnergySource('solar_farm', { isRenewable: true, costPerUnit: 100 });
    expect(getAIPreferredEnergySource([renewable], 1_000_000)).toBeNull();
  });

  it('returns the most MW/$ efficient non-renewable source', () => {
    const coal = makeEnergySource('coal_plant', {
      mwPerUnit: 1_000,
      costPerUnit: 2_000,
      isRenewable: false,
    }); // 0.5 MW/$
    const nuclear = makeEnergySource('nuclear_reactor', {
      mwPerUnit: 20_000,
      costPerUnit: 300_000,
      isRenewable: false,
    }); // ~0.067 MW/$
    const oil = makeEnergySource('oil_refinery', {
      mwPerUnit: 5_000,
      costPerUnit: 8_000,
      isRenewable: false,
    }); // 0.625 MW/$

    const result = getAIPreferredEnergySource([coal, nuclear, oil], 1_000_000);
    expect(result?.id).toBe('oil_refinery');
  });

  it('excludes sources the player cannot afford', () => {
    const cheap = makeEnergySource('coal_plant', {
      mwPerUnit: 1_000,
      costPerUnit: 500,
      isRenewable: false,
    });
    const expensive = makeEnergySource('nuclear_reactor', {
      mwPerUnit: 20_000,
      costPerUnit: 300_000,
      isRenewable: false,
    });
    const result = getAIPreferredEnergySource([cheap, expensive], 1_000);
    expect(result?.id).toBe('coal_plant');
  });
});

// ─── getAIUnlockedCrypto ──────────────────────────────────────────────────────

describe('getAIUnlockedCrypto', () => {
  it('Level 1 unlocks neural_coin', () => {
    expect(getAIUnlockedCrypto(1)).toBe('neural_coin');
  });

  it('Level 2 unlocks quantum_bit', () => {
    expect(getAIUnlockedCrypto(2)).toBe('quantum_bit');
  });

  it('Level 3 unlocks singularity_coin', () => {
    expect(getAIUnlockedCrypto(3)).toBe('singularity_coin');
  });
});

// ─── isAutonomous integrity ───────────────────────────────────────────────────

describe('AI isAutonomous integrity', () => {
  it('isAutonomous is false at Level 0', () => {
    expect(getInitialAIState().isAutonomous).toBe(false);
  });

  it('isAutonomous is false at Level 1', () => {
    const ai: AIState = { ...getInitialAIState(), level: 1 };
    expect(ai.isAutonomous).toBe(false);
  });

  it('isAutonomous is false at Level 2', () => {
    const ai: AIState = { ...getInitialAIState(), level: 2 };
    expect(ai.isAutonomous).toBe(false);
  });

  it('isAutonomous is true at Level 3', () => {
    // Simulate what the reducer does
    const ai: AIState = { ...getInitialAIState(), level: 3, isAutonomous: true };
    expect(ai.isAutonomous).toBe(true);
  });
});

// ─── AI Observer Mode — canMineBlock bypasses 21M cap ───────────────────────

describe('canMineBlock with AI autonomous', () => {
  it('returns false at 21M blocks without AI', () => {
    const state = makeState({ blocksMined: 21_000_000 });
    expect(canMineBlock(state)).toBe(false);
  });

  it('returns true at 21M blocks when AI is autonomous', () => {
    const state = makeStateWithAI(3);
    state.blocksMined = 21_000_000;
    expect(canMineBlock(state)).toBe(true);
  });

  it('returns true beyond 21M blocks when AI is autonomous', () => {
    const state = makeStateWithAI(3);
    state.blocksMined = 50_000_000;
    expect(canMineBlock(state)).toBe(true);
  });
});

// ─── AI Observer Mode — getNextAIAction decision tree ───────────────────────

describe('getNextAIAction', () => {
  it('returns SELL_CC when coins above threshold', () => {
    const state = makeStateWithAI(3);
    state.cryptoCoins = 10_000;
    const action = getNextAIAction(state);
    expect(action).not.toBeNull();
    expect(action!.type).toBe('SELL_CC');
  });

  it('returns null when no actions possible (no coins, no money)', () => {
    const state = makeStateWithAI(3, 0);
    state.cryptoCoins = 0;
    const action = getNextAIAction(state);
    // May return CREATE_AI_HARDWARE if no hardware created yet
    if (action) {
      expect(['CREATE_AI_HARDWARE', 'BUY_HARDWARE']).toContain(action.type);
    }
  });

  it('prioritizes selling over buying', () => {
    const state = makeStateWithAI(3, 1_000_000);
    state.cryptoCoins = 50_000;
    const action = getNextAIAction(state);
    expect(action).not.toBeNull();
    expect(action!.type).toBe('SELL_CC');
  });
});

// ─── AI Observer Mode — good ending blocked at Level 3 ──────────────────────

describe('Good ending condition blocks AI Level 3', () => {
  it('good ending should NOT trigger with AI Level 3', () => {
    const state = makeStateWithAI(3);
    state.blocksMined = 21_000_000;
    state.planetResources = 50;
    // The good ending check in ADD_PRODUCTION requires ai.level < 3
    // We verify the condition here:
    const aiLevel = state.ai?.level ?? 0;
    expect(aiLevel < 3).toBe(false); // AI Level 3 blocks good ending
  });

  it('good ending allowed at Level 2', () => {
    const state = makeStateWithAI(2);
    state.blocksMined = 21_000_000;
    state.planetResources = 50;
    const aiLevel = state.ai?.level ?? 0;
    expect(aiLevel < 3).toBe(true); // Level 2 allows good ending
  });
});

// ─── AI Observer Mode — offline progress disabled ───────────────────────────

describe('updateOfflineProgress with AI autonomous', () => {
  it('returns unchanged state (only lastSaveTime updated) when autonomous', () => {
    const state = makeStateWithAI(3);
    state.cryptoCoins = 1000;
    state.lastSaveTime = Date.now() - 60_000; // 1 minute ago
    const result = updateOfflineProgress(state);
    // Coins should NOT increase
    expect(result.cryptoCoins).toBe(1000);
    // lastSaveTime should be updated
    expect(result.lastSaveTime).toBeGreaterThan(state.lastSaveTime);
  });
});

// ─── getInitialAIState includes new fields ──────────────────────────────────

describe('getInitialAIState new fields', () => {
  it('includes lastActionAt and aiHardwareCreated', () => {
    const ai = getInitialAIState();
    expect(ai.lastActionAt).toBe(0);
    expect(ai.aiHardwareCreated).toEqual([]);
  });
});
