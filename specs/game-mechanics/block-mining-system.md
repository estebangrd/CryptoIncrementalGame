# Block Mining System

## Estado
- **Fase**: Phase 1 - Genesis (Implemented)
- **Estado**: Implemented & Active
- **Prioridad**: Critical (Core Game Mechanic)
- **Última actualización**: 2026-03-05

## Descripción

El sistema de minado de bloques es la mecánica central del juego, inspirada en el funcionamiento de Bitcoin. Los jugadores minan bloques automáticamente basándose en su hardware, y cada bloque minado otorga una recompensa en CryptoCoins. El sistema implementa halvings (reducción de recompensa) cada cierto número de bloques, creando una economía deflacionaria similar a Bitcoin.

Este sistema es el corazón del loop de gameplay: minar bloques → ganar CryptoCoins → comprar hardware → minar más rápido → repetir.

## Objetivos
- [x] Simular el sistema de minado de Bitcoin de forma simplificada
- [x] Crear una curva de progresión satisfactoria mediante halvings
- [x] Balancear la velocidad de minado para mantener engagement
- [x] Proveer feedback visual claro del progreso de minado
- [x] Implementar límite de suministro (21M bloques como Bitcoin)
- [x] El minado manual es la fuente primaria early-game, pero insignificante en midgame

## Comportamiento Esperado

### Caso de Uso 1: Minado Automático Continuo
**Dado que** el jugador tiene al menos 1 unidad de hardware con `miningSpeed > 0`
**Cuando** el game loop tick se ejecuta (cada 1 segundo)
**Entonces**
- Se calcula `totalMiningSpeed` sumando `miningSpeed * owned` de todo el hardware
- Se aplican multipliers de upgrades compradas
- Si `totalMiningSpeed >= 1.0`, se mina al menos 1 bloque completo
- Se pueden minar múltiples bloques por tick si `totalMiningSpeed` es alto (ej: 15.7 → mina 15 bloques)
- Cada bloque minado otorga `currentReward` CryptoCoins
- `gameState.blocksMined` se incrementa
- `gameState.cryptoCoins` aumenta por la suma de recompensas
- Se actualiza `currentReward` si se alcanzó un halving

### Caso de Uso 2: Minado Manual (Click)
**Dado que** el jugador presiona el botón de minar en la pantalla principal
**Cuando** se ejecuta la acción `MINE_BLOCK`
**Entonces**
- Se verifica `canMineBlock()` — si retorna false, no ocurre nada
- Se calcula `clickMultiplier` leyendo todos los upgrades de tipo `clickPower` comprados (multiplicativos)
- Se calcula `reward = Math.max(1, Math.floor(currentReward × clickMultiplier))`
  - Siempre es un número entero (no se minan fracciones de coin)
  - Mínimo 1 coin, incluso si `currentReward` es cercano a 0
- Se consume 1 bloque del supply de 21M (`blocksMined += 1`)
- El jugador recibe `reward` CryptoCoins
- Se actualiza `currentReward` y `nextHalving` en caso de halving

**Diseño de balance:**
- **Early game** (sin hardware): click = 50 coins = fuente primaria de ingresos
- **Con upgrade clickPower**: click = 250 coins (5×) — impacto notable early-mid
- **Midgame** (hardware produce 5,000+/sec): 250 coins/click = < 0.05 seg de producción → irrelevante
- **Late game**: halvings reducen el reward base (50 → 25 → 12.5...) AND hardware escala exponencialmente → el click se vuelve testimonial

**Upgrade clickPower:**
- Existe UN solo upgrade de este tipo (`id: 'clickPower'`)
- Multiplier: ×5
- Costo: $1,000 dinero real
- Se desbloquea siempre (visible desde el inicio del juego)
- Intención de diseño: el jugador NO debería seguir haciendo click activo en midgame

### Caso de Uso 3: Producción Automática Estable Post-Halvings
**Dado que** el jugador tiene hardware activo y ha pasado por múltiples halvings (e.g., blocksMined = 5,000,000)
**Cuando** el game loop tick se ejecuta
**Entonces**
- Se añaden exactamente `cryptoCoinsPerSecond` coins al balance del jugador
- El valor de `cryptoCoinsPerSecond` NO decreció por los halvings
- `blocksMined` sigue incrementando normalmente
- `currentReward` (display) sí refleja el valor halved, pero no afecta el income

**Anti-patrón evitado**: No se usa `calculateCurrentReward(blocksMined)` para calcular coins en la producción automática. Con alto mining speed (ej: 5 Mining Farms = 750 bloques/tick), el block reward efectivo caería a near-zero después de minutos, congelando la producción.

