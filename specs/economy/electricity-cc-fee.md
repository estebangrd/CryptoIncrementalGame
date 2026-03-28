# Electricity → CC Mining Fee

## Estado

| Campo | Valor |
|-------|-------|
| Fase | Economy Rebalance |
| Estado | ✅ Implemented |
| Prioridad | Critical |
| Última actualización | 2026-03-27 |

## Descripción

Replaces the old electricity system ($/sec drain from real money) with a **CC mining fee** — a percentage of mined CryptoCoins deducted as operating cost proportional to hardware fleet size/quality. This is analogous to mining pool fees in real Bitcoin.

### Problem

The old system drained real money ($) per second based on hardware owned. In mid-game scenarios, electricity could drain $20/sec while CC sales only generated ~$0.15/sec (135x deficit). This made progression feel punishing and forced constant selling.

### Solution

Electricity weight values are used to compute a CC fee per tick:

```
CC_fee_per_tick = totalElectricityWeight × (RATE_PERCENT / 100)
```

- `totalElectricityWeight = Σ(hw.electricityCost × hw.owned)` — existing calculation
- `RATE_PERCENT = 1.5` — configurable in `ELECTRICITY_FEE_CONFIG`
- Net CC = mined CC - fee (clamped to 0)
- `realMoney` is **never** drained by electricity

## Fórmulas

### CC Fee Per Second

```typescript
const feePerSec = totalElectricityCost * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100;
```

### Net CC Per Second (displayed)

```typescript
cryptoCoinsPerSecond = grossCCProduction - feePerSec
```

### Online (ADD_PRODUCTION tick)

```typescript
// After mining blocks and earning coinsThisTick:
newState.cryptoCoins += coinsThisTick;
newState.totalCryptoCoins += coinsThisTick;

const ccFee = totalElectricityCost * ELECTRICITY_FEE_CONFIG.RATE_PERCENT / 100;
newState.cryptoCoins = Math.max(0, newState.cryptoCoins - ccFee);
```

- Fee deducts from `cryptoCoins` only (not `totalCryptoCoins` — lifetime earnings are unaffected)
- Clamped to 0 (never goes negative)

### Offline (updateOfflineProgress)

```typescript
const ccFeeDrained = totalElectricityCost * RATE_PERCENT / 100 * offlineSec;
const netCoins = Math.max(0, coinsEarned - ccFeeDrained);
cryptoCoins = Math.max(0, cryptoCoins + netCoins);
```

## Constantes de Configuración

```typescript
// src/config/balanceConfig.ts
export const ELECTRICITY_FEE_CONFIG = {
  RATE_PERCENT: 1.5,
};
```

### Hardware Electricity Weights

| Hardware | electricityCost (weight) |
|----------|:---:|
| manual_mining | 0 |
| basic_cpu | 3 |
| advanced_cpu | 10 |
| basic_gpu | 40 |
| advanced_gpu | 120 |
| asic_gen1 | 300 |
| asic_gen2 | 900 |
| asic_gen3 | 2,500 |
| mining_farm | 4,500 |
| quantum_miner | 15,000 |
| supercomputer | 50,000 |

## Example Scenarios

### Early Game (10 basic_cpu)

```
totalWeight = 3 × 10 = 30
feePerSec = 30 × 1.5 / 100 = 0.45 CC/sec
grossCC = ~15 CC/sec (10 CPUs at era 0)
netCC = 14.55 CC/sec (~3% loss)
```

### Mid Game (5 asic_gen2)

```
totalWeight = 900 × 5 = 4500
feePerSec = 4500 × 1.5 / 100 = 67.5 CC/sec
grossCC = ~187.5 CC/sec
netCC = ~120 CC/sec (~36% loss)
```

### Late Game (3 quantum_miner)

```
totalWeight = 15000 × 3 = 45000
feePerSec = 45000 × 1.5 / 100 = 675 CC/sec
```

## Archivos Modificados

- `src/config/balanceConfig.ts` — `ELECTRICITY_FEE_CONFIG` + scaled weights
- `src/contexts/GameContext.tsx` — `recalculateGameStats`, `ADD_PRODUCTION`
- `src/utils/gameLogic.ts` — `updateOfflineProgress`
- `src/components/BlockStatus.tsx` — display CC/sec instead of $/sec
- `__tests__/bitcoinEconomy.test.ts` — updated electricity drain test
- `__tests__/blockMining.test.ts` — no changes needed (mock values)

## UI Changes

BlockStatus "Electricity" stat card shows total power consumption (narratively tied to planet collapse):
- Label: "Electricity"
- Value: `{totalElectricityCost}` (red variant when > 0)
- Sub: "kW/h"

The CC fee is applied internally but **not displayed** — the electricity stat represents energy footprint for narrative purposes (non-renewable collapse).

## Pack Electricity Hours

The `packCurrentElectricityHours` in `PURCHASE_STARTER_PACK` continues to add cash (`totalElectricityCost * hours * 3600`). With the new system, this becomes a straightforward cash bonus — the "electricity hours" label was always flavor text for a dollar amount.
