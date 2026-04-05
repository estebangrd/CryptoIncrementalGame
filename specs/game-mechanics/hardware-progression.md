# Hardware Progression System

## Estado
- **Fase**: Phase 1 - Genesis (Implemented)
- **Estado**: Implemented & Active
- **Prioridad**: Critical (Core Progression Mechanic)
- **Última actualización**: 2026-04-04

## Descripción

El sistema de progresión de hardware es la principal mecánica de upgrade del juego. Los jugadores compran hardware de minería que automáticamente mina bloques y genera CryptoCoins. El hardware está organizado en 11 niveles tecnológicos que se desbloquean progresivamente, desde CPUs básicos hasta Supercomputers.

Cada nivel de hardware tiene costos crecientes (scaling exponencial con per-tier COST_MULTIPLIER_BY_ID: 1.20-1.40), mayor producción, y mayores costos de electricidad (CC fee weights, currently disabled). Se requieren 8 unidades del tier anterior para desbloquear el siguiente. Hardware se compra con $ (real money), no con CC.

## Objetivos
- [x] Crear una progresión clara y satisfactoria de upgrades
- [x] Balancear el costo vs beneficio de cada nivel de hardware
- [x] Implementar desbloqueo progresivo para evitar overwhelm
- [x] Simular costos de electricidad para crear decisiones interesantes
- [x] Permitir múltiples estrategias viables (muchos básicos vs pocos avanzados)

## Comportamiento Esperado

### Caso de Uso 1: Comprar Hardware con CryptoCoins
**Dado que** el jugador tiene suficientes CryptoCoins para comprar hardware
**Cuando** presiona el botón "Buy" en un hardware disponible
**Entonces**
- Se deduce el costo del balance de CryptoCoins
- El contador `owned` del hardware se incrementa en 1
- El costo del siguiente purchase se recalcula usando la fórmula exponencial
- La producción total (`cryptoCoinsPerSecond`) se recalcula automáticamente
- El costo de electricidad total se actualiza
- La UI muestra el nuevo costo para la próxima compra
- Se verifica si se desbloqueó el siguiente nivel de hardware

### Caso de Uso 2: Desbloqueo Progresivo de Hardware
**Dado que** el jugador tiene 0 unidades del siguiente nivel de hardware
**Cuando** compra la 8va unidad del nivel actual
**Entonces**
- El siguiente nivel de hardware se desbloquea
- Aparece en la lista de hardware disponible
- Se muestra una notificación: "🔓 New Hardware Unlocked: [nombre]"
- El botón de compra está habilitado si el jugador tiene suficientes coins
- La descripción del hardware se muestra completa (no "???")

### Caso de Uso 3: Comprar Hardware con Real Money
**Dado que** el tab "Hardware" está desbloqueado (requiere $150 total earned)
**Cuando** el jugador intenta comprar hardware
**Entonces**
- Si el hardware está en el tab "Hardware": usa Real Money ($) como moneda
- Si el hardware está en el tab principal: usa CryptoCoins
- El costo se deduce de la moneda correspondiente
- La compra sigue las mismas reglas de scaling y unlocking
- **Nota**: Actualmente todos los hardware usan CryptoCoins, esto será modificado en implementación

### Caso de Uso 4: Ver Estadísticas de Hardware
**Dado que** el jugador abre la lista de hardware
**Cuando** ve un hardware específico
**Entonces**
- Se muestra el nombre traducido del hardware
- Se muestra la descripción traducida
- Se muestra "Owned: X" (cantidad poseída)
- Se muestra "Cost: X CC" o "Cost: $X" según corresponda
- Se muestra "Mining Speed: X blocks/s" (por unidad)
- Se muestra "Block Reward: X CC/block"
- Se muestra "Electricity: $X/s" (costo por unidad)
- Se muestra "Net Production: X CC/s" (production - electricity, total de todas las unidades)
- Si está bloqueado: se muestra "🔒 Requires X [previous hardware]"

## Niveles de Hardware (Progresión Tecnológica)

