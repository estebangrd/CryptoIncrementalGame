# Prestige Skill Tree

## Estado
- **Fase**: Post-narrativa (Retention)
- **Estado**: 📋 Planned
- **Prioridad**: High (Replayability & Prestige Retention)
- **Última actualización**: 2026-04-25

## Descripción

El **Skill Tree** es una capa de progresión permanente complementaria al sistema de Prestige. Cada nivel de prestige otorga **1 punto de skill** que el jugador puede invertir en uno de tres árboles lineales (Hardware / Mercado / Click) para obtener bonos aditivos permanentes sobre el estado base del juego.

A diferencia del bono de prestige base (que escala linealmente con `prestigeLevel`), el skill tree permite **elegir build**: el jugador decide en qué rama invertir y puede hacer **respec** para probar otra configuración a costa de perder 1 punto del total disponible.

Los nodos tienen **coste escalado por posición**: nodos tempranos cuestan 1 punto, nodos finales cuestan 3. Esto refuerza la sensación de "los capstones son aspiracionales" sin castigar al jugador casual que quiere bonos rápidos.

### Mastery Bonuses (post-completion)

Una vez que el jugador **completa el árbol** (compra los 18 nodos = 36 puntos), se desbloquean los **Mastery Bonuses**: el sistema retoma los bonos automáticos clásicos (+10% producción y +5% click por nivel post-mastery), reemplazando el viejo sistema lineal de prestige. Esto da progresión infinita para jugadores veteranos sin romper la fase de "elegir build" del early/mid game.

**Fórmula del nivel de maestría**:
```
masteryLevel = isMastered ? max(0, prestigeLevel - 36 - lostPoints) : 0
```

- `isMastered`: true cuando los 18 nodos están comprados.
- `36`: coste total del árbol completo (suma de todos los `NODE_COSTS`).
- `lostPoints`: si el jugador hace respec, `lostPoints` aumenta y la mastery se "pausa" (el árbol queda incompleto). Cada respec cuesta 1 nivel post-mastery permanente: el jugador necesita 1 prestige adicional para "reconstruir" el árbol y volver al mismo masteryLevel.

**Ejemplo**:
- P36 mastered: level=0 (sin bonos extra todavía)
- P40 mastered: level=4 → +40% prod, +20% click
- P40 + respec: mastered=false → level=0
- P41 (recomprar todo): mastered=true, lost=1 → level = 41-36-1 = 4 (continuación)

El objetivo es dar un "gancho" motivacional en cada prestige (el jugador quiere el siguiente punto) sin romper el balance del juego: los nodos son **aditivos dentro de cada rama**, no multiplicativos, con techos predecibles.

## Objetivos
- [ ] Motivar al jugador a alcanzar nuevos niveles de prestige con progresión permanente visible
- [ ] Introducir diversidad de builds (Hardware / Mercado / Click) con trade-offs reales
- [ ] Mantener balance predecible (stacks aditivos, nunca multiplicativos compuestos)
- [ ] Permitir experimentación via respec sin romper la economía del juego
- [ ] Integrar el sistema en la pantalla de Prestige existente sin fricción UX
- [ ] No requerir rebalance del juego base (bonos son tunneables vía `balanceConfig.ts`)

## Comportamiento Esperado

### Caso de Uso 1: Primer Punto de Skill Tree
**Dado que** el jugador completa su primer prestige (prestigeLevel pasa de 0 a 1)
**Cuando** abre la pantalla de Prestige
**Entonces**
- Aparece un **nuevo sub-tab "Skill Tree"** en PrestigeScreen (no estaba visible antes)
- El sub-tab muestra un indicador/badge "1 punto disponible"
- Al entrar al sub-tab, se muestra un árbol con 3 ramas (Hardware / Mercado / Click), 6 nodos cada una
- Solo el **Nodo 1** de cada rama es clickeable; nodos 2-6 aparecen bloqueados (grises)
- Un panel superior indica: "Puntos disponibles: 1 · Puntos totales ganados: 1 · Puntos perdidos: 0"

### Caso de Uso 2: Invertir Puntos en un Nodo
**Dado que** el jugador tiene ≥ `node.cost` puntos disponibles y abre el Skill Tree
**Cuando** presiona un nodo desbloqueable (nodo 1 de cualquier rama, o el siguiente nodo de una rama ya iniciada)
**Entonces**
- Se muestra un modal de confirmación con: nombre del nodo, descripción del bono (ej. "+5% producción de hardware"), coste (`node.cost` puntos)
- Al confirmar:
  - Puntos disponibles se reducen en `node.cost` (1, 2 o 3 según posición)
  - El nodo se marca como comprado (estado visual: verde/neón)
  - El **siguiente nodo** de la misma rama se desbloquea (pasa de gris → clickeable) si el jugador tiene puntos suficientes para el siguiente coste
  - Se recalculan stats del juego aplicando el bono del nodo
  - Toast: "Skill aprendido: +5% producción de hardware"

### Caso de Uso 3: Progresión Lineal dentro de una Rama
**Dado que** el jugador tiene Nodo 1 y Nodo 2 comprados en rama Hardware
**Cuando** entra al Skill Tree con 1 punto disponible
**Entonces**
- Nodo 3 de Hardware aparece clickeable
- Nodos 4, 5, 6 de Hardware aparecen bloqueados
- Nodos 1 de Mercado y Click aparecen clickeable (puede iniciar otra rama)
- El jugador elige libremente dónde invertir

