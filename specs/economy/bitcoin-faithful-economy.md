# Bitcoin-Faithful Economy Redesign

## Estado
- **Fase**: Phase 2 - Economy Overhaul
- **Estado**: Implemented
- **Prioridad**: Critical
- **Ultima actualizacion**: 2026-04-04

---

## Overview

Rediseño completo de la economía del juego para emular fielmente el modelo de Bitcoin. Los CryptoCoins (CC) son un recurso finito (21M), el block reward es global (no por hardware), la dificultad escala con bloques minados, y el precio de CC sube con cada era siguiendo la tendencia histórica de BTC.

## Modelo Fundamental

```
Global Block Reward = 50 / 2^(floor(blocksMined / 210,000))
Difficulty          = 1.0 + 0.35 × (totalMiningSpeed / 80)^0.70
Blocks/sec          = totalMiningSpeed / difficulty
CC/sec              = blocks/sec × globalBlockReward
```

**Nota**: La dificultad escala con `totalMiningSpeed` (speed-based), NO con `blocksMined`. Comprar más hardware aumenta la velocidad bruta pero también la dificultad.

### Flujo económico
```
Minar bloques → ganar CC → vender CC en market por $ → comprar hardware con $
```

- **CC**: recurso finito (21M cap), se gana minando bloques
- **$**: moneda sin cap, se obtiene vendiendo CC en el market
- **Hardware**: se compra con $, no con CC
- **Precio de CC**: sube con cada era (simula apreciación de BTC)

---

## Block Rewards por Era

| Era | Bloques | Reward/bloque | CC total | CC acumulado |
|-----|---------|:---:|:---:|:---:|
| 0 | 0 – 209,999 | 50 | 10,500,000 | 10,500,000 |
| 1 | 210,000 – 419,999 | 25 | 5,250,000 | 15,750,000 |
| 2 | 420,000 – 629,999 | 12.5 | 2,625,000 | 18,375,000 |
| 3 | 630,000 – 839,999 | 6.25 | 1,312,500 | 19,687,500 |
| 4 | 840,000 – 1,049,999 | 3.125 | 656,250 | 20,343,750 |
| 5 | 1,050,000 – 1,259,999 | 1.5625 | 328,125 | 20,671,875 |
| 6 | 1,260,000 – 1,469,999 | 0.78125 | 164,062.5 | 20,835,937.5 |

**Total CC**: 20,835,937.5 (≈21M)

---

## Fórmula de Dificultad

Basada en `totalMiningSpeed` (speed-based). Comprar más hardware aumenta la velocidad bruta pero también la dificultad, creando rendimientos decrecientes.

```typescript
difficulty(totalMiningSpeed) = 1.0 + 0.35 × Math.pow(totalMiningSpeed / 80, 0.70)
```

| totalMiningSpeed | Dificultad | Efecto |
|:---:|:---:|---|
| 0 | 1.00 | sin penalidad |
| 10 | 1.07 | ~7% overhead |
| 50 | 1.25 | 20% más lento |
| 100 | 1.41 | 29% más lento |
| 500 | 2.48 | 60% más lento |
| 5,000 | 8.76 | 89% más lento |
| 50,000 | 43.87 | 98% más lento |
| 4,000,000 | 965 | 99.9% más lento |

**Propiedad clave**: Comprar hardware incrementa `totalMiningSpeed` y la dificultad simultáneamente. El net effect es siempre positivo (more blocks/sec) pero with diminishing returns. Esto previene que late-game hardware acelere el juego exponencialmente.

### Constantes en balanceConfig.ts

```typescript
BLOCK_CONFIG.DIFFICULTY = {
  AMPLITUDE: 0.35,
  SCALE: 80,        // speed-based (not blocks-based)
  EXPONENT: 0.70,
}
```

---

## Precio de CC por Era

El precio base de CC sube con cada era, simulando la apreciación histórica de BTC post-halving. La volatilidad del histórico de BTC se aplica como fluctuación alrededor de este precio base.

| Era | Precio base/CC | CC disponibles | $ generados | $/bloque |
|:---:|:---:|:---:|:---:|:---:|
| 0 | $0.05 | 10,500,000 | $525,000 | $2.50 |
| 1 | $0.18 | 5,250,000 | $945,000 | $4.50 |
| 2 | $0.55 | 2,625,000 | $1,443,750 | $6.88 |
| 3 | $1.40 | 1,312,500 | $1,837,500 | $8.75 |
| 4 | $3.50 | 656,250 | $2,296,875 | $10.94 |
| 5 | $8.00 | 328,125 | $2,625,000 | $12.50 |
| 6 | $18.00 | 164,062.5 | $2,953,125 | $14.06 |
| 7 | $40.00 | 82,031.25 | $3,281,250 | $15.63 |
| 8+ | grows | halving | grows | ~$15-16 plateau |