### Nivel 1: Manual Mining (Oculto)
```typescript
{
  id: 'manual_mining',
  level: 1,
  baseCost: 0,
  baseProduction: 10,      // Hash rate (display only)
  blockReward: 0,          // Deprecated: reward is global per era
  miningSpeed: 0.1,        // 0.1 bloques/segundo
  electricityCost: 0,      // Sin costo
  owned: 1,                // Siempre 1 (no comprable)
}
```
**Propósito**: Minería inicial para arrancar el juego (primer CryptoCoin)
**Estado**: Oculto en UI, solo usado internamente

### Nivel 2: Basic CPU
```typescript
{
  id: 'basic_cpu',
  level: 2,
  baseCost: 25,            // $ (real money)
  baseProduction: 30,
  blockReward: 0,          // Deprecated
  miningSpeed: 0.3,        // 3x más rápido que manual
  electricityCost: 3,      // CC fee weight
  unlockRequirement: 'Always unlocked (first hardware)'
}
```
**Propósito**: Primer hardware comprable, introduce el concepto de automatización

### Nivel 3: Advanced CPU
```typescript
{
  id: 'advanced_cpu',
  level: 3,
  baseCost: 350,
  baseProduction: 80,
  blockReward: 0,
  miningSpeed: 1.5,
  electricityCost: 10,
  unlockRequirement: 'basic_cpu >= 8 owned'
}
```
**Propósito**: Primera upgrade significativa

### Nivel 4: Basic GPU
```typescript
{
  id: 'basic_gpu',
  level: 4,
  baseCost: 3500,
  baseProduction: 250,
  blockReward: 0,
  miningSpeed: 8,
  electricityCost: 40,
  unlockRequirement: 'advanced_cpu >= 8 owned'
}
```
**Propósito**: Cambio de tecnología (CPU → GPU), gran salto en velocidad

### Nivel 5: Advanced GPU
```typescript
{
  id: 'advanced_gpu',
  level: 5,
  baseCost: 22000,
  baseProduction: 600,
  blockReward: 0,
  miningSpeed: 55,
  electricityCost: 120,
  unlockRequirement: 'basic_gpu >= 8 owned'
}
```
**Propósito**: GPU de alta gama, electricidad empieza a ser un factor significativo

### Nivel 6: ASIC Gen 1
```typescript
{
  id: 'asic_gen1',
  level: 6,
  baseCost: 350000,
  baseProduction: 1500,
  blockReward: 0,
  miningSpeed: 350,
  electricityCost: 300,
  unlockRequirement: 'advanced_gpu >= 8 owned'
}
```
**Propósito**: Hardware especializado, dedicado exclusivamente a mining

### Nivel 7: ASIC Gen 2
```typescript
{
  id: 'asic_gen2',
  level: 7,
  baseCost: 2250000,
  baseProduction: 4000,
  blockReward: 0,
  miningSpeed: 2400,
  electricityCost: 900,
  unlockRequirement: 'asic_gen1 >= 8 owned'
}
```
**Propósito**: ASIC de segunda generación

### Nivel 8: ASIC Gen 3
```typescript
{
  id: 'asic_gen3',
  level: 8,
  baseCost: 18000000,
  baseProduction: 10000,
  blockReward: 0,
  miningSpeed: 16000,
  electricityCost: 2500,
  unlockRequirement: 'asic_gen2 >= 8 owned'
}
```
**Propósito**: Último ASIC, punto de inflexión hacia late game

### Nivel 9: Mining Farm
```typescript
{
  id: 'mining_farm',
  level: 9,
  baseCost: 120000000,
  baseProduction: 50000,
  blockReward: 0,
  miningSpeed: 100000,
  electricityCost: 4500,
  energyRequired: 500,     // MW per unit
  unlockRequirement: 'asic_gen3 >= 8 owned'
}
```
**Propósito**: Primer hardware que requiere energía (Energy System)

### Nivel 10: Quantum Miner
```typescript
{
  id: 'quantum_miner',
  level: 10,
  baseCost: 500000000,
  baseProduction: 200000,
  blockReward: 0,
  miningSpeed: 650000,
  electricityCost: 15000,
  energyRequired: 2000,    // MW per unit
  unlockRequirement: 'mining_farm >= 8 owned'
}
```
**Propósito**: Hardware de elite, requiere inversión masiva

