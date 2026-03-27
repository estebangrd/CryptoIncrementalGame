# Electricity → CC Mining Fee

## Estado

| Campo | Valor |
|-------|-------|
| Fase | Economy Rebalance |
| Estado | ✅ Implemented |
| Prioridad | Critical |
| Última actualización | 2026-03-26 |

## Descripción

Replaces the old electricity system ($/sec drain from real money) with a **CC mining fee** — a percentage of mined CryptoCoins deducted as operating cost proportional to hardware fleet size/quality. This is analogous to mining pool fees in real Bitcoin.

### Problem

The old system drained real money ($) per second based on hardware owned. In mid-game scenarios, electricity could drain $20/sec while CC sales only generated ~$0.15/sec (135x deficit). This made progression feel punishing and forced constant selling.

### Solution

Electricity weight values are used to compute a CC fee per tick:

```
CC_fee_per_tick = totalElectricityWeight × (RATE_PERCENT / 100)
```

- `totalElectricityWeight = Σ(hw.electricityCost × hw.owned)` — existing calculation, values scaled ×10
- `RATE_PERCENT = 0.75` — configurable in `ELECTRICITY_FEE_CONFIG`
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
  RATE_PERCENT: 0.75,
};
```

### Hardware Electricity Weights (×10 from original)

| Hardware | Old electricityCost | New electricityCost (weight) |
|----------|-------------------|------------------------------|
| manual_mining | 0 | 0 |
| basic_cpu | 0.5 | 5 |
| advanced_cpu | 1.2 | 12 |
| basic_gpu | 3 | 30 |
| advanced_gpu | 7 | 70 |
| asic_gen1 | 20 | 200 |
| asic_gen2 | 45 | 450 |
| asic_gen3 | 100 | 1000 |
| mining_farm | 300 | 3000 |
| quantum_miner | 900 | 9000 |
| supercomputer | 3000 | 30000 |

## Example Scenarios

### Early Game (10 basic_cpu)

```
totalWeight = 5 × 10 = 50
feePerSec = 50 × 0.75 / 100 = 0.375 CC/sec
grossCC = ~15 CC/sec (10 CPUs at era 0)
netCC = 14.625 CC/sec (~2.5% loss)
```

### Mid Game (5 asic_gen2)

```
totalWeight = 450 × 5 = 2250
feePerSec = 2250 × 0.75 / 100 = 16.875 CC/sec
grossCC = ~187.5 CC/sec
netCC = ~170.6 CC/sec (~9% loss)
```

### Late Game (3 quantum_miner)

```
totalWeight = 9000 × 3 = 27000
feePerSec = 27000 × 0.75 / 100 = 202.5 CC/sec
```

## Archivos Modificados

- `src/config/balanceConfig.ts` — `ELECTRICITY_FEE_CONFIG` + scaled weights
- `src/contexts/GameContext.tsx` — `recalculateGameStats`, `ADD_PRODUCTION`
- `src/utils/gameLogic.ts` — `updateOfflineProgress`
- `src/components/BlockStatus.tsx` — display CC/sec instead of $/sec
- `__tests__/bitcoinEconomy.test.ts` — updated electricity drain test
- `__tests__/blockMining.test.ts` — no changes needed (mock values)

## UI Changes

BlockStatus "Electricity" card → "Mining Fee" card:
- Label: "Mining Fee"
- Value: `-{feePerSec}` (red variant when > 0)
- Sub: "CC/sec"

## Pack Electricity Hours

The `packCurrentElectricityHours` in `PURCHASE_STARTER_PACK` continues to add cash (`totalElectricityCost * hours * 3600`). With the new system, this becomes a straightforward cash bonus — the "electricity hours" label was always flavor text for a dollar amount.
