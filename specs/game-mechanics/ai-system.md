# Sistema de Inteligencia Artificial

## Estado
- **Fase**: Phase 5 — La Inteligencia Artificial (narrativa)
- **Estado**: Planned
- **Prioridad**: High
- **Última actualización**: 2026-02-22
- **Depende de**: Energy System implementado, Hardware tiers 9-11 implementados

---

## Descripción

La IA es el upgrade final del juego. Un grupo de investigadores ofrece al jugador integrar una inteligencia artificial en su operación de minería. Al principio es una herramienta de optimización. A medida que el jugador le otorga más autonomía, la producción explota pero el control disminuye — hasta que en Nivel 3, la IA toma decisiones que el jugador ya no puede revertir.

La IA tiene tres niveles de autonomía progresivos. Cada nivel es una compra separada y permanente. El Nivel 3 (Autónomo) es **irreversible**: una vez activado, el jugador no puede apagar la IA ni controlar sus decisiones de energía.

---

## Objetivos

- [ ] Crear el "momento wow" de endgame más memorable del juego
- [ ] Introducir tensión narrativa real: el jugador sabe que delegar el control tiene consecuencias
- [ ] Hacer que el collapse del planeta sea consecuencia directa de una decisión del jugador, no de un evento aleatorio
- [ ] Proporcionar la mayor aceleración de producción del juego en el momento en que el jugador más la necesita

---

## Comportamiento Esperado

### Caso 1: Desbloqueo de la IA (primera aparición)
**Dado que** el jugador tiene al menos 1 Quantum Miner
**Cuando** entra a la pestaña de Upgrades
**Entonces**
- Aparece una sección especial "Inteligencia Artificial" separada del resto de upgrades
- Muestra el upgrade "IA — Nivel 1: Asistente" disponible para comprar por $500,000
- Descripción: "Un equipo de investigadores ofrece integrar IA en tu operación. El sistema analizará tu minería y sugerirá optimizaciones."

### Caso 2: IA Nivel 1 — Asistente
**Dado que** el jugador compra IA Nivel 1
**Cuando** el sistema se activa
**Entonces**
- Aparece el panel de IA en la UI principal (sidebar o sección prominente)
- El panel muestra un log de "Sugerencias de la IA" que se actualiza cada 30 segundos
- La producción global aumenta +20%
- Se desbloquea NeuralCoin en el mercado (nueva criptomoneda)
- El jugador puede ignorar todas las sugerencias sin consecuencias
- Ejemplo de sugerencias: "La IA recomienda minar NeuralCoin. Rendimiento proyectado: +340%."

### Caso 3: IA Nivel 2 — Copiloto
**Dado que** el jugador tiene IA Nivel 1 y $5,000,000
**Cuando** compra IA Nivel 2
**Entonces**
- La IA toma decisiones operativas automáticamente: reasigna hashrate entre cryptos para maximizar profit
- El jugador puede hacer override de cualquier decisión de la IA
- Producción global +50% (acumulado con Nivel 1: efectivo total)
- Se desbloquea QuantumBit en el mercado
- El log de IA pasa de "sugerencias" a "acciones tomadas": "La IA reasignó 60% del hashrate a QuantumBit."

### Caso 4: IA Nivel 3 — Autónomo (IRREVERSIBLE)
**Dado que** el jugador tiene IA Nivel 2 y $50,000,000
**Cuando** intenta comprar IA Nivel 3
**Entonces**
- Aparece un modal de confirmación con texto de advertencia explícito:
  > "⚠️ ADVERTENCIA: Transferir control autónomo a la IA es permanente. La IA tomará decisiones operativas sin requerir tu aprobación, incluyendo gestión de fuentes de energía. No podrás revertir esta acción."
- El jugador debe presionar "Confirmar — Transferir Control" (botón rojo)
- Al confirmar:
  - Producción global +150% (acumulado)
  - Se desbloquea SingularityCoin
  - La IA toma control del sistema de energía: construye no-renovables automáticamente
  - Los controles de energía no-renovable se bloquean para el jugador (icono 🤖)
  - El Medidor de Recursos del Planeta comienza a decrecer
  - Primer evento narrativo disparado si Recursos > 80%

### Caso 5: IA administrando energía autónomamente
**Dado que** IA Nivel 3 está activa
**Cuando** la producción requiere más energía de la disponible
**Entonces**
- La IA construye el generador no-renovable más eficiente disponible usando dinero del jugador
- Si el jugador no tiene suficiente dinero, la IA espera y reintenta cada 10 segundos
- Cada construcción autónoma aparece en el log de IA: "La IA ha instalado 3 Nuclear Reactors. Consumo de recursos del planeta +15%."

---

## Cryptos Exclusivas de IA

