import { checkAchievements, getAchievementCompletionPercent, mergeAchievements } from '../src/utils/achievementLogic';
import { ALL_ACHIEVEMENTS } from '../src/data/achievements';
import { Achievement } from '../src/types/game';

const makeState = (overrides: any = {}) => ({
  blocksMined: 0,
  totalRealMoneyEarned: 0,
  realMoney: 0,
  prestigeLevel: 0,
  hardware: [
    { id: 'manual_mining', owned: 1 },
    { id: 'basic_cpu', owned: 0 },
    { id: 'advanced_cpu', owned: 0 },
    { id: 'basic_gpu', owned: 0 },
    { id: 'advanced_gpu', owned: 0 },
    { id: 'asic_gen1', owned: 0 },
    { id: 'asic_gen2', owned: 0 },
    { id: 'asic_gen3', owned: 0 },
  ],
  achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a })),
  ...overrides,
});

describe('checkAchievements', () => {
  it('unlocks first_block when blocksMined >= 1', () => {
    const state = makeState({ blocksMined: 1 });
    const result = checkAchievements(state as any);
    const ach = result.find(a => a.id === 'first_block');
    expect(ach?.unlocked).toBe(true);
  });

  it('does not unlock first_block when blocksMined = 0', () => {
    const state = makeState({ blocksMined: 0 });
    const result = checkAchievements(state as any);
    const ach = result.find(a => a.id === 'first_block');
    expect(ach?.unlocked).toBe(false);
  });

  it('unlocks century at 100 blocks', () => {
    const state = makeState({ blocksMined: 100 });
    const result = checkAchievements(state as any);
    expect(result.find(a => a.id === 'century')?.unlocked).toBe(true);
  });

  it('does not unlock century before 100 blocks', () => {
    const state = makeState({ blocksMined: 99 });
    const result = checkAchievements(state as any);
    expect(result.find(a => a.id === 'century')?.unlocked).toBe(false);
  });

  it('tracks progress for century achievement', () => {
    const state = makeState({ blocksMined: 47 });
    const result = checkAchievements(state as any);
    expect(result.find(a => a.id === 'century')?.progress).toBe(47);
  });

  it('unlocks first_steps when any non-manual hardware owned', () => {
    const state = makeState({
      hardware: [
        { id: 'manual_mining', owned: 1 },
        { id: 'basic_cpu', owned: 1 },
        { id: 'advanced_cpu', owned: 0 },
        { id: 'basic_gpu', owned: 0 },
        { id: 'advanced_gpu', owned: 0 },
        { id: 'asic_gen1', owned: 0 },
        { id: 'asic_gen2', owned: 0 },
        { id: 'asic_gen3', owned: 0 },
      ],
    });
    const result = checkAchievements(state as any);
    expect(result.find(a => a.id === 'first_steps')?.unlocked).toBe(true);
  });

  it('unlocks first_sale when totalRealMoneyEarned > 0', () => {
    const state = makeState({ totalRealMoneyEarned: 10 });
    const result = checkAchievements(state as any);
    expect(result.find(a => a.id === 'first_sale')?.unlocked).toBe(true);
  });

  it('does not unlock already-unlocked achievements again', () => {
    const alreadyUnlocked = ALL_ACHIEVEMENTS.map(a =>
      a.id === 'first_block' ? { ...a, unlocked: true, unlockedAt: 12345 } : { ...a }
    );
    const state = makeState({ blocksMined: 1, achievements: alreadyUnlocked });
    const result = checkAchievements(state as any);
    const ach = result.find(a => a.id === 'first_block');
    expect(ach?.unlockedAt).toBe(12345); // not overwritten
  });

  it('unlocks rebirth when prestigeLevel >= 1', () => {
    const state = makeState({ prestigeLevel: 1 });
    const result = checkAchievements(state as any);
    expect(result.find(a => a.id === 'rebirth')?.unlocked).toBe(true);
  });
});

describe('getAchievementCompletionPercent', () => {
  it('returns 0 when no achievements unlocked', () => {
    expect(getAchievementCompletionPercent(ALL_ACHIEVEMENTS)).toBe(0);
  });

  it('returns 100 when all achievements unlocked', () => {
    const allUnlocked = ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: true }));
    expect(getAchievementCompletionPercent(allUnlocked)).toBe(100);
  });

  it('returns correct percentage for partial unlocks', () => {
    const total = ALL_ACHIEVEMENTS.length;
    const half = ALL_ACHIEVEMENTS.map((a, i) => ({ ...a, unlocked: i < Math.floor(total / 2) }));
    const pct = getAchievementCompletionPercent(half);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});

describe('mergeAchievements', () => {
  it('preserves unlocked state from saved data', () => {
    const saved: Achievement[] = ALL_ACHIEVEMENTS.map((a, i) =>
      i === 0 ? { ...a, unlocked: true, unlockedAt: 99999 } : { ...a }
    );
    const merged = mergeAchievements(saved, ALL_ACHIEVEMENTS);
    expect(merged[0].unlocked).toBe(true);
    expect(merged[0].unlockedAt).toBe(99999);
  });

  it('adds new achievements not in saved data', () => {
    const saved: Achievement[] = [];
    const merged = mergeAchievements(saved, ALL_ACHIEVEMENTS);
    expect(merged.length).toBe(ALL_ACHIEVEMENTS.length);
    expect(merged.every(a => !a.unlocked)).toBe(true);
  });
});
