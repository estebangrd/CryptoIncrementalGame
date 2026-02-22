# Game Flow & Player Journey

## Estado
- **Fase**: Phase 1 - Genesis (Design Complete)
- **Estado**: Specification Complete
- **Prioridad**: Critical (Core UX Design)
- **Última actualización**: 2026-02-21

## Descripción

Este documento define el flujo completo del juego desde que el jugador abre la app por primera vez hasta que hace su primer (y subsiguientes) prestige. Documenta la secuencia de desbloqueos progresivos, momentos tutoriales, critical path vs contenido opcional, y la experiencia de usuario tanto para nuevos jugadores (FTUE - First Time User Experience) como para jugadores que regresan.

El objetivo es crear una experiencia fluida donde el jugador siempre sepa qué hacer a continuación, sin sentirse overwhelmed por demasiadas opciones, pero tampoco aburrido por falta de contenido.

## Objetivos
- [ ] Diseñar una FTUE clara que enseñe mecánicas sin tutorials intrusivos
- [ ] Establecer una secuencia de unlocks que mantenga engagement
- [ ] Definir el critical path (mínimo para progresar)
- [ ] Documentar contenido opcional vs obligatorio
- [ ] Diseñar flows para returning users (offline progress, daily check-ins)
- [ ] Crear transiciones suaves entre online y offline
- [ ] Asegurar que el jugador siempre tenga un "next goal" claro

## Player Journey Map

### First Time User Experience (FTUE)

#### Fase 0: App Launch (0-10 segundos)
**Usuario**: Abre la app por primera vez
**Estado del juego**: Fresh state, 0 progress

**Flow**:
1. Splash screen (logo de Blockchain Tycoon, 1-2 segundos)
2. Carga inicial de assets y fonts
3. Inicializar GameContext con estado default
4. Verificar si hay save game en AsyncStorage
   - Si NO hay save: Ir a FTUE Step 1
   - Si hay save: Ir a Returning User Flow
5. Renderizar MainScreen

**UI Visible**:
- Header: "Blockchain Tycoon" logo
- Main area:
  - Blocks mined: 0 / 21M
  - CryptoCoins: 0 CC
  - Real Money: $0.00
- Bottom: Solo tab "Mining" visible (otros locked)
- Centro: Botón grande "Start Mining" (pulsante)

**Analytics**:
```typescript
analytics().logEvent('app_opened', { is_first_time: true });
analytics().logEvent('ftue_started', { timestamp: Date.now() });
```

---

#### Fase 1: First Click (10-30 segundos)
**Usuario**: Presiona "Start Mining" o tap en la pantalla
**Goal**: Entender mecánica básica de clicks

**Flow**:
1. Usuario toca botón "Start Mining" o tap anywhere
2. Sistema ejecuta manual mining:
   - Mina 1 bloque (blocksMined: 0 → 1)
   - Otorga recompensa (cryptoCoins: 0 → 50 CC)
   - Animación de "+50 CC" en el punto del tap
   - Update de UI instantáneo
3. Tooltip aparece: "Great! Keep tapping to mine more blocks"
   - Auto-dismiss después de 3 segundos
4. Después de 3 clicks (150 CC acumulados):
   - Tooltip: "💡 Tip: Buy hardware to mine automatically!"
   - Highlight del botón "Hardware" (si visible) o mensaje "Keep mining to unlock hardware"

**UI Changes**:
- Blocks mined: 0 → 3
- CryptoCoins: 0 → 150 CC
- Barra de progreso hasta próximo desbloqueo (si aplicable)

**Analytics**:
```typescript
analytics().logEvent('first_click', { timestamp: Date.now() });
analytics().logEvent('tutorial_step_completed', { step: 'first_click' });
```

---

#### Fase 2: First Hardware (1-5 minutos)
**Usuario**: Acumula suficientes coins para comprar primer hardware
**Goal**: Comprar Basic CPU, entender automatización

**Flow**:
1. Usuario mina manualmente hasta acumular 500 CC (requiere 10 clicks)
2. Cuando cryptoCoins >= 500:
   - Bottom sheet o modal aparece automáticamente
   - Título: "🎉 You can afford hardware!"
   - Descripción: "Hardware mines blocks automatically for you"
   - Lista: Solo "Basic CPU" visible
     - Name: "Basic CPU"
     - Cost: 500 CC
     - Production: 13.5 CC/s
     - Button: "BUY" (verde, pulsante)
3. Usuario toca "BUY":
   - Animación de compra (coins vuelan hacia el hardware icon)
   - cryptoCoins: 500 → 0
   - Hardware owned: 0 → 1
   - Producción inicia automáticamente (13.5 CC/s)
