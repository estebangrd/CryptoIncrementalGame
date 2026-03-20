# Prestige System

## Estado
- **Fase**: Phase 1 - Genesis (Implemented)
- **Estado**: Implemented & Active
- **Prioridad**: High (Endgame & Retention Mechanic)
- **Última actualización**: 2026-02-21

## Descripción

El sistema de Prestige es la mecánica de endgame que permite a los jugadores reiniciar su progreso a cambio de bonificaciones permanentes. Cuando un jugador completa el juego (mina los 21 millones de bloques), puede hacer "Prestige" para resetear todo el progreso excepto su nivel de prestigio y multiplicadores acumulados.

Este sistema crea un loop infinito de rejugabilidad: completar el juego → hacer prestige → obtener bonos permanentes → completar más rápido → repetir. Además incluye un sistema de badges/trophies ocultos que se desbloquean con niveles de prestige específicos, incentivando múltiples runs.

## Objetivos
- [ ] Crear una razón convincente para reiniciar el progreso
- [ ] Recompensar a jugadores dedicados con bonos permanentes
- [ ] Implementar un sistema de achievements/badges tied to prestige
- [ ] Balancear los bonos para que cada prestige sea más rápido pero no trivial
- [ ] Proveer estadísticas detalladas de runs anteriores
- [ ] Diseñar una UX clara que explique qué se pierde y qué se gana

## Comportamiento Esperado

### Caso de Uso 1: Desbloqueo de Prestige
**Dado que** el jugador ha minado exactamente 21,000,000 bloques (completado Genesis)
**Cuando** intenta minar el siguiente bloque
**Entonces**
- El sistema detecta que se alcanzó `TOTAL_BLOCKS`
- Se muestra una notificación de celebración: "Genesis Complete! 21M blocks mined!"
- El botón/tab de "Prestige" se desbloquea y se muestra con indicador visual (badge)
- La opción de Prestige aparece en el menú principal o en un tab dedicado
- Se puede seguir jugando (vendiendo coins, comprando hardware) pero no minar más bloques
- El jugador puede hacer prestige en cualquier momento después de completar

### Caso de Uso 2: Ver Pantalla de Prestige (Pre-Reset)
**Dado que** el jugador abrió la pantalla de Prestige
**Cuando** revisa la información antes de confirmar
**Entonces**
- Se muestra el nivel de prestige actual: "Prestige Level: X"
- Se muestra el próximo nivel: "Next Prestige Level: X+1"
- Se muestran los bonos actuales:
  - Production Boost: +X% (basado en nivel actual)
  - Click Power Boost: +X% (basado en nivel actual)
- Se muestran los bonos que recibirá después del prestige:
  - Production Boost: +Y% (nivel X+1)
  - Click Power Boost: +Y% (nivel X+1)
- Se muestra una sección "What You'll Keep":
  - Prestige Level
  - Prestige Multipliers
  - Achievements/Badges unlocked
- Se muestra una sección "What You'll Lose" (en rojo):
  - All CryptoCoins
  - All Real Money ($)
  - All Hardware owned (resetea a 0)
  - All Blocks mined (resetea a 0)
  - All Upgrades purchased (resetea a not purchased)
  - Current phase (vuelve a Genesis)
- Se muestra un botón grande "PRESTIGE NOW" (rojo/dorado)

### Caso de Uso 3: Confirmar Prestige
**Dado que** el jugador presionó el botón "PRESTIGE NOW"
**Cuando** confirma la acción en el diálogo de seguridad
**Entonces**
- Se muestra un modal de confirmación con título: "Are you sure?"
- El modal muestra:
  - "You will lose ALL progress except your Prestige Level and bonuses"
  - "This cannot be undone"
  - Input de texto: "Type 'PRESTIGE' to confirm" (para evitar clicks accidentales)
- Botones: "Cancel" (gris) | "CONFIRM PRESTIGE" (rojo, solo activo si typed correctly)
- Al confirmar:
  - Se guarda el run stats actual en `prestigeHistory`
  - Se incrementa `prestigeLevel` en 1
  - Se recalculan `productionMultiplier` y `clickMultiplier` basados en nuevo nivel
  - Se resetean: `cryptoCoins = 0`, `realMoney = 0`, `blocksMined = 0`
  - Se resetean todos los hardware a `owned: 0` (excepto manual_mining que vuelve a 1)
  - Se resetean todos los upgrades a `purchased: false`
  - Se resetea la fase a `'genesis'`
  - Se guarda el nuevo gameState
  - Se muestra animación de transición/celebración
  - Se redirige al jugador a la pantalla principal (fresh start)

### Caso de Uso 4: Jugar Después de Prestige
**Dado que** el jugador acaba de hacer prestige
**Cuando** empieza a jugar de nuevo
**Entonces**
- El estado del juego es como nuevo (0 coins, 0 blocks, 0 hardware)
- PERO los multiplicadores de prestige se aplican:
  - La producción de cualquier hardware se multiplica por `productionMultiplier`
  - El click manual otorga más coins según `clickMultiplier`
- El jugador progresa más rápido que en el primer run
- Los milestones (unlocks, halvings) ocurren igual pero se alcanzan más rápido
- Los achievements de prestige se desbloquean en momentos específicos

