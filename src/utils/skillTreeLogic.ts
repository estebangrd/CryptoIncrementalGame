import { GameState, PrestigeSkillTree, SkillNode, SkillTreeBranch } from '../types/game';
import { SKILL_TREE_CONFIG, PRESTIGE_CONFIG } from '../config/balanceConfig';
import { buildInitialSkillNodes, getInitialSkillTree } from '../data/skillTree';

/**
 * Total points required to fully purchase the entire skill tree.
 * Sum of all node costs across all branches.
 * With NODE_COSTS = [1,1,2,2,3,3] and 3 branches → 12 × 3 = 36.
 */
export const getTotalTreeCost = (): number =>
  SKILL_TREE_CONFIG.NODE_COSTS.reduce((sum, c) => sum + c, 0)
    * SKILL_TREE_CONFIG.BRANCHES.length;

/**
 * Returns true when every node of the tree is purchased.
 * Used as the gate for "Mastery Bonuses" (the legacy auto prestige bonuses
 * resume after the player completes the tree).
 */
export const isSkillTreeMastered = (tree: PrestigeSkillTree | undefined): boolean => {
  if (!tree) return false;
  if (tree.nodes.length === 0) return false;
  return tree.nodes.every(n => n.purchased);
};

/**
 * How many "post-mastery" prestige levels the player has earned.
 * Returns 0 unless the tree is currently mastered.
 *
 * Formula: prestigeLevel - totalTreeCost - lostPoints (clamped at 0).
 *
 * The lostPoints subtraction means each respec costs the player one
 * "post-mastery prestige level" — they need an extra prestige to make it up.
 */
export const calculateMasteryLevel = (state: GameState): number => {
  const tree = state.prestigeSkillTree;
  if (!isSkillTreeMastered(tree)) return 0;
  const earned = state.prestigeLevel ?? 0;
  return Math.max(0, earned - getTotalTreeCost() - (tree?.lostPoints ?? 0));
};

export const calculateMasteryProductionMultiplier = (state: GameState): number => {
  const level = calculateMasteryLevel(state);
  return 1 + level * PRESTIGE_CONFIG.bonuses.productionBonus;
};

export const calculateMasteryClickMultiplier = (state: GameState): number => {
  const level = calculateMasteryLevel(state);
  return 1 + level * PRESTIGE_CONFIG.bonuses.clickBonus;
};

/**
 * Ensures the skill tree has all 18 nodes. Used when loading saves created
 * before the feature or when new nodes are added in future updates.
 * Always re-applies canonical node values and costs from config, so balance
 * tweaks propagate to existing players.
 */
export const migrateSkillTree = (tree: PrestigeSkillTree | undefined): PrestigeSkillTree => {
  if (!tree) return getInitialSkillTree();

  const expected = buildInitialSkillNodes();
  const byId = new Map(tree.nodes.map(n => [n.id, n]));
  const merged = expected.map(node => {
    const existing = byId.get(node.id);
    return existing ? { ...node, purchased: !!existing.purchased } : node;
  });

  return {
    nodes: merged,
    lostPoints: Math.max(0, tree.lostPoints ?? 0),
  };
};

export const countPurchasedNodes = (tree: PrestigeSkillTree): number =>
  tree.nodes.filter(n => n.purchased).length;

export const sumPurchasedCost = (tree: PrestigeSkillTree): number =>
  tree.nodes.filter(n => n.purchased).reduce((sum, n) => sum + n.cost, 0);

export const calculateAvailableSkillPoints = (state: GameState): number => {
  const tree = state.prestigeSkillTree;
  if (!tree) return 0;
  const spent = sumPurchasedCost(tree);
  const earned = (state.prestigeLevel ?? 0) * SKILL_TREE_CONFIG.POINTS_PER_PRESTIGE;
  return Math.max(0, earned - spent - tree.lostPoints);
};

const branchAdditiveBonus = (tree: PrestigeSkillTree, branch: SkillTreeBranch): number =>
  tree.nodes
    .filter(n => n.purchased && n.branch === branch)
    .reduce((sum, n) => sum + n.value, 0);

export const calculateSkillTreeHardwareMultiplier = (state: GameState): number => {
  if (!state.prestigeSkillTree) return 1;
  return 1 + branchAdditiveBonus(state.prestigeSkillTree, 'hardware');
};

export const calculateSkillTreeMarketMultiplier = (state: GameState): number => {
  if (!state.prestigeSkillTree) return 1;
  return 1 + branchAdditiveBonus(state.prestigeSkillTree, 'market');
};

export const calculateSkillTreeClickMultiplier = (state: GameState): number => {
  if (!state.prestigeSkillTree) return 1;
  return 1 + branchAdditiveBonus(state.prestigeSkillTree, 'click');
};

export const findSkillNode = (tree: PrestigeSkillTree, nodeId: string): SkillNode | undefined =>
  tree.nodes.find(n => n.id === nodeId);

export const canPurchaseNode = (state: GameState, nodeId: string): boolean => {
  const tree = state.prestigeSkillTree;
  if (!tree) return false;

  const node = findSkillNode(tree, nodeId);
  if (!node) return false;
  if (node.purchased) return false;
  if (calculateAvailableSkillPoints(state) < node.cost) return false;

  if (node.position === 1) return true;
  const prevId = `${node.branch}_${node.position - 1}`;
  const prev = findSkillNode(tree, prevId);
  return !!prev?.purchased;
};

export const purchaseNode = (tree: PrestigeSkillTree, nodeId: string): PrestigeSkillTree => ({
  ...tree,
  nodes: tree.nodes.map(n => (n.id === nodeId ? { ...n, purchased: true } : n)),
});

export const resetSkillTree = (tree: PrestigeSkillTree): PrestigeSkillTree => ({
  nodes: tree.nodes.map(n => ({ ...n, purchased: false })),
  lostPoints: tree.lostPoints + SKILL_TREE_CONFIG.RESPEC_COST,
});

export const hasPurchasedNodes = (tree: PrestigeSkillTree): boolean =>
  tree.nodes.some(n => n.purchased);

/**
 * Returns the additive percentage (for UI display) for a given branch.
 * E.g. { hardware_1, hardware_2 } purchased → 15.
 */
export const getBranchBonusPercent = (
  state: GameState,
  branch: SkillTreeBranch,
): number => {
  if (!state.prestigeSkillTree) return 0;
  return Math.round(branchAdditiveBonus(state.prestigeSkillTree, branch) * 100);
};