### Caso de Uso 4: Reset del Skill Tree (Respec)
**Dado que** el jugador invirtió al menos 1 punto
**Cuando** presiona el botón "Resetear Skill Tree"
**Entonces**
- Se muestra modal de confirmación con texto claro:
  - "Se devolverán todos los puntos invertidos MENOS 1"
  - "El punto perdido es permanente"
  - "Puntos perdidos totales: X (actual) → X+1 (después del reset)"
- Al confirmar:
  - Todos los nodos comprados se desmarcan
  - `spentCount` se resetea a 0
  - `lostPoints` se incrementa en 1
  - Puntos disponibles = `prestigeLevel - lostPoints` (todos quedan disponibles)
  - Se recalculan stats del juego sin los bonos del skill tree
  - Toast: "Skill Tree reseteado. 1 punto perdido permanentemente."

### Caso de Uso 5: Aplicación de Bonos en Cálculos
**Dado que** el jugador tiene nodos comprados en cualquier rama
**Cuando** el juego calcula producción, precio de venta o click power
**Entonces**
- **Producción de hardware**: Se aplica `skillTreeHardwareMultiplier` sobre el total calculado (después de prestige multiplier y antes de offline/booster multipliers)
- **Precio de venta**: Se aplica `skillTreeMarketMultiplier` sobre el precio base del market al vender CC por cash
- **Click power**: Se aplica `skillTreeClickMultiplier` al reward del click manual (después del click multiplier de prestige)
- Los tres multipliers son **aditivos dentro de cada rama** (suma de todos los nodos comprados), no multiplicativos entre nodos

### Caso de Uso 6: Visibilidad Pre-Prestige
**Dado que** el jugador está en `prestigeLevel === 0`
**Cuando** abre la pantalla de Prestige
**Entonces**
- El sub-tab "Skill Tree" **NO aparece** en la barra de sub-tabs
- Solo ve los sub-tabs: `prestige | history | badges`
- Al alcanzar prestige 1, el sub-tab aparece automáticamente

### Caso de Uso 7: Skill Tree Persistente Entre Prestiges
**Dado que** el jugador hace un segundo prestige (nivel 1 → 2)
**Cuando** completa el reset de prestige
**Entonces**
- Los nodos comprados **NO se resetean** (son permanentes)
- Se otorga 1 punto nuevo disponible (`prestigeLevel - spentCount - lostPoints`)
- El jugador puede invertirlo en el siguiente nodo desbloqueable

## Fórmulas y Cálculos

### Puntos Disponibles
```typescript
function calculateAvailableSkillPoints(state: GameState): number {
  // Cost-based: spent = sum of costs of purchased nodes (NOT count)
  const spent = state.prestigeSkillTree.nodes
    .filter(n => n.purchased)
    .reduce((sum, n) => sum + n.cost, 0);
  return Math.max(0, state.prestigeLevel - spent - state.prestigeSkillTree.lostPoints);
}
```

### Multiplicador de Producción de Hardware
```typescript
function calculateSkillTreeHardwareMultiplier(state: GameState): number {
  const hardwareNodes = state.prestigeSkillTree.nodes.filter(
    n => n.purchased && n.branch === 'hardware'
  );
  const totalBonus = hardwareNodes.reduce((sum, n) => sum + n.value, 0);
  return 1 + totalBonus;
  // Ejemplo: todos los 6 nodos comprados → 1 + (0.05 + 0.10 + 0.10 + 0.15 + 0.15 + 0.25) = 1.80 (+80%)
}
```

### Multiplicador de Mercado (Sell Price)
```typescript
function calculateSkillTreeMarketMultiplier(state: GameState): number {
  const marketNodes = state.prestigeSkillTree.nodes.filter(
    n => n.purchased && n.branch === 'market'
  );
  const totalBonus = marketNodes.reduce((sum, n) => sum + n.value, 0);
  return 1 + totalBonus;
  // Ejemplo: todos los 6 nodos → 1 + (0.03 + 0.05 + 0.07 + 0.10 + 0.12 + 0.15) = 1.52 (+52%)
}
```

### Multiplicador de Click Power
```typescript
function calculateSkillTreeClickMultiplier(state: GameState): number {
  const clickNodes = state.prestigeSkillTree.nodes.filter(
    n => n.purchased && n.branch === 'click'
  );
  const totalBonus = clickNodes.reduce((sum, n) => sum + n.value, 0);
  return 1 + totalBonus;
  // Ejemplo: todos los 6 nodos → 1 + (0.10 + 0.15 + 0.20 + 0.25 + 0.30 + 0.50) = 2.50 (+150%)
}
```

### Integración en calculateTotalProduction
```typescript
function calculateTotalProduction(state: GameState): number {
  let total = 0;
  for (const hw of state.hardware) {
    if (hw.id === 'manual_mining') continue;
    const speed = calculateHardwareMiningSpeed(hw, state.upgrades);
    total += speed * hw.blockReward * hw.owned;
  }

  const prestigeMult = calculateProductionMultiplier(state.prestigeLevel);
  const skillTreeMult = calculateSkillTreeHardwareMultiplier(state);
  // Orden: base × prestige × skillTree × otros (boosters, etc.)
  return total * prestigeMult * skillTreeMult;
}
```

### Integración en Sell Price (Market)
```typescript
function calculateSellPrice(state: GameState, basePrice: number): number {
  const skillTreeMarketMult = calculateSkillTreeMarketMultiplier(state);
  return basePrice * skillTreeMarketMult;
  // Market events (whale dump, media hype) se aplican ANTES de basePrice
  // El skill tree solo multiplica el precio resultante
}
```