### Caso de Uso 5: Ver Estadísticas de Prestige
**Dado que** el jugador abre la pantalla de Stats/Prestige
**Cuando** revisa su historial
**Entonces**
- Se muestra una lista de todos los prestige runs:
  - Run #1: 21M blocks, $X earned, Y hours played
  - Run #2: 21M blocks, $X earned, Y hours played (X% faster)
  - Current Run: Z blocks, $X earned, Y hours played (in progress)
- Se muestran stats totales:
  - Total Prestige Levels: X
  - Total Blocks Mined (all runs): X
  - Total Money Earned (all runs): $X
  - Total Playtime: X hours
  - Fastest Run: X hours
- Se muestra una sección de Badges/Achievements:
  - Badge grid con locked/unlocked badges
  - Cada badge muestra requisito y reward (si unlocked)

### Caso de Uso 6: Desbloquear Badges de Prestige
**Dado que** el jugador alcanza ciertos hitos de prestige
**Cuando** cumple la condición de un badge
**Entonces**
- Se desbloquea el badge automáticamente
- Se muestra notificación: "Badge Unlocked: [nombre]"
- El badge aparece en la colección del jugador
- Algunos badges otorgan bonos adicionales (pequeños)
- Ejemplos de badges:
  - "First Prestige": Completar primer prestige
  - "Speed Runner": Completar prestige en menos de 2 horas
  - "Prestige Master": Alcanzar nivel 10 de prestige
  - "The Collector": Desbloquear todos los badges
  - "Dedication": Alcanzar nivel 50 de prestige
  - "Infinite Loop": Alcanzar nivel 100 de prestige

## Fórmulas y Cálculos

### Multiplicador de Producción (Production Boost)
```typescript
function calculateProductionMultiplier(prestigeLevel: number): number {
  // Fórmula: 1 + (level × PRODUCTION_BONUS)
  // Ejemplo: Level 1 = 1.1x (10% boost), Level 5 = 1.5x, Level 10 = 2.0x
  return 1 + (prestigeLevel * PRESTIGE_CONFIG.bonuses.productionBonus);
}

// Con PRODUCTION_BONUS = 0.1 (10%):
// Level 0: 1.0x (sin prestige)
// Level 1: 1.1x (+10%)
// Level 5: 1.5x (+50%)
// Level 10: 2.0x (+100%)
// Level 20: 3.0x (+200%)
// Level 50: 6.0x (+500%)
```

### Multiplicador de Click (Click Power Boost)
```typescript
function calculateClickMultiplier(prestigeLevel: number): number {
  // Fórmula: 1 + (level × CLICK_BONUS)
  // Ejemplo: Level 1 = 1.05x (5% boost), Level 10 = 1.5x
  return 1 + (prestigeLevel * PRESTIGE_CONFIG.bonuses.clickBonus);
}

// Con CLICK_BONUS = 0.05 (5%):
// Level 0: 1.0x
// Level 1: 1.05x (+5%)
// Level 10: 1.5x (+50%)
// Level 20: 2.0x (+100%)
```

### Aplicación de Multiplicadores en Producción
```typescript
function calculateTotalProduction(gameState: GameState): number {
  let totalProduction = 0;

  for (const hardware of gameState.hardware) {
    const miningSpeed = calculateHardwareMiningSpeed(hardware, gameState.upgrades);
    const coinsPerSecond = miningSpeed * hardware.blockReward;
    totalProduction += coinsPerSecond;
  }

  // Aplicar prestige multiplier DESPUÉS de calcular producción base
  const prestigeMultiplier = calculateProductionMultiplier(gameState.prestigeLevel);
  const finalProduction = totalProduction * prestigeMultiplier;

  return finalProduction;
}
```

### Cálculo de Clicks con Prestige
```typescript
function calculateClickReward(gameState: GameState): number {
  const baseClickReward = BALANCE_CONFIG.MANUAL_CLICK_REWARD; // 1 CC

  // Aplicar click multiplier de prestige
  const clickMultiplier = calculateClickMultiplier(gameState.prestigeLevel);

  // Aplicar upgrades de click power (si compradas)
  let upgradeMultiplier = 1;
  for (const upgrade of gameState.upgrades) {
    if (upgrade.purchased && upgrade.effect.type === 'click') {
      upgradeMultiplier *= upgrade.effect.value;
    }
  }

  return baseClickReward * clickMultiplier * upgradeMultiplier;
}
```

### Verificación de Disponibilidad de Prestige
```typescript
function canPrestige(gameState: GameState): boolean {
  // Requiere haber completado el juego (21M bloques)
  return gameState.blocksMined >= gameState.totalBlocks;
}

function isPrestigeUnlocked(gameState: GameState): boolean {
  // Mismo que canPrestige, pero usado para UI unlock
  return canPrestige(gameState);
}
```

### Tiempo Estimado de Siguiente Run
```typescript
function estimateNextRunDuration(gameState: GameState, prestigeHistory: PrestigeRun[]): number {
  if (prestigeHistory.length === 0) {
    return null; // No hay datos previos
  }

  const lastRun = prestigeHistory[prestigeHistory.length - 1];
  const lastRunDuration = lastRun.duration; // En segundos

  const currentMultiplier = calculateProductionMultiplier(gameState.prestigeLevel);
  const nextMultiplier = calculateProductionMultiplier(gameState.prestigeLevel + 1);

  // Estimación: duración anterior × (current / next)
  const estimatedDuration = lastRunDuration * (currentMultiplier / nextMultiplier);

  return estimatedDuration;
}
```

## Constantes de Configuración

En `src/config/balanceConfig.ts`:

```typescript
export const PRESTIGE_CONFIG = {
  // Bonificaciones por nivel de prestigio
  bonuses: {
    productionBonus: 0.1,      // +10% producción por nivel
    clickBonus: 0.05,          // +5% por click por nivel
  },

  // Requisitos para hacer prestigio
  requirements: {
    minBlocks: 21000000,       // Debe completar el juego (21M bloques)
  },

  // Texto de confirmación requerido
  confirmationText: 'PRESTIGE',

  // Recompensas de badges (bonos adicionales pequeños)
  badgeRewards: {
    firstPrestige: { type: 'none' },
    speedRunner: { type: 'production', value: 1.05 }, // +5% producción permanente
    prestigeMaster: { type: 'click', value: 1.1 },    // +10% click permanente
    dedication: { type: 'production', value: 1.2 },   // +20% producción permanente
  },
};
```

## Estructura de Datos

### GameState (Campos Relevantes)
```typescript
interface GameState {
  // Prestige state
  prestigeLevel: number;              // Nivel de prestige actual (0 = sin prestige)
  prestigeProductionMultiplier: number; // Multiplicador de producción
  prestigeClickMultiplier: number;    // Multiplicador de click
  prestigeHistory: PrestigeRun[];     // Historial de runs
  unlockedBadges: string[];           // IDs de badges desbloqueados

  // Stats para tracking
  currentRunStartTime: number;        // Timestamp de inicio del run actual
  currentRunStats: RunStats;          // Stats del run en progreso

  // Resto del state que se resetea
  blocksMined: number;
  cryptoCoins: number;
  realMoney: number;
  totalRealMoneyEarned: number;
  hardware: Hardware[];
  upgrades: Upgrade[];
  phase: GamePhase;
}
```

### PrestigeRun (Historial de Runs)
```typescript
interface PrestigeRun {
  runNumber: number;               // #1, #2, #3...
  prestigeLevel: number;           // Nivel de prestige en ese run
  blocksMined: number;             // 21,000,000
  totalCoinsEarned: number;        // Total CryptoCoins ganados
  totalMoneyEarned: number;        // Total Real Money ganado
  duration: number;                // Duración en segundos
  startTime: number;               // Timestamp de inicio
  endTime: number;                 // Timestamp de fin
  hardwarePurchased: number;       // Total de hardware comprado
  upgradesPurchased: number;       // Total de upgrades compradas
}
```

### RunStats (Stats del Run Actual)
```typescript
interface RunStats {
  blocksMinedThisRun: number;
  coinsEarnedThisRun: number;
  moneyEarnedThisRun: number;
  hardwarePurchasedThisRun: number;
  upgradesPurchasedThisRun: number;
  playtimeThisRun: number;         // En segundos
}
```

### Badge (Achievements de Prestige)
```typescript
interface Badge {
  id: string;                      // Identificador único
  nameKey: string;                 // Clave de traducción del nombre
  descriptionKey: string;          // Clave de traducción de descripción
  icon: string;                    // Nombre del icono
  unlockCondition: {
    type: 'prestige_level' | 'speed' | 'total_blocks' | 'total_money' | 'special';
    value: number;                 // Valor requerido
  };
  reward?: {                       // Recompensa opcional
    type: 'production' | 'click' | 'none';
    value: number;                 // Multiplicador
  };
  hidden: boolean;                 // Si es un badge secreto
  unlocked: boolean;               // Estado de desbloqueo
}
```

## Lista de Badges/Achievements

### Tier 1: Primeros Pasos
```typescript
{
  id: 'first_prestige',
  nameKey: 'badge.firstPrestige',
  descriptionKey: 'badge.firstPrestigeDesc',
  icon: 'star',
  unlockCondition: { type: 'prestige_level', value: 1 },
  reward: { type: 'none' },
  hidden: false,
}
// Unlocks: Alcanzar prestige level 1
// Reward: None (logro simbólico)
```

### Tier 2: Dedicación
```typescript
{
  id: 'prestige_master',
  nameKey: 'badge.prestigeMaster',
  descriptionKey: 'badge.prestigeMasterDesc',
  icon: 'trophy',
  unlockCondition: { type: 'prestige_level', value: 10 },
  reward: { type: 'click', value: 1.1 }, // +10% click permanente
  hidden: false,
}
// Unlocks: Alcanzar prestige level 10
```

### Tier 3: Velocidad
```typescript
{
  id: 'speed_runner',
  nameKey: 'badge.speedRunner',
  descriptionKey: 'badge.speedRunnerDesc',
  icon: 'flash',
  unlockCondition: { type: 'speed', value: 7200 }, // 2 horas = 7200 seg
  reward: { type: 'production', value: 1.05 }, // +5% producción permanente
  hidden: false,
}
// Unlocks: Completar un prestige run en menos de 2 horas
```

### Tier 4: Maestría
```typescript
{
  id: 'dedication',
  nameKey: 'badge.dedication',
  descriptionKey: 'badge.dedicationDesc',
  icon: 'medal',
  unlockCondition: { type: 'prestige_level', value: 50 },
  reward: { type: 'production', value: 1.2 }, // +20% producción permanente
  hidden: false,
}
// Unlocks: Alcanzar prestige level 50
```

### Tier 5: Infinity
```typescript
{
  id: 'infinite_loop',
  nameKey: 'badge.infiniteLoop',
  descriptionKey: 'badge.infiniteLoopDesc',
  icon: 'infinite',
  unlockCondition: { type: 'prestige_level', value: 100 },
  reward: { type: 'production', value: 1.5 }, // +50% producción permanente
  hidden: true, // Badge secreto
}
// Unlocks: Alcanzar prestige level 100
```

