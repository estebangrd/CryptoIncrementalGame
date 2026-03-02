# Sistema de Energía

## Estado
- **Fase**: Phase 4 — La Crisis Energética (narrativa)
- **Estado**: Implemented
- **Prioridad**: High
- **Última actualización**: 2026-03-01
- **Depende de**: Hardware tiers 9-11 implementados (Opción B)

---

## Descripción

A partir del hardware de tier 9 (Mining Farm), el minado requiere energía activa para funcionar. El jugador debe construir infraestructura de generación energética para mantener el hardware operativo.

El sistema tiene tres momentos narrativos distintos:
- **Early game** (tiers 1-8): sin energía. El jugador solo mina y compra hardware.
- **Mid game** (tiers 9-11): energía como constraint activo. El jugador balancea generación vs consumo.
- **End game** (IA Nivel 3): la IA consume no-renovables de forma autónoma. El jugador no puede detenerlo.

---

## Objetivos

- [ ] Introducir un nuevo loop de gestión de recursos en mid-game sin complicar el early game
- [ ] Dar al jugador decisiones morales concretas: renovables (lentas, limpias) vs no-renovables (rápidas, destructivas)
- [ ] Preparar el terreno mecánico para que la IA autónoma cause el colapso planetario
- [ ] Que la escasez de energía sea el primer "wall" real que el jugador encuentra en mid-game

---

## Comportamiento Esperado

### Caso 1: Primera Mining Farm (activación del sistema)
**Dado que** el jugador compra su primera Mining Farm (tier 9)
**Cuando** la compra se completa
**Entonces**
- Aparece por primera vez el panel de Energía en la UI
- El medidor muestra: Generación: 0 MW / Requerido: 500 MW
- La Mining Farm está en estado "Sin energía" y no mina
- Un tooltip explica: "Este hardware requiere energía. Construí generadores en la pestaña Energía."
- La pestaña Energía se desbloquea en la navegación

### Caso 2: Balance positivo de energía
**Dado que** el jugador tiene 600 MW de generación y Mining Farm requiere 500 MW
**Cuando** el tick de producción se ejecuta
**Entonces**
- La Mining Farm opera al 100% de eficiencia
- El panel muestra: Generación: 600 MW / Requerido: 500 MW (verde)
- Los +100 MW de excedente no se pierden (buffer útil para nueva compra)

### Caso 3: Balance negativo (apagón parcial)
**Dado que** el jugador tiene 400 MW de generación y el hardware requiere 1500 MW
**Cuando** el tick de producción se ejecuta
**Entonces**
- El hardware de tier más alto se apaga primero (Supercomputer > Quantum Miner > Mining Farm)
- Se apaga hardware hasta que generación >= requerido, o todo está apagado
- El panel muestra: Generación: 400 MW / Requerido: 1500 MW (rojo)
- Tooltip: "Energía insuficiente. Comprá más generadores o vendé hardware."

### Caso 4: Cap de renovables alcanzado
**Dado que** el jugador tiene instalado el máximo de energía renovable (8,000 MW)
**Cuando** intenta construir otro generador renovable
**Entonces**
- El botón de construcción está deshabilitado
- Tooltip: "Capacidad renovable máxima alcanzada. Para más energía, instalá generadores no-renovables."
- Los generadores no-renovables se vuelven visibles y desbloqueables

### Caso 5: IA Nivel 3 activa no-renovables
**Dado que** el jugador activó IA Nivel 3 (Autónomo)
**Cuando** la IA determina que necesita más energía para maximizar producción
**Entonces**
- La IA construye generadores no-renovables automáticamente usando el dinero del jugador
- El panel muestra una nota: "La IA está gestionando la energía de forma autónoma"
- Los botones de construir/demoler generadores no-renovables se deshabilitan para el jugador
- El Medidor de Recursos del Planeta comienza a decrecer

---

## Estructura del Sistema

### Fuentes de Energía