### Caso de Uso 3b: Mining Speed Respeta Restricciones de Energía en ADD_PRODUCTION
**Dado que** el jugador tiene 5 Mining Farms (500 MW c/u) y 0 MW de energía generada
**Cuando** el game loop tick de ADD_PRODUCTION se ejecuta
**Entonces**
- Los Mining Farms NO contribuyen a `blocksToMine` (están "apagados" por falta de energía)
- Solo el hardware tier 1-8 (sin requisito de energía) mina bloques
- Comprar luego generadores de energía activa los Mining Farms correctamente

**Rationale**: Sin esta restricción, el hardware tier 9+ incrementaría `blocksMined` sin energía, causando halvings prematuros y agotando el supply de 21M bloques sin que el jugador hubiera activado el hardware legítimamente.

### Caso de Uso 4: Halving Event
**Dado que** `blocksMined` alcanza un múltiplo de `HALVING_INTERVAL` (210,000)
**Cuando** se mina el bloque que cruza el umbral
**Entonces**
- `currentReward` se divide por 2 (ej: 50 → 25 → 12.5 → 6.25)
- `nextHalving` se actualiza al próximo intervalo (ej: 210,000 → 420,000)
- Se muestra una notificación visual del halving event
- El jugador ve reducida su tasa de ganancia de CryptoCoins por bloque
- La producción total (`cryptoCoinsPerSecond`) se recalcula automáticamente

### Caso de Uso 5: Alcanzar Máximo de Bloques
**Dado que** `blocksMined` alcanza `TOTAL_BLOCKS` (21,000,000)
**Cuando** se intenta minar un bloque adicional
**Entonces**
- La función `canMineBlock()` retorna `false`
- No se minan más bloques
- El juego considera que se completó la "Genesis Phase"
- Se desbloquea la opción de Prestige (si aún no estaba disponible)
- El jugador puede seguir vendiendo coins existentes o hacer prestige

### Caso de Uso 6: Visualización de Progreso
**Dado que** el jugador está en la pantalla principal del juego
**Cuando** el componente `BlockStatus` se renderiza
**Entonces**
- Se muestra `blocksMined` con formato legible (ej: "1.2K", "45.8M")
- Se muestra `currentReward` (recompensa actual por bloque)
- Se muestra `nextHalving` y bloques restantes hasta el próximo halving
- Se muestra `totalHashRate` (capacidad de minado total)
- Se muestra `cryptoCoinsPerSecond` (producción neta actual)
- Todos los valores se actualizan en tiempo real

## Fórmulas y Cálculos

### Cálculo de Reward por Click Manual
```typescript
function getClickMultiplier(gameState: GameState): number {
  return gameState.upgrades
    .filter(u => u.purchased && u.effect.type === 'clickPower')
    .reduce((acc, u) => acc * u.effect.value, 1);
}

function calculateClickReward(gameState: GameState): number {
  const baseReward = calculateCurrentReward(gameState.blocksMined);
  const multiplier = getClickMultiplier(gameState);
  return Math.max(1, Math.floor(baseReward * multiplier));
}

// Ejemplos de relevancia relativa:
// Early (sin HW, sin upgrade):  click=50,  producción=0/s    → click es TODO
// Early (sin HW, con upgrade):  click=250, producción=0/s    → click es TODO
// Early-mid (con upgrade):      click=250, producción=10/s   → click ≈ 25s de producción
// Midgame:                      click=250, producción=5000/s → click ≈ 0.05s → insignificante
// Post-halving midgame:         click=125, producción=5000/s → click ≈ 0.025s → irrelevante
```

### Cálculo de Mining Speed Total
```typescript
function calculateTotalMiningSpeed(hardware: Hardware[], upgrades: Upgrade[]): number {
  let totalSpeed = 0;

  for (const hw of hardware) {
    // Base mining speed from hardware
    let speed = hw.miningSpeed * hw.owned;

    // Apply upgrade multipliers for this hardware
    for (const upgrade of upgrades) {
      if (upgrade.purchased && upgrade.effect.type === 'production') {
        if (upgrade.effect.target === hw.id ||
            isHardwareCategory(hw.id, upgrade.effect.target)) {
          speed *= upgrade.effect.multiplier;
        }
      }
    }

    totalSpeed += speed;
  }

  return totalSpeed;
}
```

### Cálculo de Recompensa Actual
```typescript
function calculateCurrentReward(blocksMined: number): number {
  const halvings = Math.floor(blocksMined / HALVING_INTERVAL);
  return INITIAL_REWARD / Math.pow(2, halvings);
}

// Ejemplo:
// Bloques 0-209,999: reward = 50
// Bloques 210,000-419,999: reward = 25
// Bloques 420,000-629,999: reward = 12.5
// etc.
```