### Tier 6: Especiales
```typescript
{
  id: 'the_collector',
  nameKey: 'badge.theCollector',
  descriptionKey: 'badge.theCollectorDesc',
  icon: 'briefcase',
  unlockCondition: { type: 'special', value: 'all_badges' },
  reward: { type: 'production', value: 2.0 }, // DOBLE producción permanente
  hidden: true,
}
// Unlocks: Desbloquear todos los demás badges
```

```typescript
{
  id: 'billionaire',
  nameKey: 'badge.billionaire',
  descriptionKey: 'badge.billionaireDesc',
  icon: 'cash',
  unlockCondition: { type: 'total_money', value: 1000000000 }, // $1 billion total
  reward: { type: 'click', value: 1.5 }, // +50% click permanente
  hidden: true,
}
// Unlocks: Ganar $1,000,000,000 acumulado en todos los runs
```

## Reglas de Negocio

1. **Prestige solo se puede hacer después de 21M bloques**: No antes, no hay "early prestige"
2. **El prestigio es IRREVERSIBLE**: No se puede deshacer, confirmación obligatoria
3. **Los badges son permanentes**: Una vez desbloqueados, nunca se pierden
4. **Los multiplicadores de prestige son acumulativos**: Cada nivel suma al anterior
5. **El manual_mining vuelve a owned: 1**: Para que el jugador pueda empezar de nuevo
6. **Los badges con rewards stack multiplicativamente**: Badge1 × Badge2 × Badge3
7. **El historial de runs se guarda indefinidamente**: Para stats y analytics
8. **No hay límite de prestige levels**: Puede hacer prestige infinitas veces
9. **Los hidden badges no se muestran hasta desbloquearse**: Ni su nombre ni condición
10. **El prestige level persiste entre reinstalls**: Se guarda en AsyncStorage y backend

## Progresión de Prestige (Balance)

### Tiempo Estimado por Prestige Level
| Prestige Level | Production Multiplier | Estimated Run Time | Notes |
|----------------|----------------------|-------------------|-------|
| 0 (First Run) | 1.0x | 10-15 hours | Baseline, learning curve |
| 1 | 1.1x | 9-13.5 hours | 10% faster |
| 5 | 1.5x | 6.7-10 hours | 50% faster |
| 10 | 2.0x | 5-7.5 hours | 100% faster (half time) |
| 20 | 3.0x | 3.3-5 hours | 200% faster |
| 50 | 6.0x | 1.7-2.5 hours | 500% faster |
| 100 | 11.0x | 0.9-1.4 hours | 1000% faster |

**Nota**: Estos tiempos asumen juego activo. Offline progress reduce tiempos significativamente.

### Breakpoints Importantes
- **Level 1**: Primer prestige, desbloquea el concepto
- **Level 5**: Production boost significativo (1.5x)
- **Level 10**: Prestige Master badge (+10% click permanente)
- **Level 20**: Triple producción baseline
- **Level 50**: Dedication badge (+20% producción permanente)
- **Level 100**: Infinite Loop badge (+50% producción permanente)

## UI/UX Requirements

### Prestige Button/Tab
- [ ] Se desbloquea al minar 21M bloques
- [ ] Muestra badge/indicator visual cuando está disponible
- [ ] Ubicación: Bottom navigation tab o botón destacado en main screen
- [ ] Color: Dorado/naranja para indicar importancia
- [ ] Animación: Pulsante o glow cuando está disponible

### Prestige Screen (Pre-Confirmation)
- [ ] Header: "Prestige System" con icono de estrella/infinito
- [ ] Current Prestige Level: Prominente, grande
- [ ] Current Bonuses section:
  - Production Boost: +X%
  - Click Power Boost: +X%
- [ ] Next Level Bonuses section:
  - Production Boost: +Y% (highlighted)
  - Click Power Boost: +Y% (highlighted)
- [ ] "What You'll Keep" section (verde):
  - Prestige Level
  - Prestige Multipliers
  - Achievements & Badges
- [ ] "What You'll Lose" section (rojo):
  - All CryptoCoins
  - All Real Money ($)
  - All Hardware owned
  - All Blocks mined
  - All Upgrades purchased
  - Current phase progress
- [ ] Botón grande: "PRESTIGE NOW" (rojo/dorado)
- [ ] Link/button: "View Stats & Badges"

### Confirmation Modal
- [ ] Title: "Are you absolutely sure?"
- [ ] Warning message en rojo:
  - "You will lose ALL progress except Prestige bonuses"
  - "This action CANNOT be undone"
- [ ] Input field: "Type 'PRESTIGE' to confirm"
- [ ] Validation: Button solo activo si texto es correcto
- [ ] Buttons:
  - "Cancel" (gris, outlined)
  - "CONFIRM PRESTIGE" (rojo, filled, solo activo si validated)
- [ ] Al confirmar:
  - Animación de transición (fade out/in, confetti)
  - Mensaje: "Prestige Complete! You are now Level X"
  - Redirect a main screen (fresh start)

### Stats & History Screen
- [ ] Tabs:
  - "Current Run"
  - "History"
  - "Badges"
- [ ] Current Run tab:
  - Blocks mined this run
  - Coins earned this run
  - Money earned this run
  - Playtime this run
  - Hardware purchased this run
