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

  it('subtracts spent nodes', () => {
    const state = stateWithPurchased(['hardware_1', 'hardware_2'], 5);
    expect(calculateAvailableSkillPoints(state)).toBe(3);
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

describe('getBranchBonusPercent', () => {
  it('returns 0 when no nodes purchased in branch', () => {
    expect(getBranchBonusPercent(makeState(), 'hardware')).toBe(0);
  });

  it('returns 15 when hardware_1 + hardware_2 purchased (+5 + +10)', () => {
    const state = stateWithPurchased(['hardware_1', 'hardware_2'], 2);
    expect(getBranchBonusPercent(state, 'hardware')).toBe(15);
  });
});