### Integración en Click Reward
```typescript
function calculateClickReward(state: GameState): number {
  const base = BALANCE_CONFIG.MANUAL_CLICK_REWARD;
  const prestigeMult = calculateClickMultiplier(state.prestigeLevel);
  const skillTreeMult = calculateSkillTreeClickMultiplier(state);
  const upgradeMult = state.upgrades
    .filter(u => u.purchased && u.effect.type === 'click')
    .reduce((acc, u) => acc * u.effect.value, 1);

  return base * prestigeMult * skillTreeMult * upgradeMult;
}
```

### Verificación de Nodo Desbloqueable
```typescript
function canPurchaseNode(state: GameState, nodeId: string): boolean {
  const node = SKILL_TREE_NODES.find(n => n.id === nodeId);
  if (!node) return false;

  // Ya comprado?
  if (state.prestigeSkillTree.nodes.find(n => n.id === nodeId)?.purchased) return false;

  // Puntos suficientes para el coste del nodo?
  if (calculateAvailableSkillPoints(state) < node.cost) return false;

  // Nodo anterior de la misma rama comprado? (excepto nodo 1)
  if (node.position === 1) return true;
  const prevNodeId = `${node.branch}_${node.position - 1}`;
  const prevNode = state.prestigeSkillTree.nodes.find(n => n.id === prevNodeId);
  return !!prevNode?.purchased;
}
```

### Reset (Respec)
```typescript
function resetSkillTree(state: GameState): GameState {
  const newLostPoints = state.prestigeSkillTree.lostPoints + 1;
  const resetNodes = state.prestigeSkillTree.nodes.map(n => ({ ...n, purchased: false }));

  return {
    ...state,
    prestigeSkillTree: {
      ...state.prestigeSkillTree,
      nodes: resetNodes,
      lostPoints: newLostPoints,
    },
  };
  // Nota: recalculateGameStats se invoca después automáticamente
}
```

## Constantes de Configuración

En `src/config/balanceConfig.ts`:

```typescript
export const SKILL_TREE_CONFIG = {
  // Número de ramas y nodos por rama
  BRANCHES: ['hardware', 'market', 'click'] as const,
  NODES_PER_BRANCH: 6,

  // Puntos otorgados por prestige
  POINTS_PER_PRESTIGE: 1,

  // Coste de respec (puntos perdidos permanentemente)
  RESPEC_COST: 1,

  // Valores de bonos aditivos por nodo (branch → [node1, ..., node6])
  NODE_VALUES: {
    hardware: [0.05, 0.10, 0.10, 0.15, 0.15, 0.25],  // +80% maxeado
    market:   [0.03, 0.05, 0.07, 0.10, 0.12, 0.15],  // +52% maxeado
    click:    [0.10, 0.15, 0.20, 0.25, 0.30, 0.50],  // +150% maxeado
  },

  // Coste por posición (1..6). Maxear una rama = 1+1+2+2+3+3 = 12 puntos.
  // Árbol completo (18 nodos) = 36 puntos = 36 prestiges.
  NODE_COSTS: [1, 1, 2, 2, 3, 3] as const,

  // Iconos/colores por rama (referenciar theme.ts)
  BRANCH_THEMES: {
    hardware: { color: '#00ff88', icon: 'chip' },     // neon green
    market:   { color: '#ffd600', icon: 'trending' }, // yellow
    click:    { color: '#00e5ff', icon: 'touch' },    // cyan
  },
} as const;
```

## Estructura de Datos

### GameState (Nuevo Campo)
```typescript
interface GameState {
  // ... campos existentes ...

  // Skill Tree state
  prestigeSkillTree: PrestigeSkillTree;
}
```

### PrestigeSkillTree
```typescript
interface PrestigeSkillTree {
  nodes: SkillNode[];           // Todos los 18 nodos con estado comprado/no
  lostPoints: number;            // Puntos perdidos por respec (acumulativo)
}
```

### SkillNode
```typescript
interface SkillNode {
  id: string;                    // Ej: "hardware_1", "market_3", "click_6"
  branch: 'hardware' | 'market' | 'click';
  position: 1 | 2 | 3 | 4 | 5 | 6;
  value: number;                 // Bono aditivo (ej: 0.05 = +5%)
  cost: number;                  // Puntos requeridos (1, 2 o 3 según posición)
  nameKey: string;               // Ej: "skillTree.hardware.node1.name"
  descriptionKey: string;        // Ej: "skillTree.hardware.node1.desc"
  purchased: boolean;
}
```

### Estado Inicial
```typescript
const initialSkillTree: PrestigeSkillTree = {
  nodes: SKILL_TREE_CONFIG.BRANCHES.flatMap(branch =>
    Array.from({ length: SKILL_TREE_CONFIG.NODES_PER_BRANCH }, (_, i) => ({
      id: `${branch}_${i + 1}`,
      branch,
      position: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6,
      value: SKILL_TREE_CONFIG.NODE_VALUES[branch][i],
      nameKey: `skillTree.${branch}.node${i + 1}.name`,
      descriptionKey: `skillTree.${branch}.node${i + 1}.desc`,
      purchased: false,
    }))
  ),
  lostPoints: 0,
};
```

## Tabla de Nodos