### Cálculo de Próximo Halving
```typescript
function calculateNextHalving(blocksMined: number): number {
  const currentHalving = Math.floor(blocksMined / HALVING_INTERVAL);
  return (currentHalving + 1) * HALVING_INTERVAL;
}

function getBlocksUntilHalving(blocksMined: number): number {
  return calculateNextHalving(blocksMined) - blocksMined;
}
```

### Producción de CryptoCoins por Segundo

La producción de monedas está **desacoplada del sistema de halvings** por diseño. Los halvings afectan el contador de bloques (progresión hacia 21M) pero no reducen el income per se.

```typescript
function calculateTotalProduction(gameState: GameState): number {
  let totalProduction = 0;

  for (const hardware of gameState.hardware) {
    // Para hardware tier 9+ (energyRequired > 0), solo cuentan las unidades activas
    const effectiveOwned = hardware.energyRequired > 0
      ? getActiveUnitsFromEnergyConstraint(hardware, gameState.energy)
      : hardware.owned;

    if (effectiveOwned === 0) continue;

    // Mining speed (blocks/second) × blockReward estático (coins/block)
    // NOTA: Se usa hardware.blockReward (estático), NO calculateCurrentReward(blocksMined)
    // Esto garantiza que las monedas por segundo nunca decaen por halvings
    const speed = calculateHardwareMiningSpeed({ ...hardware, owned: effectiveOwned }, gameState.upgrades);
    const coinsPerSecond = speed * hardware.blockReward;
    totalProduction += coinsPerSecond;
  }

  // Apply all multipliers (prestige, IAP boosters, ad boost, AI)
  return totalProduction * allMultipliers;
}
```

**Rationale**: `hardware.blockReward` es el valor de diseño de balance (e.g., 15 CC/bloque para Mining Farm). `calculateCurrentReward(blocksMined)` es el reward de la blockchain que decrece con halvings. Mezclarlos haría que la producción automática colapsara a cero, rompiendo el loop del juego.

### Verificación de Minado Permitido
```typescript
function canMineBlock(gameState: GameState): boolean {
  return gameState.blocksMined < gameState.totalBlocks;
}
```

### Hash Rate Total (Métrica Visual)

El hash rate refleja el poder de minado efectivo, incluyendo los mismos multiplicadores que afectan la producción real de monedas. Ubicación: `src/utils/gameLogic.ts`.

```typescript
function calculateTotalHashRate(gameState: GameState): number {
  let totalHashRate = 0;

  for (const hardware of gameState.hardware) {
    if (hardware.owned === 0) continue;

    const baseHashRate = hardware.baseProduction * 10; // H/s base por unidad

    // Multiplicadores de upgrades por hardware (mismo criterio que calculateHardwareMiningSpeed)
    let upgradeMultiplier = 1;
    for (const upgrade of gameState.upgrades) {
      if (upgrade.purchased && upgrade.effect.type === 'production') {
        if (upgrade.effect.target === hardware.id ||
            isHardwareInCategory(hardware.id, upgrade.effect.target)) {
          upgradeMultiplier *= upgrade.effect.value;
        }
      }
    }

    totalHashRate += baseHashRate * hardware.owned * upgradeMultiplier;
  }

  // Multiplicadores globales (mismos que calculateTotalProduction)
  const prestigeMultiplier = gameState.prestigeProductionMultiplier ?? gameState.prestigeMultiplier ?? 1;
  const adBoostMultiplier = isAdBoostActive(gameState) ? BOOSTER_CONFIG.REWARDED_AD_BOOST.multiplier : 1.0;
  const permanentMultiplier = gameState.iapState?.permanentMultiplierPurchased
    ? BOOSTER_CONFIG.PERMANENT_MULTIPLIER.multiplier : 1.0;
  const iapBoosterMultiplier = getActiveIAPBooster(gameState); // 5x > 2x > 1x
  const aiMultiplier = getAIProductionMultiplier(gameState.ai?.level ?? 0);

  return totalHashRate * prestigeMultiplier * adBoostMultiplier * permanentMultiplier * iapBoosterMultiplier * aiMultiplier;
}
```

**Invariante**: `totalHashRate` siempre es coherente con `cryptoCoinsPerSecond`. Si la producción se multiplica por 2x (prestige, booster, etc.), el hash rate mostrado también se multiplica por 2x.

## Constantes de Configuración

Todas las constantes están centralizadas en `src/config/balanceConfig.ts`:

