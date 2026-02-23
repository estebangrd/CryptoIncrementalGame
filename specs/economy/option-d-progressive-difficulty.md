# Opción D — Dificultad Progresiva de Red

## Estado
- **Fase**: Game Length Extension (Pre-Phase 4)
- **Estado**: Planned
- **Prioridad**: High
- **Última actualización**: 2026-02-22
- **Objetivo conjunto**: Alcanzar 10-15h por primera run (combinado con Opciones A, B y C)
- **Contribución de esta opción**: El late game se vuelve exponencialmente más exigente en hashrate, requiriendo más hardware para mantener la misma tasa de bloques.

## Descripción

En Bitcoin real, la dificultad de la red se ajusta para que los bloques siempre tarden ~10 minutos en encontrarse, independientemente de cuánto hashrate tenga la red. A medida que más mineros se unen, la dificultad sube para compensar.

Blockchain Tycoon implementa una versión inspirada en esto: a medida que el jugador mina más bloques (acercándose a los 21M), la **dificultad de la red aumenta**, lo que requiere más hashrate acumulado para mantener la misma tasa de bloques por segundo. Quien no tiene suficiente hardware "bien escalado" ve cómo su progreso se frena en el tramo final.

Este sistema:
- No afecta la recompensa por bloque (`blockReward`). La dificultad, como en Bitcoin, solo afecta el tiempo para **encontrar** el bloque, no lo que vale.
- Afecta el `effectiveMiningSpeed`: la velocidad real con que se minan bloques dada la dificultad actual.
- Es invisible en el early game (0% de penalidad), se vuelve notoria en el mid-late game, y es un factor real en los últimos 5M bloques.

## Fórmula de Dificultad

```typescript
/**
 * Calcula la dificultad de red actual.
 * Escala de 1.0 (inicio) hasta 2.0 (21M bloques).
 *
 * @param blocksMined  Bloques minados hasta ahora (0 a 21,000,000)
 * @param totalBlocks  Total de bloques en el juego (21,000,000)
 * @returns            Multiplicador de dificultad (>= 1.0)
 */
function calculateNetworkDifficulty(blocksMined: number, totalBlocks: number): number {
  const progress = blocksMined / totalBlocks;           // 0.0 a 1.0
  return 1 + Math.pow(progress, 2);                    // 1.0 a 2.0
}

// Ejemplos:
// Bloques: 0         → difficulty = 1 + (0)^2     = 1.000 (sin penalidad)
// Bloques: 1,050,000 → difficulty = 1 + (0.05)^2  = 1.003 (0.3% más difícil)
// Bloques: 4,200,000 → difficulty = 1 + (0.2)^2   = 1.040 (4% más difícil)
// Bloques: 10,500,000→ difficulty = 1 + (0.5)^2   = 1.250 (25% más difícil)
// Bloques: 15,750,000→ difficulty = 1 + (0.75)^2  = 1.563 (56% más difícil)
// Bloques: 18,900,000→ difficulty = 1 + (0.9)^2   = 1.810 (81% más difícil)
// Bloques: 21,000,000→ difficulty = 1 + (1.0)^2   = 2.000 (doble de difícil)
```

## Mecánica: effectiveMiningSpeed

La dificultad divide la velocidad de minado efectiva de toda la operación:

```typescript
function calculateEffectiveMiningSpeed(
  totalMiningSpeed: number,    // Sum de miningSpeed * owned (solo hardware online)
  blocksMined: number,
  totalBlocks: number,
): number {
  const difficulty = calculateNetworkDifficulty(blocksMined, totalBlocks);
  return totalMiningSpeed / difficulty;
}

// Ejemplo en el tramo final (18.9M bloques minados):
// difficulty = 1.81
// totalMiningSpeed = 5,000 blocks/s (5 Supercomputers post-Opción B)
// effectiveMiningSpeed = 5,000 / 1.81 = 2,762 blocks/s efectivos

// Para recuperar los 5,000 blocks/s originales el jugador necesitaría:
// totalMiningSpeed necesario = 5,000 * 1.81 = 9,050 blocks/s
// → más hardware (o wait for Opción C improvements)
```

## Comportamiento por Etapas

| Progreso | Bloques minados | Dificultad | Velocidad efectiva (con 300 blocks/s base) | Sentimiento |
|----------|----------------|------------|---------------------------------------------|-------------|
| 0% | 0 | 1.000 | 300 blocks/s | No se nota |
| 10% | 2.1M | 1.010 | 297 blocks/s | Imperceptible |
| 25% | 5.25M | 1.063 | 282 blocks/s | Muy leve |
| 50% | 10.5M | 1.250 | 240 blocks/s | Notoria (−20%) |
| 75% | 15.75M | 1.563 | 192 blocks/s | Significativa (−36%) |
| 90% | 18.9M | 1.810 | 166 blocks/s | Desafiante (−45%) |
| 100% | 21M | 2.000 | 150 blocks/s | Máxima (−50%) |