### Rama Hardware (Producción)
| # | Bono | Valor acumulado | Coste | Coste acumulado | Requisito |
|---|------|----------------|-------|------------------|-----------|
| 1 | +5% producción | +5% | 1 | 1 | Ninguno |
| 2 | +10% producción | +15% | 1 | 2 | Hardware 1 |
| 3 | +10% producción | +25% | 2 | 4 | Hardware 2 |
| 4 | +15% producción | +40% | 2 | 6 | Hardware 3 |
| 5 | +15% producción | +55% | 3 | 9 | Hardware 4 |
| 6 | +25% producción (capstone) | **+80%** | 3 | **12** | Hardware 5 |

### Rama Mercado (Sell Price)
| # | Bono | Valor acumulado | Coste | Coste acumulado | Requisito |
|---|------|----------------|-------|------------------|-----------|
| 1 | +3% precio venta | +3% | 1 | 1 | Ninguno |
| 2 | +5% precio venta | +8% | 1 | 2 | Mercado 1 |
| 3 | +7% precio venta | +15% | 2 | 4 | Mercado 2 |
| 4 | +10% precio venta | +25% | 2 | 6 | Mercado 3 |
| 5 | +12% precio venta | +37% | 3 | 9 | Mercado 4 |
| 6 | +15% precio venta (capstone) | **+52%** | 3 | **12** | Mercado 5 |

### Rama Click (Click Power)
| # | Bono | Valor acumulado | Coste | Coste acumulado | Requisito |
|---|------|----------------|-------|------------------|-----------|
| 1 | +10% click power | +10% | 1 | 1 | Ninguno |
| 2 | +15% click power | +25% | 1 | 2 | Click 1 |
| 3 | +20% click power | +45% | 2 | 4 | Click 2 |
| 4 | +25% click power | +70% | 2 | 6 | Click 3 |
| 5 | +30% click power | +100% | 3 | 9 | Click 4 |
| 6 | +50% click power (capstone) | **+150%** | 3 | **12** | Click 5 |

### Total para árbol completo
- Maxear una rama: **12 prestiges**
- Maxear el árbol completo (18 nodos): **36 prestiges**

## Reglas de Negocio

1. **Solo 1 punto por prestige level**: Progresión garantizada pero escasa.
   - Coste de los nodos escalado por posición: posiciones 1–2 = 1 punto, 3–4 = 2 puntos, 5–6 = 3 puntos.
   - Maxear una rama requiere 12 puntos (= 12 prestiges); el árbol completo, 36 puntos.
2. **Progresión lineal por rama**: Debe comprarse nodo N antes de poder comprar N+1 dentro de la misma rama.
3. **Ramas independientes**: El jugador puede mezclar nodos de distintas ramas libremente.
4. **Nodos son permanentes entre prestiges**: Hacer prestige NO resetea el skill tree.
5. **Respec pierde 1 punto permanentemente**: `lostPoints` se acumula y nunca se recupera.
6. **No hay cooldown en respec**: Se puede resetear todas las veces que el jugador quiera (pero cada reset pierde 1 punto).
7. **Bonos aditivos dentro de la rama**: Se suman entre sí (no se multiplican) — techo predecible.
8. **Bonos multiplicativos entre sistemas**: El multiplier final de skill tree se multiplica con el de prestige base (no se suma).
9. **Skill Tree invisible en prestigeLevel 0**: El sub-tab no renderiza hasta primer prestige.
10. **No afecta market events ni NPC logic**: El bono de Mercado solo multiplica el precio final al vender CC por cash.
11. **No hay respec "gratis" la primera vez**: Todo reset cuesta 1 punto desde el inicio.
12. **El jugador puede perder todos sus puntos**: Si hace respec N veces sin tener al menos N+1 puntos ganados, queda con 0 puntos disponibles. Válido (diseño intencional).

## UI/UX Requirements

### Sub-tab "Skill Tree" en PrestigeScreen
- [ ] Solo visible si `prestigeLevel >= 1`
- [ ] Orden en barra de sub-tabs: `prestige | skillTree | history | badges`
- [ ] Badge/indicador con número de puntos disponibles (ej: "1" en esquina del tab)
- [ ] Color del badge: cyan (`#00e5ff`) cuando hay puntos disponibles

### Panel Superior (Stats del Skill Tree)
- [ ] "Puntos disponibles: X" (destacado, verde si > 0)
- [ ] "Puntos totales ganados: Y" (prestige level actual)
- [ ] "Puntos perdidos por respec: Z" (en gris, informativo)
- [ ] Botón "Resetear Skill Tree" (outline rojo, solo activo si hay al menos 1 nodo comprado)

### Árbol Visual
- [ ] 3 columnas (una por rama): Hardware / Mercado / Click
- [ ] Cada columna con 6 nodos verticales (top → bottom: nodo 1 → nodo 6, lectura natural).
  - Decisión UX: el nodo 1 (siempre el primero accionable post-prestige) debe estar visible inmediatamente al entrar al árbol, sin requerir scroll.
- [ ] Nodos conectados con líneas verticales
- [ ] Header de cada columna con icono + nombre de la rama + total bonus actual acumulado
- [ ] Estados visuales de nodo:
  - **Comprado**: Verde neón (`#00ff88`) con glow, check mark
  - **Desbloqueable**: Color de la rama (interactivo, pulsante si hay puntos)
  - **Bloqueado**: Gris oscuro, sin interacción
- [ ] Cada nodo muestra: valor del bono (ej: "+5%") y, si desbloqueable, su coste (ej: "Coste: 2 pts")
- [ ] Al presionar un nodo desbloqueable: modal de confirmación con coste exacto del nodo