```typescript
export const BLOCK_CONFIG = {
  TOTAL_BLOCKS: 21_000_000,      // Máximo de bloques minables
  INITIAL_REWARD: 50,            // Recompensa inicial por bloque
  HALVING_INTERVAL: 210_000,     // Bloques entre cada halving
  INITIAL_DIFFICULTY: 1,         // Dificultad inicial (no usado actualmente)
  DIFFICULTY_INCREASE_RATE: 0.00001  // Tasa de incremento (no usado actualmente)
};
```

## Estructura de Datos

### GameState (Campos Relevantes)
```typescript
interface GameState {
  // Block mining state
  blocksMined: number;           // Total de bloques minados hasta ahora
  totalBlocks: number;           // Máximo de bloques (21M)
  currentReward: number;         // Recompensa actual por bloque
  nextHalving: number;           // Bloque en el que ocurre próximo halving
  totalHashRate: number;         // Hash rate total (métrica visual)

  // Derived/calculated values
  cryptoCoinsPerSecond: number;  // Producción neta actual
  cryptoCoins: number;           // Balance actual de CryptoCoins
  totalCryptoCoins: number;      // Total acumulado (para stats)

  // Multipliers
  prestigeMultiplier: number;    // Multiplicador por prestige (default: 1)

  // Related systems
  hardware: Hardware[];
  upgrades: Upgrade[];
  phase: 'genesis' | 'expansion' | 'institutional' | 'singularity' | 'multiverse';
}
```

### Hardware (Campos Relevantes)
```typescript
interface Hardware {
  id: string;
  miningSpeed: number;           // Bloques por segundo que mina 1 unidad
  blockReward: number;           // CryptoCoins que otorga por bloque minado
  baseProduction: number;        // Hash rate base por unidad (× 10 = H/s base)
  owned: number;                 // Cantidad poseída
  electricityCost: number;       // Costo por segundo (reduce producción neta)
  level: number;                 // Nivel tecnológico (1-8)
}
```

## Reglas de Negocio

1. **Un bloque solo se mina si `canMineBlock()` retorna true**: No se pueden minar más de 21M bloques
2. **Los bloques se minan de forma discreta**: Solo bloques completos, no fracciones (aunque mining speed puede ser decimal)
2b. **El click manual siempre otorga mínimo 1 coin**: `Math.max(1, Math.floor(reward))` — nunca 0 ni decimal
2c. **El click manual consume 1 bloque del supply**: Contribuye a los halvings igual que el minado automático
2d. **Solo existe UN upgrade de clickPower (×5)**: No hay más tiers — la intención es que el jugador NO siga haciendo click en midgame
3. **La recompensa se calcula en el momento del minado**: No se puede "guardar" una recompensa mayor
4. **El halving es automático e irreversible**: Una vez que se reduce la recompensa, no vuelve a subir
5. **El mining speed puede ser 0**: Si el jugador no tiene hardware o tiene solo manual mining inactivo
6. **La producción neta considera electricidad**: `netProduction = totalProduction - totalElectricityCost`
7. **El prestige multiplier se aplica DESPUÉS de calcular producción base**: `finalProduction = baseProduction * prestigeMultiplier`
8. **Los bloques minados persisten entre sesiones**: Se guardan en AsyncStorage
9. **Los bloques minados NO se resetean con prestige**: El contador sigue acumulando (esto puede cambiar, ver "Preguntas Abiertas")

## Progresión de Halvings (Económica)

| Halving # | Bloques | Recompensa/Bloque | Total Coins en Esta Era | Coins Acumulados |
|-----------|---------|-------------------|-------------------------|------------------|
| 0 (Genesis) | 0 - 209,999 | 50 | 10,500,000 | 10,500,000 |
| 1 | 210,000 - 419,999 | 25 | 5,250,000 | 15,750,000 |
| 2 | 420,000 - 629,999 | 12.5 | 2,625,000 | 18,375,000 |
| 3 | 630,000 - 839,999 | 6.25 | 1,312,500 | 19,687,500 |
| 4 | 840,000 - 1,049,999 | 3.125 | 656,250 | 20,343,750 |
| ... | ... | ... | ... | ... |
| 100 (Final) | 21,000,000 | ~0.0000000000000004 | ~0 | ~21,000,000 |

**Nota**: En la práctica, después de ~33 halvings (bloques 6.93M), la recompensa es menor a 0.000001 y el juego se vuelve impracticable sin prestige.

## UI/UX Requirements

### BlockStatus Component
- [ ] Muestra "Blocks Mined: X / 21M" con formato legible
- [ ] Muestra "Current Reward: X CC/block"
- [ ] Muestra "Next Halving in: X blocks"
- [ ] Muestra "Hash Rate: X H/s" (métrica cosmética)
- [ ] Muestra "Production: X CC/s" (producción neta)
- [ ] Todos los valores se actualizan cada segundo
- [ ] Usa colores para indicar estado:
  - Verde: Minando activamente (miningSpeed > 0)
  - Rojo: No hay hardware (miningSpeed = 0)
  - Amarillo: Cerca del máximo de bloques (>95%)

