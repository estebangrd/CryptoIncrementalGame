import { GameState, PrestigeSkillTree, SkillNode, SkillTreeBranch } from '../types/game';
import { SKILL_TREE_CONFIG } from '../config/balanceConfig';
import { buildInitialSkillNodes, getInitialSkillTree } from '../data/skillTree';

/**
 * Ensures the skill tree has all 18 nodes. Used when loading saves created
 * before the feature or when new nodes are added in future updates.
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

export const calculateAvailableSkillPoints = (state: GameState): number => {
  const tree = state.prestigeSkillTree;
  if (!tree) return 0;
  const spent = countPurchasedNodes(tree);
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
  if (calculateAvailableSkillPoints(state) < 1) return false;

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