La curva cuadrática garantiza que los primeros 50% del juego sean casi sin fricción, y el último 25% sea donde la dificultad realmente presiona.

## Integración con el Sistema Existente

### Modificación en `src/utils/blockLogic.ts`

El sistema de minado de bloques actual calcula cuántos bloques se minan por tick. Se debe agregar el divisor de dificultad:

```typescript
// Antes (actual):
function calculateBlocksToMine(miningSpeed: number, deltaTime: number): number {
  return Math.floor(miningSpeed * deltaTime);
}

// Después (con dificultad):
function calculateBlocksToMine(
  miningSpeed: number,
  deltaTime: number,
  blocksMined: number,
  totalBlocks: number,
): number {
  const difficulty = calculateNetworkDifficulty(blocksMined, totalBlocks);
  const effectiveSpeed = miningSpeed / difficulty;
  return Math.floor(effectiveSpeed * deltaTime);
}
```

### Modificación en `src/utils/gameLogic.ts`

En `recalculateGameStats()`, agregar `networkDifficulty` como stat derivado:

```typescript
function recalculateGameStats(state: GameState): GameState {
  // ... cálculos existentes de totalMiningSpeed ...

  const networkDifficulty = calculateNetworkDifficulty(
    state.totalBlocksMined,
    BLOCK_CONFIG.TOTAL_BLOCKS,
  );

  const effectiveMiningSpeed = state.totalMiningSpeed / networkDifficulty;

  return {
    ...state,
    networkDifficulty,       // NUEVO campo derivado
    effectiveMiningSpeed,    // NUEVO campo derivado (reemplaza el uso de totalMiningSpeed en el tick)
    // ... resto igual ...
  };
}
```

### Modificación en el tick del juego (`GameContext.tsx`)

El tick de 1 segundo usa `effectiveMiningSpeed` en lugar de `totalMiningSpeed` para calcular bloques:

```typescript
// El loop de 1 segundo:
const blocksThisTick = calculateBlocksToMine(
  state.effectiveMiningSpeed,  // ya incluye el ajuste de dificultad
  1,                           // delta time en segundos
  state.totalBlocksMined,
  BLOCK_CONFIG.TOTAL_BLOCKS,
);
```

## Nuevos Campos en `GameState`

```typescript
interface GameState {
  // ... campos existentes ...
  networkDifficulty: number;      // NUEVO: dificultad actual (1.0 - 2.0)
  effectiveMiningSpeed: number;   // NUEVO: miningSpeed real después de aplicar dificultad
}
```

## Constante de Configuración

En `src/config/balanceConfig.ts`, agregar al `BLOCK_CONFIG`:

```typescript
export const BLOCK_CONFIG = {
  TOTAL_BLOCKS: 21_000_000,
  INITIAL_REWARD: 50,
  HALVING_INTERVAL: 210_000,
  INITIAL_DIFFICULTY: 1,
  DIFFICULTY_INCREASE_RATE: 0.00001,  // Existente (puede eliminarse si se reemplaza por la nueva fórmula)

  // NUEVO:
  NETWORK_DIFFICULTY: {
    MIN: 1.0,    // Dificultad al inicio (0 bloques)
    MAX: 2.0,    // Dificultad al final (21M bloques)
    EXPONENT: 2, // Exponente de la curva (2 = cuadrática, más suave al inicio)
  },
};
```

Esto permite ajustar la agresividad de la curva cambiando solo `EXPONENT`:
- `EXPONENT = 1`: lineal (mismo % de penalidad en todo el juego)
- `EXPONENT = 2`: cuadrática (suave al inicio, dura al final) ← **valor por defecto**
- `EXPONENT = 3`: cúbica (casi sin efecto hasta el 75%, luego muy dura)

## Análisis de Impacto Combinado (Opciones A + B + C + D)

Proyección de tiempos por etapa con todas las opciones activas y un jugador típico:

| Etapa | Bloques target | Dificultad | Hardware típico del jugador | Tiempo estimado para esa etapa |
|-------|---------------|------------|----------------------------|--------------------------------|
| Early game | 0 → 1M | 1.0 → 1.002 | CPU/GPU mix | ~30-60 min |
| Mid game | 1M → 10M | 1.002 → 1.23 | ASIC Gen 1-3 | ~2-4h |
| Late game | 10M → 18M | 1.23 → 1.81 | Mining Farm + Quantum | ~3-5h |
| Endgame | 18M → 21M | 1.81 → 2.0 | Supercomputer | ~2-4h |
| **Total** | | | | **~8-14h** |

