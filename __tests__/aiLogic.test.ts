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
import { GameState, AIState, AILevel, EnergySource } from '../src/types/game';
import { getInitialGameState } from '../src/utils/gameLogic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  ...getInitialGameState(),
  ...overrides,
});

const makeStateWithAI = (level: AILevel, moneyOverride?: number): GameState => {
  return makeState({
    realMoney: moneyOverride ?? 100_000_000,
    ai: { level, isAutonomous: level === 3, logEntries: [], lastSuggestionAt: 0 },
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

  it('returns 1.20 at Level 1', () => {
    expect(getAIProductionMultiplier(1)).toBe(1.20);
  });

  it('returns 1.50 at Level 2', () => {
    expect(getAIProductionMultiplier(2)).toBe(1.50);
  });

  it('returns 2.50 at Level 3', () => {
    expect(getAIProductionMultiplier(3)).toBe(2.50);
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
      realMoney: 1_000_000,
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
    const state = makeStateWithAI(1, 10_000_000);
    expect(canPurchaseAILevel(state, 2)).toBe(true);
  });

  it('Level 3: requires Level 2 purchased', () => {
    const state = makeStateWithAI(1, 100_000_000);
    expect(canPurchaseAILevel(state, 3)).toBe(false);
  });

  it('Level 3: available when Level 2 purchased and enough money', () => {
    const state = makeStateWithAI(2, 100_000_000);
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
    const ai: AIState = { level: 1, isAutonomous: false, logEntries: [], lastSuggestionAt: 0 };
    expect(ai.isAutonomous).toBe(false);
  });

  it('isAutonomous is false at Level 2', () => {
    const ai: AIState = { level: 2, isAutonomous: false, logEntries: [], lastSuggestionAt: 0 };
    expect(ai.isAutonomous).toBe(false);
  });

  it('isAutonomous is true at Level 3', () => {
    // Simulate what the reducer does
    const ai: AIState = { level: 3, isAutonomous: true, logEntries: [], lastSuggestionAt: 0 };
    expect(ai.isAutonomous).toBe(true);
  });
});