**20 eras definidas**: ERA_BASE_PRICES tiene 20 entradas [$0.05 → $4,000,000]. El $/bloque crece ~8-12% por era, plateaus in mid-game, and accelerates from era 14+ to support endgame hardware purchases across multiple prestiges.

**Beyond era 19**: Price doubles each era (BTC-faithful appreciation). `getBasePrice` extrapolates: `lastPrice × 2^(era - 19)`. This keeps $/block roughly constant as block reward halves, preventing a 0.0 CC/s softlock at high eras.

**Nota**: A diferencia de la v2 donde $/bloque peaked y declined, la v3 mantiene un crecimiento gradual controlado. Esto permite comprar hardware cada vez más caro sin que el income se estanque.

### Implementación del precio base

```typescript
// Precio base escala con la era actual (20-entry array, extrapolates beyond)
function getBasePrice(blocksMined: number): number {
  const era = Math.floor(blocksMined / 210_000);
  const prices = BLOCK_CONFIG.ERA_BASE_PRICES;
  if (era < prices.length) return prices[era];
  // BTC-faithful: price doubles per era beyond defined prices
  const extraEras = era - (prices.length - 1);
  return prices[prices.length - 1] * Math.pow(2, extraEras);
}
// ERA_BASE_PRICES = [0.05, 0.18, 0.55, 1.40, 3.50, 8.00, 18.00, 40.00, 90.00, 200.00,
//                    450.00, 1000.00, 2300.00, 5500.00, 14000.00, 38000.00, 110000.00,
//                    340000.00, 1100000.00, 4000000.00]
```

La volatilidad del histórico de BTC se aplica como multiplicador sobre este precio base (±20-30%). El precio efectivo de venta promedio puede ser significativamente mayor que el base price.

---

## Hardware

### Campos por hardware

- **`miningSpeed`** (bloques/seg por unidad) — ÚNICO stat de producción
- **`baseCost`** ($) — costo en real money
- **`electricityCost`** ($/seg por unidad)
- **`baseProduction`** — SOLO para display en UI (hash rate), no afecta mecánicas
- **`blockReward`** — ELIMINADO. El reward es global, de la tabla de eras.

### Tabla de hardware

| Tier | ID | miningSpeed | baseCost ($) | costMultiplier | electricityCost (weight) | energyRequired (MW) |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| 1 | manual_mining | 0.1 | 0 | 1.35 | 0 | 0 |
| 2 | basic_cpu | 0.3 | 25 | 1.40 | 3 | 0 |
| 3 | advanced_cpu | 1.5 | 350 | 1.40 | 10 | 0 |
| 4 | basic_gpu | 8 | 3,500 | 1.35 | 40 | 0 |
| 5 | advanced_gpu | 55 | 22,000 | 1.35 | 120 | 0 |
| 6 | asic_gen1 | 350 | 350,000 | 1.30 | 300 | 0 |
| 7 | asic_gen2 | 2,400 | 2,250,000 | 1.30 | 900 | 0 |
| 8 | asic_gen3 | 16,000 | 18,000,000 | 1.28 | 2,500 | 0 |
| 9 | mining_farm | 100,000 | 120,000,000 | 1.25 | 4,500 | 500 |
| 10 | quantum_miner | 650,000 | 500,000,000 | 1.22 | 15,000 | 2,000 |
| 11 | supercomputer | 4,000,000 | 2,000,000,000 | 1.20 | 50,000 | 10,000 |

**costMultiplier**: per-tier via `COST_MULTIPLIER_BY_ID` (1.20-1.40)
**unlockRequirement**: 8 unidades del tier anterior

### Compra esperada primera run

| Tier | Unidades | Costo aprox | Fuente de $ |
|---|:---:|:---:|---|
| 2-5 | 8 cada uno | ~$350K | Era 0-1 |
| 6-7 | 8 cada uno | ~$40M | Era 1-3 |
| 8 | 8 | ~$200M | Era 3-5 |
| 9 | 8 | ~$1B | Era 5-7 |

**Nota**: Quantum Miner ($500M base) y Supercomputer ($2B base) requieren múltiples eras y market volatility para ser alcanzables. La economía está diseñada para ~12 horas de juego activo hasta el primer prestige, con late game como un grind significativo que incentive el prestige.

---

## Tensión Energética (Quantum Miner)

10 quantum_miners = 20,000 MW de consumo.

| Escenario | MW | Depletion/seg | Planeta muere en |
|---|:---:|:---:|:---:|
| 10× QM con coal | 20,000 | 0.066%/seg | 25 min |
| 10× QM con oil | 20,000 | 0.054%/seg | 31 min |
| 10× QM con nuclear | 20,000 | 0.034%/seg | 49 min |
| 10× QM con renovables | 20,000 | 0 | nunca |