### Nivel 11: Supercomputer
```typescript
{
  id: 'supercomputer',
  level: 11,
  baseCost: 2000000000,
  baseProduction: 1000000,
  blockReward: 0,
  miningSpeed: 4000000,
  electricityCost: 50000,
  energyRequired: 10000,   // MW per unit
  unlockRequirement: 'quantum_miner >= 8 owned'
}
```
**Propósito**: Hardware endgame, prácticamente inalcanzable en primera run

## Fórmulas y Cálculos

### Costo de Compra (Exponencial Scaling)
```typescript
function calculateHardwareCost(hardware: Hardware): number {
  return Math.floor(
    hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned)
  );
}

// Ejemplo con Basic CPU (baseCost: 25, multiplier: 1.35):
// 1ra unidad: 25
// 2da unidad: 33
// 3ra unidad: 45
// 5ta unidad: 83
// 10ma unidad: 508
// 20ma unidad: 10,307
```

### Producción de un Hardware
```typescript
function calculateHardwareProduction(
  hardware: Hardware,
  upgrades: Upgrade[]
): number {
  let production = hardware.baseProduction * hardware.owned;

  // Aplicar multipliers de upgrades
  for (const upgrade of upgrades) {
    if (upgrade.purchased && upgrade.effect.type === 'production') {
      // Verificar si el upgrade afecta este hardware
      if (matchesHardware(hardware, upgrade.effect.target)) {
        production *= upgrade.effect.value;
      }
    }
  }

  return production;
}
```

### Mining Speed de un Hardware
```typescript
function calculateHardwareMiningSpeed(
  hardware: Hardware,
  upgrades: Upgrade[]
): number {
  let speed = hardware.miningSpeed * hardware.owned;

  // Aplicar multipliers de upgrades (mismo que producción)
  for (const upgrade of upgrades) {
    if (upgrade.purchased && upgrade.effect.type === 'production') {
      if (matchesHardware(hardware, upgrade.effect.target)) {
        speed *= upgrade.effect.value;
      }
    }
  }

  return speed;
}
```

### Costo de Electricidad
```typescript
function calculateHardwareElectricityCost(hardware: Hardware): number {
  return hardware.electricityCost * hardware.owned;
}

function calculateTotalElectricityCost(hardware: Hardware[]): number {
  return hardware.reduce((total, hw) =>
    total + calculateHardwareElectricityCost(hw), 0
  );
}
```

### Producción Neta de CryptoCoins
```typescript
function calculateNetProduction(gameState: GameState): number {
  let totalProduction = 0;

  for (const hardware of gameState.hardware) {
    const miningSpeed = calculateHardwareMiningSpeed(hardware, gameState.upgrades);
    const coinsPerSecond = miningSpeed * hardware.blockReward;
    totalProduction += coinsPerSecond;
  }

  const electricityCost = calculateTotalElectricityCost(gameState.hardware);
  const netProduction = Math.max(0, totalProduction - electricityCost);

  return netProduction * gameState.prestigeMultiplier;
}
```

### Verificación de Desbloqueo
```typescript
function isHardwareUnlocked(gameState: GameState, hardware: Hardware): boolean {
  // Manual mining nunca se muestra
  if (hardware.id === 'manual_mining') return false;

  // Primer hardware (Basic CPU) siempre desbloqueado
  if (hardware.level === 2) return true;

  // Otros hardware requieren 5 unidades del nivel anterior
  const previousLevel = hardware.level - 1;
  const previousHardware = gameState.hardware.find(h => h.level === previousLevel);

  if (!previousHardware) return false;

  return previousHardware.owned >= HARDWARE_CONFIG.UNLOCK_REQUIREMENT; // 8
}
```

### Matching de Upgrades a Hardware
```typescript
function matchesHardware(hardware: Hardware, target: string): boolean {
  // Match exacto por ID
  if (target === hardware.id) return true;

  // Match por categoría
  if (target === 'cpu' && ['basic_cpu', 'advanced_cpu'].includes(hardware.id)) {
    return true;
  }
  if (target === 'gpu' && ['basic_gpu', 'advanced_gpu'].includes(hardware.id)) {
    return true;
  }
  if (target === 'asic' && ['asic_gen1', 'asic_gen2', 'asic_gen3'].includes(hardware.id)) {
    return true;
  }

  return false;
}
```

## Constantes de Configuración

En `src/config/balanceConfig.ts`:

