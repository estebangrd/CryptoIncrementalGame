import { GameState } from '../types/game';
import { PRESTIGE_CONFIG } from '../config/balanceConfig';
import { ALL_BADGES } from '../data/badges';

export const calculateProductionMultiplier = (prestigeLevel: number): number => {
  return 1 + (prestigeLevel * PRESTIGE_CONFIG.bonuses.productionBonus);
};

export const calculateClickMultiplier = (prestigeLevel: number): number => {
  return 1 + (prestigeLevel * PRESTIGE_CONFIG.bonuses.clickBonus);
};

export const canPrestige = (gameState: GameState): boolean => {
  return gameState.blocksMined >= PRESTIGE_CONFIG.requirements.minBlocks;
};

export const checkBadgeUnlocks = (gameState: GameState): string[] => {
  const unlockedBadges = [...(gameState.unlockedBadges || [])];

  for (const badge of ALL_BADGES) {
    if (unlockedBadges.includes(badge.id)) {
      continue;
    }

    let shouldUnlock = false;

    switch (badge.unlockCondition.type) {
      case 'prestige_level':
        shouldUnlock = gameState.prestigeLevel >= (badge.unlockCondition.value as number);
        break;
      case 'speed': {
        const history = gameState.prestigeHistory || [];
        const lastRun = history[history.length - 1];
        shouldUnlock = !!lastRun && lastRun.duration > 0 && lastRun.duration <= (badge.unlockCondition.value as number);
        break;
      }
      case 'total_money': {
        const totalMoney = (gameState.prestigeHistory || []).reduce(
          (sum, run) => sum + run.totalMoneyEarned,
          gameState.totalRealMoneyEarned || 0
        );
        shouldUnlock = totalMoney >= (badge.unlockCondition.value as number);
        break;
      }
      case 'special': {
        if (badge.unlockCondition.value === 'all_badges') {
          const otherBadges = ALL_BADGES.filter(b => b.id !== badge.id);
          shouldUnlock = otherBadges.every(b => unlockedBadges.includes(b.id));
        }
        break;
      }
      default:
        break;
    }

    if (shouldUnlock) {
      unlockedBadges.push(badge.id);
    }
  }

  return unlockedBadges;
};

// Keep for backwards compat (old screens might call this)
export const getPrestigeBonus = (prestigeLevel: number): string => {
  const productionPct = Math.round(prestigeLevel * PRESTIGE_CONFIG.bonuses.productionBonus * 100);
  return `+${productionPct}% production`;
};
