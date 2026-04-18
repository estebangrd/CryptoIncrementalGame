# Sistema de Logros (Achievements)

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: Implemented & Active
- **Prioridad**: High
- **Última actualización**: 2026-02-21

## Descripción
Sistema de logros que recompensa a los jugadores por alcanzar hitos importantes en el juego. Los logros aumentan el engagement y proporcionan objetivos a corto y largo plazo. Algunos logros otorgan recompensas tangibles (CryptoCoins, real money), mientras que otros son puramente cosméticos.

## Objetivos
- [ ] Aumentar retención de jugadores (objetivo: +15% D7 retention)
- [ ] Proporcionar metas claras a corto, medio y largo plazo
- [ ] Recompensar exploración de todas las mecánicas del juego
- [ ] Crear momentos de satisfacción y celebración

## Comportamiento Esperado

### Caso de Uso 1: Desbloquear Primer Logro
**Dado que** el jugador acaba de comprar su primera unidad de hardware (Basic CPU)
**Cuando** la compra se procesa exitosamente
**Entonces**
- Se muestra una notificación toast: "🏆 Achievement Unlocked: First Steps"
- El logro se marca como completado en el GameState
- Se otorga la recompensa: 100 CryptoCoins
- Se reproduce un sonido de celebración (si sonidos están habilitados)

### Caso de Uso 2: Ver Lista de Logros
**Dado que** el jugador abre la pantalla de logros
**Cuando** la pantalla se renderiza
**Entonces**
- Se muestran todos los logros desbloqueados en color (con fecha de desbloqueo)
- Se muestran logros bloqueados en gris con descripción oculta ("???")
- Se muestra progreso hacia logros parciales (ej: "Mine 100 Blocks: 47/100")
- Se muestra el porcentaje total de logros completados

### Caso de Uso 3: Progreso Incremental
**Dado que** el jugador está trabajando hacia un logro de "Minar 1000 bloques"
**Cuando** el contador de bloques minados llega a 1000
**Entonces**
- El logro se desbloquea automáticamente
- Se muestra notificación
- Se actualiza la UI de logros en tiempo real
- Se otorga la recompensa configurada

## Categorías de Logros

### 1. Mining Achievements (Minería)
- **First Block**: Mine your first block
- **Century**: Mine 100 blocks
- **Millennium**: Mine 1,000 blocks
- **Epic Miner**: Mine 100,000 blocks
- **Halving Survivor**: Experience your first halving event

### 2. Hardware Achievements (Hardware)
- **First Steps**: Buy your first hardware
- **Upgrader**: Own 10 units of any hardware
- **Hardware Collector**: Own at least 1 unit of every hardware type
- **ASIC Master**: Own 100 ASIC Gen 3 miners

> **Nota de implementacion**: "Data Empire" NO esta implementado en `achievements.ts`. "ASIC Master" no tiene reward definido en el codigo. "Hardware Collector" excluye `manual_mining` del check -- verifica que todo hardware comprable tenga owned >= 1.

### 3. Economy Achievements (Economía)
- **First Sale**: Sell CryptoCoins for the first time
- **Millionaire**: Accumulate $1,000,000 real money
- **Market Trader**: Make 100 market transactions

> **Nota de implementacion**: "Smart Investor" NO esta implementado. "Millionaire" verifica `realMoney` (balance actual), NO `totalRealMoneyEarned`. Esto significa que el jugador debe tener $1M en el balance al momento del check, no que haya ganado $1M en total. "Market Trader" no tiene auto-tracking -- debe desbloquearse via la accion `UNLOCK_ACHIEVEMENT` (actualmente no se dispara automaticamente).

### 4. Prestige Achievements (Prestigio)
- **Rebirth**: Complete your first prestige
- **Veteran**: Complete 10 prestiges
- **Eternal**: Complete 100 prestiges (hidden)

> **Nota de implementacion**: "Rebirth" se verifica con `prestigeLevel >= 1`. Su reward es `duration: 15 min (floor $5000)`, NO un bonus permanente de prestige como decia la spec original. "Veteran" y "Eternal" usan `prestigeLevel` directamente (no un conteo separado de prestiges). "Eternal" tiene `hidden: true`.