- [ ] History tab:
  - Lista de todos los runs previos
  - Cada run muestra:
    - Run #X (Prestige Level Y)
    - Blocks: 21M
    - Money: $X
    - Duration: X hours Y minutes
  - Stats totales al final:
    - Total Prestige Runs: X
    - Total Blocks (all time): X
    - Total Money (all time): $X
    - Total Playtime: X hours
    - Fastest Run: X hours Y minutes
- [ ] Badges tab:
  - Grid de badges (3 columns)
  - Cada badge:
    - Icono (color si unlocked, gris si locked)
    - Nombre (si unlocked, "???" si hidden & locked)
    - Descripción (si unlocked, oculta si locked)
    - Progress bar si aplicable (ej: "Level 7/10")
  - Al tocar un badge unlocked:
    - Modal con detalles completos
    - Reward si tiene
    - Fecha de desbloqueo

### Post-Prestige Celebration
- [ ] Animación fullscreen de celebración (confetti, fireworks)
- [ ] Mensaje: "Prestige Complete!"
- [ ] "You are now Prestige Level X"
- [ ] "New Production Boost: +X%"
- [ ] "New Click Boost: +X%"
- [ ] Botón: "Start New Run"
- [ ] Duración: 3-5 segundos

### Badge Unlock Notification
- [ ] Toast notification al desbloquear badge
- [ ] Mensaje: "Badge Unlocked: [nombre]"
- [ ] Icono del badge
- [ ] Si tiene reward: "Reward: +X% [tipo]"
- [ ] Duración: 5 segundos
- [ ] Color: Dorado

## Validaciones

### Pre-Prestige Validations
- [ ] Verificar que `blocksMined >= TOTAL_BLOCKS` (21M)
- [ ] Verificar que el jugador escribió "PRESTIGE" correctamente (case-sensitive)
- [ ] Verificar que gameState no sea null
- [ ] Verificar que no hay prestige en progreso (evitar doble prestige)

### Post-Prestige Validations
- [ ] Verificar que `prestigeLevel` se incrementó en 1
- [ ] Verificar que todos los valores reseteable están en 0:
  - `cryptoCoins = 0`
  - `realMoney = 0`
  - `blocksMined = 0`
  - `totalRealMoneyEarned = 0`
- [ ] Verificar que todo hardware tiene `owned = 0` excepto manual_mining
- [ ] Verificar que manual_mining tiene `owned = 1`
- [ ] Verificar que todos los upgrades tienen `purchased = false`
- [ ] Verificar que `phase = 'genesis'`
- [ ] Verificar que los multiplicadores se recalcularon correctamente
- [ ] Verificar que el run stats se guardó en `prestigeHistory`
- [ ] Verificar que `currentRunStartTime` se actualizó

### Badge Unlock Validations
- [ ] Verificar condición de desbloqueo antes de marcar como unlocked
- [ ] Verificar que el badge no estaba ya unlocked (no duplicados)
- [ ] Verificar que el badge existe en la lista de badges
- [ ] Aplicar reward del badge correctamente

### State Integrity
- [ ] `prestigeLevel` debe ser >= 0 (entero)
- [ ] `prestigeProductionMultiplier` debe ser >= 1.0
- [ ] `prestigeClickMultiplier` debe ser >= 1.0
- [ ] `prestigeHistory` debe ser un array (puede estar vacío)
- [ ] `unlockedBadges` debe ser un array de strings

## Dependencias

### Requiere
- `GameContext` - State management y dispatch
- `balanceConfig.ts` - Configuración de prestige bonos
- `Block Mining System` - Para verificar 21M bloques
- `AsyncStorage` - Para persistir prestige state

### Bloquea
- Ningún sistema (es endgame)

### Relacionado con
- `Achievement System` - Badges son parte del sistema de achievements
- `Stats Tracking` - Requiere tracking de run stats
- `Save/Load System` - Debe guardar prestige state
- `Analytics` - Track prestige events

## Criterios de Aceptación

- [ ] El prestige se desbloquea al alcanzar 21M bloques
- [ ] El jugador puede ver bonos actuales y futuros antes de prestigiar
- [ ] La confirmación requiere escribir "PRESTIGE" para evitar accidents
- [ ] Todo el progreso se resetea excepto prestige level y badges
- [ ] Los multiplicadores de prestige se aplican correctamente a producción y clicks
- [ ] El historial de runs se guarda y muestra correctamente
- [ ] Los badges se desbloquean automáticamente al cumplir condiciones
- [ ] Los rewards de badges se aplican permanentemente
- [ ] La UI muestra claramente qué se pierde y qué se gana
- [ ] El prestige state persiste entre sesiones
- [ ] Las animaciones de celebración se muestran correctamente

## Notas de Implementación

### Archivos Principales
- `src/contexts/GameContext.tsx` - Action DO_PRESTIGE, badge checking
- `src/screens/PrestigeScreen.tsx` - UI del prestige system
- `src/screens/StatsScreen.tsx` - Historial y badges
- `src/data/badges.ts` - Definición de todos los badges
- `src/utils/prestigeLogic.ts` - Cálculos de multiplicadores
- `src/config/balanceConfig.ts` - Configuración de bonos