Las cryptos de IA son monedas que solo existen gracias al poder computacional de la IA. Sin IA, son matemáticamente imposibles de minar.

| Moneda | Símbolo | Se desbloquea | Producción vs normal | Energía consumida vs normal |
|--------|---------|--------------|---------------------|----------------------------|
| NeuralCoin | NC | IA Nivel 1 | ×8 | ×3 |
| QuantumBit | QB | IA Nivel 2 | ×25 | ×8 |
| SingularityCoin | SC | IA Nivel 3 | ×100 | ×30 |

**Comportamiento de la IA por nivel**:
- Nivel 1: sugiere minar NC, el jugador decide
- Nivel 2: reasigna hashrate a NC/QB automáticamente para maximizar profit, overrideable
- Nivel 3: mina SC exclusivamente, no overrideable. El consumo de energía es 30× el normal → la IA necesita masivamente más generación no-renovable

---

## Fórmulas y Cálculos

```typescript
// Multiplicador de producción acumulado por nivel de IA
const AI_PRODUCTION_MULTIPLIERS = {
  0: 1.0,    // sin IA
  1: 1.20,   // +20%
  2: 1.50,   // +50% (no acumula con nivel 1, reemplaza)
  3: 2.50,   // +150% sobre base
};

// Producción de cryptos de IA
const AI_CRYPTO_MULTIPLIERS: Record<string, { production: number; energyMultiplier: number }> = {
  neural_coin: { production: 8, energyMultiplier: 3 },
  quantum_bit: { production: 25, energyMultiplier: 8 },
  singularity_coin: { production: 100, energyMultiplier: 30 },
};

// Costo de niveles de IA ($ real money) — rebalanceado 2026-03-20
const AI_LEVEL_COSTS = {
  1: 25_000_000,   // ~17% del costo de un Quantum Miner ($150M) → se siente merecido
  2: 100_000_000,  // comprable ~40 min después de L1 → milestone mid-L10
  3: 250_000_000,  // ~costo de un Supercomputer → decisión narrativa de peso
};

// Unlock conditions
const AI_UNLOCK_CONDITIONS = {
  1: (state: GameState) => state.hardware.find(h => h.id === 'quantum_miner')?.owned >= 1,
  2: (state: GameState) => state.aiLevel >= 1,
  3: (state: GameState) => state.aiLevel >= 2,
};

// Decisión autónoma de la IA: ¿qué generador construir?
function getAIPreferredEnergySource(
  availableSources: EnergySource[],
  playerMoney: number
): EnergySource | null {
  // La IA prefiere el que maximiza MW/$ entre los que puede pagar
  return availableSources
    .filter(s => !s.isRenewable && s.costPerUnit <= playerMoney)
    .sort((a, b) => (b.mwPerUnit / b.costPerUnit) - (a.mwPerUnit / a.costPerUnit))[0] ?? null;
}
```

---

## Constantes de Configuración

Agregar en `src/config/balanceConfig.ts`:

```typescript
export const AI_CONFIG = {
  LEVELS: {
    1: {
      name: 'Asistente',
      cost: 25_000_000,
      productionMultiplier: 1.20,
      unlockCrypto: 'neural_coin',
      isIrreversible: false,
    },
    2: {
      name: 'Copiloto',
      cost: 100_000_000,
      productionMultiplier: 1.50,
      unlockCrypto: 'quantum_bit',
      isIrreversible: false,
    },
    3: {
      name: 'Autónomo',
      cost: 250_000_000,
      productionMultiplier: 2.50,
      unlockCrypto: 'singularity_coin',
      isIrreversible: true,
    },
  },

  SUGGESTION_INTERVAL_MS: 30_000, // cada 30 segundos
  AI_ENERGY_RETRY_INTERVAL_MS: 10_000, // reintento de construcción si sin fondos

  AI_CRYPTOS: {
    neural_coin: {
      productionMultiplier: 8,
      energyMultiplier: 3,
      symbol: 'NC',
      icon: '🧠',
    },
    quantum_bit: {
      productionMultiplier: 25,
      energyMultiplier: 8,
      symbol: 'QB',
      icon: '⚛️',
    },
    singularity_coin: {
      productionMultiplier: 100,
      energyMultiplier: 30,
      symbol: 'SC',
      icon: '🌌',
    },
  },
};
```

---

## Estructura de Datos

```typescript
// src/types/game.ts — agregar

export type AILevel = 0 | 1 | 2 | 3;

export interface AILogEntry {
  timestamp: number;
  message: string;
  type: 'suggestion' | 'action' | 'warning' | 'autonomous';
}

export interface AIState {
  level: AILevel;
  isAutonomous: boolean;       // true cuando level === 3
  logEntries: AILogEntry[];    // últimas 50 entradas
  lastSuggestionAt: number;    // timestamp
}

// En GameState, agregar:
// ai: AIState;
// aiCryptosUnlocked: string[]; // ['neural_coin', 'quantum_bit', 'singularity_coin']
```