### 5. Secret Achievements (Secretos)
- **Pizza Day**: Sell exactly 10,000 BTC (reference to Bitcoin Pizza Day)
- **HODL Master**: Keep 1M coins without selling for 24 hours
- **Speed Runner**: Reach $100K in under 1 hour

> **Nota de implementacion**: Los secret achievements estan definidos en `achievements.ts` con `hidden: true` pero sus condiciones de unlock NO estan implementadas en `checkAchievements()` (el switch/case no los cubre). Necesitarian ser desbloqueados manualmente via `UNLOCK_ACHIEVEMENT`. `pizza_day`, `hodl_master`, y `speed_runner_eco` existen como entradas pero sin logica de auto-check.

## Fórmulas y Cálculos

```typescript
// Progreso hacia un logro
achievementProgress = currentValue / targetValue
isUnlocked = currentValue >= targetValue

// Porcentaje total completado
totalProgress = (unlockedCount / totalAchievementsCount) * 100

// Verificación de logro incremental
function checkAchievementProgress(
  achievementId: string,
  currentValue: number,
  targetValue: number
): boolean {
  const achievement = gameState.achievements.find(a => a.id === achievementId)
  if (achievement.unlocked) return false

  if (currentValue >= targetValue) {
    unlockAchievement(achievementId)
    return true
  }
  return false
}
```

## Estructura de Datos

```typescript
interface Achievement {
  id: string
  nameKey: string           // Translation key for name
  descriptionKey: string    // Translation key for description
  category: 'mining' | 'hardware' | 'economy' | 'prestige' | 'secret'
  icon: string             // Icon name from react-native-vector-icons
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlockedAt?: number      // Timestamp when unlocked
  progress?: number        // Current progress (for incremental achievements)
  target?: number          // Target value (for incremental achievements)
  reward?: AchievementReward
  hidden: boolean          // True for secret achievements
}

interface AchievementReward {
  type: 'coins' | 'money' | 'multiplier' | 'cosmetic' | 'duration'
  amount?: number          // For coins/money
  multiplier?: number      // For production multipliers
  duration?: number        // For temporary rewards (ms)
  // Duration-based reward fields (used when type === 'duration')
  durationMinutes?: number // Minutes of current production to grant
  floorUSD?: number        // Minimum USD value for early-game
}
```

> **Nota de implementacion**: El tipo `duration` fue agregado al union type. Es el tipo mas usado en la implementacion actual. Los tipos `coins` y `money` estan deprecated. El `Achievement` interface en `game.ts` tambien tiene campos opcionales `name` y `description` (strings directos ademas de las translation keys).

## Valores de Recompensas

| Logro | Categoría | Rareza | Recompensa |
|-------|-----------|--------|------------|
| First Block | Mining | Common | duration: 1 min de produccion (floor $5) |
| Century | Mining | Common | duration: 2 min de produccion (floor $50) |
| Millennium | Mining | Rare | duration: 2 min de produccion (floor $100) |
| Epic Miner | Mining | Epic | duration: 7 min de produccion (floor $10,000) |
| First Steps | Hardware | Common | duration: 1 min de produccion (floor $10) |
| Upgrader | Hardware | Common | duration: 2 min de produccion (floor $50) |
| Hardware Collector | Hardware | Epic | duration: 6 min de produccion (floor $1,000) |
| First Sale | Economy | Common | duration: 1 min de produccion (floor $20) |
| Millionaire | Economy | Legendary | 2x production for 24h |
| Rebirth | Prestige | Rare | duration: 15 min de produccion (floor $5,000) |

> **Nota de implementacion**: La mayoria de las recompensas usan el tipo `duration` en vez de `coins` o `money` fijos. Un reward `{ type: 'duration', durationMinutes: N, floorUSD: X }` otorga N minutos de produccion actual (CC + cash split 50/50) con un minimo de $X USD para que sea significativo en early-game. Las rewards tipo `coins` y `money` fijos estan deprecated. El tipo `duration` se procesa en `APPLY_ACHIEVEMENT_REWARD` en `GameContext.tsx`. El logro "Rebirth" NO da un bonus permanente de prestige como decia la spec original.

## Reglas de Negocio

