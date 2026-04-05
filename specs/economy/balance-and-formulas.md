# Balance and Formulas

## Estado
- **Fase**: Phase 1 - Genesis (Active Reference Document)
- **Estado**: Living Document - Updated Continuously
- **Prioridad**: Critical (Game Balance Foundation)
- **Última actualización**: 2026-04-04

## Descripción

Este documento centraliza todas las fórmulas matemáticas, constantes de balance, y metodología de testing del juego Blockchain Tycoon. Sirve como la única fuente de verdad para todos los cálculos del juego, referenciando `balanceConfig.ts` como el archivo de implementación.

El objetivo es mantener un equilibrio entre progresión satisfactoria (no demasiado lenta) y engagement a largo plazo (no demasiado fácil), con una curva de dificultad que recompensa tanto el juego activo como el progreso offline.

## Objetivos
- [x] Centralizar todas las fórmulas matemáticas del juego
- [x] Definir la progresión económica esperada
- [x] Documentar el ROI (Return on Investment) de cada hardware
- [x] Establecer break-even points y optimal strategies
- [x] Proveer metodología de balance testing
- [x] Definir métricas de éxito de balance
- [ ] Mantener actualizado con cada cambio de balance

## Fuente de Verdad: balanceConfig.ts

**Ubicación**: `/src/config/balanceConfig.ts`

Todos los valores de balance DEBEN estar definidos en este archivo. Ningún valor hardcodeado en componentes o lógica. Si necesitas ajustar el balance, modifica `balanceConfig.ts` únicamente.

### Estructura del Archivo
```typescript
// BLOCK_CONFIG - Sistema de minado de bloques
export const BLOCK_CONFIG = {
  TOTAL_BLOCKS: 21000000,
  INITIAL_REWARD: 50,
  HALVING_INTERVAL: 210000,
  INITIAL_DIFFICULTY: 1,
  DIFFICULTY: {
    AMPLITUDE: 0.35,
    SCALE: 80,           // speed-based (totalMiningSpeed), not blocks-based
    EXPONENT: 0.70,
  },
  // 20-entry array — $/block grows ~8-12% per era, plateaus mid-game
  ERA_BASE_PRICES: [
    0.05, 0.18, 0.55, 1.40, 3.50,
    8.00, 18.00, 40.00, 90.00, 200.00,
    450.00, 1000.00, 2300.00, 5500.00, 14000.00,
    38000.00, 110000.00, 340000.00, 1100000.00, 4000000.00,
  ],
};

// HARDWARE_CONFIG - Costos y producción de hardware
export const HARDWARE_CONFIG = {
  COST_MULTIPLIER: 1.35,  // legacy default
  COST_MULTIPLIER_BY_ID: { basic_cpu: 1.40, ..., supercomputer: 1.20 },
  UNLOCK_REQUIREMENT: 8,
  levels: { /* ... */ },
};

// CRYPTO_CONFIG - Valores de criptomonedas
export const CRYPTO_CONFIG = { /* ... */ };

// UPGRADE_CONFIG - Costos y efectos de upgrades
export const UPGRADE_CONFIG = { /* ... */ };

// UNLOCK_CONFIG - Requisitos de desbloqueo
export const UNLOCK_CONFIG = { /* ... */ };

// MARKET_CONFIG - Configuración del mercado
export const MARKET_CONFIG = { /* ... */ };

// PRESTIGE_CONFIG - Sistema de prestigio
export const PRESTIGE_CONFIG = { /* ... */ };

// BALANCE_CONFIG - Configuración general
export const BALANCE_CONFIG = { /* ... */ };
```

## Fórmulas Centralizadas

### 1. Block Mining System

#### 1.1 Recompensa por Bloque (Halving)
```typescript
function calculateCurrentReward(blocksMined: number): number {
  const halvings = Math.floor(blocksMined / BLOCK_CONFIG.HALVING_INTERVAL);
  return BLOCK_CONFIG.INITIAL_REWARD / Math.pow(2, halvings);
}

// Valores de referencia:
// Bloques 0-209,999: 50 CC/block
// Bloques 210,000-419,999: 25 CC/block
// Bloques 420,000-629,999: 12.5 CC/block
// Bloques 630,000-839,999: 6.25 CC/block
```