**Nota**: La dificultad sola aporta ~1.5x de slowdown en el late game. El efecto más dramático viene de la combinación con los altos costos de Opción A+B (que limitan cuánto hardware puede tener el jugador) y el constraint de Opción C (que puede apagar hardware si no vende suficiente).

## UI/UX Requirements

### Indicador de Dificultad de Red

Mostrar en `BlockStatus.tsx` (o componente similar donde se muestran stats de minado):

```
Red de Mining
Bloques minados: 10,500,000 / 21,000,000
Dificultad:      1.25×  [████████░░░░░░░░] 50%
Mining Speed:    240 blocks/s (de 300 base)
```

- La barra de progreso va de verde (1.0) a rojo (2.0)
- Mostrar tanto el mining speed base como el efectivo para que el jugador entienda la penalidad

### Traducciones

```typescript
// EN
'stats.networkDifficulty': 'Network Difficulty',
'stats.effectiveMiningSpeed': 'Effective Speed',
'stats.baseMiningSpeed': 'Base Speed',
'stats.difficultyProgress': '{{blocks}} / {{total}} blocks mined',

// ES
'stats.networkDifficulty': 'Dificultad de Red',
'stats.effectiveMiningSpeed': 'Velocidad Efectiva',
'stats.baseMiningSpeed': 'Velocidad Base',
'stats.difficultyProgress': '{{blocks}} / {{total}} bloques minados',

// PT
'stats.networkDifficulty': 'Dificuldade da Rede',
'stats.effectiveMiningSpeed': 'Velocidade Efetiva',
'stats.baseMiningSpeed': 'Velocidade Base',
'stats.difficultyProgress': '{{blocks}} / {{total}} blocos minerados',
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/config/balanceConfig.ts` | Agregar `BLOCK_CONFIG.NETWORK_DIFFICULTY` con `MIN`, `MAX`, `EXPONENT` |
| `src/utils/blockLogic.ts` | Nueva función `calculateNetworkDifficulty`; modificar `calculateBlocksToMine` |
| `src/utils/gameLogic.ts` | En `recalculateGameStats`, calcular y guardar `networkDifficulty` y `effectiveMiningSpeed` |
| `src/types/game.ts` | Agregar `networkDifficulty` y `effectiveMiningSpeed` a `GameState` |
| `src/contexts/GameContext.tsx` | Usar `effectiveMiningSpeed` en el tick, no `totalMiningSpeed` |
| `src/components/BlockStatus.tsx` | Mostrar `networkDifficulty` y comparación base vs efectiva |
| `src/data/translations.ts` | Claves nuevas para stats de dificultad |

## Reglas de Negocio

1. **La dificultad nunca es < 1.0**: El jugador nunca mina más rápido que su velocidad base.
2. **La dificultad nunca es > 2.0**: El cap máximo es el doble de la dificultad inicial.
3. **La dificultad afecta a todo el hardware online por igual**: No hay hardware inmune.
4. **La `blockReward` no se ve afectada**: Solo la velocidad de minado cambia.
5. **La dificultad se calcula en tiempo real**: Se actualiza en cada `recalculateGameStats()`.
6. **El prestige resetea `totalBlocksMined` a 0**: La dificultad vuelve a 1.0 en cada run.
7. **La dificultad es global, no por hardware**: Un solo divisor para toda la flota.
8. **El `DIFFICULTY_INCREASE_RATE` existente se depreca**: Se reemplaza por la nueva fórmula. El campo puede mantenerse en el config por compatibilidad pero no se usa.

## Criterios de Aceptación

- [ ] `calculateNetworkDifficulty(0, 21_000_000)` retorna `1.0`
- [ ] `calculateNetworkDifficulty(10_500_000, 21_000_000)` retorna `1.25`
- [ ] `calculateNetworkDifficulty(21_000_000, 21_000_000)` retorna `2.0`
- [ ] `effectiveMiningSpeed` = `totalMiningSpeed / networkDifficulty`
- [ ] El tick del juego usa `effectiveMiningSpeed` para calcular bloques minados
- [ ] `networkDifficulty` se muestra en la UI de estadísticas
- [ ] El prestige resetea `totalBlocksMined` → difficulty vuelve a 1.0
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

## Testing