1. **Los logros no se pueden "des-desbloquear"**: Una vez desbloqueado, permanece para siempre
2. **Los logros persisten entre prestiges**: No se resetean al hacer prestige
3. **Los logros secretos no muestran descripción** hasta que se desbloquean
4. **Las recompensas se otorgan automáticamente** al desbloquear
5. **Recompensas tipo `coins` avanzan `blocksMined`**: Usan `creditCryptoCoins()` para convertir CC a bloques equivalentes según reward actual, respetando halvings y el cap de TOTAL_BLOCKS. No pueden existir CC sin bloques correspondientes (invariante del génesis).
6. **Notificaciones de logros no bloquean el gameplay**: Son toast no-invasivos
6. **Progreso de logros se actualiza en tiempo real**: Sin necesidad de refresh
7. **Logros se guardan con AsyncStorage**: Junto con el resto del GameState

## UI/UX Requirements

### Achievement Notification Toast
- [ ] Aparece en la parte superior de la pantalla
- [ ] Duración: 3 segundos
- [ ] Incluye: icono, nombre del logro, recompensa
- [ ] Animación de entrada/salida suave
- [ ] No bloquea interacción con el juego
- [ ] Puede ser tocada para ver detalles

### Achievements Screen
- [x] Accesible desde el menú de configuración
- [x] Lista scrolleable de todos los logros
- [x] Filtros por categoría
- [ ] Ordenar por: fecha de desbloqueo, rareza, categoría
- [x] Barra de progreso total en la parte superior
- [ ] Logros bloqueados muestran "???" en vez de descripción
- [x] Logros desbloqueados muestran fecha de desbloqueo

> **Nota de implementacion**: NO hay sorting de achievements implementado. El orden es el del array `ALL_ACHIEVEMENTS` en `achievements.ts` (orden de definicion). El filtro por categoria funciona. Los logros bloqueados no ocultan su descripcion con "???" -- muestran la descripcion real pero con visual gris/opaco.

### Achievement Card
- [ ] Icono del logro (color si desbloqueado, gris si bloqueado)
- [ ] Nombre del logro
- [ ] Descripción (o "???" si secreto y bloqueado)
- [ ] Barra de progreso para logros incrementales
- [ ] Badge de rareza (Common/Rare/Epic/Legendary)
- [ ] Recompensa mostrada al desbloquear

## Validaciones

- [ ] No otorgar recompensa dos veces por el mismo logro
- [ ] Verificar que el jugador cumple el requisito antes de desbloquear
- [ ] Prevenir race conditions si múltiples logros se desbloquean simultáneamente
- [ ] Validar que las recompensas no rompan el balance del juego

## Dependencias

- Requiere: GameState expansion, Toast notification system
- Bloquea: Ninguno (es feature independiente)
- Relacionado con: Missions system (Phase 3.3), Leaderboards (Phase 5.2)

## Criterios de Aceptación

- [ ] Usuario puede ver lista completa de logros disponibles
- [ ] Logros se desbloquean automáticamente al cumplir requisitos
- [ ] Se muestra notificación toast al desbloquear
- [ ] Recompensas se aplican correctamente
- [ ] Progreso de logros incrementales se muestra correctamente
- [ ] Logros persisten después de cerrar/reabrir app
- [ ] Logros persisten después de hacer prestige
- [ ] Logros secretos ocultan descripción hasta desbloqueo
- [ ] Porcentaje total de completado se calcula correctamente

## Notas de Implementación

### Archivos Creados
- `src/data/achievements.ts` - Definición de todos los logros (implementado)
- `src/components/AchievementsScreen.tsx` - Pantalla principal de logros (implementado)
- `src/components/AchievementToast.tsx` - Notificación de desbloqueo (implementado)
- `src/utils/achievementLogic.ts` - Lógica de verificación y desbloqueo (implementado)

> **Nota de implementacion**: `AchievementCard.tsx` NO fue creado como archivo separado -- el card esta inline dentro de `AchievementsScreen.tsx`. Existe un sistema paralelo de **Badges** (insignias) en `src/data/badges.ts` con `checkBadgeUnlocks()` en `src/utils/prestigeLogic.ts`. Los Badges otorgan multiplicadores permanentes de produccion o click y se verifican en el prestige. Los Achievements son separados, se verifican en cada tick via `CHECK_ACHIEVEMENTS`, y usan rewards de tipo `duration`. Ambos sistemas coexisten independientemente.

