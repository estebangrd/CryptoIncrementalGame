import { Hardware } from '../types/game';

// Hardware progression based on the mining table
export const hardwareProgression: Hardware[] = [
  // Level 1: Manual Mining
  {
    id: 'manual_mining',
    name: 'Manual Mining',
    nameKey: 'hardware.manualMining',
    description: 'Mine blocks manually with your own hands',
    descriptionKey: 'hardware.manualMiningDesc',
    baseCost: 0,
    baseProduction: 10, // 10 H/s
    blockReward: 50,
    miningSpeed: 0.1, // 0.1 blocks/sec (6/min)
    electricityCost: 0,
    owned: 0, // Start with 0 manual miners (user must mine manually)
    costMultiplier: 1.15,
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
    baseCost: 100, // Reducido para mejor progresión
    baseProduction: 30, // 30 H/s
    blockReward: 45,
    miningSpeed: 0.3, // 0.3 blocks/sec (18/min)
    electricityCost: 0.5,
    owned: 0,
    costMultiplier: 1.15,
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
    baseCost: 400, // Reducido para mejor progresión
    baseProduction: 80, // 80 H/s
    blockReward: 42,
    miningSpeed: 0.8, // 0.8 blocks/sec (48/min)
    electricityCost: 1.2,
    owned: 0,
    costMultiplier: 1.15,
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
    baseCost: 1500, // Reducido para mejor progresión
    baseProduction: 250, // 250 H/s
    blockReward: 38,
    miningSpeed: 2.5, // 2.5 blocks/sec (150/min)
    electricityCost: 3,
    owned: 0,
    costMultiplier: 1.15,
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
    baseCost: 5000, // Reducido para mejor progresión
    baseProduction: 600, // 600 H/s
    blockReward: 35,
    miningSpeed: 6, // 6 blocks/sec (360/min)
    electricityCost: 7,
    owned: 0,
    costMultiplier: 1.15,
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
    baseCost: 15000, // Reducido para mejor progresión
    baseProduction: 1500, // 1500 H/s
    blockReward: 30,
    miningSpeed: 15, // 15 blocks/sec (900/min)
    electricityCost: 20,
    owned: 0,
    costMultiplier: 1.15,
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
    baseCost: 50000, // Reducido para mejor progresión
    baseProduction: 4000, // 4000 H/s
    blockReward: 25,
    miningSpeed: 40, // 40 blocks/sec (2400/min)
    electricityCost: 45,
    owned: 0,
    costMultiplier: 1.15,
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
    baseCost: 150000, // Reducido para mejor progresión
    baseProduction: 10000, // 10000 H/s
    blockReward: 20,
    miningSpeed: 100, // 100 blocks/sec (6000/min)
    electricityCost: 100,
    owned: 0,
    costMultiplier: 1.15,
    icon: '🏭',
    currencyId: 'cryptocoin',
    level: 8,
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
