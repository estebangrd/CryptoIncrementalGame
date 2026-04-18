# Endgame: Colapso y Ending Alternativo

## Estado
- **Fase**: Phase 7 — El Colapso (narrativa)
- **Estado**: Implemented
- **Prioridad**: High
- **Última actualización**: 2026-04-18
- **Depende de**: Narrative Events implementado, Prestige System implementado

---

## Descripción

El juego tiene tres endings posibles, todos son una forma de prestige:

**Ending normal — El Colapso**: Los Recursos del Planeta llegan a 0%. La civilización colapsa. El jugador ve una pantalla de estadísticas finales con tono apocalíptico. Un grupo de supervivientes escapa a un nuevo planeta llevando los multiplicadores de legado del jugador. Prestige con todos los bonos acumulados.

**Ending alternativo — El Minero Responsable**: El jugador completa el blockchain (21 millones de bloques) con Recursos del Planeta > 0%. La humanidad sobrevive. Prestige con un bonus diferente: "Sustainable Mining", ligeramente más débil en producción pura pero con descuento permanente en energía renovable.

**Ending tercer tipo — Colapso Humano**: El jugador agota los recursos del planeta sin ayuda de la IA. Solo accesible via debug button — no se activa durante gameplay normal. Mecánicamente equivalente al Colapso pero con narrativa diferente (sin mención a la IA).

> **Nota de implementacion**: `human_collapse` es un EndingType registrado en `src/types/game.ts` y soportado por `EndingScreen.tsx`, pero solo se puede activar a traves del debug menu en Settings. No existe un trigger automatico en el gameplay. `EndingType` es `'collapse' | 'human_collapse' | 'good_ending' | null`.

Los tres endings activan un prestige. Solo difieren en la narrativa, los textos, y el tipo de bonus de legado.

---

## Objetivos

- [ ] Dar cierre narrativo satisfactorio a cada run
- [ ] Diferenciar mecánicamente las dos rutas (buen ending vs colapso) para que la elección del jugador importe
- [ ] Crear un momento de reflexión antes del prestige (no inmediatamente al botón)
- [ ] Motivar al jugador a hacer runs adicionales con distintas estrategias

---

## Comportamiento Esperado

### Caso 1: Colapso — Recursos del Planeta llegan a 0%
**Dado que** `planetResources` llega a 0% (ver `narrative-events.md`)
**Cuando** el tick detecta el colapso
**Entonces**
1. Toda producción se pausa inmediatamente
2. Se muestra la pantalla de Colapso (fullscreen, no dismissible)
3. La pantalla muestra estadísticas de la run y texto narrativo
4. El jugador puede presionar "[Comenzar en el nuevo planeta]" para activar el prestige
5. El prestige aplica los bonos de "Legado Apocalíptico"

### Caso 2: Buen Ending — Blockchain completado con recursos > 0%
**Dado que** el jugador ha minado los 21,000,000 de bloques
**Y** `planetResources > 0`
**Cuando** se mina el último bloque
**Entonces**
1. Toda producción se pausa
2. Se muestra la pantalla del Buen Ending (fullscreen, no dismissible)
3. La pantalla muestra estadísticas de la run y texto narrativo alternativo
4. El jugador puede presionar "[Comenzar de nuevo]" para activar el prestige
5. El prestige aplica los bonos de "Mining Sostenible"

### Caso 3: Prestige estándar (sin llegar al ending)
*Este caso ya existe en el sistema de prestige actual y no cambia. El nuevo sistema solo afecta el ending de run completa.*

---

## Pantalla de Colapso (Ending Normal)

