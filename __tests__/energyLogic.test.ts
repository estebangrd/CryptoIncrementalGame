/**
 * Unit tests for Energy System.
 * Based on spec: specs/game-mechanics/energy-system.md
 */

import {
  getActiveHardwareWithEnergyConstraint,
  calculatePlanetDepletion,
  canBuildEnergySource,
  areNonRenewablesUnlocked,
  getInitialEnergyState,
  calculateTotalGeneratedMW,
  calculateRenewableGeneratedMW,
} from '../src/utils/energyLogic';
import { Hardware, EnergySource, EnergyState } from '../src/types/game';
import { ENERGY_CONFIG } from '../src/config/balanceConfig';

// ─── Hardware mock helpers ────────────────────────────────────────────────────

const makeHardware = (overrides: Partial<Hardware>): Hardware => ({
  id: 'test',
  name: 'Test',
  nameKey: 'test',
  description: '',
  descriptionKey: '',
  baseCost: 0,
  baseProduction: 0,
  blockReward: 0,
  miningSpeed: 0,
  electricityCost: 0,
  energyRequired: 0,
  owned: 0,
  costMultiplier: 1.2,
  icon: '',
  currencyId: 'cryptocoin',
  level: 1,
  ...overrides,
});

const mockMiningFarm = (owned: number): Hardware =>
  makeHardware({ id: 'mining_farm', level: 9, energyRequired: 500, owned });

const mockQuantumMiner = (owned: number): Hardware =>
  makeHardware({ id: 'quantum_miner', level: 10, energyRequired: 2000, owned });

const mockSupercomputer = (owned: number): Hardware =>
  makeHardware({ id: 'supercomputer', level: 11, energyRequired: 10000, owned });

// ─── EnergySource mock helpers ────────────────────────────────────────────────

const makeSolarFarm = (quantity: number): EnergySource => ({
  id: 'solar_farm',
  nameKey: 'energy.solar_farm',
  descriptionKey: 'energy.solar_farm.desc',
  mwPerUnit: 200,
  costPerUnit: 5000,
  isRenewable: true,
  depletionPerMwPerSecond: 0,
  icon: '☀️',
  quantity,
  unlockedByAI: false,
});

const makeCoalPlant = (quantity: number): EnergySource => ({
  id: 'coal_plant',
  nameKey: 'energy.coal_plant',
  descriptionKey: 'energy.coal_plant.desc',
  mwPerUnit: 1000,
  costPerUnit: 2000,
  isRenewable: false,
  depletionPerMwPerSecond: 0.0001,
  icon: '🏭',
  quantity,
  unlockedByAI: false,
});

const makeWindFarm = (quantity: number): EnergySource => ({
  id: 'wind_farm',
  nameKey: 'energy.wind_farm',
  descriptionKey: 'energy.wind_farm.desc',
  mwPerUnit: 800,
  costPerUnit: 20000,
  isRenewable: true,
  depletionPerMwPerSecond: 0,
  icon: '💨',
  quantity,
  unlockedByAI: false,
});

// ─── EnergyState builder ──────────────────────────────────────────────────────

const makeEnergyState = (
  sources: Record<string, EnergySource>,
  overrides: Partial<EnergyState> = {}
): EnergyState => {
  const totalGeneratedMW = calculateTotalGeneratedMW(sources);
  const renewableMW = calculateRenewableGeneratedMW(sources);
  return {
    sources,
    totalGeneratedMW,
    totalRequiredMW: 0,
    nonRenewableActiveMW: totalGeneratedMW - renewableMW,
    aiControlled: false,
    ...overrides,
  };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getActiveHardwareWithEnergyConstraint', () => {
  it('all operate when energy is sufficient', () => {
    const hw = [mockMiningFarm(2), mockQuantumMiner(1)];
    // 2×500 + 1×2000 = 3000 MW needed, 3500 MW generated
    const active = getActiveHardwareWithEnergyConstraint(hw, 3500);
    expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(2);
    expect(active.find(h => h.id === 'quantum_miner')?.activeUnits).toBe(1);
  });

  it('shuts down highest tier first in case of deficit', () => {
    const hw = [mockMiningFarm(3), mockQuantumMiner(2)];
    // 3×500 + 2×2000 = 5500 MW needed, only 2500 MW
    // Quantum Miners (tier 10) shut down first: 2500/2000 = 1 can run, but 2 owned
    // After 1 Quantum Miner: 2500 - 2000 = 500 remaining → 1 Mining Farm
    const active = getActiveHardwareWithEnergyConstraint(hw, 2500);
    expect(active.find(h => h.id === 'quantum_miner')?.activeUnits).toBe(1);
    expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(1);
  });

  it('total blackout when energy is 0', () => {
    const hw = [mockMiningFarm(5)];
    const active = getActiveHardwareWithEnergyConstraint(hw, 0);
    expect(active.every(h => h.activeUnits === 0)).toBe(true);
  });

  it('shuts down quantum miner completely before touching mining farms', () => {
    const hw = [mockMiningFarm(3), mockQuantumMiner(2)];
    // Only 400 MW — not enough for any quantum miner (2000), not enough for any mining farm either (500)
    // quantum_miner: 400/2000 = 0 active
    // mining_farm: 400/500 = 0 active
    const active = getActiveHardwareWithEnergyConstraint(hw, 400);
    expect(active.find(h => h.id === 'quantum_miner')?.activeUnits).toBe(0);
    expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(0);
  });

  it('works with supercomputer taking priority over lower tiers', () => {
    const hw = [mockMiningFarm(5), mockSupercomputer(1)];
    // 1×10000 + 5×500 = 12500 needed, 11000 available
    // Supercomputer (tier 11) first: 11000/10000 = 1 → uses 10000, leaves 1000
    // Mining Farm: 1000/500 = 2
    const active = getActiveHardwareWithEnergyConstraint(hw, 11000);
    expect(active.find(h => h.id === 'supercomputer')?.activeUnits).toBe(1);
    expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(2);
  });

  it('ignores hardware with no energy requirement', () => {
    const noEnergyHw = makeHardware({ id: 'basic_cpu', level: 2, energyRequired: 0, owned: 10 });
    const hw = [noEnergyHw, mockMiningFarm(1)];
    const active = getActiveHardwareWithEnergyConstraint(hw, 0);
    // Only energy-requiring hardware appears in result
    expect(active.find(h => h.id === 'basic_cpu')).toBeUndefined();
    expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(0);
  });
});

