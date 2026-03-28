import {
  boxMullerZ,
  pickRegime,
  rollRegimeDuration,
  tickOU,
  smoothEraTransition,
  generateInitialChartWindow,
  getInitialPriceEngineState,
  PriceEngineState,
} from '../src/utils/priceEngine';
import { PRICE_ENGINE } from '../src/config/balanceConfig';
import { getBasePrice } from '../src/utils/blockLogic';

describe('priceEngine', () => {
  describe('boxMullerZ', () => {
    it('returns a finite number', () => {
      const z = boxMullerZ();
      expect(isFinite(z)).toBe(true);
    });

    it('produces values roughly in standard normal range over many samples', () => {
      const samples = Array.from({ length: 1000 }, () => boxMullerZ());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
      // Mean should be near 0, variance near 1
      expect(Math.abs(mean)).toBeLessThan(0.2);
      expect(Math.abs(variance - 1)).toBeLessThan(0.3);
    });
  });

  describe('pickRegime', () => {
    it('returns a valid regime name', () => {
      const regime = pickRegime(0, 'normal');
      expect(Object.keys(PRICE_ENGINE.REGIMES)).toContain(regime);
    });

    it('respects blocking rules: spike cannot follow spike', () => {
      const results = new Set<string>();
      for (let i = 0; i < 200; i++) {
        results.add(pickRegime(0, 'spike'));
      }
      expect(results.has('spike')).toBe(false);
      expect(results.has('crash')).toBe(false);
    });

    it('respects blocking rules: crash cannot follow crash', () => {
      const results = new Set<string>();
      for (let i = 0; i < 200; i++) {
        results.add(pickRegime(0, 'crash'));
      }
      expect(results.has('crash')).toBe(false);
      expect(results.has('spike')).toBe(false);
    });
  });

  describe('rollRegimeDuration', () => {
    it('returns duration within configured range', () => {
      const cfg = PRICE_ENGINE.REGIMES.normal;
      for (let i = 0; i < 100; i++) {
        const dur = rollRegimeDuration('normal');
        expect(dur).toBeGreaterThanOrEqual(cfg.minTicks);
        expect(dur).toBeLessThanOrEqual(cfg.maxTicks);
      }
    });

    it('returns duration for spike regime within range', () => {
      const cfg = PRICE_ENGINE.REGIMES.spike;
      for (let i = 0; i < 100; i++) {
        const dur = rollRegimeDuration('spike');
        expect(dur).toBeGreaterThanOrEqual(cfg.minTicks);
        expect(dur).toBeLessThanOrEqual(cfg.maxTicks);
      }
    });

    it('falls back to normal for unknown regime', () => {
      const dur = rollRegimeDuration('nonexistent');
      const cfg = PRICE_ENGINE.REGIMES.normal;
      expect(dur).toBeGreaterThanOrEqual(cfg.minTicks);
      expect(dur).toBeLessThanOrEqual(cfg.maxTicks);
    });
  });

  describe('tickOU', () => {
    it('returns a positive price', () => {
      const state = getInitialPriceEngineState();
      const result = tickOU(state, 0);
      expect(result.price).toBeGreaterThan(0);
    });

    it('clamps deviation within bounds', () => {
      // Start at the upper clamp to see it doesn't exceed
      const state: PriceEngineState = {
        priceDeviation: PRICE_ENGINE.CLAMP_MAX,
        priceRegime: 'spike',
        priceRegimeTicksLeft: 100,
      };
      for (let i = 0; i < 100; i++) {
        const result = tickOU(state, 0);
        expect(result.state.priceDeviation).toBeLessThanOrEqual(PRICE_ENGINE.CLAMP_MAX);
        expect(result.state.priceDeviation).toBeGreaterThanOrEqual(PRICE_ENGINE.CLAMP_MIN);
      }
    });

    it('decrements ticks left and transitions regime at 0', () => {
      const state: PriceEngineState = {
        priceDeviation: 0,
        priceRegime: 'normal',
        priceRegimeTicksLeft: 1, // will hit 0 this tick
      };
      const result = tickOU(state, 0);
      // Should have rolled a new regime with fresh ticks
      expect(result.state.priceRegimeTicksLeft).toBeGreaterThan(0);
    });

    it('price tracks era base price', () => {
      const state = getInitialPriceEngineState();
      const eraBase = getBasePrice(0);
      // Run multiple ticks and check price is in a reasonable range of era base
      let totalDeviation = 0;
      let s = state;
      for (let i = 0; i < 50; i++) {
        const result = tickOU(s, 0);
        totalDeviation += Math.abs(result.price / eraBase - 1);
        s = result.state;
      }
      const avgDeviation = totalDeviation / 50;
      // Average deviation should be < 30%
      expect(avgDeviation).toBeLessThan(0.3);
    });
  });

  describe('smoothEraTransition', () => {
    it('recalculates deviation for new era base', () => {
      // Use a price close to the new era base so clamping doesn't interfere
      const newBase = getBasePrice(210000); // era 1 = $0.50
      const oldPrice = newBase * 1.15; // 15% above era base
      const newDev = smoothEraTransition(oldPrice, 210000);
      // dev should be ~0.15
      expect(Math.abs(newDev - 0.15)).toBeLessThan(0.001);
      // Price should be reconstructable
      const reconstructed = newBase * (1 + newDev);
      expect(Math.abs(reconstructed - oldPrice)).toBeLessThan(0.01);
    });

    it('clamps deviation within bounds', () => {
      // Very extreme price that would require deviation outside bounds
      const oldPrice = 100;
      const dev = smoothEraTransition(oldPrice, 0);
      expect(dev).toBeLessThanOrEqual(PRICE_ENGINE.CLAMP_MAX);
      expect(dev).toBeGreaterThanOrEqual(PRICE_ENGINE.CLAMP_MIN);
    });
  });

  describe('generateInitialChartWindow', () => {
    it('returns array of CHART_WINDOW length', () => {
      const prices = generateInitialChartWindow(0);
      expect(prices).toHaveLength(PRICE_ENGINE.CHART_WINDOW);
    });

    it('all prices are positive', () => {
      const prices = generateInitialChartWindow(0);
      prices.forEach(p => expect(p).toBeGreaterThan(0));
    });

    it('shows visible variation (not flat)', () => {
      const prices = generateInitialChartWindow(0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      // Should have at least 1% range
      expect((max - min) / min).toBeGreaterThan(0.01);
    });
  });

  describe('getInitialPriceEngineState', () => {
    it('returns default state with normal regime', () => {
      const state = getInitialPriceEngineState();
      expect(state.priceDeviation).toBe(0);
      expect(state.priceRegime).toBe('normal');
      expect(state.priceRegimeTicksLeft).toBeGreaterThan(0);
    });
  });
});