4. Tooltip: "✅ Automation unlocked! Now you earn coins every second"
5. Después de 10 segundos:
   - cryptoCoins incrementa visiblemente (135 CC ganados)
   - Tooltip: "💰 You earned 135 CC automatically! Buy more hardware to earn faster"

**UI Changes**:
- Bottom sheet "Hardware" ahora accesible (tab o botón)
- Hardware list muestra: Basic CPU (Owned: 1)
- Production counter visible: "13.5 CC/s"
- Próximo hardware (Advanced CPU) muestra 🔒 "Requires 5 Basic CPU"

**Analytics**:
```typescript
analytics().logEvent('first_hardware_purchased', {
  hardware_id: 'basic_cpu',
  time_to_purchase: timeFromStart,
});
analytics().logEvent('tutorial_step_completed', { step: 'first_hardware' });
```

---

#### Fase 3: First Unlock (5-15 minutos)
**Usuario**: Compra múltiples Basic CPUs para desbloquear Advanced CPU
**Goal**: Entender unlock progresivo

**Flow**:
1. Usuario compra más Basic CPUs (2do, 3ro, 4to, 5to)
   - Costo escala: 500 → 575 → 661 → 760 → 875 CC
   - Producción aumenta linealmente: 13.5 → 27 → 40.5 → 54 → 67.5 CC/s
2. Al comprar el 5to Basic CPU:
   - Animación de "UNLOCK!"
   - Modal celebratorio:
     - "🔓 New Hardware Unlocked!"
     - "Advanced CPU is now available"
     - Muestra preview del Advanced CPU
     - Botón: "Nice!" (close modal)
   - Advanced CPU aparece en la lista (ya no 🔒)
3. Tooltip: "Keep buying hardware to unlock even more powerful options!"

**UI Changes**:
- Basic CPU: Owned: 5
- Advanced CPU: Ahora visible (no locked)
  - Cost: 2,500 CC
  - Production: 33.6 CC/s
  - Button: "BUY" (disabled si no hay fondos)
- Siguiente unlock: Basic GPU (🔒 Requires 5 Advanced CPU)

**Analytics**:
```typescript
analytics().logEvent('hardware_unlocked', {
  hardware_id: 'advanced_cpu',
  time_to_unlock: timeFromStart,
  basic_cpu_owned: 5,
});
```

---

#### Fase 4: Market Unlock (10-20 minutos)
**Usuario**: Alcanza 15 bloques minados + 1,000 CC
**Goal**: Aprender a vender coins por Real Money

**Flow**:
1. Sistema detecta: blocksMined >= 15 AND cryptoCoins >= 1000
2. Celebración full-screen:
   - "🎊 Market Unlocked!"
   - "You can now sell CryptoCoins for real money ($)"
   - "Use money to buy upgrades and advanced hardware"
   - Botón: "Open Market"
3. Usuario toca "Open Market":
   - Tab "Market" aparece en bottom navigation
   - Navigate automáticamente a MarketScreen
4. MarketScreen se muestra:
   - Lista de criptomonedas (Bitcoin, Ethereum, etc.)
   - CryptoCoin destacado:
     - Balance: 1,000+ CC
     - Price: $0.001/CC
     - Button: "SELL"
   - Input: "Amount to sell"
5. Tutorial tooltip: "💡 Sell your CryptoCoins to earn real money. You'll need $ to buy upgrades!"
6. Usuario vende primera vez (ej: 500 CC):
   - Input: 500
   - Preview: "You'll get: $0.50"
   - Button "SELL" → Confirmación → Success
   - realMoney: $0 → $0.50
   - cryptoCoins: 1,000 → 500
7. Toast: "✅ Sold 500 CC for $0.50"

**UI Changes**:
- Bottom navigation: Tab "Market" ahora visible
- Top bar: "$0.50" visible junto a CryptoCoins
- MarketScreen accesible en cualquier momento

**Analytics**:
```typescript
analytics().logEvent('market_unlocked', {
  blocks_mined: 15,
  coins_earned: totalCoins,
  time_to_unlock: timeFromStart,
});
analytics().logEvent('first_sale', {
  amount: 500,
  money_earned: 0.50,
});
```

---

#### Fase 5: Upgrades Unlock (30-60 minutos)
**Usuario**: Compra primer hardware, ya tiene acceso a upgrades
**Goal**: Entender sistema de upgrades y multipliers

**Flow**:
1. Sistema detecta: Al menos 1 hardware comprado
2. Tab/section "Upgrades" se desbloquea
3. Notificación: "🔓 Upgrades Unlocked! Boost your production with permanent upgrades"
4. Usuario abre Upgrades screen:
   - Lista de upgrades disponibles
   - Primer upgrade: "Click Power" (Cost: $1,000)
     - Effect: +50% coins per click
     - Status: 🔒 Locked (necesita $1,000)
   - Upgrade visible pero no comprable aún