### Modal de Confirmación de Nodo
- [ ] Título: nombre completo del nodo
- [ ] Descripción: texto completo del bono (ej: "+5% producción de hardware permanente")
- [ ] Coste: "1 punto"
- [ ] Botones: "Cancelar" (gris) | "Aprender" (verde neón)

### Modal de Reset (Respec)
- [ ] Título: "Resetear Skill Tree"
- [ ] Warning en rojo: "Perderás 1 punto PERMANENTEMENTE"
- [ ] Info: "Puntos actuales comprados: X → serán devueltos"
- [ ] Info: "Puntos perdidos: Y → Y+1"
- [ ] Info: "Puntos disponibles después: Z"
- [ ] Botones: "Cancelar" (gris) | "Resetear" (rojo)

### Indicadores Visuales en HUD Principal
- [ ] (Opcional) Ícono en topbar que pulsa cuando hay puntos disponibles sin gastar
- [ ] No intrusivo — solo al entrar a Prestige tab

### Post-Prestige
- [ ] Si el jugador hace prestige y consigue punto nuevo, al volver a PrestigeScreen el sub-tab Skill Tree tiene el badge con nuevo número
- [ ] Toast opcional: "+1 punto de skill disponible"

## Validaciones

### Pre-Purchase Validations
- [ ] Verificar que `calculateAvailableSkillPoints(state) >= 1`
- [ ] Verificar que el nodo existe en `SKILL_TREE_NODES`
- [ ] Verificar que el nodo NO está ya comprado
- [ ] Verificar que el nodo anterior de la misma rama está comprado (excepto nodo 1)

### Post-Purchase Validations
- [ ] Verificar que `prestigeSkillTree.nodes[i].purchased === true`
- [ ] Verificar que `calculateAvailableSkillPoints` devuelve el valor correcto (decrementado en 1)
- [ ] Verificar que los multipliers (hardware/market/click) se recalcularon
- [ ] Verificar que stats derivados (producción total, sell price proyectado) reflejan el cambio

### Pre-Reset Validations
- [ ] Verificar que al menos 1 nodo está comprado (sin nodos comprados, no tiene sentido resetear)

### Post-Reset Validations
- [ ] Verificar que todos los nodos tienen `purchased === false`
- [ ] Verificar que `lostPoints` se incrementó en 1
- [ ] Verificar que `calculateAvailableSkillPoints === prestigeLevel - lostPoints`
- [ ] Verificar que multipliers volvieron a 1.0

### State Integrity
- [ ] `prestigeSkillTree.nodes.length === 18` (3 ramas × 6 nodos)
- [ ] `prestigeSkillTree.lostPoints >= 0`
- [ ] No puede haber un nodo N+1 comprado sin N comprado en la misma rama
- [ ] `availablePoints >= 0` (nunca negativo — si quedara negativo por bug de respec, capear a 0)

## Dependencias

### Requiere
- `Prestige System` — el skill tree depende de `prestigeLevel` para otorgar puntos
- `GameContext` — nuevas actions: `PURCHASE_SKILL_NODE`, `RESET_SKILL_TREE`
- `balanceConfig.ts` — `SKILL_TREE_CONFIG` con valores de nodos
- `translations.ts` — nuevas claves `skillTree.*` en ES/EN/PT

### Bloquea
- Ninguno (es una feature aditiva)

### Relacionado con
- `Block Mining System` — los multipliers afectan la producción calculada
- `Market System` — el multiplier de Mercado afecta sell price
- `Achievement System` — potencialmente agregar badges "Skill Tree Maxed", "First Respec", etc. (fuera de scope v1)
- `Save/Load System` — el skill tree debe persistir en AsyncStorage

## Criterios de Aceptación

- [ ] El sub-tab Skill Tree aparece solo cuando `prestigeLevel >= 1`
- [ ] Cada prestige otorga exactamente 1 punto
- [ ] Los 18 nodos están definidos con los valores de la tabla
- [ ] La progresión lineal por rama se respeta (no se puede saltar nodos)
- [ ] Al comprar un nodo, el bono se aplica inmediatamente a los cálculos
- [ ] Los 3 multipliers (hardware/market/click) funcionan correctamente
- [ ] El botón de respec devuelve N-1 puntos y marca 1 como perdido permanente
- [ ] El estado persiste entre sesiones (AsyncStorage)
- [ ] El estado persiste entre prestiges (no se resetea al hacer prestige)
- [ ] La UI muestra claramente qué nodos están comprados/desbloqueables/bloqueados
- [ ] Las traducciones ES/EN/PT están completas
- [ ] Tests unitarios cubren los 3 multipliers, available points y respec
- [ ] Lint y test pasan limpios antes del commit

## Notas de Implementación

### Archivos Principales (nuevos o modificados)
- **Nuevo**: `src/data/skillTree.ts` — definición de `SKILL_TREE_NODES` (derivados de `SKILL_TREE_CONFIG`)
- **Nuevo**: `src/utils/skillTreeLogic.ts` — funciones de cálculo de multipliers, puntos disponibles, validación
- **Nuevo**: `src/components/SkillTreeScreen.tsx` — UI del árbol (sub-tab)
- **Modificado**: `src/config/balanceConfig.ts` — agregar `SKILL_TREE_CONFIG`
- **Modificado**: `src/types/game.ts` — agregar `PrestigeSkillTree`, `SkillNode` y campo en `GameState`
- **Modificado**: `src/contexts/GameContext.tsx` — actions `PURCHASE_SKILL_NODE`, `RESET_SKILL_TREE`; incluir multipliers en `recalculateGameStats` y `calculateTotalProduction`
- **Modificado**: `src/utils/gameLogic.ts` — integrar `skillTreeHardwareMultiplier` en producción
- **Modificado**: `src/utils/marketLogic.ts` — integrar `skillTreeMarketMultiplier` en sell price
- **Modificado**: `src/components/PrestigeScreen.tsx` — agregar sub-tab y renderizar `SkillTreeScreen`
- **Modificado**: `src/data/translations.ts` — claves `skillTree.*` en ES/EN/PT