### Reducer Action: DO_PRESTIGE
```typescript
case 'DO_PRESTIGE':
  if (!canPrestige(state)) {
    console.warn('Cannot prestige: requirements not met');
    return state;
  }

  // Guardar stats del run actual
  const currentRun: PrestigeRun = {
    runNumber: state.prestigeHistory.length + 1,
    prestigeLevel: state.prestigeLevel,
    blocksMined: state.blocksMined,
    totalCoinsEarned: state.totalCryptoCoins,
    totalMoneyEarned: state.totalRealMoneyEarned,
    duration: (Date.now() - state.currentRunStartTime) / 1000,
    startTime: state.currentRunStartTime,
    endTime: Date.now(),
    hardwarePurchased: state.hardware.reduce((sum, hw) => sum + hw.owned, 0),
    upgradesPurchased: state.upgrades.filter(u => u.purchased).length,
  };

  // Incrementar prestige level
  const newPrestigeLevel = state.prestigeLevel + 1;

  // Recalcular multiplicadores
  const newProductionMultiplier = calculateProductionMultiplier(newPrestigeLevel);
  const newClickMultiplier = calculateClickMultiplier(newPrestigeLevel);

  // Resetear hardware
  const resetHardware = state.hardware.map(hw => ({
    ...hw,
    owned: hw.id === 'manual_mining' ? 1 : 0,
  }));

  // Resetear upgrades
  const resetUpgrades = state.upgrades.map(upg => ({
    ...upg,
    purchased: false,
  }));

  // Verificar badges desbloqueados
  const newUnlockedBadges = checkBadgeUnlocks({
    ...state,
    prestigeLevel: newPrestigeLevel,
    prestigeHistory: [...state.prestigeHistory, currentRun],
  });

  const newState = {
    ...state,
    // Prestige state
    prestigeLevel: newPrestigeLevel,
    prestigeProductionMultiplier: newProductionMultiplier,
    prestigeClickMultiplier: newClickMultiplier,
    prestigeHistory: [...state.prestigeHistory, currentRun],
    unlockedBadges: newUnlockedBadges,

    // Reset progress
    blocksMined: 0,
    cryptoCoins: 0,
    realMoney: 0,
    totalRealMoneyEarned: 0,
    totalCryptoCoins: 0,
    hardware: resetHardware,
    upgrades: resetUpgrades,
    phase: 'genesis' as GamePhase,

    // Reset run stats
    currentRunStartTime: Date.now(),
    currentRunStats: {
      blocksMinedThisRun: 0,
      coinsEarnedThisRun: 0,
      moneyEarnedThisRun: 0,
      hardwarePurchasedThisRun: 0,
      upgradesPurchasedThisRun: 0,
      playtimeThisRun: 0,
    },
  };

  return recalculateGameStats(newState);
```

### Badge Checking Logic
```typescript
function checkBadgeUnlocks(gameState: GameState): string[] {
  const unlockedBadges = [...gameState.unlockedBadges];

  for (const badge of ALL_BADGES) {
    // Skip si ya está unlocked
    if (unlockedBadges.includes(badge.id)) continue;

    let shouldUnlock = false;

    switch (badge.unlockCondition.type) {
      case 'prestige_level':
        shouldUnlock = gameState.prestigeLevel >= badge.unlockCondition.value;
        break;

      case 'speed':
        // Verificar si el último run fue más rápido que el valor
        const lastRun = gameState.prestigeHistory[gameState.prestigeHistory.length - 1];
        shouldUnlock = lastRun && lastRun.duration <= badge.unlockCondition.value;
        break;

      case 'total_blocks':
        const totalBlocks = gameState.prestigeHistory.reduce(
          (sum, run) => sum + run.blocksMined,
          gameState.blocksMined
        );
        shouldUnlock = totalBlocks >= badge.unlockCondition.value;
        break;

      case 'total_money':
        const totalMoney = gameState.prestigeHistory.reduce(
          (sum, run) => sum + run.totalMoneyEarned,
          gameState.totalRealMoneyEarned
        );
        shouldUnlock = totalMoney >= badge.unlockCondition.value;
        break;

      case 'special':
        if (badge.unlockCondition.value === 'all_badges') {
          // Verificar si todos los otros badges están unlocked
          const otherBadges = ALL_BADGES.filter(b => b.id !== badge.id);
          shouldUnlock = otherBadges.every(b => unlockedBadges.includes(b.id));
        }
        break;
    }

    if (shouldUnlock) {
      unlockedBadges.push(badge.id);

      // Mostrar notificación
      showBadgeUnlockedNotification(badge);

      // Analytics
      analytics().logEvent('badge_unlocked', {
        badge_id: badge.id,
        prestige_level: gameState.prestigeLevel,
      });
    }
  }

  return unlockedBadges;
}
```

## Testing

