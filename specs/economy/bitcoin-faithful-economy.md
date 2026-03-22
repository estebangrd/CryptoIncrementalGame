# Bitcoin-Faithful Economy Redesign

## Estado
- **Fase**: Phase 2 - Economy Overhaul
- **Estado**: Implemented
- **Prioridad**: Critical
- **Ultima actualizacion**: 2026-03-22

---

## Overview

Rediseño completo de la economía del juego para emular fielmente el modelo de Bitcoin. Los CryptoCoins (CC) son un recurso finito (21M), el block reward es global (no por hardware), la dificultad escala con bloques minados, y el precio de CC sube con cada era siguiendo la tendencia histórica de BTC.

## Modelo Fundamental

```
Global Block Reward = 50 / 2^(floor(blocksMined / 210,000))
Difficulty          = 1.0 + 0.5 × log₁₀(1 + blocksMined / 100,000)
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
difficulty(blocksMined) = 1.0 + 0.5 × Math.log10(1 + blocksMined / 100_000)
```

| Bloques | Dificultad | Efecto |
|:---:|:---:|---|
| 0 | 1.00 | sin penalidad |
| 50,000 | 1.09 | 8% más lento |
| 100,000 | 1.15 | 13% más lento |
| 210,000 | 1.25 | 20% más lento |
| 500,000 | 1.39 | 28% más lento |
| 1,000,000 | 1.52 | 34% más lento |
| 10,000,000 | 2.00 | 50% más lento |
| 21,000,000 | 2.16 | 54% más lento |

**Propiedad clave**: comprar hardware SIEMPRE acelera el minado, porque la dificultad no sube al comprar hardware. Solo sube con bloques minados.

### Constantes en balanceConfig.ts

```typescript
BLOCK_CONFIG.DIFFICULTY = {
  AMPLITUDE: 0.5,
  SCALE_BLOCKS: 100_000,
}
```

---

## Precio de CC por Era

El precio base de CC sube con cada era, simulando la apreciación histórica de BTC post-halving. La volatilidad del histórico de BTC se aplica como fluctuación alrededor de este precio base.

| Era | Precio base/CC | CC disponibles | $ generados | Multiplicador vs anterior |
|:---:|:---:|:---:|:---:|:---:|
| 0 | $0.10 | 10,500,000 | $1,050,000 | — |
| 1 | $2.00 | 5,250,000 | $10,500,000 | 20x |
| 2 | $10.00 | 2,625,000 | $26,250,000 | 5x |
| 3 | $40.00 | 1,312,500 | $52,500,000 | 4x |
| 4 | $100.00 | 656,250 | $65,600,000 | 2.5x |
| **Total** | | **20,343,750** | **$155,900,000** | **1000x** |

### Implementación del precio base

```typescript
// Precio base escala con la era actual
function getBasePrice(blocksMined: number): number {
  const era = Math.floor(blocksMined / 210_000);
  const BASE_PRICES = [0.10, 2.00, 10.00, 40.00, 100.00, 100.00, 100.00];
  return BASE_PRICES[Math.min(era, BASE_PRICES.length - 1)];
}
```

La volatilidad del histórico de BTC se aplica como multiplicador sobre este precio base (±20-30%).

---

## Hardware

### Campos por hardware

- **`miningSpeed`** (bloques/seg por unidad) — ÚNICO stat de producción
- **`baseCost`** ($) — costo en real money
- **`electricityCost`** ($/seg por unidad)
- **`baseProduction`** — SOLO para display en UI (hash rate), no afecta mecánicas
- **`blockReward`** — ELIMINADO. El reward es global, de la tabla de eras.

### Tabla de hardware

| Tier | ID | miningSpeed | baseCost ($) | 5 unidades ($) | electricityCost | energyRequired (MW) |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| 1 | manual_mining | 0.1 | 0 | 0 | 0 | 0 |
| 2 | basic_cpu | 0.3 | 30 | 110 | 0.5 | 0 |
| 3 | advanced_cpu | 0.8 | 120 | 439 | 1.2 | 0 |
| 4 | basic_gpu | 2.5 | 600 | 2,195 | 3 | 0 |
| 5 | advanced_gpu | 6 | 3,000 | 10,976 | 7 | 0 |
| 6 | asic_gen1 | 12 | 24,000 | 87,811 | 20 | 0 |
| 7 | asic_gen2 | 30 | 96,000 | 351,245 | 45 | 0 |
| 8 | asic_gen3 | 60 | 384,000 | 1,404,979 | 100 | 0 |
| 9 | mining_farm | 75 | 5,120,000 | 18,733,056 | 300 | 500 |
| 10 | quantum_miner | 200 | 5,000,000 | 18,293,609 | 900 | 2,000 |
| 11 | supercomputer | 500 | 50,000,000 | 182,936,089 | 3,000 | 10,000 |