### Archivos Modificados
- `src/types/game.ts` - `Achievement` interface, `AchievementReward` interface, `achievements: Achievement[]` en GameState
- `src/contexts/GameContext.tsx` - Reducer actions: `UNLOCK_ACHIEVEMENT`, `CHECK_ACHIEVEMENTS`, `APPLY_ACHIEVEMENT_REWARD`
- `src/data/translations.ts` - Traducciones para logros
- `src/components/SettingsModal.tsx` - Boton "Achievements"

### Configuración
- Balance config: Las recompensas están hardcodeadas en `achievements.ts` (no en `balanceConfig.ts`)
- AsyncStorage key: Guardado automáticamente como parte de GameState
- Merge de nuevos logros en updates via `mergeAchievements()` en `achievementLogic.ts`

### Verificación en Game Loop
```typescript
// En GameContext.tsx, después de cada acción relevante
useEffect(() => {
  checkAchievements(gameState)
}, [gameState.blocksMined, gameState.hardware, gameState.realMoney])
```

## Testing

### Test Cases

1. **Test: Desbloquear logro al minar primer bloque**
   - Given: gameState.blocksMined = 0, achievement "First Block" locked
   - When: blocksMined incrementa a 1
   - Expected: Achievement "First Block" se desbloquea, se otorgan 50 CryptoCoins

2. **Test: Progreso incremental hacia logro**
   - Given: Achievement "Century" (100 blocks), blocksMined = 47
   - When: Se renderiza AchievementsScreen
   - Expected: Muestra "47/100" en barra de progreso

3. **Test: Logro secreto oculto hasta desbloqueo**
   - Given: Achievement "Pizza Day" (secret), unlocked = false
   - When: Se muestra en AchievementsScreen
   - Expected: Nombre = "???", descripción = "???"

4. **Test: Recompensa temporal de multiplicador**
   - Given: Achievement "Millionaire" desbloqueado con reward 2x production for 24h
   - When: Logro se desbloquea
   - Expected: gameState.prestigeMultiplier *= 2 por 24 horas

### Edge Cases

- ¿Qué pasa si dos logros se desbloquean al mismo tiempo?
  → Mostrar toasts en secuencia con 0.5s de delay entre cada una

- ¿Qué pasa si el usuario hace prestige?
  → Los logros NO se resetean, persisten para siempre

- ¿Qué pasa si se modifica manualmente el AsyncStorage?
  → Validación al cargar: verificar que achievements[] sea un array válido

- ¿Qué pasa si agregamos nuevos logros en una actualización?
  → Merge con logros existentes, inicializar nuevos como unlocked: false

## Preguntas Abiertas

- [ ] ¿Deberíamos tener logros de "no hacer algo"? (ej: "Never Sell: Reach 1M coins without selling")
- [ ] ¿Incluir logros basados en tiempo? (ej: "Play for 7 days consecutivos")
- [ ] ¿Mostrar notificación cuando el jugador está al 90% de un logro?
- [ ] ¿Agregar sistema de puntos de logros (cada logro vale X puntos según rareza)?
- [ ] ¿Permitir compartir logros en redes sociales?

## Wireframes

```
┌─────────────────────────────────┐
│ ← Achievements        75% ⭐    │
├─────────────────────────────────┤
│ [All] [Mining] [Hardware] [...]│
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🏆 First Block   ✓          │ │
│ │ Mine your first block       │ │
│ │ Unlocked: 2026-02-20        │ │
│ │ Reward: 50 CryptoCoins      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🔒 Century                  │ │
│ │ Mine 100 blocks             │ │
│ │ Progress: ▓▓▓░░░░░ 47/100   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🔒 ???                      │ │
│ │ ???                         │ │
│ │ Secret Achievement          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Referencias
- Universal Paperclips achievements system
- Cookie Clicker achievement mechanics
- Idle game achievement best practices: https://www.gamasutra.com/blogs/[...]