5. Tutorial tooltip: "Upgrades give permanent bonuses. Keep earning $ to unlock them!"
6. Usuario vende suficientes coins para ganar $1,000
7. Regresa a Upgrades screen:
   - "Click Power" ahora muestra "BUY" button (enabled)
8. Usuario compra upgrade:
   - realMoney: $1,000 → $0
   - Upgrade marca como "Purchased" ✅
   - Click power ahora: 1 CC → 1.5 CC per click
9. Toast: "✅ Click Power upgraded! You now earn 1.5 CC per click"

**UI Changes**:
- Upgrades tab accessible
- Lista de upgrades con estados (locked/available/purchased)
- Indicators visuales de qué upgrades aplican a qué hardware

**Analytics**:
```typescript
analytics().logEvent('upgrades_unlocked', {
  time_to_unlock: timeFromStart,
});
analytics().logEvent('first_upgrade_purchased', {
  upgrade_id: 'click_power',
  cost: 1000,
});
```

---

#### Fase 6: Hardware Tab Unlock (1-2 horas)
**Usuario**: Gana total de $200 vendiendo coins
**Goal**: Acceder a hardware avanzado (si implementado)

**Flow**:
1. Sistema detecta: totalRealMoneyEarned >= $200
2. Celebración:
   - "🔓 Hardware Shop Unlocked!"
   - "Advanced hardware is now available for purchase with $"
3. Tab "Hardware" aparece en bottom sheet/navigation
4. Usuario abre Hardware tab:
   - Lista de hardware comprable con Real Money (si implementado)
   - Alternativamente: Sección especial en Hardware list
5. Tooltip: "This hardware can be purchased with $ instead of CryptoCoins"

**Note**: En la implementación actual, todo hardware usa CryptoCoins. Este unlock puede ser para futuro contenido premium.

**Analytics**:
```typescript
analytics().logEvent('hardware_tab_unlocked', {
  total_money_earned: 200,
  time_to_unlock: timeFromStart,
});
```

---

#### Fase 7: Mid Game Progression (2-8 horas)
**Usuario**: Progresa a través de todos los niveles de hardware
**Goal**: Escalar producción hasta alcanzar ASICs

**Flow** (resumido, no hay tutorials):
1. Usuario compra 5+ Advanced CPUs
   - Desbloquea Basic GPU
   - Animación de unlock
2. Usuario compra 5+ Basic GPUs
   - Desbloquea Advanced GPU
3. Usuario experimenta primer Halving (210k bloques):
   - Modal: "⚠️ Halving Event! Block reward reduced from 50 to 25 CC"
   - Producción efectiva se reduce a la mitad
   - Tooltip: "This is normal! Keep upgrading hardware to compensate"
4. Usuario compra upgrades de producción:
   - "CPU Efficiency" (2x multiplier para CPUs)
   - "GPU Optimization" (2x multiplier para GPUs)
5. Usuario desbloquea ASICs:
   - ASIC Gen 1 (5+ Advanced GPUs)
   - ASIC Gen 2 (5+ ASIC Gen 1)
   - ASIC Gen 3 (5+ ASIC Gen 2)
6. Producción escala exponencialmente
7. Bloques minados: 0 → 1M → 5M → 10M → 15M → 20M

**UI State**:
- Todos los tabs desbloqueados
- Múltiples hardware owned (diversificado)
- Varios upgrades comprados
- Balance de millions de CryptoCoins y miles de $
- Production: Miles de CC/s

**Analytics**:
```typescript
analytics().logEvent('milestone_reached', {
  milestone: '1M_blocks',
  time_to_milestone: timeFromStart,
});
analytics().logEvent('halving_reached', {
  halving_number: 1,
  blocks_mined: 210000,
});
```

---

#### Fase 8: Endgame & First Prestige (10-20 horas)
**Usuario**: Alcanza 21M bloques, completa Genesis
**Goal**: Hacer primer prestige

**Flow**:
1. Sistema detecta: blocksMined >= 21,000,000
2. Celebración full-screen:
   - "🎉 GENESIS COMPLETE!"
   - "You've mined all 21 million blocks!"
   - Confetti animation
   - Stats mostradas:
     - Total time played: X hours Y minutes
     - Total CryptoCoins earned: X CC
     - Total Real Money earned: $X
     - Hardware purchased: X units
   - Botones:
     - "View Stats" → Stats screen
     - "Prestige Now" → Prestige screen
3. Si usuario toca "Prestige Now":
   - Navigate a PrestigeScreen (ver Prestige System spec para detalles)
4. Si usuario toca "View Stats":
   - Muestra stats detalladas
   - Botón "Prestige" también visible aquí