### Unit Tests
```typescript
describe('Prestige System', () => {
  describe('calculateProductionMultiplier', () => {
    it('should return 1.0 for level 0', () => {
      expect(calculateProductionMultiplier(0)).toBe(1.0);
    });

    it('should return correct multiplier for each level', () => {
      expect(calculateProductionMultiplier(1)).toBe(1.1);
      expect(calculateProductionMultiplier(5)).toBe(1.5);
      expect(calculateProductionMultiplier(10)).toBe(2.0);
      expect(calculateProductionMultiplier(20)).toBe(3.0);
    });
  });

  describe('calculateClickMultiplier', () => {
    it('should return correct multiplier for each level', () => {
      expect(calculateClickMultiplier(0)).toBe(1.0);
      expect(calculateClickMultiplier(1)).toBe(1.05);
      expect(calculateClickMultiplier(10)).toBe(1.5);
    });
  });

  describe('canPrestige', () => {
    it('should return true when 21M blocks mined', () => {
      const state = { blocksMined: 21000000, totalBlocks: 21000000 };
      expect(canPrestige(state)).toBe(true);
    });

    it('should return false when less than 21M blocks', () => {
      const state = { blocksMined: 1000000, totalBlocks: 21000000 };
      expect(canPrestige(state)).toBe(false);
    });
  });

  describe('checkBadgeUnlocks', () => {
    it('should unlock prestige level badges correctly', () => {
      const state = {
        prestigeLevel: 10,
        unlockedBadges: [],
        prestigeHistory: [],
      };

      const badges = checkBadgeUnlocks(state);

      // Should unlock first_prestige and prestige_master
      expect(badges).toContain('first_prestige');
      expect(badges).toContain('prestige_master');
    });

    it('should unlock speed badges for fast runs', () => {
      const state = {
        prestigeLevel: 1,
        unlockedBadges: [],
        prestigeHistory: [{
          duration: 7000, // 1h 56m (bajo 2h)
        }],
      };

      const badges = checkBadgeUnlocks(state);
      expect(badges).toContain('speed_runner');
    });

    it('should not unlock badges already unlocked', () => {
      const state = {
        prestigeLevel: 10,
        unlockedBadges: ['first_prestige'],
        prestigeHistory: [],
      };

      const badges = checkBadgeUnlocks(state);

      // Should not duplicate first_prestige
      expect(badges.filter(b => b === 'first_prestige').length).toBe(1);
    });
  });
});
```

### Integration Tests
```typescript
describe('Prestige Integration', () => {
  it('should complete full prestige flow', () => {
    const initialState = {
      blocksMined: 21000000,
      cryptoCoins: 1000000,
      realMoney: 50000,
      prestigeLevel: 0,
      hardware: [
        { id: 'manual_mining', owned: 1 },
        { id: 'cpu', owned: 50 },
      ],
      upgrades: [{ id: 'click', purchased: true }],
    };

    const newState = gameReducer(initialState, { type: 'DO_PRESTIGE' });

    // Verify prestige level increased
    expect(newState.prestigeLevel).toBe(1);

    // Verify multipliers updated
    expect(newState.prestigeProductionMultiplier).toBe(1.1);
    expect(newState.prestigeClickMultiplier).toBe(1.05);

    // Verify reset
    expect(newState.blocksMined).toBe(0);
    expect(newState.cryptoCoins).toBe(0);
    expect(newState.realMoney).toBe(0);
    expect(newState.hardware.find(h => h.id === 'cpu').owned).toBe(0);
    expect(newState.upgrades.find(u => u.id === 'click').purchased).toBe(false);

    // Verify manual_mining persists
    expect(newState.hardware.find(h => h.id === 'manual_mining').owned).toBe(1);

    // Verify history saved
    expect(newState.prestigeHistory.length).toBe(1);
    expect(newState.prestigeHistory[0].blocksMined).toBe(21000000);
  });

  it('should apply production multiplier after prestige', () => {
    const state = {
      prestigeLevel: 5,
      prestigeProductionMultiplier: 1.5,
      hardware: [{ id: 'cpu', miningSpeed: 10, blockReward: 50, owned: 1 }],
      upgrades: [],
    };

    const production = calculateTotalProduction(state);

    // Base: 10 × 50 = 500
    // With prestige: 500 × 1.5 = 750
    expect(production).toBe(750);
  });
});
```

### E2E Tests
```typescript
describe('Prestige E2E', () => {
  it('should keep prestige tab active after reset when prestigeLevel >= 1', async () => {
    // Player already has prestige level 2
    await mockGameState({ prestigeLevel: 2, unlockedTabs: { prestige: false } });

    // Prestige tab must be visible and selectable even with prestige: false in saved state
    await expect(element(by.id('prestige-tab'))).toBeVisible();
    await element(by.id('prestige-tab')).tap();
    await expect(element(by.id('current-prestige-level'))).toHaveText('2');
  });

  it('should preserve prestige tab after performing a prestige reset', async () => {
    await mockGameState({ blocksMined: 21000000 });

    await element(by.id('prestige-tab')).tap();
    await element(by.id('prestige-now-button')).tap();
    await element(by.id('prestige-confirm-input')).typeText('PRESTIGE');
    await element(by.id('confirm-prestige-button')).tap();

    await waitFor(element(by.id('prestige-celebration')))
      .toBeVisible()
      .withTimeout(2000);

    // After reset, prestige tab must still be accessible
    await expect(element(by.id('prestige-tab'))).toBeVisible();
    await element(by.id('prestige-tab')).tap();
    await expect(element(by.id('current-prestige-level'))).toHaveText('1');
  });

  it('should complete prestige from unlock to new run', async () => {
    await launch();

    // Fast-forward to 21M blocks (mock)
    await mockGameState({ blocksMined: 21000000 });

    // Prestige button should appear
    await expect(element(by.id('prestige-tab'))).toBeVisible();
    await element(by.id('prestige-tab')).tap();

    // See prestige info
    await expect(element(by.id('current-prestige-level'))).toHaveText('0');
    await expect(element(by.id('next-prestige-level'))).toHaveText('1');

    // Press prestige
    await element(by.id('prestige-now-button')).tap();

    // Confirmation modal
    await expect(element(by.id('prestige-confirmation-modal'))).toBeVisible();
    await element(by.id('prestige-confirm-input')).typeText('PRESTIGE');
    await element(by.id('confirm-prestige-button')).tap();

    // Wait for animation
    await waitFor(element(by.id('prestige-celebration')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify reset
    await expect(element(by.id('blocks-mined'))).toHaveText('0');
    await expect(element(by.id('crypto-coins'))).toHaveText('0');

    // Verify new level
    await element(by.id('prestige-tab')).tap();
    await expect(element(by.id('current-prestige-level'))).toHaveText('1');
  });
});
```

