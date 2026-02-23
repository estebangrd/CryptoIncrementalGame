import { Hardware } from '../types/game';
import { HARDWARE_CONFIG } from '../config/balanceConfig';

// Hardware progression based on the mining table
export const hardwareProgression: Hardware[] = [
  // Level 1: Manual Mining
  {
    id: 'manual_mining',
    name: 'Manual Mining',
    nameKey: 'hardware.manualMining',
    description: 'Mine blocks manually with your own hands',
    descriptionKey: 'hardware.manualMiningDesc',
    baseCost: HARDWARE_CONFIG.levels.manual_mining.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.manual_mining.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.manual_mining.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.manual_mining.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.manual_mining.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '👋',
    currencyId: 'cryptocoin',
    level: 1,
  },

  // Level 2: Basic CPU
  {
    id: 'basic_cpu',
    name: 'Basic CPU',
    nameKey: 'hardware.basicCPU',
    description: 'Basic CPU mining setup',
    descriptionKey: 'hardware.basicCPUDesc',
    baseCost: HARDWARE_CONFIG.levels.basic_cpu.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.basic_cpu.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.basic_cpu.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.basic_cpu.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.basic_cpu.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '💻',
    currencyId: 'cryptocoin',
    level: 2,
  },

  // Level 3: Advanced CPU
  {
    id: 'advanced_cpu',
    name: 'Advanced CPU',
    nameKey: 'hardware.advancedCPU',
    description: 'High-performance CPU mining',
    descriptionKey: 'hardware.advancedCPUDesc',
    baseCost: HARDWARE_CONFIG.levels.advanced_cpu.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.advanced_cpu.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.advanced_cpu.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.advanced_cpu.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.advanced_cpu.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🖥️',
    currencyId: 'cryptocoin',
    level: 3,
  },

  // Level 4: Basic GPU
  {
    id: 'basic_gpu',
    name: 'Basic GPU',
    nameKey: 'hardware.basicGPU',
    description: 'Entry-level GPU mining rig',
    descriptionKey: 'hardware.basicGPUDesc',
    baseCost: HARDWARE_CONFIG.levels.basic_gpu.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.basic_gpu.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.basic_gpu.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.basic_gpu.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.basic_gpu.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🎮',
    currencyId: 'cryptocoin',
    level: 4,
  },

  // Level 5: Advanced GPU
  {
    id: 'advanced_gpu',
    name: 'Advanced GPU',
    nameKey: 'hardware.advancedGPU',
    description: 'High-end GPU mining setup',
    descriptionKey: 'hardware.advancedGPUDesc',
    baseCost: HARDWARE_CONFIG.levels.advanced_gpu.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.advanced_gpu.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.advanced_gpu.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.advanced_gpu.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.advanced_gpu.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🚀',
    currencyId: 'cryptocoin',
    level: 5,
  },

  // Level 6: ASIC Gen 1
  {
    id: 'asic_gen1',
    name: 'ASIC Gen 1',
    nameKey: 'hardware.asicGen1',
    description: 'First generation ASIC miner',
    descriptionKey: 'hardware.asicGen1Desc',
    baseCost: HARDWARE_CONFIG.levels.asic_gen1.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.asic_gen1.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.asic_gen1.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.asic_gen1.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.asic_gen1.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '⚡',
    currencyId: 'cryptocoin',
    level: 6,
  },

  // Level 7: ASIC Gen 2
  {
    id: 'asic_gen2',
    name: 'ASIC Gen 2',
    nameKey: 'hardware.asicGen2',
    description: 'Second generation ASIC miner',
    descriptionKey: 'hardware.asicGen2Desc',
    baseCost: HARDWARE_CONFIG.levels.asic_gen2.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.asic_gen2.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.asic_gen2.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.asic_gen2.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.asic_gen2.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🔋',
    currencyId: 'cryptocoin',
    level: 7,
  },

  // Level 8: ASIC Gen 3
  {
    id: 'asic_gen3',
    name: 'ASIC Gen 3',
    nameKey: 'hardware.asicGen3',
    description: 'Third generation ASIC miner',
    descriptionKey: 'hardware.asicGen3Desc',
    baseCost: HARDWARE_CONFIG.levels.asic_gen3.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.asic_gen3.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.asic_gen3.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.asic_gen3.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.asic_gen3.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🏭',
    currencyId: 'cryptocoin',
    level: 8,
  },

  // Level 9: Mining Farm
  {
    id: 'mining_farm',
    name: 'Mining Farm',
    nameKey: 'hardware.miningFarm',
    description: 'An industrial facility consuming an entire city power grid',
    descriptionKey: 'hardware.miningFarmDesc',
    baseCost: HARDWARE_CONFIG.levels.mining_farm.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.mining_farm.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.mining_farm.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.mining_farm.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.mining_farm.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🏗️',
    currencyId: 'cryptocoin',
    level: 9,
  },

  // Level 10: Quantum Miner
  {
    id: 'quantum_miner',
    name: 'Quantum Miner',
    nameKey: 'hardware.quantumMiner',
    description: 'Quantum computers exploiting superposition to mine at impossible speeds',
    descriptionKey: 'hardware.quantumMinerDesc',
    baseCost: HARDWARE_CONFIG.levels.quantum_miner.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.quantum_miner.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.quantum_miner.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.quantum_miner.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.quantum_miner.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '⚛️',
    currencyId: 'cryptocoin',
    level: 10,
  },

  // Level 11: Supercomputer
  {
    id: 'supercomputer',
    name: 'Supercomputer',
    nameKey: 'hardware.supercomputer',
    description: 'A planetary megastructure converting Earth core energy into compute power',
    descriptionKey: 'hardware.supercomputerDesc',
    baseCost: HARDWARE_CONFIG.levels.supercomputer.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.supercomputer.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.supercomputer.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.supercomputer.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.supercomputer.electricityCost,
    owned: 0,
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: '🌍',
    currencyId: 'cryptocoin',
    level: 11,
  },
];

// Helper function to get hardware by level
export const getHardwareByLevel = (level: number): Hardware | undefined => {
  return hardwareProgression.find(h => h.level === level);
};

// Helper function to get next hardware level
export const getNextHardwareLevel = (currentLevel: number): Hardware | undefined => {
  return hardwareProgression.find(h => h.level === currentLevel + 1);
};

// Helper function to get previous hardware level
export const getPreviousHardwareLevel = (currentLevel: number): Hardware | undefined => {
  return hardwareProgression.find(h => h.level === currentLevel - 1);
};