#### Renovables (cap total: 8,000 MW)
| Fuente | MW generados | Costo ($) | Ícono |
|--------|-------------|-----------|-------|
| Solar Farm | 200 MW | $5,000 | ☀️ |
| Wind Farm | 800 MW | $20,000 | 💨 |
| Hydroelectric Dam | 3,000 MW | $150,000 | 💧 |
| Geothermal Plant | 5,000 MW | $800,000 | 🌋 |

*El cap de 8,000 MW permite operar cómodamente Mining Farms y algunos Quantum Miners, pero no 5× Supercomputer sin no-renovables.*

#### No-renovables (sin cap, depletan Recursos del Planeta)
| Fuente | MW generados | Costo ($) | Depleción (% planeta/MW/s) | Ícono |
|--------|-------------|-----------|---------------------------|-------|
| Coal Plant | 1,000 MW | $2,000 | 0.0001% | 🏭 |
| Oil Refinery | 5,000 MW | $8,000 | 0.00008% | 🛢️ |
| Nuclear Reactor | 20,000 MW | $300,000 | 0.00005% | ☢️ |

*Nuclear es más "eficiente" en depleción por MW, pero el costo de escala lo hace devastador de todos modos.*

### Requerimientos de Energía por Hardware
| Hardware | Tier | Energía requerida por unidad |
|----------|------|------------------------------|
| manual_mining a asic_gen3 | 1-8 | 0 MW (no requieren) |
| mining_farm | 9 | 500 MW |
| quantum_miner | 10 | 2,000 MW |
| supercomputer | 11 | 10,000 MW |

### Algoritmo de Apagado Parcial
Cuando `totalEnergyGenerated < totalEnergyRequired`:
1. Ordenar hardware activo por tier (descendente)
2. Apagar unidades del tier más alto hasta que balance sea positivo
3. Si se apaga todo el tier más alto y sigue negativo, bajar al siguiente tier
4. Hardware apagado no produce ni consume energía

---

## Fórmulas y Cálculos

```typescript
// Energía total generada
const totalEnergyGenerated = energySources.reduce(
  (sum, source) => sum + (source.quantity * source.mwPerUnit), 0
);

// Energía total requerida
const totalEnergyRequired = hardware
  .filter(h => h.owned > 0 && h.energyRequired > 0)
  .reduce((sum, h) => sum + (h.owned * h.energyRequired), 0);

// Balance
const energyBalance = totalEnergyGenerated - totalEnergyRequired;

// Hardware operativo con balance negativo
function getActiveHardwareWithEnergyConstraint(
  hardware: Hardware[],
  totalGenerated: number
): Hardware[] {
  const energyHardware = hardware
    .filter(h => h.energyRequired > 0 && h.owned > 0)
    .sort((a, b) => b.level - a.level); // descendente por tier

  let remainingEnergy = totalGenerated;
  const active: Hardware[] = [];

  for (const hw of energyHardware) {
    const canRun = Math.floor(remainingEnergy / hw.energyRequired);
    const activeUnits = Math.min(canRun, hw.owned);
    if (activeUnits > 0) {
      active.push({ ...hw, activeUnits });
      remainingEnergy -= activeUnits * hw.energyRequired;
    }
  }
  return active;
}

// Depleción de Recursos del Planeta (por tick, 1 segundo)
const nonRenewableMW = energySources
  .filter(s => !s.isRenewable)
  .reduce((sum, s) => sum + (s.quantity * s.mwPerUnit), 0);

const planetResourceDepletion = energySources
  .filter(s => !s.isRenewable)
  .reduce((sum, s) => sum + (s.quantity * s.mwPerUnit * s.depletionPerMwPerSecond), 0);
// planetResourceDepletion es % por segundo
```

---

## Constantes de Configuración

Agregar en `src/config/balanceConfig.ts`:

```typescript
export const ENERGY_CONFIG = {
  RENEWABLE_CAP_MW: 8_000,

  SOURCES: {
    solar_farm: {
      mwPerUnit: 200,
      costPerUnit: 5_000,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '☀️',
    },
    wind_farm: {
      mwPerUnit: 800,
      costPerUnit: 20_000,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '💨',
    },
    hydroelectric_dam: {
      mwPerUnit: 3_000,
      costPerUnit: 150_000,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '💧',
    },
    geothermal_plant: {
      mwPerUnit: 5_000,
      costPerUnit: 800_000,
      isRenewable: true,
      depletionPerMwPerSecond: 0,
      icon: '🌋',
    },
    coal_plant: {
      mwPerUnit: 1_000,
      costPerUnit: 2_000,
      isRenewable: false,
      depletionPerMwPerSecond: 0.0001,
      icon: '🏭',
    },
    oil_refinery: {
      mwPerUnit: 5_000,
      costPerUnit: 8_000,
      isRenewable: false,
      depletionPerMwPerSecond: 0.00008,
      icon: '🛢️',
    },
    nuclear_reactor: {
      mwPerUnit: 20_000,
      costPerUnit: 300_000,
      isRenewable: false,
      depletionPerMwPerSecond: 0.00005,
      icon: '☢️',
    },
  },

  HARDWARE_ENERGY_REQUIREMENTS: {
    mining_farm: 500,
    quantum_miner: 2_000,
    supercomputer: 10_000,
  },
};
```

---

## Estructura de Datos

```typescript
// src/types/game.ts — agregar

export interface EnergySource {
  id: string;
  nameKey: string;
  descriptionKey: string;
  mwPerUnit: number;
  costPerUnit: number; // $ (real money)
  isRenewable: boolean;
  depletionPerMwPerSecond: number; // % planeta por MW por segundo
  icon: string;
  quantity: number; // unidades construidas
  unlockedByAI: boolean; // true = la IA lo construyó en Nivel 3
}

export interface EnergyState {
  sources: Record<string, EnergySource>;
  totalGeneratedMW: number;       // calculado
  totalRequiredMW: number;        // calculado
  nonRenewableActiveMW: number;   // calculado, para depleción del planeta
  aiControlled: boolean;          // true cuando IA Nivel 3 está activa
}

// En GameState, agregar:
// energy: EnergyState;
```

---

## Reglas de Negocio

1. Los tiers 1-8 (manual mining a ASIC Gen 3) no tienen requisito de energía. El sistema de energía no existe para ellos.
2. Los tiers 9-11 tienen energía requerida. Si no hay suficiente generación, el hardware se apaga siguiendo el orden descendente por tier.
3. La pestaña de Energía se desbloquea al comprar el primer hardware de tier 9+.
4. Los generadores renovables tienen un cap total de 8,000 MW. No se pueden construir más aunque el jugador tenga dinero.
5. Los generadores no-renovables se desbloquean cuando el cap renovable está al 80% de capacidad o superior.
6. Con IA Nivel 3, el jugador no puede construir ni demoler generadores no-renovables. Solo puede ver el estado.
7. El dinero de construcción de generadores no-renovables (en modo IA Nivel 3) se descuenta automáticamente del saldo del jugador.
8. Si el jugador no tiene suficiente dinero para que la IA construya no-renovables, la IA espera y reintenta cada 10 segundos.
9. Hardware "apagado" por falta de energía mantiene su `owned` count. Al recuperar energía, vuelve a operar sin acción del jugador.
10. La `electricityCost` existente (en $/s) de los tiers 1-8 no se elimina, pero queda silenciosa en UI hasta posible reactivación futura.

---

## UI/UX Requirements

### Panel de Energía (dentro de pestaña Energía)
```
┌──────────────────────────────────────┐
│  ⚡ Energía                          │
│  Generación: 3,200 MW                │
│  Requerido:  2,500 MW  ✓ OPERATIVO  │
│  Excedente:    700 MW                │
├──────────────────────────────────────┤
│  RENOVABLES            [8,000 MW max]│
│  ☀️ Solar Farm    ×4    800 MW  [+]  │
│  💨 Wind Farm    ×3  2,400 MW  [+]  │
│  💧 Hydroelectric ×0      0 MW  [+]  │
│  🌋 Geothermal   ×0      0 MW  [+]  │
├──────────────────────────────────────┤
│  NO-RENOVABLES       [bloqueado 🔒]  │
│  Desbloquear cuando renovables ≥80%  │
└──────────────────────────────────────┘
```

