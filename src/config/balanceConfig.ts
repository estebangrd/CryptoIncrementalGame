/**
 * CONFIGURACIÓN DE BALANCE DEL JUEGO
 *
 * Este archivo centraliza todos los valores de balance del juego.
 * Modifica estos valores para ajustar la dificultad y progresión.
 */

// ============================================================================
// SISTEMA DE BLOQUES (GENESIS)
// ============================================================================
export const BLOCK_CONFIG = {
  // Total de bloques disponibles para minar
  TOTAL_BLOCKS: 21000000,

  // Recompensa inicial por bloque (CryptoCoins)
  INITIAL_REWARD: 50,

  // Cada cuántos bloques se reduce la recompensa a la mitad
  HALVING_INTERVAL: 210000,

  // Dificultad inicial de minado
  INITIAL_DIFFICULTY: 1,

  // Multiplicador de dificultad por bloque minado
  DIFFICULTY_INCREASE_RATE: 0.00001,
};

// ============================================================================
// HARDWARE - COSTOS Y PRODUCCIÓN
// ============================================================================
export const HARDWARE_CONFIG = {
  // Multiplicador de costo al comprar múltiples unidades
  COST_MULTIPLIER: 1.15,

  // Requisito de unidades del nivel anterior para desbloquear siguiente
  UNLOCK_REQUIREMENT: 5,

  // Configuración por nivel de hardware
  levels: {
    // Nivel 1: Manual Mining (oculto, solo para mecánica interna)
    manual_mining: {
      baseCost: 0,
      baseProduction: 10,        // Hash/s
      blockReward: 50,           // CryptoCoins por bloque
      miningSpeed: 0.1,          // Bloques/segundo
      electricityCost: 0,        // $/segundo
    },

    // Nivel 2: Basic CPU
    basic_cpu: {
      baseCost: 100,             // CryptoCoins
      baseProduction: 30,        // Hash/s
      blockReward: 45,           // CryptoCoins por bloque
      miningSpeed: 0.3,          // Bloques/segundo
      electricityCost: 0.5,      // $/segundo
    },

    // Nivel 3: Advanced CPU
    advanced_cpu: {
      baseCost: 400,
      baseProduction: 80,
      blockReward: 42,
      miningSpeed: 0.8,
      electricityCost: 1.2,
    },

    // Nivel 4: Basic GPU
    basic_gpu: {
      baseCost: 1500,
      baseProduction: 250,
      blockReward: 38,
      miningSpeed: 2.5,
      electricityCost: 3,
    },

    // Nivel 5: Advanced GPU
    advanced_gpu: {
      baseCost: 5000,
      baseProduction: 600,
      blockReward: 35,
      miningSpeed: 6,
      electricityCost: 7,
    },

    // Nivel 6: ASIC Gen 1
    asic_gen1: {
      baseCost: 15000,
      baseProduction: 1500,
      blockReward: 30,
      miningSpeed: 15,
      electricityCost: 20,
    },

    // Nivel 7: ASIC Gen 2
    asic_gen2: {
      baseCost: 50000,
      baseProduction: 4000,
      blockReward: 25,
      miningSpeed: 40,
      electricityCost: 45,
    },

    // Nivel 8: ASIC Gen 3
    asic_gen3: {
      baseCost: 150000,
      baseProduction: 10000,
      blockReward: 20,
      miningSpeed: 100,
      electricityCost: 100,
    },
  },
};

// ============================================================================
// CRIPTOMONEDAS - VALORES Y VOLATILIDAD
// ============================================================================
export const CRYPTO_CONFIG = {
  cryptocoin: {
    baseValue: 0.001,          // Valor base en $ por CryptoCoin
    volatility: 0.1,           // 10% de volatilidad
  },

  bitcoin: {
    baseValue: 10,             // Valor base en $ por Bitcoin
    volatility: 0.15,          // 15% de volatilidad
  },

  ethereum: {
    baseValue: 5,              // Valor base en $ por Ethereum
    volatility: 0.2,           // 20% de volatilidad
  },

  dogecoin: {
    baseValue: 0.01,           // Valor base en $ por Dogecoin
    volatility: 0.3,           // 30% de volatilidad
  },

  cardano: {
    baseValue: 0.05,           // Valor base en $ por Cardano
    volatility: 0.25,          // 25% de volatilidad
  },
};

// ============================================================================
// MEJORAS (UPGRADES)
// ============================================================================
export const UPGRADE_CONFIG = {
  // Click Power - Aumenta CryptoCoins por click
  clickPower: {
    cost: 1000,                // Costo en $ (dinero real)
    multiplier: 1.5,           // Multiplicador (1.5 = +50%)
  },

  // CPU Efficiency - Duplica velocidad de CPUs
  cpuEfficiency: {
    cost: 5000,
    multiplier: 2,             // Duplica producción
    unlockRequirement: {
      hardwareId: 'advanced_cpu',
      minOwned: 10,
    },
  },

  // GPU Optimization - Duplica velocidad de GPUs
  gpuOptimization: {
    cost: 25000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'advanced_gpu',
      minOwned: 10,
    },
  },

  // ASIC Optimization - Duplica velocidad de ASICs
  asicOptimization: {
    cost: 100000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'asic_gen3',
      minOwned: 10,
    },
  },
};

// ============================================================================
// SISTEMA DE DESBLOQUEO PROGRESIVO
// ============================================================================
export const UNLOCK_CONFIG = {
  // Desbloquear Market (Mercado)
  market: {
    requiredBlocks: 10,        // Bloques minados necesarios
    requiredCoins: 500,        // CryptoCoins necesarios
  },

  // Desbloquear Hardware
  hardware: {
    requiredMoney: 200,        // $ (dinero real) necesarios
  },

  // Desbloquear Upgrades (Mejoras)
  upgrades: {
    requiredHardware: 1,       // Cantidad de hardware comprado
  },

  // Desbloquear Prestige (legacy field kept for backwards compat)
  prestige: {
    requiredLevel: 1,
  },
};

