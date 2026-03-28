# Bitcoin-Faithful Economy Redesign

## Estado
- **Fase**: Phase 2 - Economy Overhaul
- **Estado**: Implemented
- **Prioridad**: Critical
- **Ultima actualizacion**: 2026-03-27

---

## Overview

Rediseño completo de la economía del juego para emular fielmente el modelo de Bitcoin. Los CryptoCoins (CC) son un recurso finito (21M), el block reward es global (no por hardware), la dificultad escala con bloques minados, y el precio de CC sube con cada era siguiendo la tendencia histórica de BTC.

## Modelo Fundamental

```
Global Block Reward = 50 / 2^(floor(blocksMined / 210,000))
Difficulty          = 1.0 + 0.8 × (blocksMined / 200,000)^0.65
Blocks/sec          = totalMiningSpeed / difficulty
CC/sec              = blocks/sec × globalBlockReward
```

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

Basada SOLO en bloques minados. No depende del hash rate.

```typescript
difficulty(blocksMined) = 1.0 + 0.8 × Math.pow(blocksMined / 200_000, 0.65)
```

| Bloques | Dificultad | Efecto |
|:---:|:---:|---|
| 0 | 1.00 | sin penalidad |
| 50,000 | 1.33 | 25% más lento |
| 100,000 | 1.51 | 34% más lento |
| 210,000 | 1.83 | 45% más lento |
| 500,000 | 2.45 | 59% más lento |
| 1,000,000 | 3.28 | 70% más lento |
| 10,000,000 | 11.18 | 91% más lento |
| 21,000,000 | 17.47 | 94% más lento |

**Propiedad clave**: comprar hardware SIEMPRE acelera el minado, porque la dificultad no sube al comprar hardware. Solo sube con bloques minados.

### Constantes en balanceConfig.ts

```typescript
BLOCK_CONFIG.DIFFICULTY = {
  AMPLITUDE: 0.8,
  SCALE_BLOCKS: 200_000,
  EXPONENT: 0.65,
}
```

---

## Precio de CC por Era

El precio base de CC sube con cada era, simulando la apreciación histórica de BTC post-halving. La volatilidad del histórico de BTC se aplica como fluctuación alrededor de este precio base.

| Era | Precio base/CC | CC disponibles | $ generados | $/bloque | Multiplicador vs anterior |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | $0.08 | 10,500,000 | $840,000 | $4.00 | — |
| 1 | $0.50 | 5,250,000 | $2,625,000 | $12.50 | 6.25x |
| 2 | $2.00 | 2,625,000 | $5,250,000 | $25.00 | 4x |
| 3 | $5.00 | 1,312,500 | $6,562,500 | $31.25 | 2.5x |
| 4 | $8.00 | 656,250 | $5,250,000 | $25.00 | 1.6x |
| 5 | $8.00 | 328,125 | $2,625,000 | $12.50 | 1x |
| 6 | $8.00 | 164,062.5 | $1,312,500 | $6.25 | 1x |
| **Total** | | **20,835,937.5** | **$24,465,000** | — | **100x** |

**Nota**: $/bloque alcanza su pico en Era 3 ($31.25) y luego **declina** desde Era 4 porque el halving domina. Esto crea presión económica real en late game.

### Implementación del precio base