5. PrestigeScreen:
   - Current Level: 0
   - Next Level: 1
   - Bonuses you'll get:
     - Production: +10%
     - Click Power: +5%
   - Warning: "You'll lose all progress except prestige bonuses"
   - Button: "PRESTIGE NOW"
6. Usuario confirma prestige (ver Prestige spec)
7. Reset completo + incremento de prestige level
8. **LOOP BACK TO FASE 1** (pero con multipliers)

**Analytics**:
```typescript
analytics().logEvent('genesis_complete', {
  total_time: totalGameTime,
  blocks_mined: 21000000,
  money_earned: totalMoneyEarned,
});
analytics().logEvent('prestige_completed', {
  prestige_level: 1,
  run_duration: runDuration,
});
```

---

### Returning User Experience (RUX)

#### Scenario 1: Regresa después de 5 minutos (Short Session)
**Context**: Usuario cerró app, vuelve poco después

**Flow**:
1. App launch
2. Cargar saved state de AsyncStorage
3. Calcular offline progress:
   - Time offline: 5 minutos = 300 segundos
   - Production: 100 CC/s (ejemplo)
   - Offline multiplier: 0.5 (50%)
   - Earnings: 300 × 100 × 0.5 = 15,000 CC
4. NO mostrar offline modal (muy poco tiempo)
5. Simplemente acreditar las coins silenciosamente
6. Usuario continúa donde dejó

**UI**:
- Coins balance actualizado
- No interrupciones
- Game loop continúa normalmente

**Analytics**:
```typescript
analytics().logEvent('session_started', {
  time_since_last_session: 300,
  offline_earnings: 15000,
});
```

---

#### Scenario 2: Regresa después de 8 horas (Overnight)
**Context**: Usuario dejó correr el juego overnight

**Flow**:
1. App launch
2. Cargar saved state
3. Calcular offline progress:
   - Time offline: 8 horas = 28,800 segundos
   - Production: 1,000 CC/s
   - Offline multiplier: 0.5
   - Earnings: 28,800 × 1,000 × 0.5 = 14,400,000 CC
   - Blocks mined offline: (1,000 CC/s ÷ 50 CC/block) × 28,800s × 0.5 = 288,000 bloques
4. Mostrar Offline Progress modal:
   - "Welcome Back!"
   - "You were offline for: 8 hours"
   - "Coins earned: 14,400,000 CC" (conteo animado)
   - "Blocks mined: 288,000" (conteo animado)
   - "Offline efficiency: 50%"
   - Tip: "💡 Buy more hardware to earn even while offline!"
   - Button: "Collect" (verde)
5. Usuario toca "Collect":
   - Acreditar earnings
   - Modal cierra
   - Animación de coins volando al balance
6. Usuario continúa jugando

**UI**:
- Modal full-screen con stats de offline progress
- Animaciones de conteo (números subiendo)
- Celebración visual

**Analytics**:
```typescript
analytics().logEvent('offline_progress_collected', {
  time_offline: 28800,
  coins_earned: 14400000,
  blocks_mined: 288000,
});
```

---

#### Scenario 3: Regresa después de 1 semana (Long Absence)
**Context**: Usuario no jugó por 7 días

**Flow**:
1. App launch
2. Calcular offline progress:
   - Time offline: 7 días = 604,800 segundos
   - **PERO capped a MAX_OFFLINE_TIME**: 24 horas = 86,400 segundos
   - Production: 5,000 CC/s
   - Earnings: 86,400 × 5,000 × 0.5 = 216,000,000 CC
3. Offline modal:
   - "Welcome Back!"
   - "You were offline for: 7 days"
   - "⚠️ Offline earnings are capped at 24 hours"
   - "Coins earned: 216,000,000 CC (24h worth)"
   - "Blocks mined: X"
   - Tip: "💡 Open the game daily to maximize earnings!"
   - Button: "Collect"
4. Usuario colecta
5. Opcionalmente: Mostrar "daily bonus" o incentive para regresar mañana (Phase 2+)

**Analytics**:
```typescript
analytics().logEvent('user_returned_after_long_absence', {
  days_offline: 7,
  capped_earnings: true,
  earnings_collected: 216000000,
});
```

---

### Session Flow (Active Play)

#### Typical Session (15-30 minutos)

**Opening** (0-2 min):
1. App launch
2. Collect offline progress (si aplicable)
3. Check current state:
   - How many coins?
   - How close to next unlock?
   - Any upgrades affordable?

**Mid Session** (2-25 min):
4. Buy hardware if affordable
5. Sell coins for $ if needed
6. Buy upgrades if $ available
7. Check progress towards goals:
   - Next hardware unlock
   - Next halving
   - Prestige completion
8. Occasional manual clicks (si upgrade click power comprado)
9. Watch production numbers go up (satisfying)

**Closing** (25-30 min):
10. Make final purchases
11. Ensure production is positive (no negative net)
12. Close app (auto-save triggers)