#### 1.2 Total de Coins Minables por Era
```typescript
function calculateCoinsPerEra(halvingNumber: number): number {
  const blocksPerEra = BLOCK_CONFIG.HALVING_INTERVAL;
  const rewardPerBlock = BLOCK_CONFIG.INITIAL_REWARD / Math.pow(2, halvingNumber);
  return blocksPerEra * rewardPerBlock;
}

// Total supply: ~21,000,000 CryptoCoins (asumiendo todas las eras)
// Era 0: 10,500,000 CC (50%)
// Era 1: 5,250,000 CC (25%)
// Era 2: 2,625,000 CC (12.5%)
// ...hasta convergir a 21M
```

#### 1.3 Mining Speed Total
```typescript
function calculateTotalMiningSpeed(
  hardware: Hardware[],
  upgrades: Upgrade[]
): number {
  let totalSpeed = 0;

  for (const hw of hardware) {
    let speed = hw.miningSpeed * hw.owned;

    // Aplicar multipliers de upgrades
    for (const upgrade of upgrades) {
      if (upgrade.purchased && upgrade.effect.type === 'production') {
        if (matchesHardwareCategory(hw.id, upgrade.effect.target)) {
          speed *= upgrade.effect.multiplier;
        }
      }
    }

    totalSpeed += speed;
  }

  return totalSpeed;
}

// Ejemplo con 10 Basic CPUs (0.3 blocks/s cada uno) + CPU Efficiency upgrade (2x):
// Base: 10 × 0.3 = 3 blocks/s
// Con upgrade: 3 × 2 = 6 blocks/s
```

### 2. Hardware System

#### 2.1 Costo de Hardware (Exponential Scaling)
```typescript
function calculateHardwareCost(hardware: Hardware): number {
  return Math.floor(
    hardware.baseCost * Math.pow(HARDWARE_CONFIG.COST_MULTIPLIER, hardware.owned)
  );
}

// Con COST_MULTIPLIER_BY_ID.basic_cpu = 1.40 y baseCost = 25:
// 1ra unidad: 25
// 2da unidad: 35 (40% más cara)
// 5ta unidad: 96
// 8va unidad: 263 (unlock next tier)
// 10ma unidad: 515
```

**Explicación del Scaling**: Cada unidad cuesta un % más que la anterior (per-tier: 1.20-1.40). Early tiers scale faster (1.40) to push progression forward, late tiers scale gently (1.20-1.25) to allow accumulation. Esto crea una curva exponencial donde comprar muchas unidades del mismo hardware se vuelve prohibitivamente caro, incentivando al jugador a diversificar y avanzar al siguiente tier.

#### 2.2 Producción de Hardware (Base)
```typescript
function calculateHardwareProduction(
  hardware: Hardware,
  upgrades: Upgrade[]
): number {
  let production = hardware.miningSpeed * hardware.blockReward * hardware.owned;

  // Aplicar upgrade multipliers
  for (const upgrade of upgrades) {
    if (upgrade.purchased && upgrade.effect.type === 'production') {
      if (matchesHardwareCategory(hardware.id, upgrade.effect.target)) {
        production *= upgrade.effect.multiplier;
      }
    }
  }

  return production;
}

// Ejemplo con 1 Basic CPU (0.3 blocks/s, 45 CC/block):
// Producción = 0.3 × 45 = 13.5 CC/s
```

#### 2.3 Producción Neta (Con Electricidad)
```typescript
function calculateNetProduction(gameState: GameState): number {
  let totalProduction = 0;
  let totalElectricity = 0;

  for (const hardware of gameState.hardware) {
    const hwProduction = calculateHardwareProduction(hardware, gameState.upgrades);
    const hwElectricity = hardware.electricityCost * hardware.owned;

    totalProduction += hwProduction;
    totalElectricity += hwElectricity;
  }

  // Electricidad NO puede hacer la producción negativa
  const netProduction = Math.max(0, totalProduction - totalElectricity);

  // Aplicar prestige multiplier
  return netProduction * gameState.prestigeMultiplier;
}

// Ejemplo:
// Total producción: 1000 CC/s
// Total electricidad: 50 $/s
// Neto: 1000 - 50 = 950 CC/s
// Con prestige 2x: 950 × 2 = 1900 CC/s
```

### 3. Market System

#### 3.1 Valor de Venta
```typescript
function calculateSaleValue(amount: number, price: number): number {
  // Validaciones
  if (!price || price <= 0 || !isFinite(price)) return 0;

  const value = amount * price;

  // Límite anti-bug
  if (value > 100000000) return 0; // $100M max

  return value;
}

// Ejemplo con 10,000 CC @ $0.001/CC:
// Value = 10,000 × 0.001 = $10
```

