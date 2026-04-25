/**
 * Unit tests for Prestige Skill Tree.
 * Based on spec: specs/game-mechanics/skill-tree.md
 */

import {
  calculateAvailableSkillPoints,
  calculateSkillTreeHardwareMultiplier,
  calculateSkillTreeMarketMultiplier,
  calculateSkillTreeClickMultiplier,
  canPurchaseNode,
  purchaseNode,
  resetSkillTree,
  hasPurchasedNodes,
  migrateSkillTree,
  getBranchBonusPercent,
  sumPurchasedCost,
  isSkillTreeMastered,
  calculateMasteryLevel,
  calculateMasteryProductionMultiplier,
  calculateMasteryClickMultiplier,
  getTotalTreeCost,
} from '../src/utils/skillTreeLogic';
import { getInitialSkillTree, buildInitialSkillNodes } from '../src/data/skillTree';
import { GameState, PrestigeSkillTree } from '../src/types/game';
import { SKILL_TREE_CONFIG } from '../src/config/balanceConfig';

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  prestigeLevel: 0,
  prestigeSkillTree: getInitialSkillTree(),
  ...overrides,
} as GameState);

const stateWithPurchased = (nodeIds: string[], prestigeLevel: number): GameState => {
  let tree = getInitialSkillTree();
  for (const id of nodeIds) {
    tree = purchaseNode(tree, id);
  }
  return makeState({ prestigeLevel, prestigeSkillTree: tree });
};

describe('buildInitialSkillNodes', () => {
  it('creates 18 nodes (3 branches × 6 positions)', () => {
    const nodes = buildInitialSkillNodes();
    expect(nodes).toHaveLength(18);
  });

  it('assigns correct values from SKILL_TREE_CONFIG', () => {
    const nodes = buildInitialSkillNodes();
    const hardware1 = nodes.find(n => n.id === 'hardware_1');
    expect(hardware1?.value).toBe(SKILL_TREE_CONFIG.NODE_VALUES.hardware[0]);
    const click6 = nodes.find(n => n.id === 'click_6');
    expect(click6?.value).toBe(SKILL_TREE_CONFIG.NODE_VALUES.click[5]);
  });

  it('assigns correct cost from NODE_COSTS', () => {
    const nodes = buildInitialSkillNodes();
    expect(nodes.find(n => n.id === 'hardware_1')?.cost).toBe(SKILL_TREE_CONFIG.NODE_COSTS[0]);
    expect(nodes.find(n => n.id === 'market_3')?.cost).toBe(SKILL_TREE_CONFIG.NODE_COSTS[2]);
    expect(nodes.find(n => n.id === 'click_6')?.cost).toBe(SKILL_TREE_CONFIG.NODE_COSTS[5]);
  });

  it('all nodes start unpurchased', () => {
    const nodes = buildInitialSkillNodes();
    expect(nodes.every(n => !n.purchased)).toBe(true);
  });
});

describe('calculateAvailableSkillPoints', () => {
  it('returns 0 at prestige level 0', () => {
    expect(calculateAvailableSkillPoints(makeState({ prestigeLevel: 0 }))).toBe(0);
  });

  it('returns prestigeLevel when nothing spent or lost', () => {
    expect(calculateAvailableSkillPoints(makeState({ prestigeLevel: 5 }))).toBe(5);
  });

  it('subtracts sum of purchased node costs', () => {
    // hardware_1 (cost 1) + hardware_2 (cost 1) = 2 spent
    const state = stateWithPurchased(['hardware_1', 'hardware_2'], 5);
    expect(calculateAvailableSkillPoints(state)).toBe(3);
  });

  it('subtracts higher costs for later nodes', () => {
    // 1 + 1 + 2 = 4 spent (positions 1, 2, 3)
    const state = stateWithPurchased(['hardware_1', 'hardware_2', 'hardware_3'], 10);
    expect(calculateAvailableSkillPoints(state)).toBe(6);
  });

  it('correctly sums all 6 nodes of a branch (=12 spent)', () => {
    const state = stateWithPurchased(
      ['hardware_1', 'hardware_2', 'hardware_3', 'hardware_4', 'hardware_5', 'hardware_6'],
      15,
    );
    expect(calculateAvailableSkillPoints(state)).toBe(3); // 15 - 12 = 3
  });

  it('subtracts lost points (respec penalty)', () => {
    const tree: PrestigeSkillTree = { nodes: buildInitialSkillNodes(), lostPoints: 2 };
    expect(calculateAvailableSkillPoints(makeState({ prestigeLevel: 5, prestigeSkillTree: tree }))).toBe(3);
  });

  it('clamps to 0 (never negative)', () => {
    const tree: PrestigeSkillTree = { nodes: buildInitialSkillNodes(), lostPoints: 100 };
    expect(calculateAvailableSkillPoints(makeState({ prestigeLevel: 2, prestigeSkillTree: tree }))).toBe(0);
  });
});