```typescript
export const HARDWARE_CONFIG = {
  COST_MULTIPLIER: 1.35,        // Legacy default
  COST_MULTIPLIER_BY_ID: {      // Per-tier multipliers
    manual_mining: 1.35, basic_cpu: 1.40, advanced_cpu: 1.40,
    basic_gpu: 1.35, advanced_gpu: 1.35, asic_gen1: 1.30,
    asic_gen2: 1.30, asic_gen3: 1.28, mining_farm: 1.25,
    quantum_miner: 1.22, supercomputer: 1.20,
  },
  UNLOCK_REQUIREMENT: 8,        // Unidades necesarias para desbloquear siguiente

  levels: {
    manual_mining: { baseCost: 0, baseProduction: 10, blockReward: 0, miningSpeed: 0.1, electricityCost: 0 },
    basic_cpu: { baseCost: 25, baseProduction: 30, blockReward: 0, miningSpeed: 0.3, electricityCost: 3 },
    advanced_cpu: { baseCost: 350, baseProduction: 80, blockReward: 0, miningSpeed: 1.5, electricityCost: 10 },
    basic_gpu: { baseCost: 3500, baseProduction: 250, blockReward: 0, miningSpeed: 8, electricityCost: 40 },
    advanced_gpu: { baseCost: 22000, baseProduction: 600, blockReward: 0, miningSpeed: 55, electricityCost: 120 },
    asic_gen1: { baseCost: 350000, baseProduction: 1500, blockReward: 0, miningSpeed: 350, electricityCost: 300 },
    asic_gen2: { baseCost: 2250000, baseProduction: 4000, blockReward: 0, miningSpeed: 2400, electricityCost: 900 },
    asic_gen3: { baseCost: 18000000, baseProduction: 10000, blockReward: 0, miningSpeed: 16000, electricityCost: 2500 },
    mining_farm: { baseCost: 120000000, baseProduction: 50000, blockReward: 0, miningSpeed: 100000, electricityCost: 4500 },
    quantum_miner: { baseCost: 500000000, baseProduction: 200000, blockReward: 0, miningSpeed: 650000, electricityCost: 15000 },
    supercomputer: { baseCost: 2000000000, baseProduction: 1000000, blockReward: 0, miningSpeed: 4000000, electricityCost: 50000 },
  }
};

// blockReward is deprecated — reward is global per era (see bitcoin-faithful-economy.md)
// electricityCost is a CC fee weight; RATE_PERCENT = 0 (disabled, pending rework)
```

## Estructura de Datos

```typescript
interface Hardware {
  id: string;                    // Identificador único
  name: string;                  // Nombre en inglés (legacy)
  nameKey: string;               // Clave de traducción
  description: string;           // Descripción en inglés (legacy)
  descriptionKey: string;        // Clave de traducción
  baseCost: number;              // Costo inicial
  baseProduction: number;        // Hash rate (H/s) - solo para display
  blockReward: number;           // CryptoCoins por bloque minado
  miningSpeed: number;           // Bloques por segundo por unidad
  electricityCost: number;       // $ por segundo por unidad
  owned: number;                 // Cantidad poseída por el jugador
  costMultiplier: number;        // Multiplicador de costo (per-tier: 1.20-1.40)
  icon: string;                  // Nombre del icono (react-native-vector-icons)
  currencyId: string;            // ID de la criptomoneda que mina
  level: number;                 // Nivel tecnológico (1-8)
}
```

## Tabla de Progresión Económica

| Hardware | Base Cost ($) | costMultiplier | Mining Speed | Electricity Weight |
|----------|:---:|:---:|:---:|:---:|
| Basic CPU | 25 | 1.40 | 0.3 | 3 |
| Advanced CPU | 350 | 1.40 | 1.5 | 10 |
| Basic GPU | 3,500 | 1.35 | 8 | 40 |
| Advanced GPU | 22,000 | 1.35 | 55 | 120 |
| ASIC Gen 1 | 350,000 | 1.30 | 350 | 300 |
| ASIC Gen 2 | 2,250,000 | 1.30 | 2,400 | 900 |
| ASIC Gen 3 | 18,000,000 | 1.28 | 16,000 | 2,500 |
| Mining Farm | 120,000,000 | 1.25 | 100,000 | 4,500 |
| Quantum Miner | 500,000,000 | 1.22 | 650,000 | 15,000 |
| Supercomputer | 2,000,000,000 | 1.20 | 4,000,000 | 50,000 |