### Halving Notification
- [ ] Se muestra cuando ocurre un halving
- [ ] Tipo: Modal o Toast destacado (no solo toast simple)
- [ ] Mensaje: "⚠️ Halving Event! Block reward reduced to X CC"
- [ ] Duración: 5 segundos (más larga que notificaciones normales)
- [ ] Color: Amarillo/Naranja para llamar atención
- [ ] Sonido: Efecto especial (si audio está habilitado)

### Game Complete Notification
- [ ] Se muestra al minar el bloque 21,000,000
- [ ] Tipo: Modal full-screen (bloquea UI)
- [ ] Mensaje: "🎉 Genesis Complete! You've mined all 21 million blocks!"
- [ ] Botones: "View Stats" | "Prestige Now"
- [ ] Muestra stats finales: Total tiempo jugado, coins ganados, hardware comprado
- [ ] Celebración visual: Animación de confetti o similar

## Validaciones

### Pre-Mining Validations
- [ ] Verificar `canMineBlock()` antes de intentar minar
- [ ] Verificar que `totalMiningSpeed > 0` (sino no hace nada)
- [ ] Verificar que el game state no sea `null` o `undefined`

### Post-Mining Validations
- [ ] Verificar que `blocksMined` nunca exceda `totalBlocks`
- [ ] Verificar que `currentReward` nunca sea negativo
- [ ] Verificar que `cryptoCoins` no se vuelva `Infinity` o `NaN`
- [ ] Verificar que el halving se aplicó correctamente cuando corresponde

### State Integrity
- [ ] `blocksMined` debe ser un entero (no decimal)
- [ ] `currentReward` debe coincidir con la fórmula `INITIAL_REWARD / 2^halvings`
- [ ] `nextHalving` debe ser siempre mayor a `blocksMined`
- [ ] `totalHashRate` debe ser >= 0

## Dependencias

### Requiere
- `GameContext` - Para state management y dispatch
- `balanceConfig.ts` - Para constantes de bloques
- `Hardware system` - Para calcular mining speed
- `Upgrade system` - Para aplicar multipliers

### Bloquea
- Market system (necesita CryptoCoins para vender)
- Prestige system (necesita completar bloques para prestigiar)

### Relacionado con
- Offline Progress (calcula bloques minados durante ausencia)
- Save/Load system (persiste blocksMined)
- Achievement system (logros por bloques minados)

## Criterios de Aceptación

- [x] El jugador puede minar bloques automáticamente según su hardware
- [x] La recompensa por bloque se reduce cada 210,000 bloques (halving)
- [x] El jugador no puede minar más de 21 millones de bloques
- [x] La producción se calcula correctamente: miningSpeed × blockReward
- [x] Los halvings se detectan y aplican automáticamente
- [x] El estado de minado se guarda y carga correctamente
- [x] El progreso de minado se muestra visualmente en la UI
- [x] Las notificaciones de halving se muestran al usuario
- [x] La producción considera el prestige multiplier
- [x] La electricidad reduce la producción neta correctamente
- [x] El click manual aplica el multiplicador de upgrades clickPower
- [x] El click manual siempre retorna un entero ≥ 1
- [x] El click manual consume 1 bloque del supply de 21M
- [x] El click manual es irrelevante en midgame por diseño (no requiere fix)
- [x] La producción automática de coins NO decrece con los halvings (usa `cryptoCoinsPerSecond`, no `calculateCurrentReward`)
- [x] El Hash Rate mostrado incluye multiplicadores de upgrades de producción, prestige, boosters (ad, IAP) e IA — coherente con `cryptoCoinsPerSecond`
- [x] Hardware tier 9+ (energyRequired > 0) NO contribuye a `blocksToMine` en ADD_PRODUCTION si no tiene energía suficiente
- [x] Con balance de energía positivo (+X MW), todos los mining farms/quantum miners activos generan coins correctamente
- [x] Los halvings afectan solo el display de "reward por bloque" y la progresión del contador, no el income real del jugador

## Notas de Implementación

### Archivos Principales
- `src/utils/blockLogic.ts` - Lógica de cálculo de bloques y recompensas
- `src/utils/gameLogic.ts` - Funciones `calculateTotalProduction()` y `calculateTotalHashRate()`
- `src/contexts/GameContext.tsx` - Game loop que ejecuta minado cada segundo
- `src/components/BlockStatus.tsx` - Componente de visualización
- `src/config/balanceConfig.ts` - Constantes de configuración