#### 3.2 Precio de CryptoCoin
```typescript
function calculateCryptoCoinPrice(): number {
  // CryptoCoin usa precio fijo (no fluctúa por ahora)
  return CRYPTO_CONFIG.cryptocoin.baseValue; // $0.001
}

// Futuro: Podría fluctuar basado en supply/demand
```

### 4. Upgrade System

#### 4.1 Efecto de Upgrade (Multiplier)
```typescript
function applyUpgradeMultiplier(
  baseValue: number,
  upgrades: Upgrade[],
  upgradeType: string
): number {
  let multiplier = 1;

  for (const upgrade of upgrades) {
    if (upgrade.purchased && upgrade.effect.type === upgradeType) {
      multiplier *= upgrade.effect.multiplier;
    }
  }

  return baseValue * multiplier;
}

// Ejemplo con click upgrades (multiplicativos):
// Base click reward: currentReward CC
// Con Click Power (×2): reward × 2
// + Click Mastery (×2): reward × 2 × 2 = ×4
// + Click Legend (×2): reward × 2 × 2 × 2 = ×8
```

#### 4.2 Stacking de Upgrades
```typescript
// Los upgrades se multiplican entre sí (NO suman)
// Upgrade A: 2x
// Upgrade B: 2x
// Resultado: 2 × 2 = 4x (NO 2 + 2 = 4x)

function stackUpgradeMultipliers(upgrades: Upgrade[]): number {
  return upgrades
    .filter(u => u.purchased)
    .reduce((total, u) => total * u.effect.multiplier, 1);
}
```

### 5. Prestige System

#### 5.1 Multiplicador de Producción
```typescript
function calculateProductionMultiplier(prestigeLevel: number): number {
  return 1 + (prestigeLevel * PRESTIGE_CONFIG.bonuses.productionBonus);
}

// Con PRODUCTION_BONUS = 0.1 (10%):
// Level 0: 1.0x
// Level 1: 1.1x (+10%)
// Level 5: 1.5x (+50%)
// Level 10: 2.0x (+100%)
// Level 50: 6.0x (+500%)
```

#### 5.2 Multiplicador de Click
```typescript
function calculateClickMultiplier(prestigeLevel: number): number {
  return 1 + (prestigeLevel * PRESTIGE_CONFIG.bonuses.clickBonus);
}

// Con CLICK_BONUS = 0.05 (5%):
// Level 0: 1.0x
// Level 10: 1.5x (+50%)
// Level 20: 2.0x (+100%)
```

#### 5.3 Tiempo Estimado de Run
```typescript
function estimateRunDuration(
  prestigeLevel: number,
  baselineDuration: number
): number {
  const currentMultiplier = calculateProductionMultiplier(prestigeLevel);
  return baselineDuration / currentMultiplier;
}

// Ejemplo con baseline de 10 horas:
// Level 0: 10 horas
// Level 1 (1.1x): 9.09 horas
// Level 5 (1.5x): 6.67 horas
// Level 10 (2.0x): 5 horas
```

### 6. Offline Progress

El juego calcula ganancias offline al volver al primer plano mediante `updateOfflineProgress()`. Si el jugador tiene IAP Offline Miner activo, se acreditan automáticamente; si no, se almacenan como `pendingOfflineEarnings` para reclamar vía modal (ad-gated). Al reclamar, `claimOfflineEarnings()` avanza `blocksMined` junto con las CC.

**Invariante del génesis**: Toda CC que entra al sistema debe avanzar `blocksMined`. Esto aplica a: producción normal, offline earnings, packs IAP (`creditCryptoCoins()`), y achievement rewards (`creditCryptoCoins()`). No pueden existir CC sin bloques minados correspondientes.

## ROI (Return on Investment) por Hardware