### Reducer Action: PURCHASE_SKILL_NODE
```typescript
case 'PURCHASE_SKILL_NODE': {
  const { nodeId } = action.payload;
  if (!canPurchaseNode(state, nodeId)) return state;

  const updatedNodes = state.prestigeSkillTree.nodes.map(n =>
    n.id === nodeId ? { ...n, purchased: true } : n
  );

  const newState = {
    ...state,
    prestigeSkillTree: {
      ...state.prestigeSkillTree,
      nodes: updatedNodes,
    },
  };

  return recalculateGameStats(newState);
}
```

### Reducer Action: RESET_SKILL_TREE
```typescript
case 'RESET_SKILL_TREE': {
  const hasPurchasedNodes = state.prestigeSkillTree.nodes.some(n => n.purchased);
  if (!hasPurchasedNodes) return state;

  const resetNodes = state.prestigeSkillTree.nodes.map(n => ({ ...n, purchased: false }));

  const newState = {
    ...state,
    prestigeSkillTree: {
      nodes: resetNodes,
      lostPoints: state.prestigeSkillTree.lostPoints + 1,
    },
  };

  return recalculateGameStats(newState);
}
```

### Migración de Saves Existentes
- Si `state.prestigeSkillTree === undefined` en un save guardado previo:
  - Inicializar con `initialSkillTree`
  - `lostPoints: 0`
  - Todos los nodos con `purchased: false`
- Los jugadores con `prestigeLevel > 0` tendrán sus puntos disponibles desde el inicio

## Testing

### Unit Tests
```typescript
describe('Skill Tree System', () => {
  describe('calculateAvailableSkillPoints', () => {
    it('should return 0 for prestige level 0', () => {
      const state = mockState({ prestigeLevel: 0 });
      expect(calculateAvailableSkillPoints(state)).toBe(0);
    });

    it('should return prestigeLevel when no nodes purchased and no lost points', () => {
      const state = mockState({ prestigeLevel: 5 });
      expect(calculateAvailableSkillPoints(state)).toBe(5);
    });

    it('should subtract spent and lost points correctly', () => {
      const state = mockState({
        prestigeLevel: 10,
        skillTree: { spentCount: 3, lostPoints: 2 },
      });
      expect(calculateAvailableSkillPoints(state)).toBe(5);
    });
  });

  describe('calculateSkillTreeHardwareMultiplier', () => {
    it('should return 1.0 when no hardware nodes purchased', () => {
      const state = mockStateNoNodes();
      expect(calculateSkillTreeHardwareMultiplier(state)).toBe(1.0);
    });

    it('should return 1.05 with only hardware_1 purchased', () => {
      const state = mockStateWithNodes(['hardware_1']);
      expect(calculateSkillTreeHardwareMultiplier(state)).toBe(1.05);
    });

    it('should return 1.80 with all hardware nodes purchased', () => {
      const state = mockStateWithNodes([
        'hardware_1', 'hardware_2', 'hardware_3',
        'hardware_4', 'hardware_5', 'hardware_6',
      ]);
      expect(calculateSkillTreeHardwareMultiplier(state)).toBeCloseTo(1.80, 2);
    });
  });

  describe('canPurchaseNode', () => {
    it('should allow purchasing node 1 of any branch if points available', () => {
      const state = mockState({ prestigeLevel: 1 });
      expect(canPurchaseNode(state, 'hardware_1')).toBe(true);
      expect(canPurchaseNode(state, 'market_1')).toBe(true);
      expect(canPurchaseNode(state, 'click_1')).toBe(true);
    });

    it('should block node 2 if node 1 not purchased', () => {
      const state = mockState({ prestigeLevel: 1 });
      expect(canPurchaseNode(state, 'hardware_2')).toBe(false);
    });

    it('should allow node 2 if node 1 purchased and points available', () => {
      const state = mockStateWithNodes(['hardware_1']);
      state.prestigeLevel = 2;
      expect(canPurchaseNode(state, 'hardware_2')).toBe(true);
    });

    it('should block node if already purchased', () => {
      const state = mockStateWithNodes(['hardware_1']);
      state.prestigeLevel = 5;
      expect(canPurchaseNode(state, 'hardware_1')).toBe(false);
    });

    it('should block purchase if no points available', () => {
      const state = mockStateWithNodes(['hardware_1']);
      state.prestigeLevel = 1;
      expect(canPurchaseNode(state, 'market_1')).toBe(false);
    });
  });

  describe('RESET_SKILL_TREE action', () => {
    it('should reset all purchased nodes and increment lostPoints', () => {
      let state = mockState({ prestigeLevel: 5 });
      state = gameReducer(state, { type: 'PURCHASE_SKILL_NODE', payload: { nodeId: 'hardware_1' } });
      state = gameReducer(state, { type: 'PURCHASE_SKILL_NODE', payload: { nodeId: 'hardware_2' } });
      state = gameReducer(state, { type: 'PURCHASE_SKILL_NODE', payload: { nodeId: 'market_1' } });

      state = gameReducer(state, { type: 'RESET_SKILL_TREE' });

      expect(state.prestigeSkillTree.nodes.every(n => !n.purchased)).toBe(true);
      expect(state.prestigeSkillTree.lostPoints).toBe(1);
      expect(calculateAvailableSkillPoints(state)).toBe(4); // 5 - 0 - 1
    });

    it('should not reset if no nodes purchased', () => {
      const state = mockState({ prestigeLevel: 5 });
      const newState = gameReducer(state, { type: 'RESET_SKILL_TREE' });
      expect(newState.prestigeSkillTree.lostPoints).toBe(0);
    });
  });
});
```

