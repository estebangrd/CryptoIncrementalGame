import { GameState, Achievement } from '../types/game';
import { ALL_ACHIEVEMENTS } from '../data/achievements';

export const checkAchievements = (gameState: GameState): Achievement[] => {
  const achievements = [...(gameState.achievements || ALL_ACHIEVEMENTS)];

  achievements.forEach((achievement, index) => {
    if (achievement.unlocked) return;

    let shouldUnlock = false;
    let newProgress = achievement.progress ?? 0;

    switch (achievement.id) {
      case 'first_block':
        newProgress = Math.min(gameState.blocksMined, 1);
        shouldUnlock = gameState.blocksMined >= 1;
        break;
      case 'century':
        newProgress = Math.min(gameState.blocksMined, 100);
        shouldUnlock = gameState.blocksMined >= 100;
        break;
      case 'millennium':
        newProgress = Math.min(gameState.blocksMined, 1000);
        shouldUnlock = gameState.blocksMined >= 1000;
        break;
      case 'epic_miner':
        newProgress = Math.min(gameState.blocksMined, 100000);
        shouldUnlock = gameState.blocksMined >= 100000;
        break;
      case 'halving_survivor':
        // First halving occurs after 210,000 blocks mined
        shouldUnlock = gameState.blocksMined >= 210000;
        break;
      case 'first_steps': {
        const totalHardware = gameState.hardware
          .filter(h => h.id !== 'manual_mining')
          .reduce((sum, h) => sum + h.owned, 0);
        shouldUnlock = totalHardware >= 1;
        break;
      }
      case 'upgrader': {
        const maxOwned = Math.max(...gameState.hardware.map(h => h.owned));
        newProgress = Math.min(maxOwned, 10);
        shouldUnlock = maxOwned >= 10;
        break;
      }
      case 'hardware_collector': {
        const purchasableHardware = gameState.hardware.filter(h => h.id !== 'manual_mining');
        shouldUnlock = purchasableHardware.length > 0 && purchasableHardware.every(h => h.owned >= 1);
        break;
      }
      case 'asic_master': {
        const asicGen3 = gameState.hardware.find(h => h.id === 'asic_gen3');
        const owned = asicGen3?.owned ?? 0;
        newProgress = Math.min(owned, 100);
        shouldUnlock = owned >= 100;
        break;
      }
      case 'first_sale':
        shouldUnlock = (gameState.totalRealMoneyEarned ?? 0) > 0;
        break;
      case 'millionaire': {
        const money = gameState.realMoney ?? 0;
        newProgress = Math.min(money, 1000000);
        shouldUnlock = money >= 1000000;
        break;
      }
      case 'market_trader':
        // Will be unlocked via UNLOCK_ACHIEVEMENT action — no auto-tracking
        break;
      case 'rebirth':
        shouldUnlock = (gameState.prestigeLevel ?? 0) >= 1;
        break;
      case 'veteran':
        newProgress = Math.min(gameState.prestigeLevel ?? 0, 10);
        shouldUnlock = (gameState.prestigeLevel ?? 0) >= 10;
        break;
      case 'eternal':
        newProgress = Math.min(gameState.prestigeLevel ?? 0, 100);
        shouldUnlock = (gameState.prestigeLevel ?? 0) >= 100;
        break;
      default:
        break;
    }

    const updated: Achievement = {
      ...achievement,
      progress: newProgress,
    };

    if (shouldUnlock && !achievement.unlocked) {
      updated.unlocked = true;
      updated.unlockedAt = Date.now();
    }

    achievements[index] = updated;
  });

  return achievements;
};

export const getNewlyUnlockedAchievements = (
  oldAchievements: Achievement[],
  newAchievements: Achievement[]
): Achievement[] => {
  return newAchievements.filter((newA) => {
    const oldA = oldAchievements.find(a => a.id === newA.id);
    return newA.unlocked && oldA && !oldA.unlocked;
  });
};

export const getAchievementCompletionPercent = (achievements: Achievement[]): number => {
  if (achievements.length === 0) return 0;
  const unlocked = achievements.filter(a => a.unlocked).length;
  return Math.round((unlocked / achievements.length) * 100);
};

// Merge newly added achievements into existing list (for app updates)
export const mergeAchievements = (
  saved: Achievement[],
  defaults: Achievement[]
): Achievement[] => {
  return defaults.map(defaultA => {
    const savedA = saved.find(a => a.id === defaultA.id);
    return savedA ?? defaultA;
  });
};
