/**
 * Tests for RESET_GAME edge case — all required state fields must be present.
 * Bug: iapState/adState/adBoost were missing after reset, causing crash.
 */

import { getInitialGameState } from '../src/utils/gameLogic';

describe('RESET_GAME — required fields', () => {
  it('getInitialGameState includes iapState', () => {
    const state = getInitialGameState();
    expect(state.iapState).toBeDefined();
    expect(state.iapState.removeAdsPurchased).toBe(false);
    expect(state.iapState.purchaseHistory).toEqual([]);
    expect(state.iapState.booster2x).toBeDefined();
    expect(state.iapState.booster5x).toBeDefined();
    expect(state.iapState.luckyBlock).toBeDefined();
    expect(state.iapState.marketPump).toBeDefined();
    expect(state.iapState.offlineMiner).toBeDefined();
  });

  it('getInitialGameState includes adState', () => {
    const state = getInitialGameState();
    expect(state.adState).toBeDefined();
    expect(state.adState.isFirstSession).toBe(true);
    expect(state.adState.totalInterstitialsShown).toBe(0);
  });

  it('getInitialGameState includes adBoost', () => {
    const state = getInitialGameState();
    expect(state.adBoost).toBeDefined();
    expect(state.adBoost.isActive).toBe(false);
  });
});