describe('calculatePlanetDepletion', () => {
  it('renewables do not deplete the planet', () => {
    const sources = { solar_farm: makeSolarFarm(10) };
    expect(calculatePlanetDepletion(sources)).toBe(0);
  });

  it('non-renewables deplete according to MW and rate', () => {
    const sources = { coal_plant: makeCoalPlant(2) };
    // 2 × 1000 MW × 0.0001 %/MW/s = 0.2 % per second
    expect(calculatePlanetDepletion(sources)).toBeCloseTo(0.2);
  });

  it('mixed sources: only non-renewables contribute', () => {
    const sources = {
      solar_farm: makeSolarFarm(5),
      coal_plant: makeCoalPlant(1),
    };
    // Only coal: 1 × 1000 × 0.0001 = 0.1
    expect(calculatePlanetDepletion(sources)).toBeCloseTo(0.1);
  });
});

describe('areNonRenewablesUnlocked', () => {
  const baseCap = ENERGY_CONFIG.RENEWABLE_CAP_MW; // 8000

  it('returns false when renewables are below 80% of cap', () => {
    // 79% of 8000 = 6320 MW
    const sources = { wind_farm: makeWindFarm(7) }; // 7 × 800 = 5600 MW (70%)
    const state = makeEnergyState(sources);
    expect(areNonRenewablesUnlocked(state, baseCap)).toBe(false);
  });

  it('returns true at exactly 80% of cap', () => {
    // 80% of 8000 = 6400 MW → 8 × wind_farm (800 MW each)
    const sources = { wind_farm: makeWindFarm(8) }; // 6400 MW
    const state = makeEnergyState(sources);
    expect(areNonRenewablesUnlocked(state, baseCap)).toBe(true);
  });

  it('returns true above 80% of cap', () => {
    // 10 × 800 = 8000 MW (100%)
    const sources = { wind_farm: makeWindFarm(10) };
    const state = makeEnergyState(sources);
    expect(areNonRenewablesUnlocked(state, baseCap)).toBe(true);
  });
});

describe('canBuildEnergySource', () => {
  const baseCap = ENERGY_CONFIG.RENEWABLE_CAP_MW; // 8000

  it('returns false when player has insufficient money', () => {
    const state = makeEnergyState({ solar_farm: makeSolarFarm(0) });
    // solar_farm costs $5000
    expect(canBuildEnergySource(state, 'solar_farm', 4999, baseCap)).toBe(false);
  });

  it('returns true when player has enough money for renewable', () => {
    const state = makeEnergyState({ solar_farm: makeSolarFarm(0) });
    expect(canBuildEnergySource(state, 'solar_farm', 5000, baseCap)).toBe(true);
  });

  it('returns false when renewable cap is reached', () => {
    // Fill up to cap: 40 × solar_farm (200 MW) = 8000 MW
    const sources = { solar_farm: makeSolarFarm(40) };
    const state = makeEnergyState(sources);
    expect(canBuildEnergySource(state, 'solar_farm', 100000, baseCap)).toBe(false);
  });

  it('returns false for non-renewable when threshold not reached', () => {
    const sources = { coal_plant: makeCoalPlant(0) };
    const state = makeEnergyState(sources);
    // 0 MW renewable, threshold is 80% of 8000 = 6400 MW
    expect(canBuildEnergySource(state, 'coal_plant', 100000, baseCap)).toBe(false);
  });

  it('returns true for non-renewable when threshold is reached', () => {
    // 80% = 6400 MW renewable
    const sources = {
      wind_farm: makeWindFarm(8), // 6400 MW
      coal_plant: makeCoalPlant(0),
    };
    const state = makeEnergyState(sources);
    // coal_plant costs $2000
    expect(canBuildEnergySource(state, 'coal_plant', 2000, baseCap)).toBe(true);
  });

  it('returns false for non-renewable when AI controlled', () => {
    const sources = {
      wind_farm: makeWindFarm(8),
      coal_plant: makeCoalPlant(0),
    };
    const state = makeEnergyState(sources, { aiControlled: true });
    expect(canBuildEnergySource(state, 'coal_plant', 100000, baseCap)).toBe(false);
  });
});

describe('getInitialEnergyState', () => {
  it('starts with zero generation and resources', () => {
    const state = getInitialEnergyState();
    expect(state.totalGeneratedMW).toBe(0);
    expect(state.totalRequiredMW).toBe(0);
    expect(state.nonRenewableActiveMW).toBe(0);
    expect(state.aiControlled).toBe(false);
  });

  it('initializes all energy sources from config', () => {
    const state = getInitialEnergyState();
    const configSourceIds = Object.keys(ENERGY_CONFIG.SOURCES);
    for (const id of configSourceIds) {
      expect(state.sources[id]).toBeDefined();
      expect(state.sources[id].quantity).toBe(0);
    }
  });
});