**Nota**:
- `blockReward` is deprecated — reward is global per era (50 CC → 25 CC → 12.5 CC...)
- `electricityCost` is a CC fee weight; RATE_PERCENT = 0 (disabled, pending rework)
- Hardware se compra con $ (real money), no con CryptoCoins
- COST_MULTIPLIER_BY_ID: per-tier multipliers (1.20-1.40)
- UNLOCK_REQUIREMENT: 8 units of previous tier

## Reglas de Negocio

1. **El hardware se desbloquea secuencialmente**: No se puede saltar niveles
2. **Se requieren exactamente 8 unidades para desbloquear**: No más, no menos
3. **Manual Mining no se muestra en UI**: Pero existe internamente para el juego inicial
4. **El costo aumenta exponencialmente**: Cada compra es 20-40% más cara (per-tier)
5. **No hay límite de unidades**: El jugador puede comprar infinitas (solo limitado por costo)
6. **La electricidad siempre se paga**: Aunque el jugador no tenga dinero (resta de producción)
7. **El blockReward es global por era**: Deprecated per-hardware blockReward — el reward es 50/2^era
8. **Los upgrades afectan por categoría o ID exacto**: "cpu" afecta a basic_cpu y advanced_cpu
9. **Prestige resetea el hardware owned**: No se mantiene entre prestiges
10. **El tab "Hardware" requiere desbloqueo**: Se desbloquea con $150 real money ganado (`UNLOCK_CONFIG.hardware.requiredMoney`)

## UI/UX Requirements

### HardwareList Component
- [x] Muestra todos los hardware desbloqueados en orden de level
- [ ] Hardware bloqueado muestra "🔒" y requisito de desbloqueo
- [x] Cada card de hardware muestra en una fila de 5 celdas (siempre visibles, en este orden):
  - REWARD: recompensa por bloque en CC/blk — color amarillo (`#ffd600`). Delta badge muestra "—" (em dash) con estilo `.zero` (gris/dim) porque `blockReward` es una constante fija por hardware, no escala con unidades owned.
  - HASH RATE: producción total en H/s — color cyan (`#00e5ff`). Delta badge muestra `+N` (verde).
  - MINE SPD: velocidad de minado total en blk/s — color cyan (`#00e5ff`, igual que Hash Rate, consistente con la mining screen). Delta badge muestra `+N` (verde).
  - COINS/S: monedas producidas por segundo (CC/s) — color verde (`#00ff88`). Delta badge muestra `+N` (verde).
  - POWER: costo de electricidad total en $/s — color rojo (`#ff3d5a`). Delta badge muestra `-N` (rojo negativo) o "0" (dim/gris) cuando no hay costo de electricidad. Siempre visible (muestra 0 si owned=0).
- [x] Delta badges embebidos en cada celda de métrica (no hay fila "+1 ADDS" separada)
- [x] "PURCHASE COST" + valor formateado
- [x] Botón "BUY UNIT" (disabled con mensaje "INSUFFICIENT FUNDS" si no puede comprar)
- [x] El botón "Buy" muestra el costo de la próxima unidad (precio escala con owned)
- [x] Si no hay suficientes fondos, el botón está deshabilitado y en rojo
- [x] Si hay fondos, el botón está habilitado y en verde
- [x] Las 5 celdas de stats siempre se muestran en la misma fila (no wrapping)

**Nota sobre POWER**: El stat de electricidad (POWER) debe mostrarse siempre,
incluso cuando `owned=0`. El valor mostrado es `electricityCost * owned` ($/ s total),
y es consistente con los otros stats que también muestran 0 cuando owned=0.
La visibilidad NO debe condicionar por `electricityCost > 0` — siempre renderizar la celda.

### Unlock Notification
- [ ] Al desbloquear nuevo hardware:
  - Toast notification: "🔓 New Hardware Unlocked: [nombre]"
  - Duración: 3 segundos
  - Color: Azul/cyan
  - Sonido: Efecto de unlock (si audio habilitado)