**User Goals Each Session**:
- [ ] Buy at least 1 new hardware
- [ ] Unlock 1 new hardware tier (si posible)
- [ ] Buy 1 upgrade (si affordable)
- [ ] Progress X% towards next prestige

---

### Critical Path vs Optional Content

#### Critical Path (Mínimo para Progresar)
**Definición**: Acciones obligatorias para completar el juego

1. **Minar bloques** (manual o automático)
   - Requerido: Alcanzar 21M bloques
2. **Comprar hardware**
   - Requerido: Al menos 1 hardware para automatizar
3. **Desbloquear hardware progresivamente**
   - Requerido: Comprar 5 unidades de cada nivel para desbloquear siguiente
4. **Vender CryptoCoins**
   - Requerido: Para ganar $ y desbloquear contenido
5. **Hacer Prestige**
   - Requerido: Para endgame loop

**Tiempo estimado (critical path only)**: 12-15 horas

---

#### Optional Content (Mejora Experiencia)
**Definición**: Acciones opcionales que aceleran/mejoran progresión

1. **Comprar Upgrades**
   - Opcional pero recomendado: Multiplican producción significativamente
   - Skip posible pero hace el juego 2-3x más lento
2. **Manual Clicking**
   - Opcional: Solo útil si upgrade Click Power comprado
   - Skip posible: Hardware solo es viable
3. **Vender en momento óptimo**
   - Opcional: Si implementamos precio dinámico, vender cuando precio alto
   - Skip posible: Vender cuando se necesita $ también funciona
4. **Diversificar hardware**
   - Opcional: Comprar balance de todos los niveles vs solo el más caro
   - Skip posible: Estrategia "solo ASICs" funciona (más lenta)
5. **Coleccionar Badges**
   - Opcional: Puramente cosmético (algunos dan bonos)
   - Skip posible: No afecta progresión core

**Tiempo estimado (con optional content)**: 8-12 horas (más rápido)

---

### Progressive Unlock Sequence (Orden Temporal)

| Order | Feature | Unlock Condition | Estimated Time |
|-------|---------|------------------|----------------|
| 1 | Manual Mining | Always available | 0s |
| 2 | Basic CPU | Always available | ~2 min |
| 3 | Advanced CPU | 5 Basic CPUs owned | ~10 min |
| 4 | Market Tab | 15 blocks + 1,000 CC | ~15 min |
| 5 | Basic GPU | 5 Advanced CPUs owned | ~30 min |
| 6 | Upgrades Tab | 1+ hardware owned | ~30 min |
| 7 | Advanced GPU | 5 Basic GPUs owned | ~1 hour |
| 8 | Hardware Tab | $200 total earned | ~1.5 hours |
| 9 | ASIC Gen 1 | 5 Advanced GPUs owned | ~3 hours |
| 10 | ASIC Gen 2 | 5 ASIC Gen 1 owned | ~5 hours |
| 11 | ASIC Gen 3 | 5 ASIC Gen 2 owned | ~8 hours |
| 12 | Prestige | 21M blocks mined | ~15 hours |

**Design Philosophy**:
- Algo nuevo se desbloquea cada ~15-60 minutos (early game)
- Los unlocks se espacian más en late game (puede pasar 2-3 horas sin unlock)
- Siempre hay un "next goal" visible en UI
- Locked features muestran requisitos claramente

---

### Online to Offline Transition

#### When User Closes App (Graceful Exit)

**Flow**:
1. Usuario presiona home button o swipe up (iOS/Android)
2. React Native lifecycle: `AppState` cambia a 'background'
3. GameContext detecta background state:
   ```typescript
   AppState.addEventListener('change', (nextAppState) => {
     if (nextAppState === 'background') {
       handleAppGoingBackground();
     }
   });
   ```
4. Trigger auto-save:
   - Save gameState to AsyncStorage
   - Save timestamp: `lastSaveTime = Date.now()`
5. Log analytics:
   ```typescript
   analytics().logEvent('session_ended', {
     session_duration: sessionDuration,
     coins_earned_this_session: coinsThisSession,
   });
   ```
6. App entra en background (iOS puede suspender, Android puede matar proceso)

**Data Persisted**:
- gameState completo (blocksMined, coins, hardware, upgrades, etc.)
- prestigeLevel y prestige history
- unlockedBadges
- lastSaveTime timestamp

---

#### When App is Killed (Force Close)

**Flow**:
1. Usuario fuerza cierre (swipe away from multitasking)
2. OS mata proceso sin warning
3. React Native NO tiene chance de ejecutar cleanup
4. **Esperanza**: Auto-save interval de 30 segundos
   - Último auto-save fue máximo hace 30s
   - Pérdida máxima: 30 segundos de progreso