### Metodología de Cálculo
```typescript
function calculateHardwareROI(hardware: Hardware): {
  breakEvenTime: number;    // Segundos para recuperar inversión
  roi24h: number;           // ROI en 24 horas (%)
  coinsPerDollar: number;   // CryptoCoins generados por $ invertido
} {
  const cost = calculateHardwareCost(hardware);
  const production = hardware.miningSpeed * hardware.blockReward; // CC/s por unidad
  const electricityCost = hardware.electricityCost; // $/s por unidad

  // Convertir producción a $ usando precio de CC
  const productionInDollars = production * CRYPTO_CONFIG.cryptocoin.baseValue;

  // Net earnings por segundo (producción - electricidad)
  const netEarningsPerSecond = productionInDollars - electricityCost;

  if (netEarningsPerSecond <= 0) {
    return {
      breakEvenTime: Infinity,
      roi24h: -100,
      coinsPerDollar: 0,
    };
  }

  const breakEvenTime = cost / netEarningsPerSecond;
  const earnings24h = netEarningsPerSecond * 86400; // 24h en segundos
  const roi24h = ((earnings24h - cost) / cost) * 100;
  const coinsPerDollar = (production * 86400) / cost;

  return { breakEvenTime, roi24h, coinsPerDollar };
}
```

### Tabla de Hardware (Valores Actuales — Economy Rebalance v3)

| Hardware | baseCost ($) | miningSpeed | costMultiplier | Electricity Weight |
|----------|:---:|:---:|:---:|:---:|
| Basic CPU | $25 | 0.3 | 1.40 | 3 |
| Advanced CPU | $350 | 1.5 | 1.40 | 10 |
| Basic GPU | $3,500 | 8 | 1.35 | 40 |
| Advanced GPU | $22,000 | 55 | 1.35 | 120 |
| ASIC Gen 1 | $350,000 | 350 | 1.30 | 300 |
| ASIC Gen 2 | $2,250,000 | 2,400 | 1.30 | 900 |
| ASIC Gen 3 | $18,000,000 | 16,000 | 1.28 | 2,500 |
| Mining Farm | $120,000,000 | 100,000 | 1.25 | 4,500 |
| Quantum Miner | $500,000,000 | 650,000 | 1.22 | 15,000 |
| Supercomputer | $2,000,000,000 | 4,000,000 | 1.20 | 50,000 |

**Notas**:
- `blockReward` is deprecated — reward is global per era (see `bitcoin-faithful-economy.md`)
- `electricityCost` is a CC fee weight; RATE_PERCENT is currently 0 (disabled, pending rework)
- Hardware se compra con $ (real money), no con CryptoCoins
- COST_MULTIPLIER_BY_ID: per-tier multipliers (1.20-1.40) — early tiers scale faster
- UNLOCK_REQUIREMENT: 8 units of previous tier to unlock next
- ROI depends on the current era's base price for CC

### Estrategia Óptima (Early Game)
1. Comprar 10 Basic CPU (mejor ROI inicial)
2. Unlock Advanced CPU, comprar 5-10 unidades
3. Vender suficientes coins para desbloquear Market tab ($200)
4. Unlock Basic GPU, comprar 5 unidades
5. Comprar upgrade "CPU Efficiency" para duplicar producción de CPUs
6. Continuar escalando GPUs hasta desbloquear ASICs

### Estrategia Óptima (Late Game)
1. Priorizar ASIC Gen 3 (máxima producción)
2. Comprar upgrade "ASIC Optimization" (2x multiplier)
3. Balancear entre comprar más ASICs vs save for prestige
4. Hacer prestige al llegar a 21M bloques
5. Repetir con multipliers de prestige para runs más rápidos

## Precio de CryptoCoin — Motor de Precios OU

El precio de CC se genera dinámicamente usando un proceso Ornstein-Uhlenbeck mean-reverting con regímenes de mercado:

```
CC_price = ERA_BASE_PRICES[currentEra] × (1 + priceDeviation)
priceDeviation = mean-reverting OU process, range [-0.30, +0.40]
```

**Parámetros OU**: theta=0.12, sigma=0.045, clamped [-0.30, +0.40]
**Fluctuación por tick**: ~2.5% (vs 0.04% con el antiguo dataset BTC)
**6 regímenes**: normal (40%), bull/bear (18% c/u), volatile (12%), spike/crash (6% c/u)
**Precio base por era**: $0.05 → $0.18 → $0.55 → ... → $4,000,000 (20 eras)
**Fuente**: `balanceConfig.ts` → `PRICE_ENGINE`, `src/utils/priceEngine.ts`

> La desviación mean-reverts a 0, por lo que ERA_BASE_PRICES[era] es el valor esperado para simulaciones de largo plazo.

---

## Progresión Temporal Esperada

### Supuestos de la Simulación (Economy Rebalance v3 — 2026-04-04)