**costMultiplier**: 1.20 por unidad adicional
**unlockRequirement**: 5 unidades del tier anterior

### Compra esperada primera run

| Tier | Unidades | Costo total | Fuente de $ |
|---|:---:|:---:|---|
| 2-5 | 5 cada uno | ~$13,720 | Era 0 ($1.05M) |
| 6-7 | 5 cada uno | ~$439,056 | Era 0-1 ($11.5M) |
| 8 | 5 | ~$1,404,979 | Era 1-2 ($36.7M) |
| 9 | 5 | ~$18,733,056 | Era 2-3 ($78.7M) |
| 10 | 10 | ~$129,750,000 | Era 3-4 ($118.1M) |
| **Total** | | **~$150,340,811** | **$155,900,000 disponible** |

**Surplus**: ~$5.6M (cubre electricidad, upgrades de energía, margen de error en precios del market)

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

## Progresión temporal (10-12 horas)

### Era 0 (bloques 0-210K): ~3-4 horas
- Hardware: manual → CPU → GPU
- CC ganados: 10,500,000
- $ ganados: ~$1,050,000
- Compras: tiers 2-5

### Era 1 (bloques 210K-420K): ~2-3 horas
- Hardware: GPU → ASIC Gen 1-2
- CC ganados: 5,250,000
- $ ganados: ~$10,500,000
- Compras: tiers 6-7

### Era 2 (bloques 420K-630K): ~1.5-2 horas
- Hardware: ASIC Gen 2-3
- CC ganados: 2,625,000
- $ ganados: ~$26,250,000
- Compras: tier 8, inicio tier 9

### Era 3 (bloques 630K-840K): ~1-1.5 horas
- Hardware: Mining Farm → Quantum Miner
- CC ganados: 1,312,500
- $ ganados: ~$52,500,000
- Compras: tier 9-10

### Era 4 (bloques 840K-1.05M): ~1 hora
- Hardware: Quantum Miner a full
- CC ganados: 656,250
- $ ganados: ~$65,600,000
- Tensión energética al máximo

### Eras 5-6: endgame / prestige
- Producción mínima, prestige atractivo

---

## Cambios en código

### Archivos a modificar

1. **`src/config/balanceConfig.ts`**
   - Agregar `BLOCK_CONFIG.DIFFICULTY` (AMPLITUDE, SCALE_BLOCKS)
   - Agregar `BLOCK_CONFIG.ERA_BASE_PRICES` array de precios por era
   - Actualizar `HARDWARE_CONFIG.levels` (nuevos baseCost, miningSpeed, eliminar blockReward)

2. **`src/utils/blockLogic.ts`**
   - Cambiar `calculateDifficulty(totalHashRate)` → `calculateDifficulty(blocksMined)`
   - Nueva fórmula: `1.0 + AMPLITUDE × log₁₀(1 + blocksMined / SCALE_BLOCKS)`

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
   - Mostrar era actual, dificultad, reward global

---

## Testing

### Unit tests requeridos

```
- calculateDifficulty(0) === 1.0
- calculateDifficulty(100_000) ≈ 1.15
- calculateDifficulty(21_000_000) ≈ 2.16
- dificultad es monótonamente creciente
- globalBlockReward(0) === 50
- globalBlockReward(210_000) === 25
- globalBlockReward(420_000) === 12.5
- sum de CC todas las eras ≈ 20,835,937.5
- getBasePrice(0) === 0.10
- getBasePrice(210_000) === 2.00
- comprar hardware siempre aumenta blocks/sec (dificultad no cambia)
```

### Playtest checklist

```
- [ ] Hora 0-1: CPU phase, progresión rápida
- [ ] Hora 2-3: GPU phase, primer halving se siente
- [ ] Hora 4-6: ASIC phase, momentum fuerte
- [ ] Hora 7-9: Mining Farm + Quantum, tensión energética
- [ ] Hora 10-12: Endgame, prestige atractivo
- [ ] Economía cierra: $ de CC sales >= hardware costs
- [ ] 10 quantum_miners comprables
- [ ] Dilema energético funciona (renovables vs no renovables)
```
