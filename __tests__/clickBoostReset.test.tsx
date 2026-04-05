/**
 * Test: click boost must reset to 0 when BlockStatus unmounts (tab switch).
 *
 * Bug: switching from Mining tab to Market tab left miningClickBoost frozen
 * at the last manual-click value, causing the hero CC/s display to freeze.
 * Returning to Mining tab remounted BlockStatus with clickBoost=0, resetting it.
 *
 * Root cause: BlockStatus.useEffect for onClickBoostChange had no cleanup
 * to call onClickBoostChange(0) on unmount.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Use fake timers to prevent setInterval leaks
jest.useFakeTimers();

// Mock react-native-svg before importing the component
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Defs: View,
    LinearGradient: View,
    Stop: View,
    Rect: View,
  };
});

// Stub Animated.loop to avoid infinite animation loops that cause act() timeouts
const { Animated } = require('react-native');
const origLoop = Animated.loop;
beforeAll(() => { Animated.loop = jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })); });
afterAll(() => { Animated.loop = origLoop; });

import { BlockStatus } from '../src/components/BlockStatus';

// Minimal gameState that satisfies BlockStatus rendering
const makeGameState = (): any => ({
  cryptoCoins: 100,
  cryptoCoinsPerSecond: 5,
  blocksMined: 10,
  totalCryptoCoins: 100,
  totalRealMoneyEarned: 0,
  realMoney: 0,
  totalHashRate: 50,
  totalElectricityCost: 0,
  hardware: [{ id: 'basic_cpu', owned: 1, baseProduction: 10, baseCost: 10, miningSpeed: 1, blockReward: 1 }],
  upgrades: [],
  prestigeMultiplier: 1,
  prestigeLevel: 0,
  currentReward: 50,
  nextHalving: 210000,
  difficulty: 1,
});

describe('BlockStatus click boost reset on unmount', () => {
  it('calls onClickBoostChange(0) when component unmounts', async () => {
    const onClickBoostChange = jest.fn();
    const onMineBlock = jest.fn();
    const t = (key: string) => key;

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <BlockStatus
          gameState={makeGameState()}
          onMineBlock={onMineBlock}
          onClickBoostChange={onClickBoostChange}
          t={t}
        />
      );
    });

    // Initial render fires onClickBoostChange(0) from the useEffect
    expect(onClickBoostChange).toHaveBeenCalledWith(0);
    onClickBoostChange.mockClear();

    // Unmount the component (simulates switching to Market tab)
    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });

    // BUG: onClickBoostChange should be called with 0 on unmount
    // to reset the hero CC/s display in GameScreen
    expect(onClickBoostChange).toHaveBeenCalledWith(0);
  });
});