### Game Loop Implementation
```typescript
// En GameContext.tsx
useEffect(() => {
  const interval = setInterval(() => {
    if (gameState.cryptoCoinsPerSecond > 0) {
      dispatch({ type: 'ADD_PRODUCTION' });
    }
  }, 1000); // Tick cada 1 segundo

  return () => clearInterval(interval);
}, [gameState.cryptoCoinsPerSecond]);
```

### Reducer Action: ADD_PRODUCTION
```typescript
case 'ADD_PRODUCTION':
  if (state.collapseTriggered || state.goodEndingTriggered) return state;

  // Mining speed respeta restricciones de energía: hardware tier 9+
  // solo cuenta si tiene energía suficiente
  const constrainedHardware = state.hardware.map(hw =>
    hw.energyRequired > 0
      ? { ...hw, owned: getActiveUnitsFromEnergy(hw, state.energy) }
      : hw
  );
  const totalMiningSpeed = calculateTotalMiningSpeed(constrainedHardware, state.upgrades);
  const blocksToMine = Math.floor(totalMiningSpeed);

  if (blocksToMine > 0 && canMineBlock(state)) {
    let newState = { ...state };

    // Minar bloques: solo incrementa el contador de progresión (21M goal)
    // Las monedas NO provienen de calculateCurrentReward (que decrece con halvings)
    for (let i = 0; i < blocksToMine && canMineBlock(newState); i++) {
      newState.blocksMined += 1;
      newState.currentReward = calculateCurrentReward(newState.blocksMined);
      newState.nextHalving = calculateNextHalving(newState.blocksMined);
    }

    // Coins por tick = cryptoCoinsPerSecond (rate estático basado en hardware.blockReward)
    // Independiente de halvings → garantiza producción estable
    newState.cryptoCoins += state.cryptoCoinsPerSecond;
    newState.totalCryptoCoins += state.cryptoCoinsPerSecond;

    return recalculateGameStats(newState);
  }

  return state;
```

**Invariante clave**: los halvings reducen `calculateCurrentReward(blocksMined)` (visible en la UI como "recompensa actual por bloque"), pero NO reducen `cryptoCoinsPerSecond`. El income del jugador se mantiene estable mientras tenga hardware activo y energía suficiente.

### Configuración de Balance
Para ajustar la velocidad del juego:
- Aumentar `INITIAL_REWARD`: Más coins por bloque (juego más fácil)
- Reducir `HALVING_INTERVAL`: Halvings más frecuentes (juego más difícil)
- Aumentar `hardware.miningSpeed`: Minado más rápido (progresión más rápida)
- Aumentar `hardware.blockReward`: Más coins por bloque minado con ese hardware

## Testing

### Unit Tests

```typescript
describe('Block Mining System', () => {
  describe('calculateCurrentReward', () => {
    it('should return INITIAL_REWARD before first halving', () => {
      expect(calculateCurrentReward(0)).toBe(50);
      expect(calculateCurrentReward(100000)).toBe(50);
      expect(calculateCurrentReward(209999)).toBe(50);
    });

    it('should halve reward at each halving interval', () => {
      expect(calculateCurrentReward(210000)).toBe(25);
      expect(calculateCurrentReward(420000)).toBe(12.5);
      expect(calculateCurrentReward(630000)).toBe(6.25);
    });

    it('should handle multiple halvings correctly', () => {
      const halvings = 10;
      const blocks = halvings * 210000;
      const expectedReward = 50 / Math.pow(2, halvings);
      expect(calculateCurrentReward(blocks)).toBeCloseTo(expectedReward);
    });
  });

  describe('calculateNextHalving', () => {
    it('should calculate next halving correctly', () => {
      expect(calculateNextHalving(0)).toBe(210000);
      expect(calculateNextHalving(100000)).toBe(210000);
      expect(calculateNextHalving(210000)).toBe(420000);
      expect(calculateNextHalving(210001)).toBe(420000);
    });
  });

  describe('canMineBlock', () => {
    it('should allow mining when below total blocks', () => {
      const state = { blocksMined: 1000000, totalBlocks: 21000000 };
      expect(canMineBlock(state)).toBe(true);
    });

    it('should prevent mining when at total blocks', () => {
      const state = { blocksMined: 21000000, totalBlocks: 21000000 };
      expect(canMineBlock(state)).toBe(false);
    });
  });

  describe('calculateTotalMiningSpeed', () => {
    it('should sum mining speeds from all hardware', () => {
      const hardware = [
        { id: 'cpu', miningSpeed: 0.3, owned: 5 }, // 1.5 blocks/s
        { id: 'gpu', miningSpeed: 2.5, owned: 2 }, // 5.0 blocks/s
      ];
      const upgrades = [];
      expect(calculateTotalMiningSpeed(hardware, upgrades)).toBe(6.5);
    });

    it('should apply upgrade multipliers correctly', () => {
      const hardware = [
        { id: 'basic_cpu', miningSpeed: 0.3, owned: 10 }, // 3.0 blocks/s base
      ];
      const upgrades = [
        { id: 'cpu_boost', purchased: true, effect: { type: 'production', target: 'cpu', value: 2 } }
      ];
      expect(calculateTotalMiningSpeed(hardware, upgrades)).toBe(6.0); // 3.0 * 2
    });

    it('should return 0 when no hardware owned', () => {
      const hardware = [
        { id: 'cpu', miningSpeed: 0.3, owned: 0 },
      ];
      const upgrades = [];
      expect(calculateTotalMiningSpeed(hardware, upgrades)).toBe(0);
    });
  });
});
```