## Performance Considerations

### Non-Functional Requirements
- **Prestige action**: Debe completarse en < 100ms (es un simple reset)
- **Badge checking**: < 50ms para verificar todos los badges
- **Stats calculation**: < 20ms para calcular stats de run
- **History rendering**: Debe manejar 1000+ runs sin lag

### Optimizaciones
- Memoizar badge unlock checks (solo verificar cuando cambian stats relevantes)
- Lazy load historial de runs (paginar si hay 100+)
- Comprimir historial antiguo (guardar solo stats clave)
- Batch badge unlock notifications (si múltiples a la vez)

## Analytics

```typescript
analytics().logEvent('prestige_unlocked', {
  blocks_mined: 21000000,
  time_to_unlock: totalGameTime,
  hardware_owned: totalHardware,
});

analytics().logEvent('prestige_completed', {
  prestige_level: newPrestigeLevel,
  previous_run_duration: currentRun.duration,
  blocks_mined: currentRun.blocksMined,
  money_earned: currentRun.totalMoneyEarned,
});

analytics().logEvent('badge_unlocked', {
  badge_id: badge.id,
  prestige_level: gameState.prestigeLevel,
  has_reward: badge.reward ? true : false,
});

analytics().logEvent('prestige_milestone', {
  milestone: 'level_10', // or 'level_50', 'level_100'
  total_runs: prestigeHistory.length,
  total_playtime: totalPlaytime,
});
```

## Edge Cases

**Edge Case 0: Hash rate y net income en nuevo run sin hardware comprado**
- Input: Post-prestige state con `manual_mining.owned = 1` y sin otro hardware
- Expected: Hash rate = 0, net income = 0 CC/s
- Razón: `manual_mining` representa el mecanismo de click manual, no producción automática.
  Debe excluirse de `calculateTotalProduction` y `calculateTotalHashRate`. Los multiplicadores
  de prestige solo deben aplicarse a hardware real comprado por el jugador.
- Fix: Excluir `manual_mining` (id = 'manual_mining') de ambas funciones de cálculo en `gameLogic.ts`.

**Edge Case 1: Prestige con exactamente 21M bloques**
- Input: blocksMined = 21000000
- Expected: Can prestige, botón habilitado

**Edge Case 2: Prestige con más de 21M bloques (imposible pero validar)**
- Input: blocksMined = 21000001
- Expected: Clamp a 21M, permitir prestige

**Edge Case 3: Múltiples badges desbloqueados a la vez**
- Input: Prestige level 0 → 10 (via hacking/bug)
- Expected: Desbloquear todos los badges de nivel 1-10, mostrar notificaciones en secuencia

**Edge Case 4: Badge "The Collector" con todos los badges**
- Input: Desbloquear último badge faltante
- Expected: The Collector se desbloquea automáticamente, reward se aplica

**Edge Case 5: Prestige level extremadamente alto**
- Input: prestigeLevel = 1000
- Expected: Multiplicadores calculados correctamente (101x production, 51x click), no overflow

**Edge Case 6: Intentar prestige sin 21M bloques**
- Input: blocksMined = 20999999, intentar prestige
- Expected: Botón deshabilitado, mensaje "Complete 21M blocks first"

**Edge Case 7: Run de 0 segundos (instant prestige via bug)**
- Input: duration = 0
- Expected: Guardar en historial pero no contar para speed badges

## Preguntas Abiertas

- [ ] **Prestige parcial**: ¿Permitir prestige antes de 21M a cambio de menores bonos?
  - **Recomendación**: No, mantener como endgame exclusivo

- [ ] **Soft reset vs Hard reset**: ¿Implementar "soft reset" que solo resetea algunas cosas?
  - **Recomendación**: No, mantener prestige como único reset

- [ ] **Badge trading/cosmetics**: ¿Permitir usar badges como cosmetics visuales?
  - **Recomendación**: Phase 5+, no prioritario

- [ ] **Prestige challenges**: ¿Añadir desafíos opcionales por run (ej: "Sin comprar GPUs")?
  - **Recomendación**: Phase 4+, añade replay value

- [ ] **Leaderboards de prestige**: ¿Competir por fastest run con otros jugadores?
  - **Recomendación**: Phase 6+, requiere backend

- [ ] **Badge rewards balanceados**: ¿Los rewards de badges hacen el juego demasiado fácil?
  - **Recomendación**: Testear, posiblemente reducir rewards a la mitad

- [ ] **Reset de badges con reinstall**: ¿Badges se pierden si desinstala?
  - **Recomendación**: Cloud save opcional (Firebase/backend) para prevenir pérdida

## Referencias

- Cookie Clicker Prestige System: https://cookieclicker.fandom.com/wiki/Ascension
- Universal Paperclips Prestige: http://www.decisionproblem.com/paperclips/
- AdVenture Capitalist Angel Investors: https://adventure-capitalist.fandom.com/wiki/Angel_Investors
- Incremental game prestige design: https://www.reddit.com/r/incremental_games/wiki/design_prestige/