**Cap renovable max**: 30,000 MW (con 3 upgrades: $125M total)
**Dilema**: invertir $125M en renovables (sostenible) o usar no renovables (rápido pero destruye el planeta)

---

## Progresión temporal

La nueva economía está diseñada para una primera run significativamente más larga. Los precios de CC crecen más gradualmente y la dificultad (power curve) frena la producción en late game.

### Era 0 (bloques 0-210K): Early game
- Hardware: manual → CPU → GPU
- CC ganados: 10,500,000
- $ ganados: ~$525,000 (base price $0.05)
- Compras: tiers 2-4

### Era 1 (bloques 210K-420K): Early-mid game
- Hardware: GPU → Advanced GPU
- CC ganados: 5,250,000
- $ ganados: ~$945,000 (base price $0.18)
- Compras: tiers 4-5, inicio tier 6

### Era 2-3 (bloques 420K-840K): Mid game
- Hardware: ASIC Gen 1-2
- CC ganados: 3,937,500
- $ ganados: ~$3,281,250 (base prices $0.55-$1.40)
- Compras: tiers 6-7

### Era 4-6 (bloques 840K-1.47M): Late-mid game
- Hardware: ASIC Gen 2-3, Mining Farm
- CC ganados: ~1,148,437
- $ ganados: ~$8M+ (base prices $3.50-$18.00)
- Compras: tiers 7-9

### Era 7+ (bloques 1.47M+): Late game / Endgame
- $/bloque continues growing (~$15-16 plateau, then accelerates era 14+)
- Prestige atractivo after reaching 21M blocks
- Quantum Miner y Supercomputer requieren prestige runs o market volatility

---

## Cambios en código

### Archivos a modificar

1. **`src/config/balanceConfig.ts`**
   - `BLOCK_CONFIG.DIFFICULTY` (AMPLITUDE 0.35, SCALE 80, EXPONENT 0.70)
   - `BLOCK_CONFIG.ERA_BASE_PRICES` 20-entry array
   - `HARDWARE_CONFIG.COST_MULTIPLIER_BY_ID` per-tier multipliers
   - `HARDWARE_CONFIG.UNLOCK_REQUIREMENT` = 8
   - `HARDWARE_CONFIG.levels` (updated baseCost, miningSpeed)

2. **`src/utils/blockLogic.ts`**
   - `calculateDifficulty(totalMiningSpeed)` — speed-based
   - Fórmula: `1.0 + AMPLITUDE × (totalMiningSpeed / SCALE)^EXPONENT`

3. **`src/utils/gameLogic.ts`**
   - `calculateTotalProduction()`: usar `totalMiningSpeed / difficulty × globalBlockReward`
   - Eliminar lógica de `blockReward` por hardware
   - `baseProduction` pasa a ser display-only

4. **`src/contexts/GameContext.tsx`**
   - `ADD_PRODUCTION`: usar nueva fórmula de producción
   - Agregar `networkDifficulty` al estado

5. **`src/utils/marketLogic.ts`**
   - Integrar precio base por era como floor del precio de CC

6. **`src/types/game.ts`**
   - Agregar `networkDifficulty: number` a GameState
   - Remover `blockReward` de Hardware type (o marcarlo como deprecated)

7. **`src/data/hardwareData.ts`**
   - Actualizar valores de miningSpeed y baseCost

8. **`src/components/BlockStatus.tsx`**
   - Mostrar reward global (era y dificultad son internas, no se muestran en UI)

---

## Testing

### Unit tests requeridos

```
- calculateDifficulty(0) === 1.0
- calculateDifficulty(100) ≈ 1.41
- calculateDifficulty(5000) ≈ 8.76
- dificultad es monótonamente creciente con totalMiningSpeed
- globalBlockReward(0) === 50
- globalBlockReward(210_000) === 25
- globalBlockReward(420_000) === 12.5
- sum de CC todas las eras ≈ 20,835,937.5
- getBasePrice(0) === 0.05
- getBasePrice(210_000) === 0.18
- getBasePrice(420_000) === 0.55
- comprar hardware increases net blocks/sec (though with diminishing returns)
```

### Playtest checklist

```
- [ ] Early game: CPU → GPU progression feels natural
- [ ] Mid game: ASIC unlocks require meaningful saving
- [ ] Late game: Mining Farm purchase is a significant milestone
- [ ] Quantum Miner is NOT trivially reachable in first run
- [ ] $/block peaks at Era 3 then declines — creates prestige pressure
- [ ] Economía cierra: $ de CC sales >= tiers 2-9 hardware costs
- [ ] Dilema energético funciona (renovables vs no renovables)
- [ ] Prestige atractivo antes de poder comprar quantum_miner
```
