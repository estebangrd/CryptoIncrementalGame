import { EnergySource, EnergyState, Hardware } from '../types/game';
import { ENERGY_CONFIG } from '../config/balanceConfig';

export const getInitialEnergyState = (): EnergyState => {
  const sources: Record<string, EnergySource> = {};

  const sourceNames = Object.keys(ENERGY_CONFIG.SOURCES) as Array<keyof typeof ENERGY_CONFIG.SOURCES>;
  for (const id of sourceNames) {
    const cfg = ENERGY_CONFIG.SOURCES[id];
    sources[id] = {
      id,
      nameKey: `energy.${id}`,
      descriptionKey: `energy.${id}.desc`,
      mwPerUnit: cfg.mwPerUnit,
      costPerUnit: cfg.costPerUnit,
      costMultiplier: cfg.costMultiplier,
      isRenewable: cfg.isRenewable,
      depletionPerMwPerSecond: cfg.depletionPerMwPerSecond,
      icon: cfg.icon,
      quantity: 0,
      unlockedByAI: false,
    };
  }

  return {
    sources,
    totalGeneratedMW: 0,
    totalRequiredMW: 0,
    nonRenewableActiveMW: 0,
    aiControlled: false,
  };
};

export const calculateTotalGeneratedMW = (sources: Record<string, EnergySource>): number => {
  return Object.values(sources).reduce(
    (sum, source) => sum + source.quantity * source.mwPerUnit,
    0
  );
};

export const calculateRenewableGeneratedMW = (sources: Record<string, EnergySource>): number => {
  return Object.values(sources)
    .filter(s => s.isRenewable)
    .reduce((sum, s) => sum + s.quantity * s.mwPerUnit, 0);
};

export const calculateNonRenewableActiveMW = (sources: Record<string, EnergySource>): number => {
  return Object.values(sources)
    .filter(s => !s.isRenewable)
    .reduce((sum, s) => sum + s.quantity * s.mwPerUnit, 0);
};

export const calculateTotalRequiredMW = (hardware: Hardware[]): number => {
  return hardware
    .filter(h => h.energyRequired > 0 && h.owned > 0)
    .reduce((sum, h) => sum + h.owned * h.energyRequired, 0);
};

// Returns hardware with activeUnits computed based on available energy.
// Hardware is shut down highest tier first when energy is insufficient.
export const getActiveHardwareWithEnergyConstraint = (
  hardware: Hardware[],
  totalGenerated: number
): Array<Hardware & { activeUnits: number }> => {
  const energyHardware = hardware
    .filter(h => h.energyRequired > 0 && h.owned > 0)
    .sort((a, b) => b.level - a.level); // descending by tier

  let remainingEnergy = totalGenerated;
  const result: Array<Hardware & { activeUnits: number }> = [];

  for (const hw of energyHardware) {
    const canRun = Math.floor(remainingEnergy / hw.energyRequired);
    const activeUnits = Math.min(canRun, hw.owned);
    result.push({ ...hw, activeUnits });
    if (activeUnits > 0) {
      remainingEnergy -= activeUnits * hw.energyRequired;
    }
  }

  return result;
};

// Returns planet depletion per second (percentage points)
export const calculatePlanetDepletion = (sources: Record<string, EnergySource>): number => {
  return Object.values(sources)
    .filter(s => !s.isRenewable)
    .reduce((sum, s) => sum + s.quantity * s.mwPerUnit * s.depletionPerMwPerSecond, 0);
};

// Returns the cost of the next unit to build (scales with quantity owned)
export const getEnergySourceCurrentCost = (source: EnergySource): number => {
  return Math.round(source.costPerUnit * Math.pow(source.costMultiplier, source.quantity));
};

export const getEffectiveRenewableCap = (purchasedUpgrades: string[]): number => {
  let cap = ENERGY_CONFIG.RENEWABLE_CAP_MW;
  for (const upgrade of ENERGY_CONFIG.RENEWABLE_UPGRADES) {
    if (purchasedUpgrades.includes(upgrade.id)) {
      cap += upgrade.capIncreaseMW;
    }
  }
  return cap;
};

export const areNonRenewablesUnlocked = (state: EnergyState, effectiveCap: number): boolean => {
  const renewableMW = calculateRenewableGeneratedMW(state.sources);
  return renewableMW >= effectiveCap * ENERGY_CONFIG.NON_RENEWABLE_UNLOCK_THRESHOLD;
};

export const canBuildEnergySource = (
  state: EnergyState,
  sourceId: string,
  realMoney: number,
  effectiveCap: number,
): boolean => {
  const source = state.sources[sourceId];
  if (!source) return false;

  if (realMoney < getEnergySourceCurrentCost(source)) return false;

  if (source.isRenewable) {
    const currentRenewable = calculateRenewableGeneratedMW(state.sources);
    if (currentRenewable + source.mwPerUnit > effectiveCap) return false;
  } else {
    if (!areNonRenewablesUnlocked(state, effectiveCap)) return false;
    if (state.aiControlled) return false;
  }

  return true;
};

export const recalculateEnergyTotals = (state: EnergyState): EnergyState => {
  return {
    ...state,
    totalGeneratedMW: calculateTotalGeneratedMW(state.sources),
    nonRenewableActiveMW: calculateNonRenewableActiveMW(state.sources),
  };
};

export const buildEnergySource = (state: EnergyState, sourceId: string): EnergyState => {
  const source = state.sources[sourceId];
  if (!source) return state;

  const updatedSources = {
    ...state.sources,
    [sourceId]: { ...source, quantity: source.quantity + 1 },
  };

  return recalculateEnergyTotals({ ...state, sources: updatedSources });
};

// Demolishes one unit of a renewable source. Returns the updated state.
// The 50% cost refund is handled in the reducer.
export const demolishEnergySource = (state: EnergyState, sourceId: string): EnergyState => {
  const source = state.sources[sourceId];
  if (!source || !source.isRenewable || source.quantity <= 0) return state;

  const updatedSources = {
    ...state.sources,
    [sourceId]: { ...source, quantity: source.quantity - 1 },
  };

  return recalculateEnergyTotals({ ...state, sources: updatedSources });
};