// ============================================================================
// SISTEMA DE MERCADO
// ============================================================================
export const MARKET_CONFIG = {
  // Intervalo de actualización de precios (milisegundos)
  UPDATE_INTERVAL: 5000,       // 5 segundos

  // Comisión por transacción (porcentaje)
  TRANSACTION_FEE: 0.01,       // 1% de comisión

  // Rango de fluctuación de precios
  PRICE_FLUCTUATION: {
    min: 0.8,                  // -20% del valor base
    max: 1.2,                  // +20% del valor base
  },
};

// ============================================================================
// SISTEMA DE PRESTIGIO
// ============================================================================
export const PRESTIGE_CONFIG = {
  // Requisitos para hacer prestigio
  requirements: {
    minBlocks: 21000000,       // Debe completar el juego completo (21M bloques)
  },

  // Texto que el jugador debe escribir para confirmar el prestige
  confirmationText: 'PRESTIGE',

  // Bonificaciones por prestigio
  bonuses: {
    productionBonus: 0.1,      // +10% producción por nivel
    clickBonus: 0.05,          // +5% por click por nivel
  },

  // Recompensas de insignias
  badgeRewards: {
    speedRunner: { type: 'production' as const, value: 1.05 },
    prestigeMaster: { type: 'click' as const, value: 1.1 },
    dedication: { type: 'production' as const, value: 1.2 },
    infiniteLoop: { type: 'production' as const, value: 1.5 },
    theCollector: { type: 'production' as const, value: 2.0 },
    billionaire: { type: 'click' as const, value: 1.5 },
  },
} as const;

// ============================================================================
// AJUSTES GENERALES DE BALANCE
// ============================================================================
export const BALANCE_CONFIG = {
  // Velocidad del juego (1 = normal, 2 = doble velocidad, etc.)
  GAME_SPEED: 1,

  // Multiplicador de ganancias offline (0-1, donde 1 = 100%)
  OFFLINE_EARNINGS_MULTIPLIER: 0.5,  // 50% de ganancias offline

  // Tiempo máximo de ganancias offline (horas)
  MAX_OFFLINE_TIME: 24,

  // Multiplicador de click manual inicial
  MANUAL_CLICK_REWARD: 1,    // CryptoCoins por click

  // Intervalo de guardado automático (milisegundos)
  AUTO_SAVE_INTERVAL: 30000, // 30 segundos
};

// ============================================================================
// BOOSTERS Y MULTIPLICADORES IAP
// ============================================================================
export const BOOSTER_CONFIG = {
  BOOSTER_2X: {
    multiplier: 2.0,
    durationMs: 4 * 60 * 60 * 1000,   // 4 horas
  },
  BOOSTER_5X: {
    multiplier: 5.0,
    durationMs: 24 * 60 * 60 * 1000,  // 24 horas
  },
  PERMANENT_MULTIPLIER: {
    multiplier: 2.0,
  },
  REWARDED_AD_BOOST: {
    multiplier: 2.0,
    durationMs: 4 * 60 * 60 * 1000,   // 4 horas
    cooldownMs: 5 * 60 * 1000,         // 5 minutos
  },
} as const;

// ============================================================================
// STARTER PACKS - RECOMPENSAS
// ============================================================================
export const STARTER_PACK_REWARDS = {
  small:  { cryptoCoins: 10000,  realMoney: 500 },
  medium: { cryptoCoins: 50000,  realMoney: 2500 },
  large:  { cryptoCoins: 150000, realMoney: 10000 },
  mega:   { cryptoCoins: 500000, realMoney: 50000 },
} as const;

// ============================================================================
// NOTAS DE BALANCE
// ============================================================================
/*
GUÍA DE AJUSTE DE BALANCE:

1. Si el juego es muy difícil:
   - Aumenta HARDWARE_CONFIG.levels.*.blockReward
   - Reduce HARDWARE_CONFIG.levels.*.baseCost
   - Aumenta CRYPTO_CONFIG.cryptocoin.baseValue
   - Reduce HARDWARE_CONFIG.COST_MULTIPLIER

2. Si el juego es muy fácil:
   - Reduce HARDWARE_CONFIG.levels.*.blockReward
   - Aumenta HARDWARE_CONFIG.levels.*.baseCost
   - Reduce CRYPTO_CONFIG.cryptocoin.baseValue
   - Aumenta HARDWARE_CONFIG.COST_MULTIPLIER

3. Para ajustar la progresión:
   - Modifica HARDWARE_CONFIG.UNLOCK_REQUIREMENT
   - Ajusta UNLOCK_CONFIG.* para cambiar cuándo se desbloquean features
   - Cambia BLOCK_CONFIG.HALVING_INTERVAL para afectar la economía a largo plazo

4. Para hacer el mercado más rentable:
   - Aumenta CRYPTO_CONFIG.*.baseValue
   - Reduce MARKET_CONFIG.TRANSACTION_FEE
   - Ajusta MARKET_CONFIG.PRICE_FLUCTUATION para más variación

5. Para balancear las mejoras:
   - Ajusta UPGRADE_CONFIG.*.cost
   - Modifica UPGRADE_CONFIG.*.multiplier
   - Cambia los requisitos de desbloqueo

VALORES RECOMENDADOS PARA TESTING:
- Para testing rápido: GAME_SPEED = 10
- Para ver progresión completa: GAME_SPEED = 1
- Para balance inicial: Usa los valores por defecto
*/