### Integration Tests

```typescript
describe('Block Mining Integration', () => {
  it('should mine blocks and award coins correctly', () => {
    const initialState = {
      blocksMined: 0,
      cryptoCoins: 0,
      currentReward: 50,
      hardware: [{ id: 'cpu', miningSpeed: 1, blockReward: 50, owned: 1 }],
      upgrades: [],
      prestigeMultiplier: 1,
    };

    const newState = gameReducer(initialState, { type: 'ADD_PRODUCTION' });

    expect(newState.blocksMined).toBe(1);
    expect(newState.cryptoCoins).toBe(50);
  });

  it('should handle halving event correctly', () => {
    const initialState = {
      blocksMined: 209999,
      currentReward: 50,
      nextHalving: 210000,
      cryptoCoins: 0,
      hardware: [{ id: 'cpu', miningSpeed: 1, blockReward: 50, owned: 1 }],
      upgrades: [],
      prestigeMultiplier: 1,
    };

    const newState = gameReducer(initialState, { type: 'ADD_PRODUCTION' });

    expect(newState.blocksMined).toBe(210000);
    expect(newState.currentReward).toBe(25); // Halved
    expect(newState.nextHalving).toBe(420000);
  });

  it('should stop mining at max blocks', () => {
    const initialState = {
      blocksMined: 21000000,
      totalBlocks: 21000000,
      cryptoCoins: 1000000,
      hardware: [{ id: 'cpu', miningSpeed: 1, blockReward: 50, owned: 1 }],
    };

    const newState = gameReducer(initialState, { type: 'ADD_PRODUCTION' });

    expect(newState.blocksMined).toBe(21000000); // No change
    expect(newState.cryptoCoins).toBe(1000000); // No new coins
  });
});
```

### E2E Test Scenarios

```typescript
describe('Block Mining E2E', () => {
  it('should complete full mining progression', async () => {
    // 1. Start game
    await launch();

    // 2. Verify initial state
    await expect(element(by.id('blocks-mined'))).toHaveText('0');
    await expect(element(by.id('current-reward'))).toHaveText('50');

    // 3. Buy first hardware
    await element(by.id('buy-basic-cpu')).tap();

    // 4. Wait for mining to start
    await waitFor(element(by.id('blocks-mined')))
      .toHaveText('1')
      .withTimeout(2000);

    // 5. Verify coins increased
    await expect(element(by.id('crypto-coins'))).not.toHaveText('0');

    // 6. Verify production rate is displayed
    await expect(element(by.id('coins-per-second'))).not.toHaveText('0');
  });
});
```

### Edge Cases

**Edge Case 1: Mining speed > 1000 blocks/second**
- Input: totalMiningSpeed = 1500
- Expected: Mina 1500 bloques por tick, actualiza reward 1500 veces si cruza halving(s)
- Test: Verificar que no haya overflow numérico

**Edge Case 2: Justo en el límite de bloques**
- Input: blocksMined = 20999999, miningSpeed = 10
- Expected: Solo mina 1 bloque (hasta 21M), ignora los otros 9

**Edge Case 3: Halving doble en un tick**
- Input: blocksMined = 209990, miningSpeed = 30000
- Expected: Cruza halving 210k y 420k en un solo tick, aplica ambos halvings correctamente

**Edge Case 4: Reward decimal muy pequeño**
- Input: blocksMined = 10000000 (muchos halvings)
- Expected: currentReward puede ser 0.0000001, no crashea, se muestra correctamente

**Edge Case 5: Hardware sin mining speed**
- Input: Solo manual_mining (miningSpeed = 0) owned
- Expected: No mina bloques, production = 0, UI muestra "No active mining"