### Integration Tests
```typescript
describe('Skill Tree Integration', () => {
  it('should apply hardware multiplier to production', () => {
    const state = mockStateWithNodes(['hardware_1', 'hardware_2']); // +5% + +10% = +15%
    state.hardware = [{ id: 'cpu', miningSpeed: 10, blockReward: 50, owned: 1 }];

    const production = calculateTotalProduction(state);
    // Base: 10 × 50 × 1 = 500
    // Prestige (1.0) × SkillTree (1.15) = 500 × 1.15 = 575
    expect(production).toBe(575);
  });

  it('should apply market multiplier to sell price', () => {
    const state = mockStateWithNodes(['market_1', 'market_2']); // +3% + +5% = +8%
    const basePrice = 100;

    const finalPrice = calculateSellPrice(state, basePrice);
    expect(finalPrice).toBeCloseTo(108, 2);
  });

  it('should apply click multiplier to click reward', () => {
    const state = mockStateWithNodes(['click_1']); // +10%
    state.prestigeLevel = 0; // no prestige bonus

    const reward = calculateClickReward(state);
    expect(reward).toBe(1.1); // base 1 × 1.0 prestige × 1.10 skillTree
  });

  it('should persist skill tree across prestige', () => {
    let state = mockStateWithNodes(['hardware_1', 'hardware_2']);
    state.prestigeLevel = 2;
    state.blocksMined = 21000000;

    const newState = gameReducer(state, { type: 'DO_PRESTIGE' });

    // Skill tree nodes should remain purchased
    expect(newState.prestigeSkillTree.nodes.find(n => n.id === 'hardware_1')?.purchased).toBe(true);
    expect(newState.prestigeSkillTree.nodes.find(n => n.id === 'hardware_2')?.purchased).toBe(true);

    // New point available: prestigeLevel (3) - spent (2) - lost (0) = 1
    expect(calculateAvailableSkillPoints(newState)).toBe(1);
  });
});
```

### E2E Tests
```typescript
describe('Skill Tree E2E', () => {
  it('should show skill tree sub-tab only after first prestige', async () => {
    await mockGameState({ prestigeLevel: 0 });
    await element(by.id('prestige-tab')).tap();
    await expect(element(by.id('subtab-skillTree'))).not.toBeVisible();

    await mockGameState({ prestigeLevel: 1 });
    await element(by.id('prestige-tab')).tap();
    await expect(element(by.id('subtab-skillTree'))).toBeVisible();
  });

  it('should purchase a node and update available points', async () => {
    await mockGameState({ prestigeLevel: 2 });
    await element(by.id('prestige-tab')).tap();
    await element(by.id('subtab-skillTree')).tap();

    await expect(element(by.id('available-points'))).toHaveText('2');

    await element(by.id('node-hardware_1')).tap();
    await element(by.id('confirm-purchase-node')).tap();

    await expect(element(by.id('available-points'))).toHaveText('1');
    await expect(element(by.id('node-hardware_1-purchased'))).toBeVisible();
    await expect(element(by.id('node-hardware_2'))).toBeVisible(); // unlocked
  });

  it('should reset skill tree losing 1 point permanently', async () => {
    await mockGameState({ prestigeLevel: 5 });
    // Purchase 3 nodes
    await element(by.id('prestige-tab')).tap();
    await element(by.id('subtab-skillTree')).tap();
    await element(by.id('node-hardware_1')).tap();
    await element(by.id('confirm-purchase-node')).tap();
    await element(by.id('node-hardware_2')).tap();
    await element(by.id('confirm-purchase-node')).tap();
    await element(by.id('node-market_1')).tap();
    await element(by.id('confirm-purchase-node')).tap();

    // Reset
    await element(by.id('reset-skilltree-button')).tap();
    await element(by.id('confirm-reset-skilltree')).tap();

    // Verify: 5 - 0 - 1 = 4 points available
    await expect(element(by.id('available-points'))).toHaveText('4');
    await expect(element(by.id('lost-points'))).toHaveText('1');
  });
});
```

## Edge Cases

**Edge Case 1: Jugador con prestigeLevel alto que nunca abrió skill tree**
- Input: `prestigeLevel: 15`, `skillTree.nodes all unpurchased`, `lostPoints: 0`
- Expected: `availablePoints = 15`, sub-tab con badge "15" (número grande pero visible)

**Edge Case 2: Respec con más puntos invertidos que prestigeLevel actual**
- Input: Imposible por diseño — `spentCount <= prestigeLevel - lostPoints` siempre
- Validación: Si por alguna razón sucede (bug), capear `availablePoints` a 0