```typescript
describe('Network Difficulty System', () => {
  describe('calculateNetworkDifficulty', () => {
    it('should be 1.0 at start', () => {
      expect(calculateNetworkDifficulty(0, 21_000_000)).toBe(1.0);
    });

    it('should be 1.25 at 50% progress', () => {
      expect(calculateNetworkDifficulty(10_500_000, 21_000_000)).toBeCloseTo(1.25);
    });

    it('should be 2.0 at 100% progress', () => {
      expect(calculateNetworkDifficulty(21_000_000, 21_000_000)).toBe(2.0);
    });

    it('should never be less than 1.0', () => {
      expect(calculateNetworkDifficulty(0, 21_000_000)).toBeGreaterThanOrEqual(1.0);
    });

    it('should never exceed 2.0', () => {
      expect(calculateNetworkDifficulty(21_000_000, 21_000_000)).toBeLessThanOrEqual(2.0);
    });
  });

  describe('calculateEffectiveMiningSpeed', () => {
    it('should equal base speed at difficulty 1.0', () => {
      const effective = calculateEffectiveMiningSpeed(1000, 0, 21_000_000);
      expect(effective).toBe(1000);
    });

    it('should halve at difficulty 2.0 (endgame)', () => {
      const effective = calculateEffectiveMiningSpeed(1000, 21_000_000, 21_000_000);
      expect(effective).toBeCloseTo(500);
    });

    it('should reduce by 20% at 50% progress', () => {
      const effective = calculateEffectiveMiningSpeed(1000, 10_500_000, 21_000_000);
      expect(effective).toBeCloseTo(800); // 1000 / 1.25
    });
  });

  describe('Game state integration', () => {
    it('should store networkDifficulty in game state', () => {
      const state = createTestState({ totalBlocksMined: 10_500_000 });
      const recalculated = recalculateGameStats(state);
      expect(recalculated.networkDifficulty).toBeCloseTo(1.25);
    });

    it('should use effectiveMiningSpeed in tick, not totalMiningSpeed', () => {
      const state = createTestState({
        totalBlocksMined: 21_000_000 / 2,  // 50% → difficulty 1.25
        totalMiningSpeed: 1000,
        effectiveMiningSpeed: 800,          // 1000 / 1.25
      });
      const newState = gameReducer(state, { type: 'TICK' });
      // En 1 segundo a 800 blocks/s efectivos, debería minar ~800 bloques
      expect(newState.totalBlocksMined - state.totalBlocksMined).toBeCloseTo(800);
    });

    it('should reset difficulty to 1.0 after prestige', () => {
      const state = createTestState({ totalBlocksMined: 20_000_000 });
      const newState = gameReducer(state, { type: 'PRESTIGE' });
      expect(newState.networkDifficulty).toBe(1.0);
      expect(newState.totalBlocksMined).toBe(0);
    });
  });
});
```

## Edge Cases

**Edge Case 1: Progreso mayor a 100%**
- Teóricamente imposible (el juego termina a 21M), pero por si acaso:
- `progress = Math.min(1, blocksMined / totalBlocks)` — cap en 1.0

**Edge Case 2: totalBlocks = 0 (división por cero)**
- Protección: si `totalBlocks === 0`, retornar difficulty = 1.0

**Edge Case 3: Boosters de velocidad (2x, 5x)**
- Los boosters multiplican `totalMiningSpeed` antes de que se aplique la dificultad
- `effectiveMiningSpeed = (totalMiningSpeed * boosterMultiplier) / networkDifficulty`
- Esto es correcto: los boosters hacen que el mismo hardware sea más efectivo pero la dificultad de red sigue siendo la misma.

**Edge Case 4: Juego pausado (app en background)**
- El cálculo de offline earnings usa `effectiveMiningSpeed` promedio del período offline
- Dificultad al inicio del período offline para el cálculo (simplificación aceptable)

## Preguntas Abiertas

- [ ] **¿Mostrar el % de penalidad en la UI o solo la dificultad?**
  - "Dificultad: 1.25×" vs "Velocidad reducida: −20%"
  - Recomendación: Mostrar ambos (el multiplicador y la reducción porcentual).

- [ ] **¿El achievement "Speed Runner" debería considerar la dificultad?**
  - Actualmente es el tiempo más rápido en completar la run.
  - Con dificultad, el tiempo siempre va a ser mayor que sin ella.
  - Recomendación: El achievement sigue basándose en tiempo real, no ajustado.

- [ ] **¿Ajustar el EXPONENT a 3 para una curva más late-heavy?**
  - Con `EXPONENT = 3`, la penalidad es casi invisible hasta el 70%, pero aplasta el endgame.
  - Recomendación: Empezar con 2 (cuadrática) y calibrar con GAME_SPEED=10.

## Dependencias

### Requiere
- `src/utils/blockLogic.ts` (existe)
- `src/utils/gameLogic.ts` (existe)

### Impacta directamente
- `Opción B` (nuevos hardware con miningSpeed alta) — sin esta opción, Supercomputer trivializaría el endgame incluso con Opción A

### Relacionado con
- `specs/economy/option-a-cost-rebalancing.md`
- `specs/economy/option-b-hardware-tiers.md`
- `specs/economy/option-c-electricity-constraint.md`
- `specs/game-mechanics/block-mining-system.md` — Documentar el nuevo campo `networkDifficulty`