- **COST_MULTIPLIER_BY_ID**: per-tier (1.20-1.40); 8 unidades to unlock next tier
- **ERA_BASE_PRICES**: 20-entry array [$0.05 → $4,000,000]
- **Difficulty**: Speed-based power curve `1.0 + 0.35 × (totalMiningSpeed / 80)^0.70`
- **Electricity fee**: Disabled (RATE_PERCENT = 0, pending rework)
- **blockReward**: Global per era (50 → 25 → 12.5...), NOT per hardware
- **Sin offline progress**; producción solo durante sesión activa
- **Target**: ~12 hours active play to first prestige

### $/bloque por Era

| Era | Block Reward | CC Price | $/bloque |
|---|:---:|:---:|:---:|
| 0 | 50 CC | $0.05 | $2.50 |
| 1 | 25 CC | $0.18 | $4.50 |
| 2 | 12.5 CC | $0.55 | $6.88 |
| 3 | 6.25 CC | $1.40 | $8.75 |
| 4 | 3.125 CC | $3.50 | $10.94 |
| 5 | 1.5625 CC | $8.00 | $12.50 |
| 6 | 0.78125 CC | $18.00 | $14.06 |
| 7+ | halving | grows | ~$15-16 plateau then gradual climb |

**Nota**: $/bloque crece ~8-12% per era, plateaus in mid-game, then accelerates in late eras (14+). With 20 eras defined, the economy supports extended play across multiple prestiges.

### Hardware Investment por Era

| Tier | 8 units cost ($) | Target Era |
|---|:---:|---|
| basic_cpu — advanced_gpu | ~$350K | Era 0-1 |
| asic_gen1 — asic_gen2 | ~$40M | Era 1-3 |
| asic_gen3 | ~$200M | Era 3-5 |
| mining_farm | ~$1B | Era 5-7 |
| quantum_miner | ~$5B | Multiple eras + prestige |
| supercomputer | ~$16B | Post-prestige endgame |

### Observaciones

- Quantum Miner ($500M base) es difícilmente alcanzable en primera run
- Supercomputer ($2B base) está diseñado como meta de múltiples prestiges
- Difficulty scales with totalMiningSpeed: higher hardware = steeper curve
- Electricity fee is disabled (RATE_PERCENT = 0) pending rework
- El first prestige debería ocurrir ~12 horas de juego activo
- UNLOCK_REQUIREMENT = 8 (need 8 units of previous tier)

## Break-Even Analysis

### ¿Cuándo es rentable comprar hardware?

```typescript
function isHardwareProfitable(
  hardware: Hardware,
  currentProduction: number,
  hoursUntilPrestige: number
): boolean {
  const cost = calculateHardwareCost(hardware);
  const productionIncrease = hardware.miningSpeed * hardware.blockReward;
  const electricityCost = hardware.electricityCost;

  // Convertir a $ usando precio de CC
  const productionInDollars = productionIncrease * CRYPTO_CONFIG.cryptocoin.baseValue;
  const netEarnings = productionInDollars - electricityCost;

  // Ganancias totales hasta el prestige
  const totalEarnings = netEarnings * hoursUntilPrestige * 3600;

  // Es rentable si ganas más de lo que gastas
  return totalEarnings > cost;
}

// Ejemplo:
// ASIC Gen 3 cuesta $1M
// Produce 2,000 CC/s = $2/s
// Electricidad: $100/s
// Net: $2 - $100 = -$98/s (NO RENTABLE sin vender producción)
// Pero si vendes los 2,000 CC/s: $2/s ganancia
// Necesitas ~139 horas para break-even
```

**Regla general**:
- Si faltan menos de 1 hora para prestige: NO comprar hardware caro
- Si faltan 5+ horas: Comprar hardware es casi siempre rentable
- Si la electricidad > producción: NUNCA comprar (a menos que tengas upgrades)

## Balance Testing Methodology

### 1. Automated Balance Tests

