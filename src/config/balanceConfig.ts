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

  // Difficulty scales with blocks mined using power curve
  DIFFICULTY: {
    AMPLITUDE: 0.25,
    SCALE: 100,
    EXPONENT: 0.65,
  },

  // Base CC price per era (indexed by era number)
  // Eras 0-3 grow, Era 4+ halving dominates ($/block declines)
  ERA_BASE_PRICES: [0.08, 0.50, 2.00, 5.00, 12.00, 28.00, 65.00, 150.00, 350.00, 800.00],
};

// ============================================================================
// ELECTRICITY FEE (CC MINING FEE)
// ============================================================================
export const ELECTRICITY_FEE_CONFIG = {
  // Percentage of totalElectricityWeight deducted as CC per tick
  // Currently disabled (0) — electricity rework pending
  RATE_PERCENT: 0,
};

// ============================================================================
// HARDWARE - COSTOS Y PRODUCCIÓN
// ============================================================================
export const HARDWARE_CONFIG = {
  // Multiplicador de costo al comprar múltiples unidades
  COST_MULTIPLIER: 1.35,

  // Per-tier cost multipliers (lower tiers scale faster, late-game scales gently)
  COST_MULTIPLIER_BY_ID: {
    manual_mining: 1.35,
    basic_cpu: 1.35,
    advanced_cpu: 1.35,
    basic_gpu: 1.28,
    advanced_gpu: 1.28,
    asic_gen1: 1.22,
    asic_gen2: 1.22,
    asic_gen3: 1.22,
    mining_farm: 1.15,
    quantum_miner: 1.15,
    supercomputer: 1.15,
  } as Record<string, number>,

  // Requisito de unidades del nivel anterior para desbloquear siguiente
  UNLOCK_REQUIREMENT: 5,

  // Configuración por nivel de hardware
  levels: {
    // Nivel 1: Manual Mining (oculto, solo para mecánica interna)
    manual_mining: {
      baseCost: 0,               // $ (free)
      baseProduction: 10,        // Hash/s (display only)
      blockReward: 0,            // Deprecated: reward is global per era
      miningSpeed: 0.1,          // Bloques/segundo
      electricityCost: 0,        // $/segundo
    },

    // Nivel 2: Basic CPU
    basic_cpu: {
      baseCost: 32.5,            // $ (real money) — was 25, +30%
      baseProduction: 30,        // Hash/s (display only)
      blockReward: 0,            // Deprecated: reward is global per era
      miningSpeed: 0.3,          // Bloques/segundo
      electricityCost: 3,        // CC fee weight (×RATE_PERCENT = CC/sec)
    },

    // Nivel 3: Advanced CPU
    advanced_cpu: {
      baseCost: 187.5,           // was 150, +25%
      baseProduction: 80,
      blockReward: 0,
      miningSpeed: 2.0,
      electricityCost: 10,
    },

    // Nivel 4: Basic GPU
    basic_gpu: {
      baseCost: 960,             // was 800, +20%
      baseProduction: 250,
      blockReward: 0,
      miningSpeed: 12.5,
      electricityCost: 40,
    },

    // Nivel 5: Advanced GPU
    advanced_gpu: {
      baseCost: 5000,
      baseProduction: 600,
      blockReward: 0,
      miningSpeed: 90,
      electricityCost: 120,
    },

    // Nivel 6: ASIC Gen 1
    asic_gen1: {
      baseCost: 35000,
      baseProduction: 1500,
      blockReward: 0,
      miningSpeed: 730,
      electricityCost: 300,
    },

    // Nivel 7: ASIC Gen 2
    asic_gen2: {
      baseCost: 200000,
      baseProduction: 4000,
      blockReward: 0,
      miningSpeed: 4800,
      electricityCost: 900,
    },

    // Nivel 8: ASIC Gen 3
    asic_gen3: {
      baseCost: 1200000,
      baseProduction: 10000,
      blockReward: 0,
      miningSpeed: 33000,
      electricityCost: 2500,
    },

    // Nivel 9: Mining Farm
    mining_farm: {
      baseCost: 8000000,
      baseProduction: 50000,
      blockReward: 0,
      miningSpeed: 255000,
      electricityCost: 4500,
    },

    // Nivel 10: Quantum Miner
    quantum_miner: {
      baseCost: 50000000,
      baseProduction: 200000,
      blockReward: 0,
      miningSpeed: 1800000,
      electricityCost: 15000,
    },

    // Nivel 11: Supercomputer
    supercomputer: {
      baseCost: 500000000,
      baseProduction: 1000000,
      blockReward: 0,
      miningSpeed: 21000000,
      electricityCost: 50000,
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
};

// ============================================================================
// MEJORAS (UPGRADES)
// ============================================================================
export const UPGRADE_CONFIG = {
  // Click Power - Aumenta CryptoCoins por click
  clickPower: {
    cost: 5000,                // Costo en $ (dinero real)
    multiplier: 5,             // Multiplicador (5 = 5x coins por click)
  },

  // Hash Injection - 3x click (apilable con clickPower → total 15x)
  clickMastery: {
    cost: 100000,
    multiplier: 3,
    unlockRequirement: {
      hardwareId: 'basic_gpu',
      minOwned: 5,
    },
  },

  // Click Legend - 2x click (apilable → total 30x)
  clickLegend: {
    cost: 2000000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'asic_gen3',
      minOwned: 10,
    },
  },

  // CPU Efficiency - Duplica velocidad de CPUs
  cpuEfficiency: {
    cost: 1500,
    multiplier: 2,             // Duplica producción
    unlockRequirement: {
      hardwareId: 'advanced_cpu',
      minOwned: 10,
    },
  },

  // GPU Optimization - Duplica velocidad de GPUs
  gpuOptimization: {
    cost: 50000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'advanced_gpu',
      minOwned: 10,
    },
  },

  // ASIC Optimization - Duplica velocidad de ASICs
  asicOptimization: {
    cost: 10000000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'asic_gen3',
      minOwned: 10,
    },
  },

  // Mining Farm Efficiency - Duplica velocidad de Mining Farm
  miningFarmEfficiency: {
    cost: 80000000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'mining_farm',
      minOwned: 10,
    },
  },

  // Quantum Coherence - Duplica velocidad de Quantum Miner
  quantumCoherence: {
    cost: 500000000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'quantum_miner',
      minOwned: 10,
    },
  },

  // Supercomputer Overclock - Duplica velocidad de Supercomputer
  supercomputerOverclock: {
    cost: 3000000000,
    multiplier: 2,
    unlockRequirement: {
      hardwareId: 'supercomputer',
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
    requiredMoney: 150,        // $ (dinero real) necesarios
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
// SISTEMA DE ENERGÍA (PHASE 4)
// ============================================================================
export const ENERGY_CONFIG = {
  RENEWABLE_CAP_MW: 8_000,

  NON_RENEWABLE_UNLOCK_THRESHOLD: 0.8, // 80% del cap renovable

  SOURCES: {
    solar_farm: {
      mwPerUnit: 100,
      costPerUnit: 250_000,
      costMultiplier: 1.2,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '☀️',
    },
    wind_farm: {
      mwPerUnit: 400,
      costPerUnit: 1_000_000,
      costMultiplier: 1.2,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '💨',
    },
    hydroelectric_dam: {
      mwPerUnit: 1_500,
      costPerUnit: 5_000_000,
      costMultiplier: 1.2,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '💧',
    },
    geothermal_plant: {
      mwPerUnit: 2_500,
      costPerUnit: 25_000_000,
      costMultiplier: 1.2,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '🌋',
    },
    coal_plant: {
      mwPerUnit: 500,
      costPerUnit: 100_000,
      costMultiplier: 1.2,
      isRenewable: false,
      depletionPerMwPerSecond: 0.0000033,
      icon: '🏭',
    },
    oil_refinery: {
      mwPerUnit: 2_500,
      costPerUnit: 400_000,
      costMultiplier: 1.2,
      isRenewable: false,
      depletionPerMwPerSecond: 0.0000027,
      icon: '🛢️',
    },
    nuclear_reactor: {
      mwPerUnit: 10_000,
      costPerUnit: 10_000_000,
      costMultiplier: 1.2,
      isRenewable: false,
      depletionPerMwPerSecond: 0.0000017,
      icon: '☢️',
    },
  },

  HARDWARE_ENERGY_REQUIREMENTS: {
    mining_farm: 500,
    quantum_miner: 2_000,
    supercomputer: 10_000,
  },

  // Upgrades que aumentan el cap de renovables secuencialmente
  RENEWABLE_UPGRADES: [
    {
      id: 'grid_expansion',
      capIncreaseMW: 4_000,    // 8,000 → 12,000 MW
      cost: 5_000_000,
      requiresUpgrade: null as string | null,
      icon: '🔌',
    },
    {
      id: 'wind_network',
      capIncreaseMW: 6_000,    // 12,000 → 18,000 MW
      cost: 20_000_000,
      requiresUpgrade: 'grid_expansion' as string | null,
      icon: '🌐',
    },
    {
      id: 'smart_grid',
      capIncreaseMW: 12_000,   // 18,000 → 30,000 MW
      cost: 100_000_000,
      requiresUpgrade: 'wind_network' as string | null,
      icon: '⚡',
    },
  ],
};

// ============================================================================
// SISTEMA DE INTELIGENCIA ARTIFICIAL (PHASE 5)
// ============================================================================
export const AI_CONFIG = {
  LEVELS: {
    1: {
      name: 'Asistente',
      cost: 25_000_000,
      productionMultiplier: 1.20,
      unlockCrypto: 'neural_coin',
      isIrreversible: false,
    },
    2: {
      name: 'Copiloto',
      cost: 100_000_000,
      productionMultiplier: 1.50,
      unlockCrypto: 'quantum_bit',
      isIrreversible: false,
    },
    3: {
      name: 'Autónomo',
      cost: 250_000_000,
      productionMultiplier: 2.50,
      unlockCrypto: 'singularity_coin',
      isIrreversible: true,
    },
  },

  SUGGESTION_INTERVAL_MS: 30_000,
  AI_ENERGY_RETRY_INTERVAL_MS: 10_000,

  AI_CRYPTOS: {
    neural_coin: {
      productionMultiplier: 8,
      energyMultiplier: 3,
      symbol: 'NC',
      icon: '🧠',
      baseValue: 0.5,
      volatility: 0.35,
    },
    quantum_bit: {
      productionMultiplier: 25,
      energyMultiplier: 8,
      symbol: 'QB',
      icon: '⚛️',
      baseValue: 5.0,
      volatility: 0.40,
    },
    singularity_coin: {
      productionMultiplier: 100,
      energyMultiplier: 30,
      symbol: 'SC',
      icon: '🌌',
      baseValue: 50.0,
      volatility: 0.50,
    },
  },
} as const;

// ============================================================================
// SISTEMA DE EVENTOS NARRATIVOS (PHASE 6)
// ============================================================================
export const NARRATIVE_CONFIG = {
  PLANET_RESOURCES_INITIAL: 100,

  EVENT_THRESHOLDS: [80, 60, 40, 20, 5] as const,

  EVENTS: {
    80: {
      titleKey: 'narrative.event80.title',
      textKey: 'narrative.event80.text',
      hasAIVariant: false,
    },
    60: {
      titleKey: 'narrative.event60.title',
      textKey: 'narrative.event60.text',
      hasAIVariant: false,
    },
    40: {
      titleKey: 'narrative.event40.title',
      textKeyDefault: 'narrative.event40.textDefault',
      textKeyWithAI: 'narrative.event40.textWithAI',
      hasAIVariant: true,
    },
    20: {
      titleKey: 'narrative.event20.title',
      textKey: 'narrative.event20.text',
      hasAIVariant: false,
    },
    5: {
      titleKey: 'narrative.event5.title',
      textKey: 'narrative.event5.text',
      hasAIVariant: false,
    },
  },

  CHRONICLE_MAX_ENTRIES: 20,
};

// ============================================================================
// SISTEMA DE ENDGAME — COLAPSO Y BUEN ENDING (PHASE 7)
// ============================================================================
export const ENDGAME_CONFIG = {
  // Colapso
  COLLAPSE_PRODUCTION_BONUS_PER_PRESTIGE: 0.15,

  // Buen ending
  GOOD_ENDING_PRODUCTION_BONUS_PER_PRESTIGE: 0.10,
  GOOD_ENDING_RENEWABLE_DISCOUNT_PER_RUN: 0.30,
  GOOD_ENDING_RENEWABLE_DISCOUNT_CAP: 0.80,
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
  OFFLINE_MINER: {
    baseDurationMs: 8 * 60 * 60 * 1000,      // 8h
    extendedDurationMs: 12 * 60 * 60 * 1000,  // 12h (extended offer)
    extendedOfferChance: 0.30,
    earningsMultiplier: 0.5,                   // uses BALANCE_CONFIG.OFFLINE_EARNINGS_MULTIPLIER
  },
  LUCKY_BLOCK: {
    rewardMultiplier: 5,
    earlyBlocks: 200,
    midBlocks: 1000,
    lateBlocks: 3000,
    earlyHashThreshold: 5000,
    lateHashThreshold: 100000,
  },
  MARKET_PUMP: {
    priceMultiplier: 2.0,
    baseDurationMs: 15 * 60 * 1000,          // 15 min
    extendedDurationMs: 20 * 60 * 1000,       // 20 min
    extendedOfferChance: 0.30,
  },
} as const;

// ============================================================================
// AD BOOSTER BUBBLES (rewarded ad floating offers — rotation system)
// ============================================================================
export const AD_BUBBLE_CONFIG = {
  // ── Boost effects ──
  HASH_BOOST: {
    multiplier: 1.20,                       // +20% hash rate (shop = 2x)
    durationMs: 5 * 60 * 1000,             // 5 min effect
  },
  MARKET_BOOST: {
    multiplier: 1.25,                       // +25% sell price (shop = 2x)
    durationMs: 10 * 60 * 1000,            // 10 min effect (aligned with market_spike)
  },
  ENERGY_RESTORE: {
    recoveryPercent: 0.50,                  // 50% of current MW deficit
  },
  // ── Bubble visibility (seconds on screen before auto-expire) ──
  BUBBLE_VISIBLE_SEC: { hash: 45, market: 30, energy: 20 },
  // ── Cooldowns (ms) — single rotation system ──
  COOLDOWN_AFTER_WATCH_MIN_MS: 6 * 60 * 1000,   // 6 min
  COOLDOWN_AFTER_WATCH_MAX_MS: 8 * 60 * 1000,   // 8 min
  COOLDOWN_AFTER_MISS_MIN_MS:  8 * 60 * 1000,   // 8 min (base)
  COOLDOWN_AFTER_MISS_MAX_MS:  10 * 60 * 1000,  // 10 min (base)
  MISS_ESCALATION_MS:          1 * 60 * 1000,    // +1 min per consecutive miss
  MISS_ESCALATION_CAP_MIN_MS:  13 * 60 * 1000,  // max escalated min
  MISS_ESCALATION_CAP_MAX_MS:  15 * 60 * 1000,  // max escalated max
  // ── Pool eligibility thresholds ──
  HASH_MIN_HARDWARE_UNITS: 5,                     // total owned across all types
  ENERGY_PLANET_THRESHOLD: 90,                     // planetResources < 90%
} as const;

// ============================================================================
// STARTER PACKS - RECOMPENSAS
// ============================================================================
export const STARTER_PACK_REWARDS = {
  small:  { cryptoCoins: 3000,    realMoney: 60 },
  medium: { cryptoCoins: 30000,   realMoney: 7000 },
  large:  { cryptoCoins: 50000,   realMoney: 40000 },
  mega:   { cryptoCoins: 150000,  realMoney: 300000 },
} as const;

// ============================================================================
// FLASH SALE (REMOVE ADS)
// ============================================================================
export const FLASH_SALE_CONFIG = {
  ROLL_CHANCE: 0.35,                          // 35% per eligible roll
  MIN_DURATION_MS: 8 * 60 * 1000,             // 8 min
  MAX_DURATION_MS: 14 * 60 * 1000,            // 14 min
  COOLDOWN_AFTER_SALE_MS: 24 * 60 * 60 * 1000, // 24h after sale expires
  COOLDOWN_AFTER_FAIL_MS: 4 * 60 * 60 * 1000,  // 4h after failed roll
} as const;

// ============================================================================
// STARTER PACKS - OFERTAS DINÁMICAS
// ============================================================================
export const PACK_CONFIG = {
  OFFER_DURATION_MS: 20 * 60 * 1000,  // 20 min active window
  COOLDOWN_MS: 8 * 60 * 60 * 1000,    // 8h between offers

  small: {
    ccRange: [3_000, 5_000] as [number, number],
    cashRange: [40, 80] as [number, number],
    boosterDurationMs: 1 * 60 * 60 * 1000,  // 1h 2x production booster (always included)
    showUntilHardwareId: 'asic_gen3',
  },
  medium: {
    ccRange: [20_000, 40_000] as [number, number],
    cashRange: [5_000, 10_000] as [number, number],
    boosterDurationMs: 2 * 60 * 60 * 1000,  // 2h 2x production booster (always included)
    showAfterHardwareId: 'asic_gen3',
    showUntilHardwareId: 'quantum_miner',
  },
  large: {
    ccRange: [40_000, 60_000] as [number, number],
    cashRange: [30_000, 50_000] as [number, number],
    boosterDurationMs: 4 * 60 * 60 * 1000,  // 4h booster (when no electricity credits)
    showAfterHardwareId: 'quantum_miner',
    showUntilHardwareId: 'supercomputer',
    includeElectricity: true,
    electricityHoursRange: [24, 48] as [number, number],
  },
  mega: {
    ccRange: [100_000, 200_000] as [number, number],
    cashRange: [200_000, 400_000] as [number, number],
    boosterDurationMs: 24 * 60 * 60 * 1000, // 24h booster (when no electricity credits)
    showAfterHardwareId: 'supercomputer',
    includeElectricity: true,
    electricityHoursRange: [72, 120] as [number, number],
  },
} as const;

// ============================================================================
// OFFLINE EARNINGS SCREEN
// ============================================================================
export const OFFLINE_SCREEN_CONFIG = {
  MIN_OFFLINE_SECONDS: 300,     // 5 min minimum to show modal
  MAX_OFFLINE_SECONDS: 3600,    // 1h cap on production
  REWARD_MIN_PCT: 80,           // minimum % on ad watch
  REWARD_MAX_PCT: 100,          // maximum %
} as const;

// ============================================================================
// EVENTOS NARRATIVOS INTERACTIVOS (PHASE 6)
// ============================================================================
export const REGULATORY_EVENT_CONFIG = {
  TAX_AMOUNT: 48200,
  LEGAL_FEE: 5000,
  PARTIAL_AMOUNT: 9640,           // 20% of TAX_AMOUNT
  REJECTED_TOTAL: 56200,          // TAX_AMOUNT + $8K late penalty
  HASH_RATE_PENALTY: 0.30,
  HASH_RATE_PENALTY_DURATION_MS: 24 * 60 * 60 * 1000,
  DECISION_WINDOW_MS: 2 * 60 * 60 * 1000,
  APPEAL_RESULT_DELAY_MS: 60 * 60 * 1000,
  TRIGGER_MIN_REAL_MONEY: 60000,
  TRIGGER_PROBABILITY: 0.20,
  APPEAL_SUCCESS_BASE: 40,
  APPEAL_PARTIAL_BASE: 35,
  APPEAL_BONUS_THRESHOLD: 80,
  APPEAL_PENALTY_THRESHOLD: 50,
  APPEAL_BONUS_CLEAN: 15,
  APPEAL_PENALTY_DEPLETED: 15,
};

export const MARKET_OPPORTUNITY_CONFIG = {
  PRICE_MULTIPLIER: 1.25,
  DURATION_MS: 10 * 60 * 1000,
  TRIGGER_PROBABILITY: 0.05,
  COOLDOWN_MS: 45 * 60 * 1000,
};

export const LOCAL_PROTEST_CONFIG = {
  TRIGGER_RESOURCES_THRESHOLD: 66, // fire when planetResources <= 66 (34% consumed)
};

// ============================================================================
// PRICE ENGINE — Ornstein-Uhlenbeck mean-reverting process
// ============================================================================
export const PRICE_ENGINE = {
  // OU process parameters
  THETA: 0.12,          // mean-reversion speed (higher = snaps back faster)
  SIGMA: 0.045,         // base volatility per tick
  CLAMP_MIN: -0.30,     // min deviation from era base price (−30%)
  CLAMP_MAX: 0.40,      // max deviation from era base price (+40%)

  // Chart window size (number of price points displayed)
  CHART_WINDOW: 30,

  // Market regimes: each overrides theta/sigma/drift for its duration
  REGIMES: {
    normal:   { weight: 40, minTicks: 20, maxTicks: 60,  drift: 0,      sigma: 1.0, theta: 1.0 },
    bull:     { weight: 18, minTicks: 15, maxTicks: 40,  drift: 0.008,  sigma: 1.2, theta: 0.8 },
    bear:     { weight: 18, minTicks: 15, maxTicks: 40,  drift: -0.008, sigma: 1.2, theta: 0.8 },
    volatile: { weight: 12, minTicks: 8,  maxTicks: 20,  drift: 0,      sigma: 2.0, theta: 0.6 },
    spike:    { weight: 6,  minTicks: 3,  maxTicks: 8,   drift: 0.025,  sigma: 2.5, theta: 0.4 },
    crash:    { weight: 6,  minTicks: 3,  maxTicks: 8,   drift: -0.030, sigma: 2.5, theta: 0.4 },
  } as Record<string, {
    weight: number; minTicks: number; maxTicks: number;
    drift: number; sigma: number; theta: number;
  }>,

  // Blocking rules: regime X cannot follow regime Y
  BLOCKED_TRANSITIONS: {
    spike: ['spike', 'crash'],
    crash: ['crash', 'spike'],
  } as Record<string, string[]>,
} as const;

// ============================================================================
// MARKET EVENTS — price modifiers triggered by game state
// ============================================================================
export const MARKET_EVENT_CONFIG = {
  halving_anticipation: {
    multiplier: 1.25,
    blocksThreshold: 10_000,     // minimum floor (used when mining is slow)
    minWindowSeconds: 120,       // guarantee at least 2 min of anticipation window
    labelKey: 'marketEvent.halvingAnticipation',
    toastKey: 'marketEvent.toast.halvingAnticipation',
    // permanent until halving occurs (cancelled explicitly)
  },
  halving_shock: {
    multiplier: 0.75,
    durationMs: 5 * 60 * 1000,  // 5 min
    labelKey: 'marketEvent.halvingShock',
    toastKey: 'marketEvent.toast.halvingShock',
  },
  market_spike: {
    multiplier: 1.25,
    durationMs: 10 * 60 * 1000, // 10 min
    labelKey: 'marketEvent.marketSpike',
    toastKey: 'marketEvent.toast.marketSpike',
  },
  blackout_regional: {
    multiplier: 0.91,
    durationMs: 6 * 60 * 1000,  // 6 min
    labelKey: 'marketEvent.blackoutRegional',
    toastKey: 'marketEvent.toast.blackoutRegional',
  },
  ai_autonomous: {
    multiplier: 1.15,
    // permanent
    labelKey: 'marketEvent.aiAutonomous',
    toastKey: 'marketEvent.toast.aiAutonomous',
  },
  planetary_collapse_incoming: {
    multiplier: 0.60,
    // permanent
    labelKey: 'marketEvent.planetaryCollapse',
    toastKey: 'marketEvent.toast.planetaryCollapse',
  },
  whale_dump: {
    multiplier: 0.85,
    durationMs: 4 * 60 * 1000,  // 4 min
    probability: 0.04,           // 4% per minute
    labelKey: 'marketEvent.whaleDump',
    toastKey: 'marketEvent.toast.whaleDump',
  },
  media_hype: {
    multiplier: 1.18,
    durationMs: 5 * 60 * 1000,  // 5 min
    probability: 0.04,           // 4% per minute
    labelKey: 'marketEvent.mediaHype',
    toastKey: 'marketEvent.toast.mediaHype',
  },
  RANDOM_CHECK_INTERVAL_MS: 60_000, // check random events every 60s
} as const;

// UI-only metadata for market event broadcast toasts (Design 7)
export const MARKET_EVENT_META: Record<string, { tag: string; icon: string; delta: string; durationLabel: string }> = {
  halving_anticipation: { tag: 'CHAIN', icon: '⛓', delta: '+25%', durationLabel: 'PERMANENT' },
  halving_shock:        { tag: 'CHAIN', icon: '⚡', delta: '−25%', durationLabel: '5 MIN' },
  market_spike:         { tag: 'MARKET', icon: '📈', delta: '+25%', durationLabel: '10 MIN' },
  blackout_regional:    { tag: 'NET', icon: '🔌', delta: '−9%', durationLabel: '6 MIN' },
  ai_autonomous:        { tag: 'NET', icon: '🤖', delta: '+15%', durationLabel: 'PERMANENT' },
  planetary_collapse_incoming: { tag: 'MARKET', icon: '☢️', delta: '−40%', durationLabel: 'PERMANENT' },
  whale_dump:           { tag: 'MARKET', icon: '🐋', delta: '−15%', durationLabel: '4 MIN' },
  media_hype:           { tag: 'MARKET', icon: '📣', delta: '+18%', durationLabel: '5 MIN' },
};

export const LOCAL_PROTEST_RATIONING = {
  ENERGY_REDUCTION: 0.20,         // 20% less energy capacity
  DURATION_MS: 30 * 60 * 1000,   // 30 min
} as const;

// ============================================================================
// NOTAS DE BALANCE
// ============================================================================
/*
GUÍA DE AJUSTE DE BALANCE (Bitcoin-Faithful Economy):

Block reward is GLOBAL (not per-hardware) and halves every 210,000 blocks.
CC/sec = (totalMiningSpeed × multipliers / difficulty) × globalBlockReward
Difficulty scales with hash rate: 1.0 + 0.25 × (totalMiningSpeed / 100)^0.65

$/block per era:
  Era 0: 50 CC × $0.08 = $4.00/block
  Era 1: 25 CC × $0.50 = $12.50/block (peak growth)
  Era 2: 12.5 CC × $2.00 = $25.00/block (golden era)
  Era 3: 6.25 CC × $5.00 = $31.25/block (plateau)
  Era 4: 3.125 CC × $12.00 = $37.50/block (continued growth)
  Era 5: 1.5625 CC × $28.00 = $43.75/block
  Era 6+: $/block continues growing through era 9

1. Si el juego es muy difícil:
   - Reduce HARDWARE_CONFIG.levels.*.baseCost ($ costs)
   - Increase ERA_BASE_PRICES to give more $ per CC sold
   - Reduce HARDWARE_CONFIG.COST_MULTIPLIER

2. Si el juego es muy fácil:
   - Aumenta HARDWARE_CONFIG.levels.*.baseCost
   - Reduce ERA_BASE_PRICES
   - Aumenta HARDWARE_CONFIG.COST_MULTIPLIER

3. Para ajustar la progresión:
   - Modifica HARDWARE_CONFIG.UNLOCK_REQUIREMENT
   - Ajusta BLOCK_CONFIG.DIFFICULTY.AMPLITUDE/EXPONENT
   - Cambia BLOCK_CONFIG.HALVING_INTERVAL para afectar la economía a largo plazo

VALORES RECOMENDADOS PARA TESTING:
- Para testing rápido: GAME_SPEED = 10
- Para ver progresión completa: GAME_SPEED = 1
- Para balance inicial: Usa los valores por defecto
*/