describe('calculateSkillTreeHardwareMultiplier', () => {
  it('returns 1.0 with no hardware nodes purchased', () => {
    expect(calculateSkillTreeHardwareMultiplier(makeState())).toBe(1.0);
  });

  it('returns 1.05 with hardware_1', () => {
    const state = stateWithPurchased(['hardware_1'], 1);
    expect(calculateSkillTreeHardwareMultiplier(state)).toBeCloseTo(1.05, 5);
  });

  it('stacks additively within the branch', () => {
    const state = stateWithPurchased(['hardware_1', 'hardware_2', 'hardware_3'], 3);
    // 0.05 + 0.10 + 0.10 = 0.25 → 1.25
    expect(calculateSkillTreeHardwareMultiplier(state)).toBeCloseTo(1.25, 5);
  });

  it('returns 1.80 when all 6 hardware nodes are purchased', () => {
    const state = stateWithPurchased(
      ['hardware_1', 'hardware_2', 'hardware_3', 'hardware_4', 'hardware_5', 'hardware_6'],
      6,
    );
    expect(calculateSkillTreeHardwareMultiplier(state)).toBeCloseTo(1.80, 5);
  });

  it('ignores non-hardware nodes', () => {
    const state = stateWithPurchased(['market_1', 'click_1'], 2);
    expect(calculateSkillTreeHardwareMultiplier(state)).toBe(1.0);
  });
});

describe('calculateSkillTreeMarketMultiplier', () => {
  it('returns 1.52 when all 6 market nodes are purchased', () => {
    const state = stateWithPurchased(
      ['market_1', 'market_2', 'market_3', 'market_4', 'market_5', 'market_6'],
      6,
    );
    expect(calculateSkillTreeMarketMultiplier(state)).toBeCloseTo(1.52, 5);
  });
});

describe('calculateSkillTreeClickMultiplier', () => {
  it('returns 2.50 when all 6 click nodes are purchased', () => {
    const state = stateWithPurchased(
      ['click_1', 'click_2', 'click_3', 'click_4', 'click_5', 'click_6'],
      6,
    );
    expect(calculateSkillTreeClickMultiplier(state)).toBeCloseTo(2.50, 5);
  });
});

describe('canPurchaseNode', () => {
  it('allows purchasing node 1 of any branch if points available', () => {
    const state = makeState({ prestigeLevel: 1 });
    expect(canPurchaseNode(state, 'hardware_1')).toBe(true);
    expect(canPurchaseNode(state, 'market_1')).toBe(true);
    expect(canPurchaseNode(state, 'click_1')).toBe(true);
  });

  it('blocks node 2 when node 1 is not purchased', () => {
    const state = makeState({ prestigeLevel: 2 });
    expect(canPurchaseNode(state, 'hardware_2')).toBe(false);
  });

  it('allows node 2 when node 1 is purchased and points available', () => {
    const state = stateWithPurchased(['hardware_1'], 2);
    expect(canPurchaseNode(state, 'hardware_2')).toBe(true);
  });

  it('blocks purchase when no points available', () => {
    const state = stateWithPurchased(['hardware_1'], 1);
    expect(canPurchaseNode(state, 'market_1')).toBe(false);
  });

  it('blocks node 3 when only 1 point available (node 3 costs 2)', () => {
    // hardware_1 (1) + hardware_2 (1) purchased → 2 spent, prestige=3 → 1 available
    const state = stateWithPurchased(['hardware_1', 'hardware_2'], 3);
    expect(canPurchaseNode(state, 'hardware_3')).toBe(false);
  });

  it('allows node 3 when 2 points available (matches cost)', () => {
    // hardware_1 (1) + hardware_2 (1) purchased → 2 spent, prestige=4 → 2 available
    const state = stateWithPurchased(['hardware_1', 'hardware_2'], 4);
    expect(canPurchaseNode(state, 'hardware_3')).toBe(true);
  });

  it('blocks node 6 (cost 3) when only 2 points available', () => {
    const ids = ['hardware_1', 'hardware_2', 'hardware_3', 'hardware_4', 'hardware_5'];
    // Spent: 1+1+2+2+3 = 9, prestige=11 → 2 available, but node 6 costs 3
    const state = stateWithPurchased(ids, 11);
    expect(canPurchaseNode(state, 'hardware_6')).toBe(false);
  });

  it('blocks already-purchased node', () => {
    const state = stateWithPurchased(['hardware_1'], 5);
    expect(canPurchaseNode(state, 'hardware_1')).toBe(false);
  });

  it('returns false for unknown node id', () => {
    const state = makeState({ prestigeLevel: 5 });
    expect(canPurchaseNode(state, 'does_not_exist')).toBe(false);
  });
});