```typescript
// Precio base escala con la era actual
function getBasePrice(blocksMined: number): number {
  const era = Math.floor(blocksMined / 210_000);
  const BASE_PRICES = [0.08, 0.50, 2.00, 5.00, 8.00, 8.00, 8.00];
  return BASE_PRICES[Math.min(era, BASE_PRICES.length - 1)];
}
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

| Tier | ID | miningSpeed | baseCost ($) | 5 unidades ($) | electricityCost (weight) | energyRequired (MW) |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| 1 | manual_mining | 0.1 | 0 | 0 | 0 | 0 |
| 2 | basic_cpu | 0.3 | 25 | 249 | 3 | 0 |
| 3 | advanced_cpu | 0.8 | 150 | 1,493 | 10 | 0 |
| 4 | basic_gpu | 2.5 | 800 | 7,964 | 40 | 0 |
| 5 | advanced_gpu | 6 | 5,000 | 49,772 | 120 | 0 |
| 6 | asic_gen1 | 12 | 35,000 | 348,403 | 300 | 0 |
| 7 | asic_gen2 | 30 | 200,000 | 1,990,876 | 900 | 0 |
| 8 | asic_gen3 | 60 | 1,200,000 | 11,945,258 | 2,500 | 0 |
| 9 | mining_farm | 100 | 8,000,000 | 79,635,050 | 4,500 | 500 |
| 10 | quantum_miner | 200 | 50,000,000 | 497,719,063 | 15,000 | 2,000 |
| 11 | supercomputer | 600 | 500,000,000 | 4,977,190,625 | 50,000 | 10,000 |

**costMultiplier**: 1.35 por unidad adicional
**unlockRequirement**: 5 unidades del tier anterior

### Compra esperada primera run

| Tier | Unidades | Costo total | Fuente de $ |
|---|:---:|:---:|---|
| 2-5 | 5 cada uno | ~$59,478 | Era 0 ($840K) |
| 6-7 | 5 cada uno | ~$2,339,279 | Era 0-1 ($3.5M) |
| 8 | 5 | ~$11,945,258 | Era 1-2 ($8.7M) |
| 9 | 5 | ~$79,635,050 | Era 2-3 ($15.2M) |

**Nota**: Quantum Miner ($50M base) y Supercomputer ($500M base) requieren múltiples eras y market volatility para ser alcanzables. La economía está diseñada para que el late game sea un grind significativo que incentive el prestige.

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
- $ ganados: ~$840,000 (base price $0.08)
- Compras: tiers 2-5

### Era 1 (bloques 210K-420K): Mid game
- Hardware: GPU → ASIC Gen 1-2
- CC ganados: 5,250,000
- $ ganados: ~$2,625,000 (base price $0.50)
- Compras: tiers 6-7

### Era 2 (bloques 420K-630K): Late-mid game
- Hardware: ASIC Gen 2-3
- CC ganados: 2,625,000
- $ ganados: ~$5,250,000 (base price $2.00)
- Compras: tier 8, inicio tier 9

### Era 3 (bloques 630K-840K): Late game
- Hardware: Mining Farm
- CC ganados: 1,312,500
- $ ganados: ~$6,562,500 (base price $5.00)
- Compras: tier 9, ahorro para tier 10

### Era 4+ (bloques 840K+): Endgame
- $/bloque declina ($25.00 → $12.50 → $6.25)
- Prestige atractivo
- Quantum Miner y Supercomputer requieren prestige runs o market volatility

---

## Cambios en código

### Archivos a modificar

1. **`src/config/balanceConfig.ts`**
   - Agregar `BLOCK_CONFIG.DIFFICULTY` (AMPLITUDE, SCALE_BLOCKS)
   - Agregar `BLOCK_CONFIG.ERA_BASE_PRICES` array de precios por era
   - Actualizar `HARDWARE_CONFIG.levels` (nuevos baseCost, miningSpeed, eliminar blockReward)

2. **`src/utils/blockLogic.ts`**
   - Cambiar `calculateDifficulty(totalHashRate)` → `calculateDifficulty(blocksMined)`
   - Fórmula: `1.0 + AMPLITUDE × (blocksMined / SCALE_BLOCKS)^EXPONENT`

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
- calculateDifficulty(100_000) ≈ 1.51
- calculateDifficulty(1_000_000) ≈ 3.28
- calculateDifficulty(21_000_000) ≈ 17.47
- dificultad es monótonamente creciente
- globalBlockReward(0) === 50
- globalBlockReward(210_000) === 25
- globalBlockReward(420_000) === 12.5
- sum de CC todas las eras ≈ 20,835,937.5
- getBasePrice(0) === 0.08
- getBasePrice(210_000) === 0.50
- getBasePrice(420_000) === 2.00
- comprar hardware siempre aumenta blocks/sec (dificultad no cambia)
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