5. Próximo launch: Cargar último auto-save

**Mitigation**:
- Auto-save cada 30 segundos (BALANCE_CONFIG.AUTO_SAVE_INTERVAL)
- Save on every significant action:
  - Hardware purchase
  - Upgrade purchase
  - Prestige
  - Market sale

---

### Offline to Online Transition

#### When User Re-Opens App

**Flow**:
1. App launch (splash screen)
2. Load saved state from AsyncStorage
3. Calculate offline time:
   ```typescript
   const now = Date.now();
   const lastSave = savedState.lastSaveTime;
   const offlineSeconds = (now - lastSave) / 1000;
   ```
4. Calculate offline earnings:
   ```typescript
   const maxOfflineSeconds = BALANCE_CONFIG.MAX_OFFLINE_TIME * 3600;
   const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds);
   const earnings = effectiveSeconds * productionPerSecond * OFFLINE_MULTIPLIER;
   ```
5. Apply offline progress:
   - Increment cryptoCoins
   - Increment blocksMined
   - Update stats
6. Show offline modal (si offline > 5 minutos)
7. Restore game to active state

**Edge Cases**:
- **No internet**: Game works 100% offline, no API calls needed
- **Save corrupted**: Fallback to default state, log error
- **Clock manipulation**: Detect negative time delta, ignore offline progress

---

### Tutorial Moments (Non-Intrusive)

**Philosophy**: No modals obligatorios, solo tooltips opcionales que se auto-dismiss

#### Tutorial 1: First Click
- **Trigger**: First tap on screen
- **Type**: Tooltip (arrow pointing to tap area)
- **Message**: "Tap to mine blocks! Each block earns CryptoCoins"
- **Dismissal**: Auto after 3s OR user taps again
- **Skippable**: Yes

#### Tutorial 2: First Hardware
- **Trigger**: cryptoCoins >= 500 (can afford Basic CPU)
- **Type**: Bottom sheet auto-open
- **Message**: "🎉 You can afford hardware! Hardware mines automatically for you"
- **Dismissal**: User closes sheet OR purchases hardware
- **Skippable**: Yes (user can close without buying)

#### Tutorial 3: Market Unlock
- **Trigger**: Market unlocks (15 blocks + 1,000 CC)
- **Type**: Full-screen modal (celebratory)
- **Message**: "🎊 Market Unlocked! Sell CryptoCoins for real money ($)"
- **Dismissal**: User taps "Open Market" button
- **Skippable**: No (but button is immediate, no reading required)

#### Tutorial 4: First Halving
- **Trigger**: blocksMined reaches 210,000
- **Type**: Modal (warning style)
- **Message**: "⚠️ Halving Event! Block reward reduced to 25 CC. This is normal in blockchain economics!"
- **Dismissal**: Auto after 5s OR user taps "OK"
- **Skippable**: Yes (auto-dismiss)

#### Tutorial 5: Prestige Available
- **Trigger**: blocksMined reaches 21M
- **Type**: Full-screen celebration
- **Message**: "🎉 GENESIS COMPLETE! You can now Prestige for permanent bonuses"
- **Dismissal**: User taps "Prestige Now" or "View Stats"
- **Skippable**: Yes (user can continue playing without prestiging)

**Tutorial Settings**:
- [ ] Option in settings: "Show Tutorials" (ON/OFF)
- [ ] Tutorial state persisted: { tutorial_first_click: true, tutorial_first_hardware: true, ... }
- [ ] If tutorial already shown: Never show again

---

### UI States & Transitions

#### State 1: Fresh Start (0-5 min)
**UI Elements Visible**:
- Header: Game title, coins balance
- Main: Blocks mined counter, tap area
- Bottom: Only "Mining" tab
- Overlay: First tutorial tooltip

**UI Elements Hidden**:
- Market tab (🔒)
- Upgrades tab (🔒)
- Hardware tab (🔒)
- Prestige button (🔒)

---

#### State 2: Early Game (5-30 min)
**UI Elements Visible**:
- All from State 1
- Hardware list (Basic CPU, Advanced CPU)
- Production counter (CC/s)
- Bottom: "Hardware" section accessible

**UI Elements Hidden**:
- Market tab (unlocking soon)
- Upgrades tab (unlocking soon)
- High-tier hardware (locked with visible requirements)

---

#### State 3: Mid Game (30 min - 8 hours)
**UI Elements Visible**:
- All from State 2
- Market tab ✅
- Upgrades tab ✅
- Hardware tab ✅ (after $200)
- Multiple hardware tiers unlocked
- Real Money balance ($)
- Production stats detailed

**UI Elements Hidden**:
- Prestige button (still 🔒)
- Late-game hardware (ASIC Gen 3 maybe locked)

---

