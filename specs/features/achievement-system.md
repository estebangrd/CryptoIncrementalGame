# Sistema de Logros (Achievements)

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: Planned
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
- **Data Empire**: Own 50 Data Centers

### 3. Economy Achievements (Economía)
- **First Sale**: Sell CryptoCoins for the first time
- **Millionaire**: Accumulate $1,000,000 real money
- **Market Trader**: Make 100 market transactions
- **Smart Investor**: Buy low, sell high 10 times in a row

### 4. Prestige Achievements (Prestigio)
- **Rebirth**: Complete your first prestige
- **Veteran**: Complete 10 prestiges
- **Eternal**: Complete 100 prestiges

### 5. Secret Achievements (Secretos)
- **Pizza Day**: Sell exactly 10,000 BTC (reference to Bitcoin Pizza Day)
- **HODL Master**: Keep 1M coins without selling for 24 hours
- **Speed Runner**: Reach $100K in under 1 hour

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
  type: 'coins' | 'money' | 'multiplier' | 'cosmetic'
  amount?: number          // For coins/money
  multiplier?: number      // For production multipliers
  duration?: number        // For temporary rewards (ms)
}
```

## Valores de Recompensas

| Logro | Categoría | Rareza | Recompensa |
|-------|-----------|--------|------------|
| First Block | Mining | Common | 50 CryptoCoins |
| Century | Mining | Common | 500 CryptoCoins |
| Millennium | Mining | Rare | $100 |
| First Steps | Hardware | Common | 100 CryptoCoins |
| Hardware Collector | Hardware | Epic | $1,000 |
| Millionaire | Economy | Legendary | 2x production for 24h |
| Rebirth | Prestige | Rare | +5% permanent prestige bonus |

## Reglas de Negocio

1. **Los logros no se pueden "des-desbloquear"**: Una vez desbloqueado, permanece para siempre
2. **Los logros persisten entre prestiges**: No se resetean al hacer prestige
3. **Los logros secretos no muestran descripción** hasta que se desbloquean
4. **Las recompensas se otorgan automáticamente** al desbloquear
5. **Notificaciones de logros no bloquean el gameplay**: Son toast no-invasivos
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
- [ ] Accesible desde el menú de configuración
- [ ] Lista scrolleable de todos los logros
- [ ] Filtros por categoría
- [ ] Ordenar por: fecha de desbloqueo, rareza, categoría
- [ ] Barra de progreso total en la parte superior
- [ ] Logros bloqueados muestran "???" en vez de descripción
- [ ] Logros desbloqueados muestran fecha de desbloqueo

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

### Archivos a Crear
- `src/data/achievements.ts` - Definición de todos los logros
- `src/components/AchievementsScreen.tsx` - Pantalla principal de logros
- `src/components/AchievementCard.tsx` - Card individual de logro
- `src/components/AchievementToast.tsx` - Notificación de desbloqueo
- `src/utils/achievementLogic.ts` - Lógica de verificación y desbloqueo

### Archivos a Modificar
- `src/types/game.ts` - Agregar `Achievement` interface y `achievements: Achievement[]` a GameState
- `src/contexts/GameContext.tsx` - Agregar reducer actions: `UNLOCK_ACHIEVEMENT`, `UPDATE_ACHIEVEMENT_PROGRESS`
- `src/data/translations.ts` - Agregar traducciones para todos los logros
- `src/components/SettingsModal.tsx` - Agregar botón "Achievements" que abre AchievementsScreen

### Configuración
- Balance config: Ninguna (las recompensas están hardcodeadas en `achievements.ts`)
- AsyncStorage key: Guardado automáticamente como parte de GameState

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
