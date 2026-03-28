/**
 * Price Engine — Ornstein-Uhlenbeck mean-reverting process with market regimes.
 *
 * Replaces the old BTC_PRICE_HISTORY lookup. All functions are pure
 * (no side-effects) except for Math.random() calls used for stochastic simulation.
 */
import { PRICE_ENGINE } from '../config/balanceConfig';
import { getBasePrice } from './blockLogic';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PriceEngineState {
  priceDeviation: number;
  priceRegime: string;
  priceRegimeTicksLeft: number;
}

// ── Box-Muller transform (standard normal variate) ───────────────────────────

export const boxMullerZ = (): number => {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};

// ── Regime selection ─────────────────────────────────────────────────────────

export const pickRegime = (
  _deviation: number,
  currentRegime: string,
): string => {
  const regimes = PRICE_ENGINE.REGIMES;
  const blocked = PRICE_ENGINE.BLOCKED_TRANSITIONS[currentRegime] ?? [];

  // Build eligible list (exclude blocked)
  const eligible: { name: string; weight: number }[] = [];
  let totalWeight = 0;
  for (const [name, cfg] of Object.entries(regimes)) {
    if (blocked.includes(name)) continue;
    eligible.push({ name, weight: cfg.weight });
    totalWeight += cfg.weight;
  }

  // Weighted random pick
  let roll = Math.random() * totalWeight;
  for (const entry of eligible) {
    roll -= entry.weight;
    if (roll <= 0) return entry.name;
  }

  return 'normal'; // fallback
};

// ── Roll regime duration ─────────────────────────────────────────────────────

export const rollRegimeDuration = (regimeName: string): number => {
  const cfg = PRICE_ENGINE.REGIMES[regimeName] ?? PRICE_ENGINE.REGIMES.normal;
  return cfg.minTicks + Math.floor(Math.random() * (cfg.maxTicks - cfg.minTicks + 1));
};

// ── Single OU tick ───────────────────────────────────────────────────────────

export interface TickResult {
  price: number;
  state: PriceEngineState;
}

export const tickOU = (
  engineState: PriceEngineState,
  blocksMined: number,
): TickResult => {
  const { THETA, SIGMA, CLAMP_MIN, CLAMP_MAX } = PRICE_ENGINE;
  const regimeCfg = PRICE_ENGINE.REGIMES[engineState.priceRegime] ?? PRICE_ENGINE.REGIMES.normal;

  // Effective parameters for this regime
  const theta = THETA * regimeCfg.theta;
  const sigma = SIGMA * regimeCfg.sigma;
  const drift = regimeCfg.drift;

  // OU step: dx = theta * (0 - x) * dt + sigma * dW + drift
  // dt = 1 (one tick)
  const dW = boxMullerZ();
  let newDev = engineState.priceDeviation
    + theta * (0 - engineState.priceDeviation)
    + sigma * dW
    + drift;

  // Clamp
  newDev = Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, newDev));

  // Advance regime
  let ticksLeft = engineState.priceRegimeTicksLeft - 1;
  let regime = engineState.priceRegime;
  if (ticksLeft <= 0) {
    regime = pickRegime(newDev, engineState.priceRegime);
    ticksLeft = rollRegimeDuration(regime);
  }

  // Calculate price
  const eraBase = getBasePrice(blocksMined);
  const price = eraBase * (1 + newDev);

  return {
    price: Math.max(eraBase * 0.01, price), // floor at 1% of era base
    state: {
      priceDeviation: newDev,
      priceRegime: regime,
      priceRegimeTicksLeft: ticksLeft,
    },
  };
};

// ── Era transition smoothing ─────────────────────────────────────────────────

export const smoothEraTransition = (
  oldPrice: number,
  blocksMined: number,
): number => {
  const newEraBase = getBasePrice(blocksMined);
  if (newEraBase <= 0) return 0;
  // Recalculate deviation so that price = newEraBase * (1 + dev)
  // → dev = (oldPrice / newEraBase) - 1
  let dev = (oldPrice / newEraBase) - 1;
  dev = Math.max(PRICE_ENGINE.CLAMP_MIN, Math.min(PRICE_ENGINE.CLAMP_MAX, dev));
  return dev;
};

// ── Generate initial chart window ────────────────────────────────────────────

export const generateInitialChartWindow = (blocksMined: number): number[] => {
  const windowSize = PRICE_ENGINE.CHART_WINDOW;
  let engineState: PriceEngineState = getInitialPriceEngineState();
  const prices: number[] = [];

  for (let i = 0; i < windowSize; i++) {
    const result = tickOU(engineState, blocksMined);
    prices.push(result.price);
    engineState = result.state;
  }

  return prices;
};

// ── Factory for default state ────────────────────────────────────────────────

export const getInitialPriceEngineState = (): PriceEngineState => ({
  priceDeviation: 0,
  priceRegime: 'normal',
  priceRegimeTicksLeft: rollRegimeDuration('normal'),
});