### Hardware Tab Unlock
- [ ] Cuando el jugador gana $150 por primera vez:
  - Se desbloquea el tab "Hardware" en el bottom sheet
  - Toast: "🔓 Hardware Shop Unlocked!"
  - El tab aparece junto a "Market", "Upgrades", etc.

## Validaciones

### Pre-Purchase Validations
- [ ] Verificar que el hardware esté desbloqueado
- [ ] Verificar que el jugador tenga suficientes fondos (CryptoCoins o Real Money)
- [ ] Verificar que el costo calculado sea correcto
- [ ] Verificar que el gameState no sea null/undefined

### Post-Purchase Validations
- [ ] Verificar que `owned` se incrementó correctamente
- [ ] Verificar que el balance se dedujo correctamente
- [ ] Verificar que la producción se recalculó
- [ ] Verificar que el siguiente hardware se desbloqueó si corresponde
- [ ] Verificar que el nuevo costo es correcto

### State Integrity
- [ ] `owned` debe ser >= 0 (entero)
- [ ] `baseCost` debe ser > 0
- [ ] `miningSpeed` debe ser >= 0
- [ ] `blockReward` debe ser > 0
- [ ] `electricityCost` debe ser >= 0

## Dependencias

### Requiere
- `GameContext` - State management
- `balanceConfig.ts` - Configuración de hardware
- `Block Mining System` - Para minar bloques
- `Market System` - Para vender coins y obtener dinero para electricidad

### Bloquea
- `Upgrade System` - Se desbloquea después de comprar primer hardware
- `Prestige System` - Requiere hardware avanzado para completar el juego

### Relacionado con
- `Progressive Unlock System` - Hardware tab unlock
- `Translation System` - Para nombres y descripciones

## Criterios de Aceptación

- [x] El jugador puede comprar hardware con CryptoCoins
- [x] El costo aumenta exponencialmente con cada compra
- [x] El hardware se desbloquea secuencialmente (5 unidades del anterior)
- [x] La producción se calcula correctamente (miningSpeed × blockReward)
- [x] La electricidad reduce la producción neta
- [x] Los upgrades multiplican la producción correctamente
- [x] El hardware owned persiste entre sesiones
- [x] Las notificaciones de unlock se muestran
- [x] El tab Hardware se desbloquea con $150
- [x] Toda la UI muestra valores traducidos

## Notas de Implementación

### Archivos Principales
- `src/data/hardwareData.ts` - Definición de todos los hardware
- `src/components/HardwareList.tsx` - UI de lista de hardware
- `src/utils/gameLogic.ts` - Cálculos de producción y costos
- `src/config/balanceConfig.ts` - Balance values
- `src/contexts/GameContext.tsx` - Reducer action BUY_HARDWARE

### Reducer Action: BUY_HARDWARE
```typescript
case 'BUY_HARDWARE':
  const hardwareIndex = state.hardware.findIndex(h => h.id === action.payload);
  if (hardwareIndex === -1) return state;

  const hardware = state.hardware[hardwareIndex];
  const cost = calculateHardwareCost(hardware);

  if (state.cryptoCoins < cost) return state;

  const newHardware = [...state.hardware];
  newHardware[hardwareIndex] = { ...hardware, owned: hardware.owned + 1 };

  const newState = {
    ...state,
    cryptoCoins: state.cryptoCoins - cost,
    hardware: newHardware,
  };

  return recalculateGameStats(newState);
```

### Data Structure (hardwareData.ts)
```typescript
export const hardwareProgression: Hardware[] = [
  {
    id: 'manual_mining',
    nameKey: 'hardware.manualMining',
    descriptionKey: 'hardware.manualMiningDesc',
    baseCost: HARDWARE_CONFIG.levels.manual_mining.baseCost,
    baseProduction: HARDWARE_CONFIG.levels.manual_mining.baseProduction,
    blockReward: HARDWARE_CONFIG.levels.manual_mining.blockReward,
    miningSpeed: HARDWARE_CONFIG.levels.manual_mining.miningSpeed,
    electricityCost: HARDWARE_CONFIG.levels.manual_mining.electricityCost,
    owned: 1, // Siempre 1
    costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
    icon: 'hand-pointer',
    currencyId: 'cryptocoin',
    level: 1,
  },
  // ... resto de hardware similar
];
```

