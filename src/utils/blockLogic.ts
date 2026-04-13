import { GameState } from '../types/game';
import { BLOCK_CONFIG } from '../config/balanceConfig';
import { getBadgeClickMultiplier } from './prestigeLogic';

// Phase 1: Genesis - Block system constants
export const GENESIS_CONSTANTS = {
  TOTAL_BLOCKS: BLOCK_CONFIG.TOTAL_BLOCKS,
  INITIAL_REWARD: BLOCK_CONFIG.INITIAL_REWARD,
  HALVING_INTERVAL: BLOCK_CONFIG.HALVING_INTERVAL,
  INITIAL_DIFFICULTY: BLOCK_CONFIG.INITIAL_DIFFICULTY,
  MAX_COINS: 21000000, // Maximum coins that can ever exist (21M like Bitcoin)
};

// Calculate current block reward based on halvings
export const calculateCurrentReward = (blocksMined: number): number => {
  const halvings = Math.floor(blocksMined / GENESIS_CONSTANTS.HALVING_INTERVAL);
  return GENESIS_CONSTANTS.INITIAL_REWARD / Math.pow(2, halvings);
};

// Calculate next halving block
export const calculateNextHalving = (blocksMined: number): number => {
  const currentHalving = Math.floor(blocksMined / GENESIS_CONSTANTS.HALVING_INTERVAL);
  return (currentHalving + 1) * GENESIS_CONSTANTS.HALVING_INTERVAL;
};

// Calculate blocks until next halving
export const getBlocksUntilHalving = (blocksMined: number): number => {
  return calculateNextHalving(blocksMined) - blocksMined;
};

// Calculate total coins mined so far
export const calculateTotalCoinsMined = (blocksMined: number): number => {
  let totalCoins = 0;
  let currentReward = GENESIS_CONSTANTS.INITIAL_REWARD;
  let blocksLeft = blocksMined;
  
  while (blocksLeft > 0) {
    const blocksInThisHalving = Math.min(blocksLeft, GENESIS_CONSTANTS.HALVING_INTERVAL);
    totalCoins += blocksInThisHalving * currentReward;
    blocksLeft -= blocksInThisHalving;
    currentReward /= 2;
  }
  
  return totalCoins;
};

// Difficulty scales with total mining speed (hash-rate-based)
export const calculateDifficulty = (totalMiningSpeed: number): number => {
  const { AMPLITUDE, SCALE, EXPONENT } = BLOCK_CONFIG.DIFFICULTY;
  if (totalMiningSpeed <= 0) return 1.0;
  return 1.0 + AMPLITUDE * Math.pow(totalMiningSpeed / SCALE, EXPONENT);
};

// Get current era (0-indexed) based on blocks mined
export const getEra = (blocksMined: number): number => {
  return Math.floor(blocksMined / GENESIS_CONSTANTS.HALVING_INTERVAL);
};

// Get base CC price for the current era
export const getBasePrice = (blocksMined: number): number => {
  const era = getEra(blocksMined);
  const prices = BLOCK_CONFIG.ERA_BASE_PRICES;
  if (era < prices.length) return prices[era];
  // Beyond defined eras: compensate halving (2^n) with gentle power-law growth
  // R(n) = (1 + 0.04n)^0.85 adds ~4% initial growth that decelerates to <1%/era
  const n = era - (prices.length - 1);
  const R = Math.pow(1 + 0.04 * n, 0.85);
  return prices[prices.length - 1] * Math.pow(2, n) * R;
};

// Calculate block mining time based on difficulty and hash rate
export const calculateBlockTime = (difficulty: number, hashRate: number): number => {
  if (hashRate <= 0) return Infinity;
  return Math.max(1, difficulty / hashRate);
};

// Check if a block can be mined
export const canMineBlock = (gameState: GameState): boolean => {
  return gameState.blocksMined < GENESIS_CONSTANTS.TOTAL_BLOCKS;
};

// Calculate click multiplier from purchased upgrades + prestige bonus
const getClickMultiplier = (gameState: GameState): number => {
  const upgradeMultiplier = gameState.upgrades
    .filter(u => u.purchased && u.effect.type === 'clickPower')
    .reduce((acc, u) => acc * u.effect.value, 1);
  const prestigeClickMultiplier = gameState.prestigeClickMultiplier ?? 1;
  const badgeClickMult = getBadgeClickMultiplier(gameState.unlockedBadges || []);
  return upgradeMultiplier * prestigeClickMultiplier * badgeClickMult;
};

// Mine a block and return updated game state
export const mineBlock = (gameState: GameState): GameState => {
  if (!canMineBlock(gameState)) return gameState;

  const newGameState = { ...gameState };
  const baseReward = calculateCurrentReward(gameState.blocksMined);
  const clickMultiplier = getClickMultiplier(gameState);
  const reward = baseReward * clickMultiplier;

  // Mine the block
  newGameState.blocksMined += 1;
  newGameState.cryptoCoins += reward;
  newGameState.totalCryptoCoins += reward;
  
  // Debug logs after mining
  console.log('DEBUG: mineBlock - After mining');
  console.log('DEBUG: new blocksMined:', newGameState.blocksMined);
  console.log('DEBUG: new cryptoCoins:', newGameState.cryptoCoins);
  
  // Update current reward
  newGameState.currentReward = calculateCurrentReward(newGameState.blocksMined);
  
  // Update next halving
  newGameState.nextHalving = calculateNextHalving(newGameState.blocksMined);
  
  return newGameState;
};

// Check if Phase 1 is complete
export const isPhase1Complete = (gameState: GameState): boolean => {
  return gameState.blocksMined >= GENESIS_CONSTANTS.TOTAL_BLOCKS;
};

// Get phase progress percentage
export const getPhaseProgress = (gameState: GameState): number => {
  return (gameState.blocksMined / GENESIS_CONSTANTS.TOTAL_BLOCKS) * 100;
};

// Format block information for display
export const formatBlockInfo = (gameState: GameState) => {
  return {
    blocksMined: gameState.blocksMined,
    totalBlocks: GENESIS_CONSTANTS.TOTAL_BLOCKS,
    blocksRemaining: GENESIS_CONSTANTS.TOTAL_BLOCKS - gameState.blocksMined,
    currentReward: gameState.currentReward,
    nextHalving: gameState.nextHalving,
    blocksUntilHalving: getBlocksUntilHalving(gameState.blocksMined),
    totalCoinsMined: calculateTotalCoinsMined(gameState.blocksMined),
    difficulty: gameState.difficulty,
    totalHashRate: gameState.totalHashRate,
    blockTime: calculateBlockTime(gameState.difficulty, gameState.totalHashRate),
    phaseProgress: getPhaseProgress(gameState),
  };
};