```typescript
describe('Balance Tests', () => {
  it('should complete first run in many hours of active play', () => {
    const simulation = simulateActivePlaythrough({
      startingState: getInitialGameState(),
      strategy: 'optimal',
    });

    // With new economy, first run is significantly longer
    // Quantum Miner may not be reachable in first run
    expect(simulation.timeToCompletion).toBeGreaterThan(20 * 3600);
  });

  it('should make each prestige run faster', () => {
    const run1 = simulateRun({ prestigeLevel: 0 });
    const run2 = simulateRun({ prestigeLevel: 1 });
    const run5 = simulateRun({ prestigeLevel: 5 });

    expect(run2.duration).toBeLessThan(run1.duration);
    expect(run5.duration).toBeLessThan(run2.duration);
  });

  it('should never have negative production', () => {
    const worstCase = {
      hardware: [{ id: 'asic_gen3', owned: 100 }],
      upgrades: [],
      prestigeLevel: 0,
    };

    const production = calculateNetProduction(worstCase);
    expect(production).toBeGreaterThanOrEqual(0);
  });

  it('should make all hardware progressively unlockable', () => {
    const simulation = simulatePlaythrough();

    for (const hardware of ALL_HARDWARE) {
      expect(simulation.unlockTimes[hardware.id]).toBeDefined();
      expect(simulation.unlockTimes[hardware.id]).toBeFinite();
    }
  });
});
```

### 2. Manual Balance Testing Checklist

- [ ] **Early Game (0-1 hour)**:
  - [ ] Primer CryptoCoin se gana en menos de 10 segundos
  - [ ] Primer hardware se compra en menos de 5 minutos
  - [ ] Market se desbloquea en menos de 15 minutos
  - [ ] Primer upgrade se puede comprar en menos de 1 hora

- [ ] **Mid Game**:
  - [ ] Al menos 3 niveles de hardware desbloqueados
  - [ ] Primer halving (210K blocks) ocurre naturally
  - [ ] ASICs requieren ahorro significativo
  - [ ] La progresión se siente constante (siempre hay "next goal")

- [ ] **Late Game**:
  - [ ] Mining Farm requiere inversión importante (~$80M para 5)
  - [ ] Quantum Miner es difícilmente alcanzable en primera run
  - [ ] La electricidad CC fee consume 10-35% del income
  - [ ] Prestige se siente como un logro (no trivial)

- [ ] **Post-Prestige**:
  - [ ] Segundo run es notablemente más rápido (10-30% faster)
  - [ ] Run 5 es significativamente más rápido (50%+ faster)
  - [ ] Run 10 es aproximadamente mitad del tiempo del run 1
  - [ ] No hay "prestige wall" donde deja de ser más rápido

### 3. Metrics de Balance Exitoso

```typescript
interface BalanceMetrics {
  // Tiempo de primer prestige
  averageFirstRunDuration: number;      // Target: significativamente largo (multiple sessions)
  medianFirstRunDuration: number;       // Target: days of active play

  // Distribución de tiempo jugado
  percentActivePlay: number;            // Target: 40-60%
  percentOfflineProgress: number;       // Target: 40-60%

  // Engagement
  averageSessionLength: number;         // Target: 15-30 minutos
  sessionsPerDay: number;               // Target: 3-5 sessions

  // Monetización (futuro)
  percentPlayersWhoSpend: number;       // Target: 2-5%
  averageRevenuePerUser: number;        // Target: $1-3

  // Retención
  day1Retention: number;                // Target: 60%+
  day7Retention: number;                // Target: 30%+
  day30Retention: number;               // Target: 10%+

  // Prestige engagement
  averagePrestigeLevel: number;         // Target: 5-10
  percentReachPrestige10: number;       // Target: 20%+
}
```

### 4. Tuning Process

**Si el juego es muy lento**:
1. Reducir `HARDWARE_CONFIG.levels.*.baseCost` ($ costs)
2. Increase `ERA_BASE_PRICES` to give more $ per CC sold
3. Reducir `COST_MULTIPLIER_BY_ID` values
4. Reducir `BLOCK_CONFIG.DIFFICULTY.AMPLITUDE` o `EXPONENT`
5. Reducir `UNLOCK_REQUIREMENT` (actualmente 8)

**Si el juego es muy rápido**:
1. Aumentar `HARDWARE_CONFIG.levels.*.baseCost`
2. Reducir `ERA_BASE_PRICES`
3. Aumentar `COST_MULTIPLIER_BY_ID` values
4. Aumentar `BLOCK_CONFIG.DIFFICULTY.AMPLITUDE` o `EXPONENT`
5. Aumentar `UNLOCK_REQUIREMENT` (actualmente 8)

**Si el prestige es muy débil**:
1. Aumentar `PRESTIGE_CONFIG.bonuses.productionBonus` (ej: 0.1 → 0.15)
2. Aumentar `PRESTIGE_CONFIG.bonuses.clickBonus` (ej: 0.05 → 0.08)