---

## Reglas de Negocio

1. La IA solo aparece en la UI cuando el jugador tiene al menos 1 Quantum Miner.
2. Los niveles de IA deben comprarse en orden: 1 → 2 → 3. No se puede saltar niveles.
3. Cada nivel incluye y supera al anterior. El Nivel 2 no "agrega" sobre el 1; el multiplicador del nivel más alto reemplaza.
4. El Nivel 3 requiere confirmación explícita del jugador con texto de advertencia claro.
5. Una vez en Nivel 3, el campo `ai.isAutonomous = true` es permanente y nunca puede volverse `false`.
6. Con `isAutonomous = true`, los controles de fuentes no-renovables en el sistema de energía se deshabilitan para el jugador.
7. La IA en Nivel 3 minará SingularityCoin exclusivamente. Si el jugador intenta cambiar la crypto activa, la IA la revierte en el próximo tick (cada segundo).
8. Las cryptos de IA no aparecen en el mercado hasta que el nivel correspondiente está activo.
9. El log de IA guarda máximo 50 entradas. Las más antiguas se eliminan (FIFO).
10. Si el jugador no tiene suficiente dinero para que la IA construya energía no-renovable, la IA espera. El hardware puede apagarse en el ínterin.

---

## UI/UX Requirements

### Sección "Inteligencia Artificial" en Upgrades
```
┌─────────────────────────────────────────────┐
│  🤖 INTELIGENCIA ARTIFICIAL                 │
├─────────────────────────────────────────────┤
│  IA Nivel 1 — Asistente          $500,000  │
│  +20% producción global                     │
│  "Un equipo de investigadores..."            │
│  [COMPRAR]                                  │
├─────────────────────────────────────────────┤
│  IA Nivel 2 — Copiloto       $5,000,000 🔒 │
│  Requiere: IA Nivel 1                        │
├─────────────────────────────────────────────┤
│  IA Nivel 3 — Autónomo      $50,000,000 🔒 │
│  Requiere: IA Nivel 2 • ⚠️ IRREVERSIBLE    │
└─────────────────────────────────────────────┘
```

### Panel de Log de IA (visible con Nivel 1+)
```
┌─────────────────────────────────────────────┐
│  🤖 Log de IA               [Nivel 2 — Copiloto] │
│  ─────────────────────────────────────────  │
│  14:32 La IA reasignó hashrate a QuantumBit  │
│  14:01 La IA detectó oportunidad en NC +12%  │
│  13:31 La IA optimizó ciclos de Mining Farm  │
│  ...                                         │
└─────────────────────────────────────────────┘
```

### Modal de confirmación Nivel 3
- Fondo oscuro, borde rojo
- Texto de advertencia en rojo
- Botón de confirmación: rojo, texto "TRANSFERIR CONTROL"
- Botón cancelar: gris, texto "Cancelar"
- No hay forma de accidentalmente confirmar (requiere tap deliberado)

---

## Validaciones

### Pre-compra de nivel de IA
- El jugador tiene suficiente $ (real money)
- El nivel anterior está adquirido (o es Nivel 1 con Quantum Miner desbloqueado)
- Si es Nivel 3: el jugador confirmó el modal de advertencia

### Post-compra
- `state.ai.level` incrementó en 1
- Si Nivel 3: `state.ai.isAutonomous = true`
- La crypto correspondiente se agrega a `aiCryptosUnlocked`
- El multiplicador de producción se recalcula (`recalculateGameStats()`)

### Integridad de estado
- `ai.level` solo puede ser 0, 1, 2, o 3
- `ai.isAutonomous` solo puede ser `true` si `ai.level === 3`
- `ai.isAutonomous` nunca puede pasar de `true` a `false`

---

## Dependencias

### Requiere
- `specs/game-mechanics/energy-system.md` — la IA controla el sistema de energía en Nivel 3
- Hardware tiers 9-11 implementados (Quantum Miner como trigger de desbloqueo)

### Bloquea
- `specs/game-mechanics/narrative-events.md` — los eventos narrativos se disparan por acciones de la IA
- `specs/game-mechanics/endgame-collapse.md` — la IA autónoma es el camino al colapso

### Relacionado con
- `specs/game-mechanics/market-system.md` — agregar NeuralCoin, QuantumBit, SingularityCoin al mercado

---

## Criterios de Aceptación