- Estado OPERATIVO: borde verde, texto verde
- Estado APAGÓN PARCIAL: borde amarillo, hardware apagado listado en rojo
- Estado APAGÓN TOTAL: borde rojo, animación de parpadeo
- Cuando IA controla: todos los botones [+] y [-] de no-renovables muestran candado 🤖

**Posición en la navegación**: La pestaña Energía ocupa la **posición 5** (entre Upgrades y Prestige). Ver tabla de tab order en `specs/ui-ux/game-flow.md`.

### Indicador compacto en header
- Muestra solo el balance neto: `⚡ +3,200 MW` o `⚡ -500 MW`
- Tres estados de color:
  - 🟢 Verde `#00ff88`: superávit cómodo — `balance >= required × 0.1`
  - 🟡 Amarillo `#ffaa00`: margen ajustado — `0 <= balance < required × 0.1` (próxima compra puede causar déficit)
  - 🔴 Rojo `#ff4444`: déficit — `balance < 0`, hardware inactivo
- Formato: `⚡ {signo}{balance} MW` donde signo es `+` si positivo, vacío si negativo (el `-` es parte del número)
- Solo visible cuando la pestaña Energía está desbloqueada (`unlockedTabs.energy === true`)

---

## Validaciones

### Pre-condición para construir generador
- El jugador tiene suficiente $ (real money)
- Si es renovable: `totalRenewableMW + newSource.mwPerUnit <= RENEWABLE_CAP_MW`
- Si es no-renovable: no está bajo control de IA

### Post-condición
- `energy.sources[id].quantity` incrementó en 1
- `energy.totalGeneratedMW` recalculado
- Si balance pasó a positivo, hardware apagado se reactiva en el próximo tick

### Integridad de estado
- `totalGeneratedMW` siempre == suma de (quantity × mwPerUnit) de todas las fuentes
- `nonRenewableActiveMW` siempre == suma de MW de fuentes no-renovables únicamente

---

## Dependencias

### Requiere
- Hardware Progression tiers 9-11 implementados (Opción B)
- Real money ($) como recurso existente en el juego

### Bloquea (no puede implementarse sin esto)
- `specs/game-mechanics/ai-system.md` — la IA controla el energy en Nivel 3
- `specs/game-mechanics/narrative-events.md` — el medidor de Recursos del Planeta lee `nonRenewableActiveMW`

### Relacionado con
- `specs/economy/option-c-electricity-constraint.md` — esta spec reemplaza y supera a la Opción C
- `specs/game-mechanics/hardware-progression.md` — agregar campo `energyRequired` a hardware tiers 9-11

---

## Criterios de Aceptación

- [ ] Los tiers 1-8 no muestran ningún elemento de energía en su UI
- [ ] Comprar Mining Farm desbloquea la pestaña Energía
- [ ] Hardware de tier 9-11 no produce si `totalGeneratedMW < totalRequiredMW`
- [ ] El algoritmo de apagado apaga tiers mayores primero
- [ ] El cap renovable de 8,000 MW se respeta en UI (botón deshabilitado)
- [ ] No-renovables se desbloquean al llegar al 80% del cap renovable
- [ ] La depleción de Recursos del Planeta se activa con cualquier MW no-renovable
- [ ] Con IA Nivel 3, los botones de no-renovables muestran estado "controlado por IA"
- [ ] Al recuperar energía suficiente, el hardware apagado vuelve a operar automáticamente
- [ ] Hardware tier 9+ con `energyRequired > 0` **no contribuye al mining speed** en el game loop tick si `totalGeneratedMW` es insuficiente para operarlo — evita halvings prematuros por hardware "fantasma"
- [ ] Con balance de energía positivo (ej: +3,500 MW), los Mining Farms y Quantum Miners activos **generan coins continuamente** cada segundo, visible en el incremento del balance de CryptoCoins
- [ ] Comprar más generadores de energía (BUILD_ENERGY_SOURCE) activa inmediatamente el hardware tier 9+ que estaba apagado, comenzando producción sin reiniciar la app
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

---

## Testing