#### State 4: Late Game (8-15 hours)
**UI Elements Visible**:
- All features unlocked except Prestige
- ASIC Gen 3 visible and purchasable
- High production numbers (millions CC/s)
- Multiple upgrades purchased (checkmarks)
- Progress bar towards 21M blocks (80-99%)

**UI Elements Hidden**:
- Prestige button (unlocking very soon)

---

#### State 5: Endgame (15+ hours, first prestige)
**UI Elements Visible**:
- ALL features unlocked
- Prestige button ✅ (pulsante, golden glow)
- Stats screen with detailed history
- Badge collection (some unlocked)
- Completion celebration

**UI Elements Hidden**:
- Nothing (all content accessible)

---

#### State 6: Post-Prestige (After first prestige)
**UI Elements Visible**:
- Same as State 1 BUT:
  - Prestige level indicator: "Prestige Level: 1"
  - Production multiplier visible: "Production Boost: +10%"
  - Prestige tab always accessible (to see stats/badges)
- Fresh progress (0 coins, 0 blocks) BUT faster

**Loop**: Returns to State 2 → 3 → 4 → 5 → 6 (loop infinito)

---

### Navigation Flow

```
App Launch
    ↓
Splash Screen (1-2s)
    ↓
Load State (AsyncStorage)
    ↓
    ├─→ [First Time User] → MainScreen (FTUE)
    │       ↓
    │   Tap to Mine
    │       ↓
    │   Buy Hardware → Hardware unlocked
    │       ↓
    │   Market Unlock (15 blocks)
    │       ↓
    │   Upgrades Unlock (1 hardware)
    │       ↓
    │   Progress to 21M blocks
    │       ↓
    │   Prestige
    │       ↓
    │   [Loop to MainScreen with prestige bonuses]
    │
    └─→ [Returning User] → Calculate Offline Progress
            ↓
        Show Offline Modal (if > 5 min offline)
            ↓
        MainScreen (continue where left off)
            ↓
        Active Play Session
            ↓
        Close App (auto-save)
```

---

### Screen-by-Screen Flow

#### MainScreen (Home/Mining)
**Accessible**: Always
**Content**:
- Blocks mined counter
- CryptoCoins balance
- Real Money balance (if Market unlocked)
- Production rate (CC/s)
- Tap area for manual mining
- Next unlock progress bar
- Quick stats (time played, next halving, etc.)

**Actions**:
- Tap to mine manually
- Navigate to Hardware
- Navigate to Market
- Navigate to Upgrades
- Navigate to Prestige (if unlocked)
- Navigate to Stats

---

#### HardwareScreen
**Accessible**: From MainScreen (bottom sheet or tab)
**Content**:
- List of all hardware (locked/unlocked)
- Each hardware shows:
  - Name, icon
  - Cost (CC or $)
  - Owned count
  - Production rate
  - "BUY" button (enabled/disabled)
  - Unlock requirement (if locked)
- Filter/sort options (optional, Phase 2+)

**Actions**:
- Buy hardware (tap "BUY")
- View hardware details (tap card to expand)
- Close and return to MainScreen

---

#### MarketScreen
**Accessible**: After unlocking (15 blocks + 1,000 CC)
**Content**:
- List of cryptocurrencies (Bitcoin, Ethereum, etc.)
- CryptoCoin highlighted:
  - Symbol: CC
  - Balance: X CC
  - Price: $0.001/CC
  - Total value: $X.XX
- Input: "Amount to sell"
- Preview: "You'll get: $X.XX"
- "SELL" button
- Last updated timestamp

**Actions**:
- Input amount to sell
- Tap "SELL" → Confirmation → Transaction complete
- View price history (chart, optional)
- Refresh prices (manual button)

---

#### UpgradesScreen
**Accessible**: After purchasing 1+ hardware
**Content**:
- List of all upgrades
- Categories:
  - Click Power
  - Production (CPU, GPU, ASIC)
  - Special
- Each upgrade shows:
  - Name, icon
  - Description (effect)
  - Cost ($)
  - Status (Locked / Available / Purchased ✅)
  - Unlock requirement (if locked)

**Actions**:
- Buy upgrade (tap "BUY")
- View upgrade details
- Filter by category (optional)

---

#### PrestigeScreen
**Accessible**: After mining 21M blocks
**Content**:
- Current Prestige Level: X
- Next Prestige Level: X+1
- Current Bonuses:
  - Production Boost: +X%
  - Click Boost: +X%
- Next Level Bonuses (highlighted)
- What You'll Keep (green box)
- What You'll Lose (red box)
- "PRESTIGE NOW" button (large, gold)
- Link to Stats/Badges

**Actions**:
- Tap "PRESTIGE NOW" → Confirmation modal
- View Stats
- View Badges
- Cancel (return to MainScreen)

---