**Si el prestige es muy fuerte**:
1. Reducir bonos de prestige
2. Aumentar requisitos de prestige (ej: requiere 25M bloques en vez de 21M)

## Optimal Strategies (Player Guide)

### Strategy 1: Speedrunner (Fastest Completion)
**Objetivo**: Completar el juego lo más rápido posible

1. Comprar solo hardware con mejor ROI (Basic CPU → Advanced CPU → Basic GPU)
2. NO comprar hardware caro hasta tener upgrades que lo multipliquen
3. Comprar todos los upgrades de producción apenas sea posible
4. Vender CryptoCoins constantemente para maximizar cash flow
5. Priorizar ASIC Gen 3 + ASIC Optimization en late game

**Tiempo estimado**: Multiple sessions (first run)

### Strategy 2: Balanced (Equilibrado)
**Objetivo**: Juego casual, sin prisa

1. Comprar hardware de todos los niveles (diversificar)
2. Explorar todos los upgrades
3. Vender coins cuando el precio es favorable (si hay fluctuación)
4. Hacer prestige cuando se sienta natural (al completar)
5. Disfrutar del proceso sin optimizar excesivamente

**Tiempo estimado**: Many sessions (first run)

### Strategy 3: Efficiency Builder (Máximo ROI)
**Objetivo**: Optimizar ratio producción/electricidad

1. Comprar hardware con BAJO electricityCost relativo a su producción
2. Comprar upgrades de producción antes que de click
3. Usar prestige para acelerar runs futuros
4. Vender coins en picos de precio

**Tiempo estimado**: Extended play (first run)

### Strategy 4: Prestige Hunter (Máximo Prestige Levels)
**Objetivo**: Alcanzar el mayor prestige level posible

1. Hacer prestige lo más rápido posible cada run
2. Usar estrategia Speedrunner para cada run
3. Priorizar badges que dan bonos permanentes
4. Optimizar cada run para mejorar tiempo del anterior
**Tiempo estimado**: 100+ horas para alcanzar prestige level 50

## Edge Cases de Balance

### Edge Case 1: Jugador compra solo 1 tipo de hardware
- **Escenario**: Solo comprar ASIC Gen 3, ignorar todo lo demás
- **Problema**: Costo escala tan rápido que se vuelve imposible progresar
- **Solución**: El unlock progresivo fuerza diversificación (necesitas 5 del anterior)

### Edge Case 2: Electricidad > Producción
- **Escenario**: Jugador compra mucho hardware caro sin suficientes coins para sostenerlo
- **Problema**: Net production = 0 (clamped), jugador stuck
- **Solución**:
  - Net production nunca va negativo (clamp a 0)
  - Permitir vender hardware en futuro (Phase 4+)
  - Tutorial warning sobre electricidad

### Edge Case 3: Prestige muy temprano (si se permite)
- **Escenario**: Jugador intenta hacer prestige con 10M bloques
- **Problema**: Recibe bonos sin haber "completado" el juego
- **Solución**: Prestige requiere exactamente 21M bloques (hard requirement)

### Edge Case 4: Offline por 1 semana
- **Escenario**: Jugador no abre el juego por 7 días
- **Resultado**: No hay earnings offline — al volver, el estado está exactamente donde lo dejó
- **Diseño intencional**: El juego requiere sesiones activas para progresar

### Edge Case 5: Precio de CryptoCoin sube mucho
- **Escenario**: Precio de CC pasa de $0.001 a $1 (si hubiera fluctuación real)
- **Problema**: Jugador se vuelve millonario instantáneamente
- **Solución**:
  - CryptoCoin usa precio fijo (no fluctúa actualmente)
  - Si se implementa fluctuación, cap de ±20% del base value

## Analytics para Balance

```typescript
// Track balance metrics en Firebase
analytics().logEvent('balance_metric', {
  metric_name: 'first_run_completion_time',
  value: completionTimeInSeconds,
  prestige_level: 0,
});

analytics().logEvent('balance_metric', {
  metric_name: 'hardware_purchase',
  hardware_id: hardware.id,
  cost: cost,
  owned_before: hardware.owned,
  time_since_start: timeSinceStart,
});

analytics().logEvent('balance_metric', {
  metric_name: 'milestone_reached',
  milestone: 'first_gpu',
  time_to_milestone: timeToMilestone,
});

// Agregar metrics en dashboard:
// - Average time to first prestige
// - Distribution of run completion times
// - Most purchased hardware (by count)
// - Most profitable hardware (by ROI)
// - Upgrade purchase rate
// - Offline vs active play ratio
```