## Testing

### Unit Tests
```typescript
describe('Hardware Progression System', () => {
  describe('calculateHardwareCost', () => {
    it('should calculate cost correctly with exponential scaling', () => {
      const hardware = { baseCost: 500, owned: 0, costMultiplier: 1.15 };
      expect(calculateHardwareCost(hardware)).toBe(500);

      hardware.owned = 1;
      expect(calculateHardwareCost(hardware)).toBe(575);

      hardware.owned = 10;
      expect(calculateHardwareCost(hardware)).toBe(2023);
    });

    it('should handle large owned counts', () => {
      const hardware = { baseCost: 500, owned: 100, costMultiplier: 1.15 };
      const cost = calculateHardwareCost(hardware);
      expect(cost).toBeGreaterThan(1000000);
      expect(isFinite(cost)).toBe(true);
    });
  });

  describe('isHardwareUnlocked', () => {
    it('should unlock basic_cpu by default', () => {
      const gameState = { hardware: [{ id: 'basic_cpu', level: 2 }] };
      expect(isHardwareUnlocked(gameState, { id: 'basic_cpu', level: 2 })).toBe(true);
    });

    it('should unlock next level after owning 8 units', () => {
      const gameState = {
        hardware: [
          { id: 'basic_cpu', level: 2, owned: 8 },
          { id: 'advanced_cpu', level: 3, owned: 0 }
        ]
      };
      expect(isHardwareUnlocked(gameState, { id: 'advanced_cpu', level: 3 })).toBe(true);
    });

    it('should not unlock if previous level has < 8 units', () => {
      const gameState = {
        hardware: [
          { id: 'basic_cpu', level: 2, owned: 7 },
          { id: 'advanced_cpu', level: 3, owned: 0 }
        ]
      };
      expect(isHardwareUnlocked(gameState, { id: 'advanced_cpu', level: 3 })).toBe(false);
    });
  });

  describe('calculateNetProduction', () => {
    it('should calculate production minus electricity', () => {
      const gameState = {
        hardware: [
          { id: 'cpu', miningSpeed: 0.3, blockReward: 45, owned: 10, electricityCost: 0.5 }
        ],
        upgrades: [],
        prestigeMultiplier: 1,
      };

      const production = 0.3 * 45 * 10; // 135 CC/s
      const electricity = 0.5 * 10; // 5 $/s
      const net = production - electricity; // 130 CC/s

      expect(calculateNetProduction(gameState)).toBe(130);
    });

    it('should not go negative if electricity > production', () => {
      const gameState = {
        hardware: [
          { id: 'cpu', miningSpeed: 0.1, blockReward: 10, owned: 1, electricityCost: 100 }
        ],
        upgrades: [],
        prestigeMultiplier: 1,
      };

      expect(calculateNetProduction(gameState)).toBe(0); // No negativo
    });

    it('should apply prestige multiplier', () => {
      const gameState = {
        hardware: [
          { id: 'cpu', miningSpeed: 1, blockReward: 50, owned: 1, electricityCost: 0 }
        ],
        upgrades: [],
        prestigeMultiplier: 2,
      };

      expect(calculateNetProduction(gameState)).toBe(100); // 50 * 2
    });
  });
});
```

### Integration Tests
```typescript
describe('Hardware Purchase Integration', () => {
  it('should buy hardware and update state correctly', () => {
    const initialState = {
      cryptoCoins: 1000,
      hardware: [{ id: 'cpu', baseCost: 500, owned: 0, costMultiplier: 1.15 }],
    };

    const newState = gameReducer(initialState, { type: 'BUY_HARDWARE', payload: 'cpu' });

    expect(newState.cryptoCoins).toBe(500); // 1000 - 500
    expect(newState.hardware[0].owned).toBe(1);
  });

  it('should unlock next hardware after 8 purchases', () => {
    let state = {
      cryptoCoins: 100000,
      hardware: [
        { id: 'cpu', level: 2, baseCost: 500, owned: 7, costMultiplier: 1.40 },
        { id: 'gpu', level: 3, baseCost: 2500, owned: 0, costMultiplier: 1.40 },
      ],
    };

    // Buy 8th CPU
    state = gameReducer(state, { type: 'BUY_HARDWARE', payload: 'cpu' });

    expect(state.hardware[0].owned).toBe(8);
    expect(isHardwareUnlocked(state, state.hardware[1])).toBe(true);
  });
});
```