#### StatsScreen
**Accessible**: Always (menu button)
**Content**:
- Tabs: Current Run | History | Badges
- **Current Run**:
  - Blocks mined this run
  - Coins earned this run
  - Money earned this run
  - Playtime this run
  - Hardware purchased
- **History**:
  - List of all prestige runs
  - Stats per run
  - Totals (all-time)
- **Badges**:
  - Grid of badges (locked/unlocked)
  - Progress bars for badges in progress

**Actions**:
- Switch tabs
- View badge details
- Share stats (optional, Phase 3+)

---

## Testing

### User Flow Tests (E2E)

```typescript
describe('Complete Game Flow', () => {
  it('should complete FTUE and first prestige', async () => {
    // Launch app
    await launch();

    // FTUE: First click
    await element(by.id('tap-area')).tap();
    await expect(element(by.id('crypto-coins'))).toHaveText('50');

    // FTUE: First hardware
    await tapMultipleTimes(by.id('tap-area'), 10); // Get to 500 CC
    await element(by.id('buy-basic-cpu')).tap();
    await expect(element(by.id('cpu-owned'))).toHaveText('1');

    // Market unlock
    await waitFor(element(by.id('market-tab')))
      .toBeVisible()
      .withTimeout(60000);

    // First sale
    await element(by.id('market-tab')).tap();
    await element(by.id('sell-amount')).typeText('500');
    await element(by.id('sell-button')).tap();
    await expect(element(by.id('real-money'))).not.toHaveText('$0.00');

    // Progress to completion (fast-forwarded)
    await mockGameState({ blocksMined: 21000000 });

    // Prestige unlock
    await expect(element(by.id('prestige-tab'))).toBeVisible();
    await element(by.id('prestige-tab')).tap();

    // Prestige action
    await element(by.id('prestige-now')).tap();
    await element(by.id('prestige-confirm-input')).typeText('PRESTIGE');
    await element(by.id('confirm-prestige')).tap();

    // Verify reset
    await expect(element(by.id('blocks-mined'))).toHaveText('0');
    await expect(element(by.id('prestige-level'))).toHaveText('1');
  });
});
```

### Flow Validation Checklist

- [ ] Fresh user completes FTUE without confusion
- [ ] All unlocks happen in correct order
- [ ] No feature accessible before its unlock condition
- [ ] Offline progress calculates correctly
- [ ] Returning user sees offline modal (if applicable)
- [ ] Prestige resets everything except prestige state
- [ ] Second run is faster than first (with prestige bonuses)
- [ ] No deadlocks (situations where player can't progress)
- [ ] No exploits (buying hardware with negative money, etc.)

---

## Analytics

```typescript
// Track complete user journey
analytics().logEvent('ftue_started', { timestamp: Date.now() });
analytics().logEvent('ftue_completed', { duration: ftueTime });

analytics().logEvent('session_started', { session_number: sessionCount });
analytics().logEvent('session_ended', { duration: sessionDuration });

analytics().logEvent('feature_unlocked', {
  feature: 'market',
  time_to_unlock: timeToUnlock,
});

analytics().logEvent('milestone_reached', {
  milestone: '1M_blocks',
  time_to_milestone: timeToMilestone,
});

analytics().logEvent('prestige_completed', {
  prestige_level: prestigeLevel,
  run_duration: runDuration,
});

// Funnel tracking
analytics().logEvent('funnel_step', {
  funnel: 'first_run',
  step: 'first_click',
  timestamp: Date.now(),
});
```

---

## Preguntas Abiertas

- [ ] **Daily rewards**: ¿Implementar recompensa diaria para incentivar logins?
  - **Recomendación**: Phase 2+, mejora retención

- [ ] **Push notifications**: ¿Notificar cuando offline progress alcanza cap (24h)?
  - **Recomendación**: Phase 3+, puede ser intrusivo

- [ ] **Social features**: ¿Permitir compartir stats/progress con amigos?
  - **Recomendación**: Phase 4+, no prioritario

- [ ] **Onboarding skip**: ¿Permitir skip de FTUE para power users?
  - **Recomendación**: No, FTUE es muy corto (< 5 min)

- [ ] **Checkpoint system**: ¿Guardar múltiples saves para recovery?
  - **Recomendación**: Sí, guardar last 3 auto-saves para corruption recovery

## Referencias

- Mobile Game FTUE Best Practices: https://www.gamasutra.com/blogs/FabioCaldeira/20180417/316623/The_First_Time_User_Experience_in_Mobile_Games.php
- Progressive Unlock Design: https://www.gdcvault.com/play/1025407/The-Art-of-Screen-Shake
- Idle Game Session Design: https://www.blog.liamcottle.com/idle-game-design
- Cookie Clicker Flow Analysis: https://cookieclicker.fandom.com/wiki/Gameplay