**Edge Case 6: Prestige multiplier extremo**
- Input: prestigeMultiplier = 1000 (después de muchos prestiges)
- Expected: Producción se multiplica correctamente, no causa overflow

**Edge Case 7: Producción no colapsa después de muchos halvings**
- Input: blocksMined = 8,000,000 (38+ halvings), 5 ASIC Gen 3 owned
- Expected: `cryptoCoinsPerSecond` sigue siendo `5 × 60 × 20 × prestigeMultiplier` (usa `hardware.blockReward` estático = 20)
- NOT expected: `cryptoCoinsPerSecond` ≈ 0 por usar `calculateCurrentReward(8_000_000)` ≈ 0.0000002

**Edge Case 8: Mining Farms sin energía no incrementan blocksMined**
- Input: 5 Mining Farms owned, `totalGeneratedMW = 0`, `totalRequiredMW = 2500`
- Expected: ADD_PRODUCTION calcula `blocksToMine` ignorando las Mining Farms → solo hardware tier 1-8 contribuye
- NOT expected: Mining Farms contribuyen 750 bloques/tick consumiendo supply sin operar realmente

**Edge Case 9: Mining Farms con energía parcial**
- Input: 5 Mining Farms owned, 1500 MW generados (solo 3 de 5 farms activas)
- Expected: Solo 3 Mining Farms contribuyen a `blocksToMine` (3 × 150 = 450 bloques/tick)
- Expected: `cryptoCoinsPerSecond` refleja solo 3 farms activas

## Performance Considerations

### Non-Functional Requirements
- **Cálculo de producción**: Debe completarse en < 16ms (para mantener 60 FPS)
- **Update de UI**: BlockStatus debe actualizar sin lag perceptible (< 50ms)
- **Memory**: Estado de bloques debe ocupar < 1KB en memoria
- **Storage**: Guardar blocksMined debe tomar < 10ms

### Optimizaciones
- Calcular `totalMiningSpeed` solo cuando cambia hardware/upgrades (memoizar)
- Usar `Math.floor()` para evitar floats en `blocksMined`
- Evitar re-renders innecesarios de BlockStatus con `React.memo()`
- Batch updates de UI (actualizar cada 1s, no cada bloque)

### Analytics

```typescript
// Firebase Analytics - Track mining milestones
analytics().logEvent('blocks_mined_milestone', {
  blocks: 1000,
  time_to_milestone: timeSinceStart,
  hardware_owned: totalHardwareOwned,
});

analytics().logEvent('halving_reached', {
  halving_number: halvingNumber,
  blocks_mined: blocksMined,
  time_played: totalTimePlayed,
});

analytics().logEvent('genesis_complete', {
  blocks_mined: 21000000,
  total_time: totalGameTime,
  prestige_level: prestigeLevel,
});
```

## Preguntas Abiertas

- [ ] **Prestigio y bloques**: ¿Los bloques minados se resetean con prestige o siguen acumulando?
  - Opción A: Se resetean (cada prestige es una "nueva blockchain")
  - Opción B: Siguen acumulando (blockchain persistente entre prestiges)
  - **Recomendación**: Opción A (resetear) para que cada prestige sea un fresh start

- [ ] **Difficulty adjustment**: ¿Implementar ajuste de dificultad como Bitcoin?
  - Actualmente no se usa, pero está en balanceConfig
  - Podría hacer que mining sea más difícil con más hash rate
  - **Recomendación**: Dejar para Phase 5+ (no prioritario)

- [ ] **Notificación de halvings**: ¿Mostrar countdown cuando faltan 100 bloques?
  - "⚠️ Halving in 100 blocks!"
  - **Recomendación**: Sí, agrega tensión y engagement

- [ ] **Block rewards diferenciados por hardware**: ¿Cada hardware debería tener su propio blockReward?
  - Actualmente cada hardware tiene blockReward diferente
  - ¿O todos deberían usar el currentReward global?
  - **Recomendación**: Mantener actual (cada HW tiene su reward) para variedad

- [ ] **Mining cuando app está cerrada**: ¿Cómo calcular bloques offline?
  - Actualmente usa `updateOfflineProgress()` pero no está claro si mina bloques o solo coins
  - **Recomendación**: Calcular bloques minados offline con 50% de rate (como está configurado)

## Referencias

- Bitcoin Whitepaper: https://bitcoin.org/bitcoin.pdf
- Bitcoin Halving Schedule: https://www.bitcoinblockhalf.com/
- Universal Paperclips mechanics: http://www.decisionproblem.com/paperclips/
- Idle game progression curves: https://gameanalytics.com/blog/idle-game-mathematics/