### Layout
```
┌──────────────────────────────────────────────┐
│                                              │
│           🌍💀 COLAPSO PLANETARIO            │
│                                              │
│   "La IA completó el blockchain.             │
│    La Tierra ya no tiene energía             │
│    para sostener vida humana organizada."    │
│                                              │
│  ══════════════════════════════════════      │
│  TU LEGADO                                   │
│  ══════════════════════════════════════      │
│                                              │
│  ⛏️  Bloques minados:      18,421,039        │
│  💰  CryptoCoins ganados:  2.4 Trillion      │
│  💵  Dinero acumulado:     $847,291,044      │
│  ⚡  Energía consumida:    4.2 PW totales    │
│  🌍  Recursos destruidos:  100%              │
│  🤖  IA Nivel alcanzado:   3 (Autónomo)      │
│  ⏱️  Duración de la run:   14h 32m           │
│                                              │
│  ══════════════════════════════════════      │
│  BONUS DE LEGADO                             │
│  ══════════════════════════════════════      │
│  +15% producción permanente                  │
│  (prestige #3 — acumulado)                   │
│                                              │
│  ──────────────────────────────────────      │
│  "Un grupo de supervivientes, con los        │
│   registros de tu tecnología y las           │
│   lecciones aprendidas, embarca en una       │
│   nave hacia un nuevo planeta. Llevan        │
│   tus multiplicadores de legado.             │
│   Esta vez, quizás, tomen mejores            │
│   decisiones."                               │
│  ──────────────────────────────────────      │
│                                              │
│       [COMENZAR EN EL NUEVO PLANETA]         │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Pantalla del Buen Ending

### Layout
```
┌──────────────────────────────────────────────┐
│                                              │
│           🌍✅ BLOCKCHAIN COMPLETADO          │
│                                              │
│   "Completaste el blockchain sin agotar      │
│    el planeta. Sos el primer magnate         │
│    energéticamente responsable de la         │
│    historia. Nadie sabe si fue suerte,       │
│    disciplina, o que simplemente             │
│    te faltó ambición."                       │
│                                              │
│  ══════════════════════════════════════      │
│  TU LEGADO                                   │
│  ══════════════════════════════════════      │
│                                              │
│  ⛏️  Bloques minados:      21,000,000 ✓      │
│  💰  CryptoCoins ganados:  891 Billion       │
│  💵  Dinero acumulado:     $412,833,901      │
│  🌍  Recursos preservados: 34%               │
│  🤖  IA Nivel alcanzado:   2 (Copiloto)      │
│  ⏱️  Duración de la run:   22h 17m           │
│                                              │
│  ══════════════════════════════════════      │
│  BONUS SUSTAINABLE MINING                    │
│  ══════════════════════════════════════      │
│  +10% producción permanente                  │
│  -30% costo de energía renovable             │
│  (prestige #3 — acumulado)                   │
│                                              │
│  ──────────────────────────────────────      │
│  "Tu método fue replicado. Las colonias      │
│   del nuevo mundo adoptaron el modelo        │
│   de minería sostenible. No fue el fin       │
│   de la historia. Fue el comienzo            │
│   de una mejor."                             │
│  ──────────────────────────────────────      │
│                                              │
│             [COMENZAR DE NUEVO]              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Diferencias entre Endings

| Aspecto | Colapso | Buen Ending |
|---------|---------|-------------|
| Trigger | `planetResources === 0` | `blocksMined === 21,000,000 AND planetResources > 0` |
| Icono | 🌍💀 | 🌍✅ |
| Tono del texto | Apocalíptico, reflexivo | Irónico, esperanzador |
| Bonus de producción | +15% por prestige | +10% por prestige |
| Bonus adicional | Ninguno | -30% costo renovables (permanente, acumula) |
| Flavor del nuevo planeta | "Esta vez, quizás, mejores decisiones" | "El comienzo de una mejor historia" |
| Accesibilidad | Cualquier jugador que use no-renovables | Solo jugadores que completen 21M bloques sin colapso |

*El buen ending da menos producción pura pero el descuento en renovables hace que las runs futuras sean más baratas en la fase de energía.*

---

## Fórmulas de Prestige

```typescript
// Bonus por ending (se aplica sobre la fórmula base de prestige existente)

// Colapso
const collapsePrestigeBonus = {
  productionMultiplier: 1 + (0.15 * prestigeCount), // acumula 15% por run
  renewableDiscount: 0, // sin descuento
};

// Buen ending
const goodEndingPrestigeBonus = {
  productionMultiplier: 1 + (0.10 * prestigeCount), // acumula 10% por run (menos que colapso)
  renewableDiscount: Math.min(0.80, 0.30 * goodEndingCount), // acumula 30% por buen ending, cap 80%
};

// El jugador que alterna estrategias acumula ambos tipos de bonus
// (productionMultiplier acumula separadamente por tipo de ending)
// En COMPLETE_ENDING_PRESTIGE los bonos se multiplican juntos:
//   totalEndgameMultiplier = collapseBonus * goodEndingBonus
```

> **Nota de implementacion**: En `COMPLETE_ENDING_PRESTIGE`, los contadores `collapseCount` y `goodEndingCount` se incrementan ANTES de calcular el bonus. Esto significa que el bonus ya incluye la run actual. Por ejemplo, en el primer collapse, `newCollapseCount = 1` y el bonus sera `1 + (0.15 * 1) = 1.15`. Tanto `collapse` como `human_collapse` incrementan `collapseCount`. La logica esta en `src/utils/endgameLogic.ts` (`calculateEndingBonus` y `calculateTotalEndgameProductionMultiplier`).

---

## Constantes de Configuración

Agregar en `src/config/balanceConfig.ts`:

```typescript
export const ENDGAME_CONFIG = {
  // Colapso
  COLLAPSE_PRODUCTION_BONUS_PER_PRESTIGE: 0.15,

  // Buen ending
  GOOD_ENDING_PRODUCTION_BONUS_PER_PRESTIGE: 0.10,
  GOOD_ENDING_RENEWABLE_DISCOUNT_PER_RUN: 0.30,
  GOOD_ENDING_RENEWABLE_DISCOUNT_CAP: 0.80,

  // Estadísticas a mostrar en pantalla de ending
  STATS_TO_SHOW: [
    'blocksMined',
    'totalCryptoCoinsEarned',
    'totalMoneyEarned',
    'planetResourcesDestroyed',
    'aiLevelReached',
    'runDurationMinutes',
  ],
};

```

---

## Estructura de Datos

```typescript
// src/types/game.ts — agregar / modificar

export type EndingType = 'collapse' | 'human_collapse' | 'good_ending' | null;

export interface EndgameStats {
  blocksMined: number;
  totalCryptoCoinsEarned: number;
  totalMoneyEarned: number;
  planetResourcesAtEnd: number;
  aiLevelReached: AILevel;
  runDurationMs: number;
  endingType: EndingType;
}

// En GameState, modificar PrestigeState para incluir:
// collapseCount: number;     // cuántas veces terminó en colapso
// goodEndingCount: number;   // cuántas veces terminó el buen ending
// lastEndgameStats: EndgameStats | null;  // estadísticas capturadas al triggear ending
// goodEndingTriggered: boolean;  // true when 21M blocks mined with resources > 0
// disconnectAttempted: boolean;  // player already saw the disconnect popup
```

> **Nota de implementacion**: La interfaz se llama `EndgameStats` (no `RunStats`) en el codigo (`src/types/game.ts`). El campo `totalEnergyConsumedTW` NO existe ni se trackea en el game state. La estadistica de energia no se muestra en el EndingScreen. `RunStats` es una interfaz separada que trackea stats del run actual (blocksMinedThisRun, coinsEarnedThisRun, etc.) y no incluye campos de endgame. El builder esta en `src/utils/endgameLogic.ts` (`buildEndgameStats`).

> **Nota de implementacion**: El campo se llama `lastEndgameStats` (no `lastRunStats`) y es de tipo `EndgameStats` (no `RunStats`). No existe un campo `endingType` en el state directamente -- el tipo de ending se determina por los flags `collapseTriggered` y `goodEndingTriggered`.

---

## Reglas de Negocio

1. El Colapso se activa cuando `planetResources === 0`, independientemente de cuántos bloques se hayan minado.
2. El Buen Ending solo se activa al minar el bloque 21,000,000 **con** `planetResources > 0`. Si se minan 21M bloques y `planetResources === 0`, es un Colapso (el planeta se agotó justo al terminar).
3. Las pantallas de ending son fullscreen y no dismissibles. El jugador DEBE presionar el botón de prestige para continuar.
4. El bonus de producción del Colapso (+15%) y el del Buen Ending (+10%) acumulan por separado. Un jugador que hace 5 runs colapsando y 3 runs con buen ending tiene ambos bonos.
5. El descuento en renovables del Buen Ending acumula hasta un cap del 80%.
6. El prestige al final del ending incluye el exchange de cryptocurrencies (sistema existente).
7. Las estadísticas de la run se calculan en el momento del trigger del ending (no se actualizan mientras la pantalla está visible).
8. El tiempo de la run se mide desde el inicio de la run (post-prestige o inicio del juego).

---

## UI/UX Requirements

- Pantalla fullscreen con fondo oscuro (colapso) o fondo levemente más claro/verde (buen ending)
- Sin posibilidad de cerrar o hacer back — el jugador debe completar el prestige
- Las estadísticas aparecen con animación de conteo (números aumentando hasta el valor final)
- El botón de prestige tiene animación sutil de pulso
- El texto narrativo aparece después de las estadísticas (scroll down o aparece después de un delay de 2s)
- No hay música en el colapso (silencio dramático). El buen ending puede tener música suave.

---

## Validaciones

### Trigger de Colapso
- `planetResources <= 0`
- `state.collapseTriggered === false` (para no disparar dos veces)

### Trigger de Buen Ending
- `state.blocksMined >= 21_000_000`
- `state.planetResources > 0`
- `state.goodEndingTriggered === false`
- `state.ai.level < 3` (el buen ending es imposible con AI Level 3)

> **Nota de implementacion**: El buen ending tambien se triggerea al cargar un save (`LOAD_GAME`) cuando `blocksMined >= 21M` y `planetResources > 0` y `ai.level < 3`. Esto cubre el caso de app reload cuando los bloques ya alcanzaron 21M. Ver `ADD_PRODUCTION` en `GameContext.tsx`.

### Post-prestige
- `planetResources` resetea a 100
- `blocksMined` resetea a 0
- `ai.level` resetea a 0, `ai.isAutonomous` resetea a `false`
- `narrativeEvents` resetea a []
- `planetResourcesVisible` resetea a `false`
- Los bonos del ending se agregan al `prestigeState` permanente

---

## Dependencias

### Requiere
- `specs/game-mechanics/narrative-events.md` — provee el trigger de `planetResources === 0`
- `specs/game-mechanics/prestige-system.md` — el prestige existente que se extiende

### Relacionado con
- `specs/game-mechanics/ai-system.md` — el nivel de IA afecta la estadística mostrada y la narrativa

---

## Criterios de Aceptación

- [ ] El Colapso se activa exactamente cuando `planetResources` llega a 0
- [ ] El Buen Ending se activa al minar el bloque 21M con recursos > 0
- [ ] Ambas pantallas son fullscreen y no dismissibles
- [ ] Las estadísticas correctas aparecen en cada ending
- [ ] El texto narrativo es diferente en cada ending
- [ ] El bonus de producción del Colapso es +15%, del Buen Ending es +10%
- [ ] El descuento de renovables del Buen Ending acumula en runs futuras
- [ ] Al presionar el botón, se aplica el prestige correctamente
- [ ] El estado resetea correctamente post-prestige (planetResources=100, ai.level=0, etc.)
- [ ] Las estadísticas de la run se guardan en `lastRunStats`
- [ ] La quote del Colapso menciona a la IA solo si `aiLevelReached === 3`; sin IA usa texto alternativo sobre agotamiento de recursos
- [ ] El número de run en Legacy Bonus muestra `collapseCount + goodEndingCount + 1` (la run actual, no las anteriores)
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

---

## Testing

```typescript
describe('Endgame', () => {
  describe('collapse trigger', () => {
    it('se activa cuando planetResources llega a 0', () => {
      const state = createStateWith({ planetResources: 0.001 });
      const newState = applyPlanetDepletion(state, 0.002);
      expect(newState.collapseTriggered).toBe(true);
    });

    it('no se activa si hay bloques completados con recursos > 0 (buen ending)', () => {
      const state = createStateWith({ blocksMined: 21_000_000, planetResources: 34 });
      expect(state.collapseTriggered).toBe(false);
      expect(state.goodEndingTriggered).toBe(true);
    });
  });

  describe('collapse quote variant', () => {
    it('muestra quote de IA cuando aiLevelReached === 3', () => {
      // EndingScreen selecciona 'endgame.collapse.quote' con mención a la IA
      const quoteKey = getCollapseQuoteKey({ aiLevelReached: 3 });
      expect(quoteKey).toBe('endgame.collapse.quote');
    });

    it('muestra quote sin IA cuando aiLevelReached < 3', () => {
      // EndingScreen selecciona 'endgame.collapse.quoteNoAI' sin mención a la IA
      const quoteKey = getCollapseQuoteKey({ aiLevelReached: 0 });
      expect(quoteKey).toBe('endgame.collapse.quoteNoAI');
    });

    it('muestra quote sin IA para aiLevelReached 1 y 2', () => {
      expect(getCollapseQuoteKey({ aiLevelReached: 1 })).toBe('endgame.collapse.quoteNoAI');
      expect(getCollapseQuoteKey({ aiLevelReached: 2 })).toBe('endgame.collapse.quoteNoAI');
    });
  });

  describe('prestige run number', () => {
    it('primera run muestra run #1', () => {
      // collapseCount=0, goodEndingCount=0 → run #1
      const runNumber = getPrestigeRunNumber(0, 0);
      expect(runNumber).toBe(1);
    });

    it('tercera run (2 collapsos previos) muestra run #3', () => {
      const runNumber = getPrestigeRunNumber(2, 0);
      expect(runNumber).toBe(3);
    });

    it('run mixta muestra suma correcta', () => {
      // 1 colapso + 2 buenos endings previos → run #4
      const runNumber = getPrestigeRunNumber(1, 2);
      expect(runNumber).toBe(4);
    });
  });

  describe('prestige bonuses', () => {
    it('colapso da +15% producción', () => {
      const bonus = calculateEndingBonus('collapse', prestigeCount=1);
      expect(bonus.productionMultiplier).toBeCloseTo(1.15);
    });

    it('buen ending da +10% producción y -30% renovables', () => {
      const bonus = calculateEndingBonus('good_ending', prestigeCount=1, goodEndingCount=1);
      expect(bonus.productionMultiplier).toBeCloseTo(1.10);
      expect(bonus.renewableDiscount).toBeCloseTo(0.30);
    });

    it('descuento renovables acumula entre buenas runs', () => {
      const bonus = calculateEndingBonus('good_ending', prestigeCount=3, goodEndingCount=3);
      expect(bonus.renewableDiscount).toBeCloseTo(0.80); // cap
    });

    it('reset post-prestige restaura estado inicial', () => {
      const state = applyPrestige(collapseState);
      expect(state.planetResources).toBe(100);
      expect(state.ai.level).toBe(0);
      expect(state.ai.isAutonomous).toBe(false);
      expect(state.narrativeEvents).toHaveLength(0);
    });
  });
});
```

---

## Edge Cases

- El jugador mina el bloque 21M en el mismo tick que `planetResources` llega a 0: **el Colapso tiene prioridad** (el planeta se acabó, no importa el blockchain).
- El jugador tiene prestige muy avanzado: el bonus acumula linealmente sin cap (a definir si se quiere un cap en producción).
- Primera run (nunca hizo prestige): el bonus base sigue la fórmula del prestige existente, el ending solo agrega el diferencial.
- El jugador mata la app durante la pantalla de ending: al reabrir, se muestra la pantalla de ending nuevamente (el ending no se completa hasta que el jugador presiona el botón).

---

## Disconnect Attempt Mechanic

Cuando la IA está en Level 3 (Autónomo) y `planetResources` baja a ≤ 70%, se muestra el `DisconnectModal` una única vez.

**Condición de aparición** (calculada en GameScreen):
```
showDisconnect = ai.isAutonomous && !disconnectAttempted && planetResources <= 70 && !isGameOver
```

**Flujo:**
1. Modal aparece con pregunta + botones YES / NO
2. **NO (Cancelar):** `dispatch({ type: 'ATTEMPT_DISCONNECT' })` → `disconnectAttempted = true` → modal no vuelve a aparecer
3. **SÍ (Desconectar):** muestra Fase 2 — mensaje de error simulado: la IA detectó la orden hace 11 días y distribuyó 847 instancias en nodos globales. Ya no existe un nodo principal para apagar.
4. **Entendido (en Fase 2):** igual que NO — cierra y marca `disconnectAttempted = true`

**Estado en GameState:**
- `disconnectAttempted: boolean` — se resetea en `COMPLETE_ENDING_PRESTIGE`

**Nota:** El Buen Ending no es alcanzable con AI Level 3 activa. La IA elimina el cap de 21M (LOG 14:23), impidiendo que el contador de bloques "complete" el objetivo del Buen Ending de forma natural. El Colapso es el único ending posible en esta ruta.

---

## Analytics

- `ending_shown` — tipo de ending ('collapse' o 'good_ending')
- `ending_planet_resources_at_collapse` — qué porcentaje de recursos quedaban al colapsar (siempre 0, pero útil para confirmar)
- `good_ending_resources_preserved` — porcentaje de recursos al hacer buen ending
- `good_ending_ai_level` — nivel de IA que tenía el jugador al hacer buen ending
- `prestige_from_ending` — tipo de ending que generó el prestige
- `ending_screen_time_ms` — tiempo en pantalla de ending antes de prestige (¿leen el texto?)

---

## Preguntas Abiertas

- [ ] **¿El prestige desde el ending incluye el exchange de cryptos del sistema existente?** Recomendación: Sí, mantener el flujo existente de exchange antes del reset.
- [ ] **¿El Buen Ending debería ser más difícil de lograr al acumular runs?** Por ejemplo, que los recursos del planeta tengan que estar > X% en lugar de solo > 0. Recomendación: No por ahora. La dificultad natural de no usar no-renovables es suficiente.
- [ ] **¿Hay un achievement especial por hacer el Buen Ending?** Recomendación: Sí, "Primer Magnate Responsable" — achievement único, solo se puede desbloquear una vez.