**Edge Case 3: Respec repetido N veces reduciendo puntos a 0 o negativo**
- Input: `prestigeLevel: 3`, hacer respec 3 veces → `lostPoints: 3`, available = 0
- Expected: Sistema funciona, jugador no puede comprar nada hasta nuevo prestige
- Validación: `availablePoints = Math.max(0, prestigeLevel - spentCount - lostPoints)`

**Edge Case 4: Save legacy sin `prestigeSkillTree`**
- Input: Jugador actualiza la app con save viejo (antes de feature)
- Expected: Migración automática → `initialSkillTree` con todos los nodos vacíos y `lostPoints: 0`
- Validación: Al cargar save, detectar si campo falta y agregar con valores default

**Edge Case 5: Comprar el último nodo de una rama (capstone)**
- Input: Comprar hardware_6 con hardware_1-5 ya comprados
- Expected: Multiplier total Hardware = 1.80; no hay nodo 7 que desbloquear
- Validación: UI no muestra "siguiente nodo" para capstones

**Edge Case 6: Aplicar bonos cuando owned hardware = 0**
- Input: `prestigeSkillTree.hardware_6 purchased`, pero `hardware.length === 0`
- Expected: Multiplier se calcula (1.80) pero producción total = 0 (no hay base)
- Validación: Multipliers NO dan producción "gratis" — solo amplifican lo existente

**Edge Case 7: Skill tree interactúa con Lucky Block / Market Pump boosters**
- Input: Jugador con Market Pump activo (2x sell price) y market_6 comprado (+15%)
- Expected: Sell price = base × 1.15 (skillTree) × 2.0 (booster)
- Orden: skill tree se aplica primero, boosters después (multiplicativo)

**Edge Case 8: Reset durante transición de prestige**
- Input: Jugador hace reset del skill tree justo cuando `DO_PRESTIGE` se está procesando
- Expected: Las acciones son secuenciales en el reducer; no hay race condition
- Validación: Reducer es síncrono, cada action procesa estado completo antes de la siguiente

## Performance Considerations

### Non-Functional Requirements
- **Purchase de nodo**: < 50ms (validación + update state + recalc)
- **Reset**: < 100ms (reset todos los nodos + recalc stats)
- **Cálculo de multipliers**: < 5ms (3 filter+reduce sobre 18 elementos)
- **Render del skill tree**: < 16ms (18 nodos estáticos, no animados por frame)

### Optimizaciones
- Memoizar los 3 multipliers cuando `prestigeSkillTree.nodes` no cambia
- No animar nodos comprados (solo el estado de "disponible para comprar")
- Usar `React.memo` en componente `<SkillNode />` para evitar re-renders innecesarios
- Los valores de nodos son constantes — no recalcular estructura de árbol en cada render

## Analytics

```typescript
analytics().logEvent('skill_node_purchased', {
  node_id: 'hardware_3',
  branch: 'hardware',
  position: 3,
  prestige_level: state.prestigeLevel,
  available_points_after: 4,
});

analytics().logEvent('skill_tree_reset', {
  nodes_purchased_before: 5,
  lost_points_total: 2,
  prestige_level: state.prestigeLevel,
});

analytics().logEvent('skill_tree_branch_maxed', {
  branch: 'hardware', // Cuando el jugador compra el capstone (nodo 6)
  prestige_level: state.prestigeLevel,
});

analytics().logEvent('skill_tree_fully_maxed', {
  // Cuando el jugador compra los 18 nodos (prestigeLevel >= 18 + lostPoints)
  prestige_level: state.prestigeLevel,
  lost_points_total: state.prestigeSkillTree.lostPoints,
});
```

## Preguntas Abiertas

- [ ] **Skill tree visible con teaser en P0**: ¿Mostrar el sub-tab vacío en P0 como preview?
  - **Decisión**: No — solo visible desde P1 para evitar confusión (confirmado con usuario).

- [ ] **Respec "gratis" la primera vez**: ¿Dar una oportunidad de respec sin coste?
  - **Decisión**: No — todo reset cuesta 1 punto (confirmado con usuario, mantiene simpleza).

- [ ] **Badges relacionados con skill tree**: ¿Agregar "Respec Master", "Maxed Hardware Branch", etc.?
  - **Recomendación**: Phase siguiente — no bloquea v1.

- [ ] **Nodos con efectos no numéricos**: ¿Agregar nodos que den funcionalidades (auto-sell, auto-click) en vez de solo %?
  - **Decisión**: No — usuario prefiere mantener puramente numérico (sin mecánicas nuevas).

- [ ] **Árbol ramificado vs lineal**: ¿Permitir sub-ramas dentro de cada columna?
  - **Decisión**: Lineal en v1 (simpleza). Considerar para expansión futura.

- [ ] **Costes variables por nodo**: ¿Nodos capstone deberían costar más de 1 punto?
  - **Decisión**: No — 1 punto por nodo uniforme. Los valores crecientes ya hacen los capstones más valiosos.

- [ ] **Leaderboard de respecs**: ¿Competir por "menos respecs" o "más puntos perdidos"?
  - **Recomendación**: Phase 6+ con backend.

## Referencias

- Prestige System (spec base): [game-mechanics/prestige-system.md](prestige-system.md)
- Path of Exile Passive Tree: https://www.pathofexile.com/passive-skill-tree
- AdVenture Capitalist Angels: https://adventure-capitalist.fandom.com/wiki/Angel_Investors
- Idle game skill tree design: https://www.reddit.com/r/incremental_games/comments/skill_trees_best_practices/
