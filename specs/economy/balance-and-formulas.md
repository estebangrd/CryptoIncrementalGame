# Balance and Formulas

## Estado
- **Fase**: Phase 1 - Genesis (Active Reference Document)
- **Estado**: Living Document - Updated Continuously
- **Prioridad**: Critical (Game Balance Foundation)
- **Última actualización**: 2026-02-21

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
  DIFFICULTY_INCREASE_RATE: 0.00001,
};

// HARDWARE_CONFIG - Costos y producción de hardware
export const HARDWARE_CONFIG = {
  COST_MULTIPLIER: 1.15,
  UNLOCK_REQUIREMENT: 5,
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

// Con COST_MULTIPLIER = 1.15 y baseCost = 500:
// 1ra unidad: 500
// 2da unidad: 575 (15% más cara)
// 5ta unidad: 875
// 10ma unidad: 2,023
// 20ma unidad: 8,181
// 50ma unidad: 331,163
```

**Explicación del Scaling**: Cada unidad cuesta 15% más que la anterior. Esto crea una curva exponencial donde comprar muchas unidades del mismo hardware se vuelve prohibitivamente caro, incentivando al jugador a diversificar.

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

// Ejemplo con Click Power upgrade (1.5x):
// Base click: 1 CC
// Con upgrade: 1 × 1.5 = 1.5 CC/click
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

El juego **no acredita ganancias mientras está en background**. La producción solo ocurre cuando el usuario está jugando activamente. Al volver al primer plano, `updateOfflineProgress` únicamente sincroniza `lastSaveTime` sin acreditar monedas.

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

### Tabla de ROI (Hardware @1 unidad owned)

| Hardware | Cost | Production (CC/s) | Electricity ($/s) | Break-Even | ROI 24h | Coins/$ |
|----------|------|-------------------|-------------------|------------|---------|---------|
| Basic CPU | $500 | 13.5 | $0.5 | ~83 min | +130% | 2,332 |
| Advanced CPU | $2,500 | 33.6 | $1.2 | ~75 min | +111% | 1,161 |
| Basic GPU | $10,000 | 95 | $3 | ~106 min | +72% | 821 |
| Advanced GPU | $40,000 | 210 | $7 | ~191 min | +39% | 453 |
| ASIC Gen 1 | $125,000 | 450 | $20 | ~278 min | +21% | 311 |
| ASIC Gen 2 | $375,000 | 1,000 | $45 | ~386 min | +10% | 230 |
| ASIC Gen 3 | $1,000,000 | 2,000 | $100 | ~500 min | +4.8% | 173 |

**Notas**:
- Production calculado como `miningSpeed × blockReward`
- Cost es el costo de la PRIMERA unidad (baseCost)
- Break-Even es tiempo para recuperar inversión vendiendo toda la producción
- ROI 24h asume que el jugador vende toda la producción al precio base de CC ($0.001)
- Cada unidad adicional tiene PEOR ROI debido al scaling exponencial del costo

**Insights**:
- Early hardware (CPU/GPU básico) tiene excelente ROI → fácil recuperar inversión
- Late hardware (ASIC Gen 3) tiene terrible ROI → solo viable con prestige multipliers
- La electricidad impacta significativamente el ROI en late game

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

## Progresión Temporal Esperada

### Milestone Timeline (First Playthrough, Active Player)

| Milestone | Time | Blocks Mined | Money Earned | Notes |
|-----------|------|--------------|--------------|-------|
| First CryptoCoin | 0s | 0 | $0 | Manual mining starts |
| First Basic CPU | ~2 min | 10-15 | $0.50 | First hardware purchase |
| Market Unlock | ~10 min | 15 | $1,000 CC | Can sell coins now |
| First $100 | ~20 min | 100 | $100 | Approaching hardware unlock |
| Hardware Tab Unlock | ~30 min | 200 | $200 | Advanced hardware available |
| First Upgrade | ~45 min | 500 | $5,000 | CPU Efficiency probably |
| First GPU | ~1 hour | 1,000 | $10,000 | Significant power spike |
| First Halving | ~2 hours | 210,000 | $100,000 | Reward drops to 25 CC/block |
| First ASIC | ~4 hours | 500,000 | $500,000 | Late game hardware |
| Second Halving | ~6 hours | 420,000 | $2M | Reward: 12.5 CC/block |
| ASIC Gen 3 | ~8 hours | 1M | $10M | Endgame hardware |
| 10M Blocks | ~10 hours | 10M | $50M | Halfway to completion |
| 20M Blocks | ~12 hours | 20M | $100M | Almost done |
| **First Prestige** | ~15 hours | 21M | $200M | COMPLETE! |

**Notas**:
- Tiempos asumen juego activo (no hay offline progress)
- Pueden variar ±30% basado en estrategia del jugador
- Upgrades compradas pueden acelerar progresión

### Subsequent Runs (Con Prestige)

| Prestige Level | Estimated Time | Notes |
|----------------|----------------|-------|
| Run #2 (Level 1, 1.1x) | ~13.6 hours | 10% más rápido |
| Run #3 (Level 2, 1.2x) | ~12.5 hours | 20% más rápido |
| Run #5 (Level 5, 1.5x) | ~10 hours | 50% más rápido |
| Run #10 (Level 10, 2.0x) | ~7.5 hours | 100% más rápido |
| Run #20 (Level 20, 3.0x) | ~5 hours | 200% más rápido |
| Run #50 (Level 50, 6.0x) | ~2.5 hours | 500% más rápido |

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
  it('should complete first run in 10-20 hours (active play)', () => {
    const simulation = simulateActivePlaythrough({
      startingState: getInitialGameState(),
      strategy: 'optimal',
    });

    expect(simulation.timeToCompletion).toBeGreaterThan(10 * 3600);
    expect(simulation.timeToCompletion).toBeLessThan(20 * 3600);
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

- [ ] **Mid Game (1-8 horas)**:
  - [ ] Al menos 3 niveles de hardware desbloqueados
  - [ ] Primer halving ocurre antes de 4 horas
  - [ ] ASICs se desbloquean antes de 6 horas
  - [ ] La progresión se siente constante (siempre hay "next goal")

- [ ] **Late Game (8-15 horas)**:
  - [ ] ASIC Gen 3 se puede comprar antes de 10 horas
  - [ ] 21M bloques se alcanzan en 10-20 horas (active play)
  - [ ] La electricidad no mata la producción completamente
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
  averageFirstRunDuration: number;      // Target: 10-15 horas
  medianFirstRunDuration: number;       // Target: 12 horas

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
1. Aumentar `HARDWARE_CONFIG.levels.*.blockReward` en 10-20%
2. Reducir `HARDWARE_CONFIG.levels.*.baseCost` en 10-20%
3. Aumentar `CRYPTO_CONFIG.cryptocoin.baseValue` (ej: $0.001 → $0.0015)
4. Reducir `HARDWARE_CONFIG.COST_MULTIPLIER` (ej: 1.15 → 1.12)

**Si el juego es muy rápido**:
1. Reducir `HARDWARE_CONFIG.levels.*.blockReward` en 10-20%
2. Aumentar `HARDWARE_CONFIG.levels.*.baseCost` en 10-20%
3. Reducir `CRYPTO_CONFIG.cryptocoin.baseValue` (ej: $0.001 → $0.0008)
4. Aumentar `HARDWARE_CONFIG.COST_MULTIPLIER` (ej: 1.15 → 1.18)

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

**Tiempo estimado**: 8-12 horas (first run)

### Strategy 2: Balanced (Equilibrado)
**Objetivo**: Juego casual, sin prisa

1. Comprar hardware de todos los niveles (diversificar)
2. Explorar todos los upgrades
3. Vender coins cuando el precio es favorable (si hay fluctuación)
4. Hacer prestige cuando se sienta natural (al completar)
5. Disfrutar del proceso sin optimizar excesivamente

**Tiempo estimado**: 15-20 horas (first run)

### Strategy 3: Efficiency Builder (Máximo ROI)
**Objetivo**: Optimizar ratio producción/electricidad

1. Comprar hardware con BAJO electricityCost relativo a su producción
2. Comprar upgrades de producción antes que de click
3. Usar prestige para acelerar runs futuros
4. Vender coins en picos de precio

**Tiempo estimado**: 12-18 horas (first run)

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

### Version 1.0 (2026-02-21)
- Establecidos valores iniciales de balance
- COST_MULTIPLIER: 1.15
- Prestige bonuses: 10% production, 5% click
- Sin offline earnings (producción solo durante sesión activa)

### Future Versions
- TBD basado en playtesting y analytics
