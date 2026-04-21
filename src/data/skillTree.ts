import { PrestigeSkillTree, SkillNode, SkillTreeBranch, SkillNodePosition } from '../types/game';
import { SKILL_TREE_CONFIG } from '../config/balanceConfig';

export const buildInitialSkillNodes = (): SkillNode[] => {
  const nodes: SkillNode[] = [];
  for (const branch of SKILL_TREE_CONFIG.BRANCHES) {
    const values = SKILL_TREE_CONFIG.NODE_VALUES[branch as SkillTreeBranch];
    for (let i = 0; i < SKILL_TREE_CONFIG.NODES_PER_BRANCH; i++) {
      const position = (i + 1) as SkillNodePosition;
      nodes.push({
        id: `${branch}_${position}`,
        branch: branch as SkillTreeBranch,
        position,
        value: values[i],
        nameKey: `skillTree.${branch}.node${position}.name`,
        descriptionKey: `skillTree.${branch}.node${position}.desc`,
        purchased: false,
      });
    }
  }
  return nodes;
};

export const getInitialSkillTree = (): PrestigeSkillTree => ({
  nodes: buildInitialSkillNodes(),
  lostPoints: 0,
});