### E2E Tests
```typescript
describe('Hardware Progression E2E', () => {
  it('should complete full hardware progression', async () => {
    await launch();

    // Buy first CPU
    await element(by.id('buy-basic-cpu')).tap();
    await expect(element(by.id('cpu-owned'))).toHaveText('1');

    // Buy 7 more to unlock next (8 total)
    for (let i = 0; i < 7; i++) {
      await element(by.id('buy-basic-cpu')).tap();
    }

    // Verify next hardware unlocked
    await expect(element(by.id('advanced-cpu-locked'))).not.toBeVisible();
    await expect(element(by.id('buy-advanced-cpu'))).toBeVisible();
  });
});
```

### Edge Cases

**Edge Case 1: Cost overflow con owned muy alto**
- Input: owned = 1000, baseCost = 1000000
- Expected: Cost puede ser Infinity, UI muestra "∞" o "Too Expensive"

**Edge Case 2: Comprar cuando justo se desbloquea**
- Input: CPU owned = 4, comprar 5to justo cuando se desbloquea GPU
- Expected: GPU aparece inmediatamente en la lista

**Edge Case 3: Electricidad > producción**
- Input: Solo ASIC Gen 3 owned, electricityCost muy alto
- Expected: netProduction = 0, no negativo

**Edge Case 4: Upgrade que afecta múltiples hardware**
- Input: Upgrade "cpu" comprado, basic_cpu y advanced_cpu owned
- Expected: Ambos reciben el boost

**Edge Case 5: Prestige con hardware owned**
- Input: Hacer prestige con 100 ASIC Gen 3 owned
- Expected: ¿Se resetea a 0 o se mantiene? (Definir en Prestige spec)

## Performance Considerations

### Non-Functional Requirements
- **Cálculo de costo**: < 1ms por hardware
- **Recalculo de producción total**: < 10ms para todos los hardware
- **Render de HardwareList**: < 100ms para 8 hardware items
- **Compra de hardware**: < 50ms desde tap hasta UI update

### Optimizaciones
- Memoizar `isHardwareUnlocked` results
- Evitar recalcular producción en cada render (usar useMemo)
- Batch updates de owned (comprar múltiples a la vez)

## Analytics

```typescript
analytics().logEvent('hardware_purchased', {
  hardware_id: hardwareId,
  hardware_level: hardware.level,
  owned_after_purchase: hardware.owned,
  cost: cost,
  coins_remaining: gameState.cryptoCoins,
});

analytics().logEvent('hardware_unlocked', {
  hardware_id: hardwareId,
  hardware_level: hardware.level,
  time_to_unlock: timeSinceStart,
  prestige_level: gameState.prestigeLevel,
});

analytics().logEvent('hardware_milestone', {
  milestone: '10_owned',
  hardware_id: hardwareId,
  total_production: gameState.cryptoCoinsPerSecond,
});
```

## Preguntas Abiertas

- [ ] **Prestige reset**: ¿El hardware owned se resetea o se mantiene?
  - **Recomendación**: Resetear para que cada prestige sea fresh start

- [ ] **Buy Max button**: ¿Implementar botón para comprar múltiples?
  - **Recomendación**: Sí, en Phase 4 (QoL improvement)

- [ ] **Hardware con dinero real**: ¿Algunos hardware deberían comprarse solo con $?
  - **Recomendación**: No, mantener todo con CryptoCoins. El $ es para upgrades

- [ ] **Límite de hardware**: ¿Debería haber un límite de unidades? (ej: max 1000)
  - **Recomendación**: No límite, pero advertir si cost > 10^15 (Infinity risk)

- [ ] **Sell hardware**: ¿Permitir vender hardware por un refund parcial?
  - **Recomendación**: No, va contra la filosofía idle/incremental

## Referencias

- Exponential scaling calculator: https://www.desmos.com/calculator
- Cookie Clicker building progression: https://cookieclicker.fandom.com/wiki/Building
- Idle game balance guide: https://gamedevelopment.tutsplus.com/articles/numbers-getting-bigger-the-design-and-math-of-incremental-games--cms-24023