describe('resetSkillTree', () => {
  it('unpurchases all nodes and increments lostPoints', () => {
    const tree = purchaseNode(purchaseNode(getInitialSkillTree(), 'hardware_1'), 'hardware_2');
    const reset = resetSkillTree(tree);
    expect(reset.nodes.every(n => !n.purchased)).toBe(true);
    expect(reset.lostPoints).toBe(1);
  });

  it('adds 1 point loss each time it is called', () => {
    let tree = purchaseNode(getInitialSkillTree(), 'hardware_1');
    tree = resetSkillTree(tree);
    tree = purchaseNode(tree, 'market_1');
    tree = resetSkillTree(tree);
    expect(tree.lostPoints).toBe(2);
  });
});

describe('sumPurchasedCost', () => {
  it('returns 0 on fresh tree', () => {
    expect(sumPurchasedCost(getInitialSkillTree())).toBe(0);
  });

  it('sums costs across branches', () => {
    let tree = purchaseNode(getInitialSkillTree(), 'hardware_1'); // cost 1
    tree = purchaseNode(tree, 'market_1');                         // cost 1
    tree = purchaseNode(tree, 'click_1');                          // cost 1
    expect(sumPurchasedCost(tree)).toBe(3);
  });

  it('sums correctly when later nodes are purchased', () => {
    let tree = getInitialSkillTree();
    for (const id of ['hardware_1', 'hardware_2', 'hardware_3', 'hardware_4']) {
      tree = purchaseNode(tree, id);
    }
    // 1 + 1 + 2 + 2 = 6
    expect(sumPurchasedCost(tree)).toBe(6);
  });
});

describe('hasPurchasedNodes', () => {
  it('returns false on fresh tree', () => {
    expect(hasPurchasedNodes(getInitialSkillTree())).toBe(false);
  });

  it('returns true after any purchase', () => {
    const tree = purchaseNode(getInitialSkillTree(), 'click_1');
    expect(hasPurchasedNodes(tree)).toBe(true);
  });
});

describe('migrateSkillTree', () => {
  it('returns initial tree when input is undefined (legacy save)', () => {
    const migrated = migrateSkillTree(undefined);
    expect(migrated.nodes).toHaveLength(18);
    expect(migrated.lostPoints).toBe(0);
  });

  it('preserves purchased state for existing nodes', () => {
    const tree = purchaseNode(getInitialSkillTree(), 'hardware_1');
    const migrated = migrateSkillTree(tree);
    expect(migrated.nodes.find(n => n.id === 'hardware_1')?.purchased).toBe(true);
  });

  it('preserves lostPoints', () => {
    const tree: PrestigeSkillTree = { nodes: buildInitialSkillNodes(), lostPoints: 3 };
    expect(migrateSkillTree(tree).lostPoints).toBe(3);
  });

  it('clamps negative lostPoints to 0', () => {
    const tree = { nodes: buildInitialSkillNodes(), lostPoints: -5 } as PrestigeSkillTree;
    expect(migrateSkillTree(tree).lostPoints).toBe(0);
  });
});

describe('getTotalTreeCost', () => {
  it('returns 36 (sum of all node costs across 3 branches)', () => {
    expect(getTotalTreeCost()).toBe(36);
  });
});

const allNodeIds = [
  'hardware_1', 'hardware_2', 'hardware_3', 'hardware_4', 'hardware_5', 'hardware_6',
  'market_1', 'market_2', 'market_3', 'market_4', 'market_5', 'market_6',
  'click_1', 'click_2', 'click_3', 'click_4', 'click_5', 'click_6',
];

describe('isSkillTreeMastered', () => {
  it('returns false when no nodes purchased', () => {
    expect(isSkillTreeMastered(getInitialSkillTree())).toBe(false);
  });

  it('returns false when partial', () => {
    const tree = purchaseNode(getInitialSkillTree(), 'hardware_1');
    expect(isSkillTreeMastered(tree)).toBe(false);
  });

  it('returns true when all 18 nodes are purchased', () => {
    let tree = getInitialSkillTree();
    for (const id of allNodeIds) tree = purchaseNode(tree, id);
    expect(isSkillTreeMastered(tree)).toBe(true);
  });

  it('returns false for undefined tree', () => {
    expect(isSkillTreeMastered(undefined)).toBe(false);
  });
});