## Preguntas Abiertas

- [ ] **Difficulty adjustment**: ¿Implementar dificultad dinámica basada en player skill?
  - **Recomendación**: No, mantener balance fijo para todos

- [ ] **Precio dinámico de CryptoCoin**: ¿Fluctuar basado en supply total?
  - **Recomendación**: Phase 3+, añade complejidad interesante

- [ ] **Hardware level skip**: ¿Permitir desbloquear hardware saltándose niveles con $?
  - **Recomendación**: No, rompe progresión diseñada

- [ ] **Negative production**: ¿Permitir que electricidad cause pérdida de coins?
  - **Recomendación**: No, sería muy frustrante

- [ ] **Balance patches**: ¿Cómo manejar cambios de balance para jugadores existentes?
  - **Recomendación**: Comunicar claramente, ofrecer "compensation" si es nerf severo

## Referencias

- Idle Game Mathematics: https://gameanalytics.com/blog/idle-game-mathematics/
- Exponential Growth in Games: https://www.gamasutra.com/blogs/TristanEngel/20180110/312681/Exponential_Growth_in_Idle_Games.php
- Cookie Clicker Numbers: https://cookieclicker.fandom.com/wiki/Building
- Desmos Graphing Calculator: https://www.desmos.com/calculator (para visualizar curvas)
- Balancing Incremental Games: https://www.reddit.com/r/incremental_games/wiki/design_balance

## Changelog de Balance

### Version 4.0 (2026-04-04) — Economy Rebalance v3 (12h target)
- Difficulty: blocks-based → speed-based (`1.0 + 0.35 × (totalMiningSpeed / 80)^0.70`)
- ERA_BASE_PRICES: 7 entries → 20 entries [$0.05 → $4,000,000]
- COST_MULTIPLIER: global 1.35 → per-tier COST_MULTIPLIER_BY_ID (1.20-1.40)
- UNLOCK_REQUIREMENT: 5 → 8
- ELECTRICITY_FEE_CONFIG.RATE_PERCENT: 1.5 → 0 (disabled, pending rework)
- Hardware costs significantly increased (e.g., basic_gpu $800→$3,500, asic_gen1 $35K→$350K, supercomputer $500M→$2B)
- Mining speeds significantly reduced for late-game tiers (e.g., supercomputer 600→4M, but with higher absolute values for mid-tiers)
- Click upgrade chain: 5×3×2=30x → 2×2×2=8x
- Upgrade costs rebalanced (cpuEfficiency $1.5K→$4K, asicOptimization $10M→$80M, etc.)
- clickLegend: cost $10M→$500K, unlock from asic_gen3@10 to advanced_gpu@5
- Ad bubble config updated (hash +35%/3min, market +25%/5min)
- Starter pack rewards massively increased to match new economy scale
- PACK_CONFIG dynamic ranges updated

### Version 3.0 (2026-03-27) — Economy Rebalance v2
- COST_MULTIPLIER: 1.20 → 1.35
- ERA_BASE_PRICES: [0.10, 2.00, 10.00, 40.00, 100.00] → [0.08, 0.50, 2.00, 5.00, 8.00]
- Difficulty: log₁₀ formula → power curve (AMPLITUDE 0.8, EXPONENT 0.65, SCALE 200K)
- ELECTRICITY_FEE_CONFIG.RATE_PERCENT: 0.75 → 1.5
- Hardware costs rebalanced (quantum_miner $5M → $50M, supercomputer $50M → $500M)
- Electricity weights rebalanced for higher CC drain
- Upgrade costs rebalanced (25-35% of hardware investment)

### Version 2.0 (2026-03-20) — Option A/B/C Rebalance
- COST_MULTIPLIER: 1.15 → 1.20
- Added tiers 9-11 (Mining Farm, Quantum Miner, Supercomputer)
- Bitcoin-faithful economy (global block reward, era pricing)
- Electricity → CC Mining Fee system

### Version 1.0 (2026-02-21)
- Establecidos valores iniciales de balance
- COST_MULTIPLIER: 1.15
- Prestige bonuses: 10% production, 5% click
- Sin offline earnings (producción solo durante sesión activa)