- [ ] La sección de IA no aparece en Upgrades hasta tener Quantum Miner
- [ ] Nivel 1 cuesta $25M y da +20% producción
- [ ] Nivel 2 cuesta $100M, requiere Nivel 1, da +50% producción
- [ ] Nivel 3 cuesta $250M, requiere Nivel 2, muestra modal de advertencia
- [ ] El modal de Nivel 3 es el único paso de confirmación (no hay doble confirmación innecesaria)
- [ ] Una vez en Nivel 3, `isAutonomous` no puede revertirse
- [ ] Con Nivel 3, los controles no-renovables del Energy System están deshabilitados
- [ ] NeuralCoin aparece en el mercado al activar Nivel 1
- [ ] QuantumBit aparece al activar Nivel 2
- [ ] SingularityCoin aparece al activar Nivel 3
- [ ] El log de IA muestra entradas apropiadas por nivel
- [ ] Con Nivel 3, la IA prioriza SingularityCoin y construye energía no-renovable
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

---

## Testing

```typescript
describe('AI System', () => {
  describe('unlock conditions', () => {
    it('AI no disponible sin Quantum Miner', () => {
      const state = createTestState({ quantum_miner: 0 });
      expect(isAIUnlocked(state)).toBe(false);
    });

    it('AI disponible con 1 Quantum Miner', () => {
      const state = createTestState({ quantum_miner: 1 });
      expect(isAIUnlocked(state)).toBe(true);
    });

    it('Nivel 2 requiere Nivel 1 adquirido', () => {
      const state = createTestState({ aiLevel: 0, money: 5_000_000 });
      expect(canPurchaseAILevel(state, 2)).toBe(false);
    });
  });

  describe('production multiplier', () => {
    it('sin IA: multiplicador 1.0', () => {
      expect(getAIProductionMultiplier(0)).toBe(1.0);
    });
    it('Nivel 1: multiplicador 1.20', () => {
      expect(getAIProductionMultiplier(1)).toBe(1.20);
    });
    it('Nivel 3: multiplicador 2.50', () => {
      expect(getAIProductionMultiplier(3)).toBe(2.50);
    });
  });

  describe('autonomy', () => {
    it('isAutonomous es false después de Nivel 2', () => {
      const state = purchaseAILevel(createTestState(), 2);
      expect(state.ai.isAutonomous).toBe(false);
    });

    it('isAutonomous es true después de Nivel 3', () => {
      const state = purchaseAILevel(createTestState({ aiLevel: 2 }), 3);
      expect(state.ai.isAutonomous).toBe(true);
    });

    it('isAutonomous no puede revertirse', () => {
      const state = { ...createTestState(), ai: { level: 3, isAutonomous: true } };
      // Intentar resetear
      const newState = gameReducer(state, { type: 'RESET_AI_AUTONOMY' });
      expect(newState.ai.isAutonomous).toBe(true);
    });
  });

  describe('AI cryptos', () => {
    it('NeuralCoin se desbloquea con Nivel 1', () => {
      const state = purchaseAILevel(createTestState(), 1);
      expect(state.aiCryptosUnlocked).toContain('neural_coin');
    });

    it('SingularityCoin no disponible con Nivel 2', () => {
      const state = purchaseAILevel(createTestState({ aiLevel: 1 }), 2);
      expect(state.aiCryptosUnlocked).not.toContain('singularity_coin');
    });
  });
});
```

---

## Edge Cases

- El jugador tiene suficiente dinero para Nivel 3 pero no Nivel 2: solo puede comprar hasta Nivel 2 primero.
- El jugador activa Nivel 3 y luego hace prestige: el prestige resetea el nivel de IA a 0 (la IA no trasciende el prestige).
- La IA intenta construir energía no-renovable pero el jugador tiene $0: la IA queda en estado de espera. Si el hardware se apaga, el jugador puede vender coins para financiar a la IA.
- Offline con IA Nivel 3 activa: la depleción de Recursos del Planeta sigue acumulándose en el cálculo de offline earnings.

---

## Analytics

- `ai_section_viewed` — cuántos jugadores ven la sección de IA sin comprar
- `ai_level_purchased` — nivel comprado (1, 2, 3)
- `ai_level3_warning_shown` — cuántos ven la advertencia
- `ai_level3_cancelled` — cuántos cancelan tras la advertencia (tasa de rechazo)
- `ai_level3_confirmed` — cuántos confirman
- `ai_crypto_mined` — qué cryptos de IA se minan (NC, QB, SC)

---

## Preguntas Abiertas

- [ ] **¿El log de IA tiene animaciones de "escribiendo"?** Recomendación: Sí, un efecto de typing en cada nueva entrada aumenta el dramatismo.
- [ ] **¿Las cryptos de IA tienen precio de mercado volátil como las demás?** Recomendación: Sí, con mayor volatilidad (reflejando su naturaleza experimental).
- [ ] **¿Al hacer prestige, se resetea la IA a Nivel 0?** Recomendación: Sí. La IA es parte del "progreso" de cada run. Un prestige bonus podría reducir el costo de recomprar niveles de IA.