```typescript
describe('Energy System', () => {
  describe('getActiveHardwareWithEnergyConstraint', () => {
    it('todos operan cuando energía es suficiente', () => {
      const hw = [mockMiningFarm(owned=2), mockQuantumMiner(owned=1)];
      // 2×500 + 1×2000 = 3000 MW needed, 3500 MW generated
      const active = getActiveHardwareWithEnergyConstraint(hw, 3500);
      expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(2);
      expect(active.find(h => h.id === 'quantum_miner')?.activeUnits).toBe(1);
    });

    it('apaga tier más alto primero en caso de déficit', () => {
      const hw = [mockMiningFarm(owned=3), mockQuantumMiner(owned=2)];
      // 3×500 + 2×2000 = 5500 MW needed, solo 2500 MW
      const active = getActiveHardwareWithEnergyConstraint(hw, 2500);
      // Quantum Miners se apagan primero: 1×2000 = 2000, queda 500 para Mining Farms
      expect(active.find(h => h.id === 'quantum_miner')?.activeUnits).toBe(0);
      expect(active.find(h => h.id === 'mining_farm')?.activeUnits).toBe(1); // 2500/500 = 5, pero solo tiene 3
      // Wait: 2500 - (0×2000) = 2500 / 500 = 5 pero owned=3 → activeUnits=3
    });

    it('apagón total si energía es 0', () => {
      const hw = [mockMiningFarm(owned=5)];
      const active = getActiveHardwareWithEnergyConstraint(hw, 0);
      expect(active.every(h => (h as any).activeUnits === 0)).toBe(true);
    });
  });

  describe('calculatePlanetDepletion', () => {
    it('renovables no deplecionan el planeta', () => {
      const sources = [mockSolarFarm(quantity=10)];
      expect(calculatePlanetDepletion(sources)).toBe(0);
    });

    it('no-renovables deplecionan según MW activos', () => {
      const sources = [mockCoalPlant(quantity=2)]; // 2×1000MW, 0.0001%/MW/s
      expect(calculatePlanetDepletion(sources)).toBeCloseTo(0.2); // 2000×0.0001
    });
  });

  describe('renewable cap', () => {
    it('no permite construir renovables sobre el cap', () => {
      const state = createEnergyState({ renewable_mw: 8000 });
      expect(canBuildRenewable(state, 'solar_farm')).toBe(false);
    });

    it('desbloquea no-renovables al 80% del cap renovable', () => {
      const state = createEnergyState({ renewable_mw: 6400 }); // 80% de 8000
      expect(areNonRenewablesUnlocked(state)).toBe(true);
    });
  });
});
```

---

## Edge Cases

- El jugador vende hardware de tier 9+ → la energía requerida baja, hardware apagado puede reactivarse
- El jugador no tiene dinero y la IA no puede construir no-renovables → hardware tier 11 puede apagarse parcialmente mientras la IA espera
- El jugador llega a Recursos del Planeta = 0% antes de completar los 21M bloques → trigger de collapse (ver `endgame-collapse.md`)
- Offline earnings: mientras la app está en background, el hardware opera con el balance energético vigente al momento del cierre. No se recalcula mid-background.

---

## Analytics

- `energy_tab_unlocked` — primera vez que el jugador desbloquea la pestaña
- `first_renewable_built` — tipo de fuente
- `first_nonrenewable_built` — tipo de fuente (¿cuánto tardaron en necesitarlo?)
- `energy_blackout` — hardware apagado por falta de energía (frecuencia indica que el jugador está atascado)
- `ai_energy_takeover` — cuando IA Nivel 3 toma control de no-renovables

---

## Preguntas Abiertas

- [ ] **¿Los generadores renovables tienen costo de mantenimiento en $/s?** Recomendación: No. Mantenerlos como inversión única sin costo recurrente simplifica el loop.
- [ ] **¿Se pueden demoler generadores renovables?** Recomendación: Sí, devolviendo el 50% del costo. Permite correcciones de estrategia.
- [ ] **¿Offline earnings aplica al energy system?** Recomendación: El balance se congela al cerrar la app. El hardware opera con la configuración que tenía. Sin recálculo de apagones mid-offline.