describe('calculateMasteryLevel', () => {
  it('returns 0 when tree is not mastered', () => {
    const state = stateWithPurchased(['hardware_1'], 50);
    expect(calculateMasteryLevel(state)).toBe(0);
  });

  it('returns 0 at exactly P36 with mastered tree (0 surplus)', () => {
    const state = stateWithPurchased(allNodeIds, 36);
    expect(calculateMasteryLevel(state)).toBe(0);
  });

  it('returns 4 at P40 with mastered tree (40 - 36 - 0)', () => {
    const state = stateWithPurchased(allNodeIds, 40);
    expect(calculateMasteryLevel(state)).toBe(4);
  });

  it('subtracts lostPoints from mastery level', () => {
    let tree = getInitialSkillTree();
    for (const id of allNodeIds) tree = purchaseNode(tree, id);
    tree = { ...tree, lostPoints: 2 };
    const state = makeState({ prestigeLevel: 40, prestigeSkillTree: tree });
    expect(calculateMasteryLevel(state)).toBe(2); // 40 - 36 - 2
  });

  it('clamps to 0 when lostPoints exceed surplus', () => {
    let tree = getInitialSkillTree();
    for (const id of allNodeIds) tree = purchaseNode(tree, id);
    tree = { ...tree, lostPoints: 10 };
    const state = makeState({ prestigeLevel: 40, prestigeSkillTree: tree });
    expect(calculateMasteryLevel(state)).toBe(0);
  });
});

describe('calculateMasteryProductionMultiplier', () => {
  it('returns 1.0 when not mastered', () => {
    const state = stateWithPurchased(['hardware_1'], 50);
    expect(calculateMasteryProductionMultiplier(state)).toBe(1.0);
  });

  it('returns 1.0 at exactly P36 mastered (level 0)', () => {
    const state = stateWithPurchased(allNodeIds, 36);
    expect(calculateMasteryProductionMultiplier(state)).toBe(1.0);
  });

  it('returns 1.4 at P40 mastered (+40% from level 4)', () => {
    const state = stateWithPurchased(allNodeIds, 40);
    expect(calculateMasteryProductionMultiplier(state)).toBeCloseTo(1.4, 5);
  });

  it('returns 1.0 if mastery breaks via respec (mastered=false)', () => {
    let tree = getInitialSkillTree();
    for (const id of allNodeIds) tree = purchaseNode(tree, id);
    tree = resetSkillTree(tree); // unpurchases all → not mastered
    const state = makeState({ prestigeLevel: 40, prestigeSkillTree: tree });
    expect(calculateMasteryProductionMultiplier(state)).toBe(1.0);
  });
});

describe('calculateMasteryClickMultiplier', () => {
  it('returns 1.0 when not mastered', () => {
    const state = stateWithPurchased(['hardware_1'], 50);
    expect(calculateMasteryClickMultiplier(state)).toBe(1.0);
  });

  it('returns 1.20 at P40 mastered (+20% from level 4)', () => {
    const state = stateWithPurchased(allNodeIds, 40);
    expect(calculateMasteryClickMultiplier(state)).toBeCloseTo(1.20, 5);
  });
});

describe('respec continuation semantics', () => {
  it('after respec at P40 → mastery breaks (level 0)', () => {
    let tree = getInitialSkillTree();
    for (const id of allNodeIds) tree = purchaseNode(tree, id);
    tree = resetSkillTree(tree);
    const state = makeState({ prestigeLevel: 40, prestigeSkillTree: tree });
    expect(isSkillTreeMastered(state.prestigeSkillTree)).toBe(false);
    expect(calculateMasteryLevel(state)).toBe(0);
  });

  it('after respec + 1 prestige + re-master, mastery continues from same level', () => {
    // Pre-respec at P40: level = 4
    // Post-respec at P40: lost=1, mastery broken
    // After 1 prestige to P41 + re-buying all 18 nodes: lost=1, mastered=true
    // Mastery level = 41 - 36 - 1 = 4 (continued)
    let tree = getInitialSkillTree();
    for (const id of allNodeIds) tree = purchaseNode(tree, id);
    tree = resetSkillTree(tree); // lost=1, all unpurchased
    for (const id of allNodeIds) tree = purchaseNode(tree, id); // re-purchased
    const state = makeState({ prestigeLevel: 41, prestigeSkillTree: tree });
    expect(isSkillTreeMastered(state.prestigeSkillTree)).toBe(true);
    expect(calculateMasteryLevel(state)).toBe(4);
  });
});

describe('getBranchBonusPercent', () => {
  it('returns 0 when no nodes purchased in branch', () => {
    expect(getBranchBonusPercent(makeState(), 'hardware')).toBe(0);
  });

  it('returns 15 when hardware_1 + hardware_2 purchased (+5 + +10)', () => {
    const state = stateWithPurchased(['hardware_1', 'hardware_2'], 2);
    expect(getBranchBonusPercent(state, 'hardware')).toBe(15);
  });
});
